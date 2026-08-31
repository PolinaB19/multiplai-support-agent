import { readFile } from "node:fs/promises";

const html = await readFile(new URL("../index.html", import.meta.url), "utf8");
for (const marker of ["Multiplai", "Центр помощи", "AI-агент поддержки", "Summer Glow"]) {
  if (!html.includes(marker)) throw new Error(`Missing required marker: ${marker}`);
}
console.log("Prototype validation passed");
