/* Guards against a missing image set: every base name the page can ask for must
 * exist on disk in client/public/img, for every width the code requests. */
import fs from "node:fs";
import path from "node:path";

const ROOT = path.resolve(import.meta.dirname, "..");
const IMG = path.join(ROOT, "client", "public", "img");
const src = fs.readFileSync(path.join(ROOT, "client", "src", "pages", "Home.tsx"), "utf8");

const files = new Set(fs.readdirSync(IMG).filter((f) => f.endsWith(".webp")));
const needed = new Set();

/* literal art("name", [widths]) calls */
for (const m of src.matchAll(/art\(\s*"([a-z0-9-]+)",\s*\[([0-9,\s]+)\]/g)) {
  for (const w of m[2].split(",").map((s) => s.trim())) needed.add(`${m[1]}-${w}.webp`);
}
/* template art(`${service.media}-card`, [480, 800]) pairs with media: "..." */
const media = [...src.matchAll(/media:\s*"([a-z]+)"/g)].map((m) => m[1]);
for (const key of media) {
  needed.add(`${key}-card-480.webp`);
  needed.add(`${key}-card-800.webp`);
  needed.add(`${key}-portrait-420.webp`);
  needed.add(`${key}-portrait-760.webp`);
}
/* template literals built from a data field, e.g. art(item.mobile, [480, 800]) */
for (const m of src.matchAll(/art\((?:item|current)\.(mobile|desktop|beforeMobile|beforeDesktop|afterMobile|afterDesktop),\s*\[([0-9,\s]+)\]/g)) {
  const field = m[1];
  const widths = m[2].split(",").map((s) => s.trim());
  const dataRe = new RegExp(`${field}:\\s*"([a-z0-9-]+)"`, "g");
  for (const d of src.matchAll(dataRe)) {
    for (const w of widths) needed.add(`${d[1]}-${w}.webp`);
  }
}

const missing = [...needed].filter((f) => !files.has(f)).sort();
const unused = [...files].filter((f) => !needed.has(f)).sort();

console.log(`referenced: ${needed.size}, on disk: ${files.size}`);
if (missing.length) {
  console.log(`\nMISSING (${missing.length}):`);
  for (const f of missing) console.log(`  ${f}`);
}
if (unused.length) {
  console.log(`\nunused on disk (${unused.length}): ${unused.join(", ")}`);
}
if (!missing.length) console.log("\nOK — every referenced image exists");
process.exitCode = missing.length ? 1 : 0;
