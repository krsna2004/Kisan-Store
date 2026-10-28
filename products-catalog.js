(() => {
  "use strict";

  const INDEX_URL = "/content/products-index.json";
  const PAGE_SIZE = 12;

  const grid = document.getElementById("cms-products-grid");
  const status = document.getElementById("catalog-status");
  const searchInput = document.getElementById("product-search");
  const categoryPicker = document.getElementById("catalog-category-picker");
  const categoryTrigger = document.getElementById("product-category-trigger");
  const categoryLabel = document.getElementById("product-category-label");
  const categoryMenu = document.getElementById("product-category-menu");

  if (!grid || !status) return;

  let products = [];
  let selectedCategory = "";
  let currentPage = 1;

  const isHindi = () => document.documentElement.lang === "hi";
  const text = (en, hi) => isHindi() ? hi : en;

  const escapeHtml = value =>
    String(value ?? "").replace(/[&<>"']/g, char => ({
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#39;"
    })[char]);

  const getSlug = product => {
    const slug = String(product.slug || "").trim();

    return /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug)
      ? slug
      : String(product.name || "")
          .normalize("NFKD")
          .replace(/[\u0300-\u036f]/g, "")
          .toLowerCase()
          .trim()
          .replace(/[^a-z0-9]+/g, "-")
          .replace(/^-+|-+$/g, "");
  };

  const isAvailable = product =>
    product.available === true ||
    product.available === "true";

  function makeCard(product) {
    const name = String(
      isHindi()
        ? product.name_hi || product.name
        : product.name
    ).trim();

    const category = String(
      isHindi()
        ? product.category_hi || product.category || "हार्डवेयर"
        : product.category || "Hardware"
    ).trim();

    const slug = getSlug(product);
    const available = isAvailable(product);
    const rawImage = String(product.image || "").trim();

    const safeImage =
      rawImage &&
      !/^(?:[a-z]+:|\/\/|\/)/i.test(rawImage) &&
      !rawImage.split("/").includes("..");

    const image = safeImage
      ? `<img
          class="catalog-product-image"
          src="/${escapeHtml(rawImage.replace(/^\.\//, ""))}"
          alt="${escapeHtml(
            isHindi()
              ? product.image_alt_hi || product.image_alt || name
              : product.image_alt || name
          )}"
          width="600"
          height="600"
          loading="lazy"
          decoding="async"
          onerror="this.hidden=true">`
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
             target="_blank"
             rel="noopener noreferrer"
             href="https://wa.me/919667540112?text=${message}">
            ${text("Ask for Price ↗", "कीमत पूछें ↗")}
          </a>
        </div>
      </article>`;
  }

  function getFilteredProducts() {
    const query = String(searchInput?.value || "")
      .trim()
      .toLocaleLowerCase();

    return products.filter(product => {
      if (!product || !product.name) return false;

      if (
        selectedCategory &&
        String(product.category || "") !== selectedCategory
      ) {
        return false;
      }

      const keywords = Array.isArray(product.search_keywords)
        ? product.search_keywords.join(" ")
        : String(product.search_keywords || "");

      const searchable = [
        product.name,
        product.name_hi,
        product.category,
        product.category_hi,
        product.description,
        product.description_hi,
        keywords,
        product.brand,
        product.sku
      ]
        .filter(Boolean)
        .join(" ")
        .toLocaleLowerCase();

      return !query || searchable.includes(query);
    });
  }

  function renderPagination(totalPages) {
    let pagination = document.getElementById("catalog-pagination");

    if (!pagination) {
      pagination = document.createElement("nav");
      pagination.id = "catalog-pagination";
      pagination.className = "catalog-pagination";
      pagination.setAttribute(
        "aria-label",
        text("Product pages", "उत्पाद पृष्ठ")
      );
      grid.insertAdjacentElement("afterend", pagination);
    }

    if (totalPages <= 1) {
      pagination.innerHTML = "";
      pagination.hidden = true;
      return;
    }

    pagination.hidden = false;

    const previousDisabled = currentPage <= 1;
    const nextDisabled = currentPage >= totalPages;

    pagination.innerHTML = `
      <button type="button"
        data-page="${currentPage - 1}"
        ${previousDisabled ? "disabled" : ""}>
        ${text("← Previous", "← पिछला")}
      </button>

      <span class="catalog-page-number">
        ${escapeHtml(text("Page", "पृष्ठ"))}
        ${currentPage} ${text("of", "में से")} ${totalPages}
      </span>

      <button type="button"
        data-page="${currentPage + 1}"
        ${nextDisabled ? "disabled" : ""}>
        ${text("Next →", "अगला →")}
      </button>`;
  }

  function renderProducts() {
    const filtered = getFilteredProducts();
    const totalPages = Math.ceil(filtered.length / PAGE_SIZE);

    if (totalPages === 0) {
      currentPage = 1;
    } else {
      currentPage = Math.min(currentPage, totalPages);
    }

    const start = (currentPage - 1) * PAGE_SIZE;
    const visibleProducts = filtered.slice(start, start + PAGE_SIZE);

    grid.innerHTML = visibleProducts.map(makeCard).join("");

    status.textContent = filtered.length
      ? text(
          `${filtered.length} product(s) found. Showing ${
            start + 1
          }–${Math.min(start + PAGE_SIZE, filtered.length)}.`,
          `${filtered.length} उत्पाद मिले। ${
            start + 1
          }–${Math.min(start + PAGE_SIZE, filtered.length)} दिखाए जा रहे हैं।`
        )
      : text(
          "No products match your search.",
          "आपकी खोज से कोई उत्पाद नहीं मिला।"
        );

    renderPagination(totalPages);
  }

  function populateCategories() {
    if (!categoryPicker || !categoryMenu || !categoryLabel) return;

    const categories = [...new Set(
      products
        .map(product => String(product?.category || "").trim())
        .filter(Boolean)
    )].sort((a, b) => a.localeCompare(b));

    const options = [
      { value: "", label: text("All categories", "सभी श्रेणियाँ") },
      ...categories.map(category => {
        const sample = products.find(
          product => product.category === category
        );

        return {
          value: category,
          label: isHindi()
            ? sample?.category_hi || category
            : category
        };
      })
    ];

    if (!options.some(option => option.value === selectedCategory)) {
      selectedCategory = "";
    }

    const selected = options.find(
      option => option.value === selectedCategory
    );

    categoryLabel.textContent =
      selected?.label || text("All categories", "सभी श्रेणियाँ");

    categoryMenu.innerHTML = options.map(option => {
      const active = option.value === selectedCategory;

      return `
        <button
          type="button"
          class="catalog-category-option${active ? " is-selected" : ""}"
          role="option"
          aria-selected="${active}"
          data-category="${escapeHtml(option.value)}">
          <span>${escapeHtml(option.label)}</span>
          <span class="catalog-category-check" aria-hidden="true">
            ${active ? "✓" : ""}
          </span>
        </button>`;
    }).join("");
  }

  async function loadProducts() {
    status.textContent = text(
      "Loading products…",
      "उत्पाद लोड हो रहे हैं…"
    );

    try {
      const response = await fetch(
        `${INDEX_URL}?v=${Date.now()}`
      );

      if (!response.ok) {
        throw new Error("Could not load product index");
      }

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

  searchInput?.addEventListener("input", () => {
    currentPage = 1;
    renderProducts();
  });

  categoryTrigger?.addEventListener("click", () => {
    const open =
      categoryTrigger.getAttribute("aria-expanded") === "true";

    categoryTrigger.setAttribute("aria-expanded", String(!open));
    categoryMenu.hidden = open;
  });

  categoryMenu?.addEventListener("click", event => {
    const option = event.target.closest("[data-category]");
    if (!option) return;

    selectedCategory = option.dataset.category || "";
    currentPage = 1;

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

  document.getElementById("catalog-pagination")
    ?.addEventListener("click", event => {
      const button = event.target.closest("[data-page]");
      if (!button || button.disabled) return;

      currentPage = Number(button.dataset.page) || 1;
      renderProducts();

      grid.scrollIntoView({
        behavior: "smooth",
        block: "start"
      });
    });

  // The pagination element is created after the initial render,
  // so use a delegated listener on the grid's parent instead.
  grid.parentElement?.addEventListener("click", event => {
    const button = event.target.closest(
      "#catalog-pagination [data-page]"
    );

    if (!button || button.disabled) return;

    currentPage = Number(button.dataset.page) || 1;
    renderProducts();

    grid.scrollIntoView({
      behavior: "smooth",
      block: "start"
    });
  });

  document.getElementById("langBtn")?.addEventListener("click", () => {
    populateCategories();
    renderProducts();
  });

  loadProducts();
})();
