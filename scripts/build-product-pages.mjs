import fs from "node:fs";
import path from "node:path";

const SITE_URL = "https://thekisanstore.in";
const PRODUCT_DATA = "content/products.json";
const CATALOGUE_HTML = "products.html";
const OUTPUT_DIR = "products";
const SITEMAP = "sitemap.xml";
const WHATSAPP_NUMBER = "919667540112";

function readJson(file) {
  if (!fs.existsSync(file)) throw new Error(`Required file not found: ${file}`);
  return JSON.parse(fs.readFileSync(file, "utf8"));
}

function escapeHtml(value = "") {
  return String(value).replace(/[&<>"']/g, (char) => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;"
  })[char]);
}

function slugify(value) {
  return String(value || "")
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function safeSlug(product) {
  const candidate = String(product.slug || "").trim();
  return /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(candidate)
    ? candidate
    : slugify(product.name);
}

function absoluteAssetPath(value) {
  const raw = String(value || "").trim();
  if (!raw) return "";
  if (/^(?:https?:|data:|\/\/|#|mailto:|tel:)/i.test(raw)) return raw;
  return "/" + raw.replace(/^\.?\//, "").replace(/^\/+/, "");
}

function makeProductPage(product, slug) {
  const name = String(product.name || "Product").trim();
  const nameHi = String(product.name_hi || name).trim();
  const category = String(product.category || "Hardware").trim();
  const categoryHi = String(product.category_hi || category).trim();
  const description = String(product.description || `Ask Kisan Hardware & Sanitary Store about ${name}, current brands, sizes, stock and price.`).trim();
  const descriptionHi = String(product.description_hi || description).trim();
  const seoTitle = String(product.seo_title || `${name} | Kisan Hardware & Sanitary Store`).trim();
  const metaDescription = String(product.meta_description || description).trim().slice(0, 300);
  const image = absoluteAssetPath(product.image);
  const imageAlt = String(product.image_alt || name).trim();
  const canonical = `${SITE_URL}/products/${slug}/`;
  const available = product.available === true || product.available === "true";
  const keywords = Array.isArray(product.search_keywords)
    ? product.search_keywords.join(", ")
    : String(product.search_keywords || "");
  const whatsappText = `Namaste, please share the price and details for ${name}. Product: ${canonical}`;
  const whatsappUrl = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(whatsappText)}`;
  const price = product.price !== undefined && product.price !== null && product.price !== ""
    ? Number(product.price)
    : null;
  const validPrice = Number.isFinite(price) && price >= 0;
  const availabilitySchema = available ? "https://schema.org/InStock" : "https://schema.org/OutOfStock";

  const schema = {
    "@context": "https://schema.org",
    "@type": "Product",
    name,
    description,
    url: canonical,
    image: image ? [`${SITE_URL}${image.startsWith("/") ? image : "/" + image}`] : undefined,
    category,
    sku: String(product.sku || slug),
    brand: product.brand ? { "@type": "Brand", name: String(product.brand) } : undefined,
    offers: {
      "@type": "Offer",
      url: canonical,
      priceCurrency: "INR",
      availability: availabilitySchema,
      seller: { "@type": "LocalBusiness", name: "Kisan Hardware & Sanitary Store", url: SITE_URL }
    }
  };
  if (validPrice) schema.offers.price = price.toFixed(2);
  else delete schema.offers.price;
  for (const key of Object.keys(schema)) if (schema[key] === undefined) delete schema[key];

  const imageMarkup = image
    ? `<img class="product-image" src="${escapeHtml(image)}" alt="${escapeHtml(imageAlt)}" width="720" height="540" fetchpriority="high">`
    : "";
  const stockLabel = available ? "Available — confirm current stock" : "Currently unavailable";
  const stockLabelHi = available ? "उपलब्ध — मौजूदा स्टॉक की पुष्टि करें" : "फिलहाल उपलब्ध नहीं";
  const visiblePrice = validPrice ? `<p class="price">₹${price.toLocaleString("en-IN")}</p>` : "";
  const keywordsMarkup = keywords ? `<meta name="keywords" content="${escapeHtml(keywords)}">` : "";

  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="theme-color" content="#b91c1c">
<title>${escapeHtml(seoTitle)}</title>
<meta name="description" content="${escapeHtml(metaDescription)}">
<link rel="canonical" href="${escapeHtml(canonical)}">
<meta property="og:type" content="product">
<meta property="og:site_name" content="Kisan Hardware &amp; Sanitary Store">
<meta property="og:title" content="${escapeHtml(seoTitle)}">
<meta property="og:description" content="${escapeHtml(metaDescription)}">
<meta property="og:url" content="${escapeHtml(canonical)}">
${image ? `<meta property="og:image" content="${escapeHtml(SITE_URL + image)}">` : ""}
${keywordsMarkup}
<link rel="stylesheet" href="/style.css">
<link rel="icon" type="image/png" href="/favicon.png">
<script type="application/ld+json">${JSON.stringify(schema).replace(/</g, "\\u003c")}</script>
<style>
.product-detail{max-width:1000px;margin:0 auto;padding:32px 20px 56px}.breadcrumbs{font-size:.92rem;margin-bottom:24px}.product-detail-grid{display:grid;grid-template-columns:minmax(0,1fr) minmax(0,1fr);gap:32px;align-items:start}.product-image-wrap{background:#f8fafc;border-radius:16px;overflow:hidden;display:flex;align-items:center;justify-content:center;min-height:240px}.product-image{display:block;width:100%;height:auto;max-height:520px;object-fit:contain}.product-detail h1{margin:.4rem 0 1rem;line-height:1.15}.product-category{color:#b91c1c;font-weight:700;text-transform:uppercase;letter-spacing:.06em;font-size:.8rem}.product-description{line-height:1.75}.product-stock{display:inline-block;border-radius:999px;padding:7px 12px;background:#fef3c7;color:#854d0e;font-size:.9rem;margin:12px 0}.product-stock.available{background:#dcfce7;color:#166534}.product-actions{display:flex;gap:12px;flex-wrap:wrap;margin-top:18px}.product-actions a{display:inline-flex;align-items:center;justify-content:center;text-decoration:none}.product-hindi{border-top:1px solid #e5e7eb;margin-top:28px;padding-top:20px}.product-hindi p{line-height:1.75}.back-link{display:inline-block;margin-top:24px;color:#b91c1c;font-weight:600}.product-footer{border-top:1px solid #e5e7eb;padding:20px;text-align:center;color:#64748b;font-size:.9rem}@media(max-width:700px){.product-detail{padding:22px 16px 40px}.product-detail-grid{grid-template-columns:1fr;gap:22px}.product-image-wrap{min-height:180px}.product-image{max-height:360px}}
</style>
</head>
<body>
<main class="product-detail">
<nav class="breadcrumbs" aria-label="Breadcrumb"><a href="/">Home</a> / <a href="/products/">Products</a> / <span>${escapeHtml(name)}</span></nav>
<div class="product-detail-grid">
${imageMarkup ? `<div class="product-image-wrap">${imageMarkup}</div>` : ""}
<section>
<p class="product-category">${escapeHtml(category)}</p>
<h1>${escapeHtml(name)}</h1>
<p class="product-stock ${available ? "available" : ""}">${stockLabel}</p>
${visiblePrice}
<p class="product-description">${escapeHtml(description)}</p>
<div class="product-actions">
<a class="button button-primary" href="${escapeHtml(whatsappUrl)}" target="_blank" rel="noopener noreferrer">Ask for Price on WhatsApp</a>
<a class="button" href="/products/">Browse all products</a>
</div>
<div class="product-hindi" lang="hi">
<h2>${escapeHtml(nameHi)}</h2>
<p><strong>श्रेणी:</strong> ${escapeHtml(categoryHi)}</p>
<p>${escapeHtml(descriptionHi)}</p>
<p><strong>${stockLabelHi}</strong></p>
<a class="button button-primary" href="https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(`नमस्ते, कृपया ${nameHi} की कीमत और जानकारी बताएं।`) }" target="_blank" rel="noopener noreferrer">WhatsApp पर कीमत पूछें</a>
</div>
<a class="back-link" href="/products/">← Back to product catalogue</a>
</section>
</div>
</main>
<footer class="product-footer">Kisan Hardware &amp; Sanitary Store · Astawan, Bharatpur, Rajasthan · Open daily, 7 AM–7 PM</footer>
</body>
</html>
`;
}

function makeCatalogueIndex(sourceHtml) {
  // Reuse the existing catalogue markup and make its local URLs root-relative-safe
  // for /products/ while leaving the original products.html unchanged.
  let html = sourceHtml;
  html = html.replace(/(href|src)="(?!https?:|\/\/|#|mailto:|tel:|\/)([^"]+)"/gi, (match, attr, value) => {
    return `${attr}="/${value.replace(/^\.\//, "")}"`;
  });
  html = html.replace(/<head>/i, '<head>\n<base href="/">');
  html = html.replace(/<title>Products \| Kisan Hardware &amp; Sanitary Store<\/title>/i, '<title>Products | Kisan Hardware &amp; Sanitary Store</title>');
  return html;
}

