
(() => {
  "use strict";

  const catalogueUrl = "content/products.json";
  const grid = document.getElementById("cms-products-grid");
  const status = document.getElementById("catalog-status");

  if (!grid || !status) return;

  const isHindi = () => document.documentElement.lang === "hi";
  const text = (en, hi) => isHindi() ? hi : en;

  const escapeHtml = (value) =>
    String(value ?? "").replace(/[&<>"']/g, (char) => ({
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#39;"
    })[char]);

  function makeCard(product) {
    const name = String(product.name || "Product").trim();
    const category = String(product.category || "Hardware").trim();
    const description = String(product.description || "").trim();

    const hasPrice =
      product.price !== "" &&
      product.price !== null &&
      product.price !== undefined &&
      Number.isFinite(Number(product.price));

    const hasStock =
      product.stock !== "" &&
      product.stock !== null &&
      product.stock !== undefined &&
      Number.isFinite(Number(product.stock));

    const available =
      product.available === true || product.available === "true";

    const price = hasPrice
      ? `<p class="catalog-meta"><strong>${text("Price:", "कीमत:")}</strong> ₹${escapeHtml(Number(product.price).toLocaleString("en-IN"))}</p>`
      : "";

    const stock = hasStock
      ? `<p class="catalog-meta"><strong>${text("Stock:", "स्टॉक:")}</strong> ${escapeHtml(product.stock)}</p>`
      : "";

    const availability = available
      ? `<span class="stock-pill in-stock">${text("Available", "उपलब्ध")}</span>`
      : `<span class="stock-pill out-stock">${text("Unavailable", "अनुपलब्ध")}</span>`;

    const rawImage = String(product.image || "").trim();
    const safeImage =
      rawImage &&
      !/^(?:[a-z]+:|\/\/|\/)/i.test(rawImage) &&
      !rawImage.split("/").includes("..");

    const image = safeImage
      ? `<img class="catalog-product-image" src="${escapeHtml(rawImage)}" alt="${escapeHtml(name)}" loading="lazy" onerror="this.hidden=true">`
      : `<div class="product-symbol symbol-red" aria-hidden="true">▦</div>`;

    const message = encodeURIComponent(
      `Namaste, please tell me about ${name}.`
    );

    return `
      <article class="product-card catalog-product-card">
        <div class="catalog-image-wrap">${image}</div>
        <div class="product-content">
          <p class="product-kicker">${escapeHtml(category)}</p>
          <h3>${escapeHtml(name)}</h3>
          ${description ? `<p>${escapeHtml(description)}</p>` : ""}
          <div class="catalog-details">${price}${stock}</div>
          ${availability}
          <a class="inline-link"
             target="_blank"
             rel="noopener noreferrer"
             href="https://wa.me/919667540112?text=${message}">
            ${text("Ask on WhatsApp ↗", "WhatsApp पर पूछें ↗")}
          </a>
        </div>
      </article>`;
  }

  async function loadProducts() {
    grid.innerHTML = "";
    status.textContent = text(
      "Loading products…",
      "उत्पाद लोड हो रहे हैं…"
    );

    try {
      const response = await fetch(
        `${catalogueUrl}?v=${Date.now()}`
      );

      if (response.status === 404) {
        status.textContent = text(
          "No catalogue file found yet. Add products in Pages CMS and publish the changes.",
          "अभी उत्पाद सूची की फ़ाइल नहीं मिली। Pages CMS में उत्पाद जोड़ें और बदलाव प्रकाशित करें।"
        );
        return;
      }

      if (!response.ok) {
        throw new Error("Catalogue could not be loaded");
      }

      const data = await response.json();
      if (!Array.isArray(data)) {
        throw new Error("Catalogue must contain a JSON list");
      }

      const products = data.filter(product =>
        product &&
        product.name &&
        (product.available === true || product.available === "true")
      );

      if (!products.length) {
        status.textContent = text(
          "No available products yet. Add a product in Pages CMS and mark it available.",
          "अभी कोई उपलब्ध उत्पाद नहीं है। Pages CMS में उत्पाद जोड़ें और उपलब्ध के रूप में चिह्नित करें।"
        );
        return;
      }

      grid.innerHTML = products.map(makeCard).join("");
      status.textContent = text(
        `${products.length} product(s) loaded.`,
        `${products.length} उत्पाद लोड हुए।`
      );
    } catch (error) {
      status.textContent = text(
        "Products could not load. Check that content/products.json exists and contains valid JSON.",
        "उत्पाद लोड नहीं हुए। जाँचें कि content/products.json मौजूद है और उसमें सही JSON है।"
      );
      console.error("Product catalogue error:", error);
    }
  }

  loadProducts();
})();
