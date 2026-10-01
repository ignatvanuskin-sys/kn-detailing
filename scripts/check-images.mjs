/* Проверка, что вёрстке хватает картинок: каждый запрошенный файл лежит в
 * client/public/img, плюс на месте заглушки «до/после».
 * Запускать после правок конфига и нарезки фото:
 *
 *   node scripts/check-images.mjs
 */
import fs from "node:fs";
import { OUT_DIR, imagePlan, placeholderFiles } from "./image-plan.mjs";

const plan = imagePlan();
const onDisk = new Set(fs.readdirSync(OUT_DIR).filter((file) => file.endsWith(".webp")));

const missing = plan.filter((item) => !onDisk.has(item.file)).map((item) => item.file);
const missingPlaceholders = placeholderFiles().filter((file) => !onDisk.has(file));
const unused = [...onDisk].filter(
  (file) => !plan.some((item) => item.file === file) && !placeholderFiles().includes(file),
);

console.log(`нужно файлов: ${plan.length}, лежит в img: ${onDisk.size}`);

if (missing.length) {
  console.log(`\nНЕ ХВАТАЕТ (${missing.length}):`);
  for (const file of missing) console.log(`  ${file}`);
  const slots = [...new Set(missing.map((file) => file.split("-").slice(0, -2).join("-")))];
  console.log(`\nпохоже, нет исходников для слотов: ${slots.join(", ")}`);
  console.log("положите фото в raw/photos/ и запустите node scripts/prepare-images.mjs");
}

if (missingPlaceholders.length) {
  console.log(`\nНЕТ ЗАГЛУШЕК «до/после» (${missingPlaceholders.length}):`);
  for (const file of missingPlaceholders) console.log(`  ${file}`);
}

if (unused.length) console.log(`\nлишнее в img (${unused.length}): ${unused.join(", ")}`);

if (!missing.length && !missingPlaceholders.length && !unused.length) {
  console.log("\nOK — весь набор картинок на месте");
}
process.exitCode = missing.length || missingPlaceholders.length ? 1 : 0;