function updateSitemap(slugs) {
  let urls = [];
  if (fs.existsSync(SITEMAP)) {
    const xml = fs.readFileSync(SITEMAP, "utf8");
    urls = [...xml.matchAll(/<loc>(.*?)<\/loc>/g)].map(match =>
      match[1].replace(/&amp;/g, "&")
    );
  }
  if (!urls.includes(`${SITE_URL}/products/`)) urls.push(`${SITE_URL}/products/`);
  for (const slug of slugs) {
    const url = `${SITE_URL}/products/${slug}/`;
    if (!urls.includes(url)) urls.push(url);
  }
  const xmlEscape = (value) => String(value).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&apos;");
  const xml = [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
    ...[...new Set(urls)].map(url => `  <url><loc>${xmlEscape(url)}</loc></url>`),
    "</urlset>",
    ""
  ].join("\n");
  fs.writeFileSync(SITEMAP, xml, "utf8");
  console.log(`Updated sitemap.xml with ${slugs.length} product URLs.`);
}

function main() {
  const products = readJson(PRODUCT_DATA);
  if (!Array.isArray(products)) throw new Error(`${PRODUCT_DATA} must contain a JSON array.`);
  if (!fs.existsSync(CATALOGUE_HTML)) throw new Error(`Required catalogue file not found: ${CATALOGUE_HTML}`);

  fs.mkdirSync(OUTPUT_DIR, { recursive: true });
  fs.writeFileSync(path.join(OUTPUT_DIR, "index.html"), makeCatalogueIndex(fs.readFileSync(CATALOGUE_HTML, "utf8")), "utf8");

  const used = new Set();
  const slugs = [];
  for (const product of products) {
    if (!product || !String(product.name || "").trim()) {
      console.warn("Skipping a product without a name.");
      continue;
    }
    let slug = safeSlug(product);
    if (!slug) throw new Error(`Could not create a URL slug for product: ${product.name}`);
    if (used.has(slug)) throw new Error(`Duplicate product slug "${slug}". Give each product a unique URL Slug in Pages CMS.`);
    used.add(slug);
    slugs.push(slug);

    const dir = path.join(OUTPUT_DIR, slug);
    fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(path.join(dir, "index.html"), makeProductPage(product, slug), "utf8");
  }

  updateSitemap(slugs);
  console.log(`Generated ${slugs.length} product pages in /${OUTPUT_DIR}/.`);
}

main();
    
