// src/lib/wp.ts

/**
 * WordPress / WPGraphQL sometimes returns upload paths as site-relative strings
 * (e.g. `/wp-content/uploads/...`). Browsers resolve those against the Next.js
 * origin, so backgrounds and <img> break unless we prefix the WP host.
 */
export function resolveWpMediaUrl(url: string | null | undefined): string | undefined {
  if (url == null) return undefined;
  const trimmed = String(url).trim();
  if (!trimmed) return undefined;
  if (/^https?:\/\//i.test(trimmed) || trimmed.startsWith("//")) return trimmed;
  if (trimmed.startsWith("/")) {
    const endpoint = process.env.WP_GRAPHQL_ENDPOINT;
    if (!endpoint) return trimmed;
    try {
      return `${new URL(endpoint).origin}${trimmed}`;
    } catch {
      return trimmed;
    }
  }
  return trimmed;
}

export type WpMediaRef = {
  sourceUrl?: string | null;
  mediaItemUrl?: string | null;
  title?: string | null;
} | null;

/** ACF file fields from WPGraphQL: nested `node` or a flat media object. */
export type WpMediaFieldInput = { node?: WpMediaRef } | WpMediaRef | undefined;

/**
 * URL for ACF File fields. WPGraphQL `sourceUrl` on PDFs is often a single-page
 * preview image; `mediaItemUrl` is the actual uploaded file.
 */
export function acfFileHref(m: WpMediaFieldInput): string {
  if (m && typeof m === "object" && "node" in m && m.node) {
    return acfFileHref(m.node);
  }
  const flat = m as WpMediaRef | undefined;
  const u = flat?.mediaItemUrl ?? flat?.sourceUrl;
  const raw = typeof u === "string" ? u.trim() : "";
  return resolveWpMediaUrl(raw) ?? raw;
}

/** Resolve href from an ACF CTA field (link URL, file media, or raw string). */
export function acfCtaHref(cta: unknown): string {
  if (cta == null) return "";
  if (typeof cta === "string") return cta.trim();
  if (typeof cta !== "object") return "";
  const o = cta as Record<string, unknown>;
  const node = o.node;
  if (node && typeof node === "object") {
    const n = node as Record<string, unknown>;
    const nu = n.mediaItemUrl ?? n.sourceUrl ?? n.uri ?? n.url;
    if (typeof nu === "string" && nu.trim()) {
      const raw = nu.trim();
      return resolveWpMediaUrl(raw) ?? raw;
    }
  }
  const flatMedia = o.mediaItemUrl ?? o.sourceUrl;
  if (typeof flatMedia === "string" && flatMedia.trim()) {
    const raw = flatMedia.trim();
    return resolveWpMediaUrl(raw) ?? raw;
  }
  const linkUrl = o.url ?? o.href ?? o.uri;
  if (typeof linkUrl === "string" && linkUrl.trim()) return linkUrl.trim();
  return "";
}

const MAX_CONCURRENT_REQUESTS = Number(process.env.WP_GRAPHQL_MAX_CONCURRENCY ?? 4);
const MAX_ATTEMPTS = Number(process.env.WP_GRAPHQL_MAX_ATTEMPTS ?? 5);
const inFlightRequests = new Map<string, Promise<unknown>>();

let activeRequests = 0;
const waitQueue: Array<() => void> = [];

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function summarizeBody(body: string, max = 300): string {
  return body.length > max ? `${body.slice(0, max)}...` : body;
}

function getRetryDelayMs(retryAfterHeader: string | null, attempt: number): number {
  if (retryAfterHeader) {
    const seconds = Number(retryAfterHeader);
    if (!Number.isNaN(seconds) && seconds >= 0) {
      return seconds * 1000;
    }

    const retryDateMs = Date.parse(retryAfterHeader);
    if (!Number.isNaN(retryDateMs)) {
      return Math.max(0, retryDateMs - Date.now());
    }
  }

  // Exponential backoff with small jitter when Retry-After is not provided.
  const base = 500 * 2 ** Math.max(0, attempt - 1);
  const jitter = Math.floor(Math.random() * 250);
  return base + jitter;
}

async function acquireSlot() {
  if (activeRequests < MAX_CONCURRENT_REQUESTS) {
    activeRequests += 1;
    return;
  }

  await new Promise<void>((resolve) => waitQueue.push(resolve));
  activeRequests += 1;
}

function releaseSlot() {
  activeRequests = Math.max(0, activeRequests - 1);
  const next = waitQueue.shift();
  if (next) next();
}

type WpFetchOptions = {
  suppressGraphQLErrorLogging?: boolean;
};

async function wpFetchInternal<T>(
  query: string,
  variables?: Record<string, any>,
  options?: WpFetchOptions
) {
  const endpoint = process.env.WP_GRAPHQL_ENDPOINT;
  if (!endpoint) {
    throw new Error("WP_GRAPHQL_ENDPOINT is not set");
  }

  const body = JSON.stringify(variables ? { query, variables } : { query });

  for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt += 1) {
    const res = await fetch(endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body,
      next: { revalidate: 60 },
    });

    const text = await res.text();

    if (!res.ok) {
      const retryable = res.status === 429 || res.status >= 500;
      if (retryable && attempt < MAX_ATTEMPTS) {
        const delayMs = getRetryDelayMs(res.headers.get("retry-after"), attempt);
        console.warn(
          `WPGraphQL retry ${attempt}/${MAX_ATTEMPTS - 1} after HTTP ${res.status}. Waiting ${delayMs}ms.`
        );
        await sleep(delayMs);
        continue;
      }

      console.error("WPGraphQL HTTP error:", res.status, summarizeBody(text));
      throw new Error(`WPGraphQL error: ${res.status}`);
    }

    let json: any;
    try {
      json = JSON.parse(text);
    } catch {
      console.error("WPGraphQL invalid JSON response:", summarizeBody(text));
      throw new Error("WPGraphQL returned invalid JSON");
    }

    if (json.errors) {
      if (!options?.suppressGraphQLErrorLogging) {
        console.error(
          "WPGraphQL GraphQL errors:",
          json.errors.map((e: any) => ({
            message: e.message,
            path: e.path,
            locations: e.locations,
            extensions: e.extensions,
          }))
        );
      }
      throw new Error(
        json.errors.map((e: any) => e.message).join(" | ")
      );
    }

    return json.data as T;
  }

  throw new Error("WPGraphQL request failed after retries");
}

export async function wpFetch<T>(
  query: string,
  variables?: Record<string, any>,
  options?: WpFetchOptions
) {
  const requestKey = JSON.stringify({ query, variables: variables ?? null });
  const existing = inFlightRequests.get(requestKey) as Promise<T> | undefined;
  if (existing) return existing;

  const requestPromise = (async () => {
    await acquireSlot();
    try {
      return await wpFetchInternal<T>(query, variables, options);
    } finally {
      releaseSlot();
    }
  })();

  inFlightRequests.set(requestKey, requestPromise);

  try {
    return await requestPromise;
  } finally {
    inFlightRequests.delete(requestKey);
  }
}
