"use client";

import { ReadonlyURLSearchParams, usePathname, useSearchParams } from "next/navigation";

/*
 * Having a `pages/` directory (for `pages/api/revalidate`) makes Next type these
 * hooks as nullable because they can be null under Pages Router. They are never
 * null inside `app/`, so App Router components should use these wrappers.
 */

const EMPTY_SEARCH_PARAMS = new ReadonlyURLSearchParams();

export function useAppSearchParams(): ReadonlyURLSearchParams {
  return useSearchParams() ?? EMPTY_SEARCH_PARAMS;
}

export function useAppPathname(): string {
  return usePathname() ?? "";
}
