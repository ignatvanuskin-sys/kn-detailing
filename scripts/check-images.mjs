/* Guards against a missing image set: every base name the page can ask for must
 * exist on disk, at every width the code requests for that block.
 *
 * Width lists are per data block on purpose — the same field name ("mobile",
 * "desktop") means different widths in `cases` and in `portfolio`, so joining
 * them all together would report files that nothing actually requests. */
import fs from "node:fs";
import path from "node:path";

const ROOT = path.resolve(import.meta.dirname, "..");
const IMG = path.join(ROOT, "client", "public", "img");
const src = fs.readFileSync(path.join(ROOT, "client", "src", "pages", "Home.tsx"), "utf8");

const files = new Set(fs.readdirSync(IMG).filter((f) => f.endsWith(".webp")));
const needed = new Set();
const add = (base, widths) => widths.forEach((w) => needed.add(`${base}-${w}.webp`));

/* literal art("name", [widths]) calls */
for (const m of src.matchAll(/art\(\s*"([a-z0-9-]+)",\s*\[([0-9,\s]+)\]/g)) {
  add(m[1], m[2].split(",").map((s) => s.trim()));
}

/* art(`${service.media}-card`, [480, 800]) pairs with media: "..." in services */
for (const m of src.matchAll(/media:\s*"([a-z]+)"/g)) {
  add(`${m[1]}-card`, [480, 800]);
  add(`${m[1]}-portrait`, [420, 760]);
}

/* data blocks read through art(item.<field> / current.<field>, [widths]) */
const BLOCKS = [
  { from: "const cases = [", to: "const portfolio = [", widths: { mobile: [480, 800], desktop: [1280, 1920] } },
  { from: "const portfolio = [", to: "const packages = [", widths: { mobile: [480, 800], desktop: [420, 760] } },
];

for (const block of BLOCKS) {
  const start = src.indexOf(block.from);
  const end = src.indexOf(block.to);
  if (start < 0 || end < 0) {
    console.log(`! could not locate block ${block.from}`);
    continue;
  }
  const slice = src.slice(start, end);
  for (const [field, widths] of Object.entries(block.widths)) {
    for (const m of slice.matchAll(new RegExp(`\\b${field}:\\s*"([a-z0-9-]+)"`, "g"))) add(m[1], widths);
  }
}

const missing = [...needed].filter((f) => !files.has(f)).sort();
const unused = [...files].filter((f) => !needed.has(f)).sort();

console.log(`referenced: ${needed.size}, on disk: ${files.size}`);
if (missing.length) {
  console.log(`\nMISSING (${missing.length}):`);
  for (const f of missing) console.log(`  ${f}`);
}
if (unused.length) console.log(`\nunused on disk (${unused.length}): ${unused.join(", ")}`);
if (!missing.length) console.log("\nOK — every referenced image exists");
process.exitCode = missing.length ? 1 : 0;
