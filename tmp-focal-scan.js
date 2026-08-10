const fs = require("fs");
const path = require("path");

function walk(d, acc = []) {
  for (const e of fs.readdirSync(d, { withFileTypes: true })) {
    const p = path.join(d, e.name);
    if (e.isDirectory()) walk(p, acc);
    else if (/\.(tsx|ts)$/.test(e.name)) acc.push(p);
  }
  return acc;
}

const files = walk("src");
for (const f of files) {
  const text = fs.readFileSync(f, "utf8");
  if (!text.includes("object-cover") && !text.includes("backgroundSize")) continue;
  const lines = text.split(/\r?\n/);
  const gaps = [];
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (
      !line.includes("object-cover") &&
      !/backgroundSize:\s*["']cover["']/.test(line)
    ) {
      continue;
    }
    const window = lines.slice(i, i + 10).join("\n");
    if (
      !window.includes("objectPosition") &&
      !window.includes("backgroundPosition")
    ) {
      if (f.includes("hero.tsx")) continue;
      gaps.push(i + 1);
    }
  }
  if (gaps.length) console.log(f + ": " + gaps.join(","));
}
