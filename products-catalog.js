
(() => {
  "use strict";

  const repo = "krsna2004/Kisan-Store";
  const api =
    `https://api.github.com/repos/${repo}/contents/content/products`;

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

    const unavailable =
      product.available === false || product.available === "false";

    const price = hasPrice
      ? `<p class="catalog-meta"><strong>${text("Price:", "कीमत:")}</strong> ₹${escapeHtml(Number(product.price).toLocaleString("en-IN"))}</p>`
      : "";

    const stock = hasStock
      ? `<p class="catalog-meta"><strong>${text("Stock:", "स्टॉक:")}</strong> ${escapeHtml(product.stock)}</p>`
      : "";

    const availability = available
      ? `<span class="stock-pill in-stock">${text("Available", "उपलब्ध")}</span>`
      : unavailable
        ? `<span class="stock-pill out-stock">${text("Unavailable", "अनुपलब्ध")}</span>`
        : `<span class="stock-pill ask-stock">${text("Ask about stock", "स्टॉक पूछें")}</span>`;

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
    try {
      const response = await fetch(api, {
        headers: { Accept: "application/vnd.github+json" }
      });

      if (response.status === 404) {
        status.textContent = text(
          "No products yet. Add your first item in Pages CMS → Products.",
          "अभी कोई उत्पाद नहीं है। Pages CMS → Products में पहला उत्पाद जोड़ें।"
        );
        return;
      }

      if (!response.ok) throw new Error("Product list unavailable");

      const files = await response.json();
      const jsonFiles = files.filter(
        file => file.type === "file" && file.name.endsWith(".json")
      );

      const results = await Promise.all(
        jsonFiles.map(async file => {
          try {
            const result = await fetch(file.download_url);
            if (!result.ok) return null;
            return await result.json();
          } catch {
            return null;
          }
        })
      );

      const products = results.filter(product =>
        product &&
        product.name &&
        product.available !== false &&
        product.available !== "false"
      );

      grid.innerHTML = "";

      if (!products.length) {
        status.textContent = text(
          "No available products listed yet. Add products in Pages CMS.",
          "अभी उपलब्ध उत्पाद सूचीबद्ध नहीं हैं। Pages CMS में उत्पाद जोड़ें।"
        );
        return;
      }

      grid.innerHTML = products.map(makeCard).join("");
      status.textContent = text(
        "Products loaded from the store catalogue.",
        "दुकान की उत्पाद सूची लोड हो गई है।"
      );
    } catch {
      status.textContent = text(
        "Products could not load right now. Please contact the store.",
        "अभी उत्पाद लोड नहीं हो सके। कृपया दुकान से संपर्क करें।"
      );
    }
  }

  loadProducts();
})();
              
