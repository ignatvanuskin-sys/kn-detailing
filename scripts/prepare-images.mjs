/* Builds the responsive image set for the KN Detailing landing page.
 *
 * Sources are the studio's own photos from its 2GIS gallery (firm
 * 70000001099671293), pulled by scripts/fetch-photos.mjs into raw/2gis/.
 * raw/ is scratch space: only client/public/img ships.
 *
 * Every file is generated at the exact dimensions the layout expects, derived
 * from the variant suffix, so no CSS depends on a particular photo.
 *
 *   node scripts/prepare-images.mjs --report   list what will be produced
 *   node scripts/prepare-images.mjs            (re)generate everything
 */
import fs from "node:fs";
import path from "node:path";
import sharp from "sharp";

const ROOT = path.resolve(import.meta.dirname, "..");
const SRC_DIR = path.join(ROOT, "raw", "2gis");
const OUT_DIR = path.join(ROOT, "client", "public", "img");
const BACKUP_DIR = path.join(ROOT, "raw", "_orig-img");

/* height = width * RATIO[variant] — mirrors the template's own artwork */
const RATIO = { card: 3 / 4, portrait: 987 / 760, tall: 4 / 3, mobile: 4 / 3, wide: 9 / 16, tight: 4 / 3 };

/* One photo per service, so no two cards show the same car twice.
 *   p-003  fitters laying a film sheet over a car      -> оклейка
 *   p-012  applicator work on paint                    -> керамика
 *   p-008  squeegee work on a panel                    -> тонировка
 *   p-004  machine polisher on a black bonnet          -> полировка
 *   p-013  work inside an open door                    -> шумоизоляция
 *   p-014  work on a door/window element               -> салон
 */
const SERVICES = {
  wrap: "p-003",
  ceramic: "p-012",
  tint: "p-008",
  polish: "p-004",
  sound: "p-013",
  salon: "p-014",
};

/* base name, widths to emit, source photo */
const PLAN = [
  ["hero-mobile", [480, 800, 1200], "p-043"], // black G-Class, KN plate — vertical
  ["hero-wide", [1280, 1920], "p-064"], // same car class shot landscape
  ["fleet-mobile", [480, 800, 1200], "p-033"], // cars at the studio entrance
  ["fleet-wide", [1280, 1920], "p-033"],
  ["craft-card", [480, 800], "p-005"], // 02 / Наш подход
  ["craft-tall", [480, 800], "p-005"],
  ["craft-wide", [1280, 1920], "p-005"], // before-layer of the process/result slider
  ["ready-b-tall", [480, 800], "p-016"], // finished black Lexus, KN plate
  ["ready-b-wide", [1280, 1920], "p-016"],
  ["ready-c-tall", [480, 800], "p-018"], // finished white BMW X5
  ["ready-c-wide", [1280, 1920], "p-018"],
  /* 04 / Наши работы — its own photos, so a work card never repeats a service
     card standing right above it on the same screen */
  ["work-a-tall", [480, 800], "p-042"], // black Mercedes, KN sign on the wall
  ["work-a-portrait", [420, 760], "p-042"],
  ["work-b-tall", [480, 800], "p-017"], // blue Lexus ES, gloss finish
  ["work-b-portrait", [420, 760], "p-017"],
  ["work-c-tall", [480, 800], "p-015"], // white SUV in the bay
  ["work-c-portrait", [420, 760], "p-015"],
  ["work-d-tall", [480, 800], "p-002"], // dark car with tinted glass
  ["work-d-portrait", [420, 760], "p-002"],
];

for (const [name, src] of Object.entries(SERVICES)) {
  PLAN.push([`${name}-card`, [480, 800], src]);
  PLAN.push([`${name}-portrait`, [420, 760], src]);
  PLAN.push([`${name}-tall`, [480, 800], src]);
  PLAN.push([`${name}-wide`, [1280, 1920], src]);
}

/* the variant is always the last segment, so "ready-b-tall" -> "tall" */
const variantOf = (base) => base.split("-").pop();
const filesFor = ([base, widths]) =>
  widths.map((w) => ({ file: `${base}-${w}.webp`, w, h: Math.round(w * RATIO[variantOf(base)]) }));

async function report() {
  for (const entry of PLAN) {
    const [base, , src] = entry;
    for (const f of filesFor(entry)) {
      console.log(`${f.file.padEnd(28)} ${f.w}x${f.h}  <- ${src}.jpg`);
    }
  }
  const all = PLAN.flatMap(filesFor);
  console.log(`\n${all.length} files, sources: ${[...new Set(PLAN.map((p) => p[2]))].join(", ")}`);
}

async function build() {
  fs.mkdirSync(BACKUP_DIR, { recursive: true });
  const wanted = new Set(PLAN.flatMap(filesFor).map((f) => f.file));

  /* anything from the template's own set that this plan no longer uses */
  for (const old of fs.readdirSync(OUT_DIR).filter((f) => f.endsWith(".webp"))) {
    if (wanted.has(old)) continue;
    const p = path.join(OUT_DIR, old);
    fs.copyFileSync(p, path.join(BACKUP_DIR, old));
    fs.unlinkSync(p);
    console.log(`dropped ${old}`);
  }

  let made = 0;
  for (const entry of PLAN) {
    const [, , srcName] = entry;
    const src = path.join(SRC_DIR, `${srcName}.jpg`);
    if (!fs.existsSync(src)) {
      console.log(`SKIP ${entry[0]}: missing ${src}`);
      continue;
    }
    for (const { file, w, h } of filesFor(entry)) {
      const target = path.join(OUT_DIR, file);
      if (fs.existsSync(target)) fs.copyFileSync(target, path.join(BACKUP_DIR, file));
      /* write to a temp path: on Windows, reading then writing the same path in
         quick succession fails with "unable to open for write" */
      const tmp = `${target}.tmp`;
      await sharp(src)
        .resize(w, h, { fit: "cover", position: "centre" })
        .webp({ quality: 82, effort: 5 })
        .toFile(tmp);
      fs.renameSync(tmp, target);
      made++;
    }
  }
  console.log(`generated ${made} files`);
}

if (process.argv[2] === "--report") await report();
else await build();
