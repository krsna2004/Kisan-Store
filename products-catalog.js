
(() => {
  "use strict";

  const catalogueUrl = "content/products.json";
  const grid = document.getElementById("cms-products-grid");
  const status = document.getElementById("catalog-status");

  if (!grid || !status) return;

  const isHindi = () => document.documentElement.lang === "hi";

  const text = (en, hi) => isHindi() ? hi : en;

  const escapeHtml = (value) =>
    String(value ?? "").replace(/[&<>"']/g, char => ({
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#39;"
    })[char]);

  function makeCard(product) {
    const name = String(
      isHindi() ? product.name_hi || product.name : product.name
    ).trim();

    const category = String(
      isHindi()
        ? product.category_hi || product.category || "हार्डवेयर"
        : product.category || "Hardware"
    ).trim();

    const description = String(
      isHindi()
        ? product.description_hi || product.description || ""
        : product.description || ""
    ).trim();

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

  let products = [];

  function renderProducts() {
    const visibleProducts = products.filter(product =>
      product &&
      product.name &&
      (product.available === true || product.available === "true")
    );

    grid.innerHTML = visibleProducts.map(makeCard).join("");

    if (!visibleProducts.length) {
      status.textContent = text(
        "No available products yet. Add a product in Pages CMS.",
        "अभी कोई उपलब्ध उत्पाद नहीं है। Pages CMS में उत्पाद जोड़ें।"
      );
    } else {
      status.textContent = text(
        `${visibleProducts.length} product(s) loaded.`,
        `${visibleProducts.length} उत्पाद लोड हुए।`
      );
    }
  }

  async function loadProducts() {
    status.textContent = text(
      "Loading products…",
      "उत्पाद लोड हो रहे हैं…"
    );

    try {
      const response = await fetch(`${catalogueUrl}?v=${Date.now()}`);

      if (!response.ok) {
        throw new Error("Could not load product catalogue");
      }

      const data = await response.json();

      if (!Array.isArray(data)) {
        throw new Error("Expected a JSON array");
      }

      products = data;
      renderProducts();
    } catch (error) {
      status.textContent = text(
        "Products could not load. Please try again later.",
        "उत्पाद लोड नहीं हो सके। कृपया बाद में फिर प्रयास करें।"
      );
      console.error("Product catalogue error:", error);
    }
  }

  // Re-render cards whenever the language button is used.
document.getElementById("langBtn")?.addEventListener("click", () => {
  renderProducts();
});

  loadProducts();
})();
