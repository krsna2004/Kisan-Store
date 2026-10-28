
(() => {
  "use strict";

  const catalogueUrl = "/content/products.json";
  const grid = document.getElementById("cms-products-grid");
  const status = document.getElementById("catalog-status");
  const searchInput = document.getElementById("product-search");
  const categoryPicker = document.getElementById("catalog-category-picker");
  const categoryTrigger = document.getElementById("product-category-trigger");
  const categoryLabel = document.getElementById("product-category-label");
  const categoryMenu = document.getElementById("product-category-menu");

let selectedCategory = "";

  if (!grid || !status) return;

  const isHindi = () => document.documentElement.lang === "hi";
  const text = (en, hi) => isHindi() ? hi : en;

  const escapeHtml = (value) =>
    String(value ?? "").replace(/[&<>"']/g, char => ({
      "&": "&amp;", "<": "&lt;", ">": "&gt;",
      '"': "&quot;", "'": "&#39;"
    })[char]);

  const slugify = value => String(value || "")
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase().trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

  const getSlug = product => {
    const slug = String(product.slug || "").trim();
    return /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug)
      ? slug : slugify(product.name);
  };

  const isAvailable = product =>
    product.available === true || product.available === "true";

  function makeCard(product) {
    const name = String(
      isHindi() ? product.name_hi || product.name : product.name
    ).trim();

    const category = String(
      isHindi()
        ? product.category_hi || product.category || "हार्डवेयर"
        : product.category || "Hardware"
    ).trim();

    const slug = getSlug(product);
    const available = isAvailable(product);
    const rawImage = String(product.image || "").trim();

    const safeImage = rawImage &&
      !/^(?:[a-z]+:|\/\/|\/)/i.test(rawImage) &&
      !rawImage.split("/").includes("..");

    const image = safeImage
      ? `<img class="catalog-product-image"
          src="/${escapeHtml(rawImage.replace(/^\.\//, ""))}"
          alt="${escapeHtml(product.image_alt || name)}"
          loading="lazy" onerror="this.hidden=true">`
      : `<div class="product-symbol symbol-red" aria-hidden="true">▦</div>`;

    const message = encodeURIComponent(
      isHindi()
        ? `नमस्ते, कृपया ${name} की कीमत और जानकारी बताएं।`
        : `Namaste, please share the price and details for ${name}.`
    );

    return `
      <article class="product-card catalog-product-card">
        <a class="catalog-image-wrap"
           href="/products/${escapeHtml(slug)}/"
           aria-label="${escapeHtml(name)}">
          ${image}
        </a>
        <div class="product-content">
          <p class="product-kicker">${escapeHtml(category)}</p>
          <h3>
            <a class="catalog-name-link"
               href="/products/${escapeHtml(slug)}/">
              ${escapeHtml(name)}
            </a>
          </h3>
          <span class="stock-pill ${available ? "in-stock" : "out-stock"}">
            ${available
              ? text("Available", "उपलब्ध")
              : text("Currently unavailable", "फिलहाल उपलब्ध नहीं")}
          </span>
          <a class="inline-link"
             target="_blank" rel="noopener noreferrer"
             href="https://wa.me/919667540112?text=${message}">
            ${text("Ask for Price ↗", "कीमत पूछें ↗")}
          </a>
        </div>
      </article>`;
  }

  let products = [];

  function renderProducts() {
    const query = String(searchInput?.value || "")
      .trim().toLocaleLowerCase();

    const filtered = products.filter(product => {
      if (!product || !product.name) return false;
      if (selectedCategory &&
          String(product.category || "") !== selectedCategory) {
        return false;
      }

      const keywords = Array.isArray(product.search_keywords)
        ? product.search_keywords.join(" ")
        : String(product.search_keywords || "");

      const searchable = [
        product.name, product.name_hi,
        product.category, product.category_hi,
        product.description, product.description_hi,
        keywords, product.brand, product.sku
      ].filter(Boolean).join(" ").toLocaleLowerCase();

      return !query || searchable.includes(query);
    });

    grid.innerHTML = filtered.map(makeCard).join("");

    status.textContent = filtered.length
      ? text(`${filtered.length} product(s) found.`,
             `${filtered.length} उत्पाद मिले।`)
      : text("No products match your search.",
             "आपकी खोज से कोई उत्पाद नहीं मिला।");
  }
  
function populateCategories() {
  if (!categoryPicker || !categoryMenu || !categoryLabel) return;

  const categories = [...new Set(
    products
      .map(p => String(p?.category || "").trim())
      .filter(Boolean)
  )].sort((a, b) => a.localeCompare(b));

  const allLabel = text("All categories", "सभी श्रेणियाँ");

  const options = [
    { value: "", label: allLabel },
    ...categories.map(category => {
      const sample = products.find(p => p.category === category);
      return {
        value: category,
        label: isHindi()
          ? sample?.category_hi || category
          : category
      };
    })
  ];

  const current = options.find(
    option => option.value === selectedCategory
  );

  if (!current) selectedCategory = "";

  const selected = options.find(
    option => option.value === selectedCategory
  );

  categoryLabel.textContent = selected?.label || allLabel;

  categoryMenu.innerHTML = options.map(option => {
    const active = option.value === selectedCategory;

    return `
      <button
        type="button"
        class="catalog-category-option${active ? " is-selected" : ""}"
        role="option"
        aria-selected="${active}"
        data-category="${escapeHtml(option.value)}"
      >
        <span>${escapeHtml(option.label)}</span>
        <span class="catalog-category-check" aria-hidden="true">
          ${active ? "✓" : ""}
        </span>
      </button>
    `;
  }).join("");
}
  
  async function loadProducts() {
    status.textContent = text(
      "Loading products…", "उत्पाद लोड हो रहे हैं…"
    );

    try {
      const response = await fetch(
        `${catalogueUrl}?v=${Date.now()}`
      );

      if (!response.ok) throw new Error("Could not load products");

      const data = await response.json();
      if (!Array.isArray(data)) {
        throw new Error("Expected a JSON array");
      }

      products = data;
      populateCategories();
      renderProducts();
    } catch (error) {
      status.textContent = text(
        "Products could not load. Please try again later.",
        "उत्पाद लोड नहीं हो सके। कृपया बाद में फिर प्रयास करें।"
      );
      console.error("Product catalogue error:", error);
    }
  }
  
searchInput?.addEventListener("input", renderProducts);

categoryTrigger?.addEventListener("click", () => {
  const isOpen = categoryTrigger.getAttribute("aria-expanded") === "true";

  categoryTrigger.setAttribute("aria-expanded", String(!isOpen));
  categoryMenu.hidden = isOpen;
});

categoryMenu?.addEventListener("click", event => {
  const option = event.target.closest("[data-category]");
  if (!option) return;

  selectedCategory = option.dataset.category || "";

  categoryTrigger.setAttribute("aria-expanded", "false");
  categoryMenu.hidden = true;

  populateCategories();
  renderProducts();
});

document.addEventListener("click", event => {
  if (categoryPicker && !categoryPicker.contains(event.target)) {
    categoryMenu.hidden = true;
    categoryTrigger?.setAttribute("aria-expanded", "false");
  }
});

categoryPicker?.addEventListener("keydown", event => {
  if (event.key === "Escape") {
    categoryMenu.hidden = true;
    categoryTrigger?.setAttribute("aria-expanded", "false");
    categoryTrigger?.focus();
  }
});

  document.getElementById("langBtn")?.addEventListener("click", () => {
    populateCategories();
    renderProducts();
  });

  loadProducts();
})();
      
