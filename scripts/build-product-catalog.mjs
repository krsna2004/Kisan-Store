import fs from "node:fs/promises";
import path from "node:path";

const ROOT = process.cwd();

const SOURCE_FILE = path.join(
  ROOT,
  "content",
  "products.json"
);

const INDEX_FILE = path.join(
  ROOT,
  "content",
  "products-index.json"
);

const PAGES_DIR = path.join(
  ROOT,
  "content",
  "product-pages"
);

const PAGE_SIZE = 12;

function getSlug(product) {
  const existing = String(product.slug || "").trim();

  if (/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(existing)) {
    return existing;
  }

  return String(product.name || "")
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

async function main() {
  console.log("Building product catalogue...");

  const raw = await fs.readFile(SOURCE_FILE, "utf8");
  const products = JSON.parse(raw);

  if (!Array.isArray(products)) {
    throw new Error(
      "content/products.json must contain a JSON array."
    );
  }

  const validProducts = products.filter(
    product =>
      product &&
      typeof product.name === "string" &&
      product.name.trim()
  );

  const seenSlugs = new Set();

  const normalizedProducts = validProducts.map(product => {
    const slug = getSlug(product);

    if (!slug) {
      throw new Error(
        `Could not create a slug for "${product.name}".`
      );
    }

    if (seenSlugs.has(slug)) {
      throw new Error(
        `Duplicate product slug "${slug}". ` +
        "Give each product a unique slug in products.json."
      );
    }

    seenSlugs.add(slug);

    return {
      ...product,
      slug
    };
  });

  // Create a small index for searching and displaying cards.
  const searchIndex = normalizedProducts.map(product => ({
    name: product.name,
    name_hi: product.name_hi || "",
    category: product.category || "Hardware",
    category_hi: product.category_hi || "",
    slug: product.slug,
    image: product.image || "",
    image_alt: product.image_alt || product.name,
    available:
      product.available === true ||
      product.available === "true",
    brand: product.brand || "",
    sku: product.sku || "",
    search_keywords: product.search_keywords || [],
    description: product.description || "",
    description_hi: product.description_hi || ""
  }));

  // Replace old generated page files to prevent stale data.
  await fs.rm(PAGES_DIR, {
    recursive: true,
    force: true
  });

  await fs.mkdir(PAGES_DIR, {
    recursive: true
  });

  // Save the search index.
  await fs.mkdir(path.dirname(INDEX_FILE), {
    recursive: true
  });

  await fs.writeFile(
    INDEX_FILE,
    JSON.stringify(searchIndex),
    "utf8"
  );

  // Split full product data into 12-product files.
  const totalPages = Math.ceil(
    normalizedProducts.length / PAGE_SIZE
  );

  for (let page = 1; page <= totalPages; page++) {
    const start = (page - 1) * PAGE_SIZE;
    const pageProducts = normalizedProducts.slice(
      start,
      start + PAGE_SIZE
    );

    const pageFile = path.join(
      PAGES_DIR,
      `page-${page}.json`
    );

    await fs.writeFile(
      pageFile,
      JSON.stringify(pageProducts),
      "utf8"
    );
  }

  console.log(
    `Product index created: ${searchIndex.length} products.`
  );

  console.log(
    `Product data files created: ${totalPages} pages, ` +
    `${PAGE_SIZE} products per page maximum.`
  );
}

main().catch(error => {
  console.error("Product catalogue build failed:", error);
  process.exitCode = 1;
});
