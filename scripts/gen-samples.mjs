// Generates the README assets: individual sample avatars + a hero contact sheet.
// Imports the real source directly (Node >=23 strips the TS types at run time),
// so there is no second copy of the generator to drift out of sync.
//
//   node scripts/gen-samples.mjs

import { writeFile, mkdir } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { geoFaceInner } from "../src/index.ts";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const assetsDir = join(root, "assets");
const samplesDir = join(assetsDir, "samples");
await mkdir(samplesDir, { recursive: true });

const slug = (s) => s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");

// A single avatar as a standalone, rounded SVG file.
function roundedTile(name, rx = 24) {
  return (
    `<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100" viewBox="0 0 100 100">` +
    `<clipPath id="r"><rect width="100" height="100" rx="${rx}"/></clipPath>` +
    `<g clip-path="url(#r)">${geoFaceInner(name)}</g></svg>`
  );
}

// Many avatars composed into one contact-sheet SVG.
function heroSheet(names, cols = 10, gap = 10, rx = 20) {
  const tile = 100;
  const step = tile + gap;
  const rows = Math.ceil(names.length / cols);
  const W = cols * step - gap;
  const H = rows * step - gap;
  let body = "";
  names.forEach((name, i) => {
    const x = (i % cols) * step;
    const y = Math.floor(i / cols) * step;
    body +=
      `<g transform="translate(${x} ${y})">` +
      `<clipPath id="h${i}"><rect width="100" height="100" rx="${rx}"/></clipPath>` +
      `<g clip-path="url(#h${i})">${geoFaceInner(name)}</g></g>`;
  });
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">${body}</svg>`;
}

const featured = ["rob", "ada lovelace", "massive.com", "satoshi", "grace hopper", "linus", "octocat", "wallhunt"];
for (const name of featured) {
  await writeFile(join(samplesDir, `${slug(name)}.svg`), roundedTile(name), "utf8");
}

// 40 varied seeds for the hero grid.
const heroNames = [
  "aria", "milo", "noor", "kenji", "lena", "tariq", "ines", "dovi", "priya", "soren",
  "maya", "yuki", "diego", "freya", "omar", "nadia", "felix", "zara", "hugo", "amara",
  "ravi", "elsa", "bo", "thea", "ivan", "luz", "kai", "petra", "samir", "wren",
  "ondine", "joaquin", "mei", "bram", "sasha", "tomas", "neve", "rico", "ada", "viktor",
];
await writeFile(join(assetsDir, "hero.svg"), heroSheet(heroNames), "utf8");

console.log(`Wrote ${featured.length} samples + hero.svg to ${assetsDir}`);
