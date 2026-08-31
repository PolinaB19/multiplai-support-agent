import { readFile } from "node:fs/promises";

const html = await readFile(new URL("../index.html", import.meta.url), "utf8");
for (const marker of ["Multiplai", "Help Center", "AI support agent", "Summer Glow"]) {
  if (!html.includes(marker)) throw new Error(`Missing required marker: ${marker}`);
}
if (/[Ѐ-ӿ]/u.test(html)) throw new Error("Cyrillic text found in the English UI");
console.log("English prototype validation passed");
