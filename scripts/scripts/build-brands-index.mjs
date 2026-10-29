
import fs from "node:fs/promises";
import path from "node:path";

const ROOT = process.cwd();
const BRANDS_DIR = path.join(ROOT, "assets", "brands");
const OUTPUT_FILE = path.join(ROOT, "content", "brands.json");

const SUPPORTED_EXTENSIONS = new Set([
  ".png",
  ".webp",
  ".jpg",
  ".jpeg",
  ".svg"
]);

// Preserve familiar brand capitalization.
const BRAND_NAMES = {
  hp: "HP",
  "astral-pipes": "Astral Pipes",
  pidilite: "Pidilite",
  tirupati: "Tirupati",
  castrol: "Castrol",
  fevicol: "Fevicol"
};

function getBrandName(filename) {
  const basename = path.basename(filename, path.extname(filename));
  const key = basename.toLowerCase().trim();

  if (BRAND_NAMES[key]) {
    return BRAND_NAMES[key];
  }

  return basename
    .replace(/[_-]+/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .replace(/\b\w/g, letter => letter.toUpperCase());
}

async function main() {
  const files = await fs.readdir(BRANDS_DIR, {
    withFileTypes: true
  });

  const logos = files
    .filter(file => file.isFile())
    .map(file => file.name)
    .filter(filename =>
      SUPPORTED_EXTENSIONS.has(
        path.extname(filename).toLowerCase()
      )
    )
    .sort((a, b) => a.localeCompare(b));

  const brands = logos.map(filename => ({
    name: getBrandName(filename),
    image: filename
  }));

  await fs.mkdir(path.dirname(OUTPUT_FILE), {
    recursive: true
  });

  await fs.writeFile(
    OUTPUT_FILE,
    JSON.stringify(brands, null, 2) + "\n",
    "utf8"
  );

  console.log(`Generated ${brands.length} brands in content/brands.json`);

  if (brands.length === 0) {
    console.warn("No brand images found in assets/brands/");
  }
}

main().catch(error => {
  console.error("Brand index generation failed:", error);
  process.exitCode = 1;
});
