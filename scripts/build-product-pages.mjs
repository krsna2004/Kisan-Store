
import fs from "node:fs";
import path from "node:path";

const SITE_URL = "https://thekisanstore.in";
const PRODUCT_DATA = "content/products.json";
const CATALOGUE_HTML = "products.html";
const OUTPUT_DIR = "products";
const SITEMAP = "sitemap.xml";
const WHATSAPP_NUMBER = "919667540112";

function readJson(file) {
  if (!fs.existsSync(file)) {
    throw new Error(`Required file not found: ${file}`);
  }
  return JSON.parse(fs.readFileSync(file, "utf8"));
}

function escapeHtml(value = "") {
  return String(value).replace(/[&<>"']/g, char => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;"
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

  if (/^(?:https?:|data:|\/\/|#|mailto:|tel:)/i.test(raw)) {
    return raw;
  }

  return "/" + raw.replace(/^\.?\//, "").replace(/^\/+/, "");
}

function makeProductPage(product, slug) {
  const name = String(product.name || "Product").trim();
  const nameHi = String(product.name_hi || name).trim();

  const category = String(product.category || "Hardware").trim();
  const categoryHi = String(product.category_hi || category).trim();

  const description = String(
    product.description ||
    `Ask Kisan Hardware & Sanitary Store about ${name}, current brands, sizes, stock and price.`
  ).trim();

  const descriptionHi = String(
    product.description_hi || description
  ).trim();

  const seoTitle = String(
    product.seo_title || `${name} | Kisan Hardware & Sanitary Store`
  ).trim();

  const metaDescription = String(
    product.meta_description || description
  ).trim().slice(0, 300);

  const image = absoluteAssetPath(product.image);
  const imageAlt = String(product.image_alt || name).trim();

  const canonical = `${SITE_URL}/products/${slug}/`;

  const available =
    product.available === true ||
    product.available === "true";

  const keywords = Array.isArray(product.search_keywords)
    ? product.search_keywords.join(", ")
    : String(product.search_keywords || "");

  const whatsappText =
    `Namaste, please share the price and details for ${name}. Product: ${canonical}`;

  const whatsappUrl =
    `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(whatsappText)}`;

  const price =
    product.price !== undefined &&
    product.price !== null &&
    product.price !== ""
      ? Number(product.price)
      : null;

  const validPrice = Number.isFinite(price) && price >= 0;

  const availabilitySchema = available
    ? "https://schema.org/InStock"
    : "https://schema.org/OutOfStock";

  const schema = {
    "@context": "https://schema.org",
    "@type": "Product",
    name,
    description,
    url: canonical,
    image: image
      ? [`${SITE_URL}${image.startsWith("/") ? image : "/" + image}`]
      : undefined,
    category,
    sku: String(product.sku || slug),
    brand: product.brand
      ? { "@type": "Brand", name: String(product.brand) }
      : undefined,
    offers: {
      "@type": "Offer",
      url: canonical,
      priceCurrency: "INR",
      availability: availabilitySchema,
      seller: {
        "@type": "LocalBusiness",
        name: "Kisan Hardware & Sanitary Store",
        url: SITE_URL
      }
    }
  };

  if (validPrice) {
    schema.offers.price = price.toFixed(2);
  } else {
    delete schema.offers.price;
  }

  for (const key of Object.keys(schema)) {
    if (schema[key] === undefined) delete schema[key];
  }

  const imageMarkup = image
    ? `<img class="product-image"
        src="${escapeHtml(image)}"
        alt="${escapeHtml(imageAlt)}"
        width="600"
        height="600"
        fetchpriority="high">`
    : "";

  const stockLabel = available
    ? "Available — confirm current stock"
    : "Currently unavailable";

  const stockLabelHi = available
    ? "उपलब्ध — मौजूदा स्टॉक की पुष्टि करें"
    : "फिलहाल उपलब्ध नहीं";

  const visiblePrice = validPrice
    ? `<p class="product-price">₹${price.toLocaleString("en-IN")}</p>`
    : "";

  const keywordsMarkup = keywords
    ? `<meta name="keywords" content="${escapeHtml(keywords)}">`
    : "";

  const hindiWhatsappUrl =
    `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(
      `नमस्ते, कृपया ${nameHi} की कीमत और जानकारी बताएं। उत्पाद: ${canonical}`
    )}`;

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
.product-detail {
  max-width: 960px;
  margin: 0 auto;
  padding: 24px 20px 42px;
}

.breadcrumbs {
  font-size: .9rem;
  margin: 0 0 20px;
  color: #64748b;
}

.breadcrumbs a {
  color: inherit;
  text-decoration: none;
}

.breadcrumbs a:hover {
  color: #b91c1c;
}

/* Compact language switch */
.product-language {
  display: inline-flex;
  align-items: center;
  gap: 3px;
  padding: 4px;
  margin-bottom: 20px;
  border: 1px solid #e5e7eb;
  border-radius: 999px;
  background: #fff;
}

.product-language button {
  border: 0;
  border-radius: 999px;
  padding: 8px 14px;
  background: transparent;
  color: #4b5563;
  font: inherit;
  font-size: .88rem;
  cursor: pointer;
}

.product-language button[aria-pressed="true"] {
  background: #fff0f0;
  color: #b91c1c;
  font-weight: 700;
}

.product-detail-grid {
  display: grid;
  grid-template-columns: minmax(220px, 300px) minmax(0, 1fr);
  gap: 30px;
  align-items: start;
}

/* Square, smaller product image */
.product-image-wrap {
  width: 100%;
  aspect-ratio: 1 / 1;
  background: #f8fafc;
  border-radius: 18px;
  overflow: hidden;
  display: flex;
  align-items: center;
  justify-content: center;
}

.product-image {
  display: block;
  width: 100%;
  height: 100%;
  padding: 12px;
  box-sizing: border-box;
  object-fit: contain;
}

.product-category {
  color: #b91c1c;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: .06em;
  font-size: .78rem;
  margin: 2px 0 8px;
}

.product-detail h1 {
  font-size: clamp(1.8rem, 4vw, 2.35rem);
  margin: .2rem 0 .8rem;
  line-height: 1.15;
}

.product-stock {
  display: inline-block;
  border-radius: 999px;
  padding: 7px 12px;
  background: #fef3c7;
  color: #854d0e;
  font-size: .88rem;
  margin: 8px 0 14px;
}

.product-stock.available {
  background: #dcfce7;
  color: #166534;
}

.product-price {
  font-weight: 700;
  font-size: 1.2rem;
  margin: 8px 0;
}

.product-description {
  line-height: 1.7;
  margin: 10px 0 0;
  color: #374151;
}

.product-actions {
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
  margin-top: 20px;
}

.product-actions a {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  text-decoration: none;
}

.product-actions .button {
  padding: 12px 17px;
  border-radius: 12px;
}

.product-copy[hidden] {
  display: none !important;
}

.back-link {
  display: inline-block;
  margin-top: 24px;
  color: #b91c1c;
  font-weight: 600;
  text-decoration: none;
}

.product-footer {
  border-top: 1px solid #e5e7eb;
  padding: 18px 20px;
  text-align: center;
  color: #64748b;
  font-size: .88rem;
}

@media (max-width: 700px) {
  .product-detail {
    padding: 20px 16px 34px;
  }

  .product-detail-grid {
    grid-template-columns: minmax(0, 1fr);
    gap: 20px;
  }

  .product-image-wrap {
    width: min(100%, 270px);
    aspect-ratio: 1 / 1;
    margin: 0 auto;
    border-radius: 16px;
  }

  .product-detail h1 {
    font-size: 2rem;
  }

  .product-actions {
    gap: 9px;
  }

  .product-actions a {
    max-width: 100%;
  }
}
</style>
</head>

<body>
<main class="product-detail">

<nav class="breadcrumbs" aria-label="Breadcrumb">
  <a href="/">Home</a> /
  <a href="/products/">Products</a> /
  <span>${escapeHtml(name)}</span>
</nav>

<div class="product-language" role="group" aria-label="Choose language">
  <button
    type="button"
    class="product-language-button"
    data-language="en"
    aria-pressed="true"
  >English</button>

  <button
    type="button"
    class="product-language-button"
    data-language="hi"
    aria-pressed="false"
  >हिन्दी</button>
</div>

<div class="product-detail-grid">

${imageMarkup ? `<div class="product-image-wrap">${imageMarkup}</div>` : ""}

<section>

  <div class="product-copy" data-copy="en">
    <p class="product-category">${escapeHtml(category)}</p>
    <h1>${escapeHtml(name)}</h1>

    <p class="product-stock ${available ? "available" : ""}">
      ${escapeHtml(stockLabel)}
    </p>

    ${visiblePrice}

    <p class="product-description">${escapeHtml(description)}</p>

    <div class="product-actions">
      <a
        class="button button-primary"
        href="${escapeHtml(whatsappUrl)}"
        target="_blank"
        rel="noopener noreferrer"
      >Ask for Price on WhatsApp</a>

      <a class="button" href="/products/">Browse all products</a>
    </div>
  </div>

  <div class="product-copy" data-copy="hi" lang="hi" hidden>
    <p class="product-category">${escapeHtml(categoryHi)}</p>
    <h1>${escapeHtml(nameHi)}</h1>

    <p class="product-stock ${available ? "available" : ""}">
      ${escapeHtml(stockLabelHi)}
    </p>

    ${visiblePrice}

    <p class="product-description">${escapeHtml(descriptionHi)}</p>

    <div class="product-actions">
      <a
        class="button button-primary"
        href="${escapeHtml(hindiWhatsappUrl)}"
        target="_blank"
        rel="noopener noreferrer"
      >WhatsApp पर कीमत पूछें</a>

      <a class="button" href="/products/">सभी उत्पाद देखें</a>
    </div>
  </div>

  <a class="back-link" href="/products/" data-back-link>
    ← Back to product catalogue
  </a>

</section>
</div>
</main>

<footer class="product-footer">
  Kisan Hardware &amp; Sanitary Store · Astawan, Bharatpur, Rajasthan · Open daily, 7 AM–7 PM
</footer>

<script>
(() => {
  const buttons = document.querySelectorAll(".product-language-button");
  const copies = document.querySelectorAll(".product-copy");
  const backLink = document.querySelector("[data-back-link]");

  function setLanguage(language) {
    document.documentElement.lang = language;

    copies.forEach(copy => {
      copy.hidden = copy.dataset.copy !== language;
    });

    buttons.forEach(button => {
      button.setAttribute(
        "aria-pressed",
        String(button.dataset.language === language)
      );
    });

    if (backLink) {
      backLink.textContent = language === "hi"
        ? "← सभी उत्पादों की सूची"
        : "← Back to product catalogue";
    }
  }

  buttons.forEach(button => {
    button.addEventListener("click", () => {
      setLanguage(button.dataset.language);
    });
  });
})();
</script>

</body>
</html>
`;
}

function makeCatalogueIndex(sourceHtml) {
  let html = sourceHtml;

  html = html.replace(
    /(href|src)="(?!https?:|\/\/|#|mailto:|tel:|\/)([^"]+)"/gi,
    (match, attr, value) =>
      `${attr}="/${value.replace(/^\.\//, "")}"`
  );

  html = html.replace(/<head>/i, '<head>\n<base href="/">');

  html = html.replace(
    /<title>Products \| Kisan Hardware &amp; Sanitary Store<\/title>/i,
    '<title>Products | Kisan Hardware &amp; Sanitary Store</title>'
  );

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

  if (!urls.includes(`${SITE_URL}/products/`)) {
    urls.push(`${SITE_URL}/products/`);
  }

  for (const slug of slugs) {
    const url = `${SITE_URL}/products/${slug}/`;

    if (!urls.includes(url)) urls.push(url);
  }

  const xmlEscape = value =>
    String(value)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&apos;");

  const xml = [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
    ...[...new Set(urls)].map(
      url => `  <url><loc>${xmlEscape(url)}</loc></url>`
    ),
    "</urlset>",
    ""
  ].join("\n");

  fs.writeFileSync(SITEMAP, xml, "utf8");

  console.log(`Updated sitemap.xml with ${slugs.length} product URLs.`);
}

function main() {
  const products = readJson(PRODUCT_DATA);

  if (!Array.isArray(products)) {
    throw new Error(`${PRODUCT_DATA} must contain a JSON array.`);
  }

  if (!fs.existsSync(CATALOGUE_HTML)) {
    throw new Error(`Required catalogue file not found: ${CATALOGUE_HTML}`);
  }

  fs.mkdirSync(OUTPUT_DIR, { recursive: true });

  fs.writeFileSync(
    path.join(OUTPUT_DIR, "index.html"),
    makeCatalogueIndex(fs.readFileSync(CATALOGUE_HTML, "utf8")),
    "utf8"
  );

  const used = new Set();
  const slugs = [];

  for (const product of products) {
    if (!product || !String(product.name || "").trim()) {
      console.warn("Skipping a product without a name.");
      continue;
    }

    const slug = safeSlug(product);

    if (!slug) {
      throw new Error(
        `Could not create a URL slug for product: ${product.name}`
      );
    }

    if (used.has(slug)) {
      throw new Error(
        `Duplicate product slug "${slug}". Give each product a unique URL Slug in Pages CMS.`
      );
    }

    used.add(slug);
    slugs.push(slug);

    const dir = path.join(OUTPUT_DIR, slug);

    fs.mkdirSync(dir, { recursive: true });

    fs.writeFileSync(
      path.join(dir, "index.html"),
      makeProductPage(product, slug),
      "utf8"
    );
  }

  updateSitemap(slugs);

  console.log(`Generated ${slugs.length} product pages in /${OUTPUT_DIR}/.`);
}

main();
                                               
