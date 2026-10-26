
(() => {
  "use strict";

  const INDEX_URL = "content/blog-index.json";
  const list = document.getElementById("blogList");
  const featured = document.getElementById("featuredBlog");
  const search = document.getElementById("blogSearch");
  const categoryButton = document.getElementById("blogCategoryButton");
  const categoryMenu = document.getElementById("blogCategoryMenu");
  const categoryLabel = document.getElementById("blogCategoryLabel");
  const status = document.getElementById("blogStatus");

  if (!list || !featured) return;

  let blogs = [];
  let selectedCategory = "";
  let language = document.documentElement.lang === "hi" ? "hi" : "en";

  function field(post, english, hindi) {
    if (language === "hi" && post[hindi]) return post[hindi];
    return post[english] || "";
  }

  function escapeHTML(value) {
    return String(value ?? "").replace(/[&<>"']/g, (char) => ({
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#39;"
    })[char]);
  }

  function postURL(post) {
    return "blog-post.html?slug=" + encodeURIComponent(post.slug || "");
  }

  function card(post) {
    const title = field(post, "title", "title_hi");
    const description = field(post, "description", "description_hi");
    const image = post.image
      ? `<img class="blog-card-image" src="${escapeHTML(post.image)}"
          alt="${escapeHTML(post.image_alt || title)}" loading="lazy">`
      : "";

    const badge = `
      <span class="blog-category-badge">
        ${escapeHTML(post.category || "Guide")}
      </span>`;

    return `
      <article class="article-card">
        <div class="blog-card-media">
          ${image}
          ${badge}
        </div>
        <div class="article-body">
          <h3><a href="${postURL(post)}">${escapeHTML(title)}</a></h3>
          <p>${escapeHTML(description)}</p>
          <p>
            <a href="${postURL(post)}">
              ${language === "hi" ? "पूरा लेख पढ़ें →" : "Read article →"}
            </a>
          </p>
        </div>
      </article>`;
  }

  function categoryText(value) {
    if (!value) {
      return language === "hi" ? "सभी श्रेणियाँ" : "All categories";
    }
    return value;
  }

  function renderCategoryMenu(categories) {
    if (!categoryMenu) return;

    const options = ["", ...categories];

    categoryMenu.innerHTML = options.map((value) => `
      <button
        class="blog-category-option${value === selectedCategory ? " is-selected" : ""}"
        type="button"
        role="option"
        aria-selected="${value === selectedCategory}"
        data-category="${escapeHTML(value)}">
        <span>${escapeHTML(categoryText(value))}</span>
        <span class="blog-category-check" aria-hidden="true">
          ${value === selectedCategory ? "✓" : ""}
        </span>
      </button>
    `).join("");

    if (categoryLabel) {
      categoryLabel.textContent = categoryText(selectedCategory);
    }
  }

  function closeCategoryMenu() {
    if (!categoryMenu || !categoryButton) return;
    categoryMenu.hidden = true;
    categoryButton.setAttribute("aria-expanded", "false");
  }

  function render() {
    const query = (search?.value || "").trim().toLowerCase();

    const filtered = blogs.filter((post) => {
      const searchable = [
        post.title,
        post.title_hi,
        post.description,
        post.description_hi,
        post.category,
        ...(Array.isArray(post.tags) ? post.tags : [post.tags || ""])
      ].join(" ").toLowerCase();

      return (!query || searchable.includes(query)) &&
        (!selectedCategory || post.category === selectedCategory);
    });

    const featuredPost = filtered.find((post) => post.featured);

    featured.innerHTML = featuredPost
      ? `<h2>${language === "hi" ? "विशेष लेख" : "Featured article"}</h2>${card(featuredPost)}`
      : "";

    const remaining = filtered.filter((post) => post !== featuredPost);

    list.innerHTML = remaining.length
      ? remaining.map(card).join("")
      : `<p>${language === "hi" ? "कोई लेख नहीं मिला।" : "No articles found."}</p>`;

    if (status) {
      status.textContent = `${filtered.length} ${
        language === "hi" ? "लेख" : "articles"
      }`;
    }
  }

  async function init() {
    try {
      const response = await fetch(INDEX_URL);
      if (!response.ok) throw new Error("Blog index could not be loaded.");

      blogs = await response.json();
      if (!Array.isArray(blogs)) throw new Error("Invalid blog index.");

      blogs = blogs.filter((post) => post.status === "Published");

      const categories = [...new Set(
        blogs.map((post) => post.category).filter(Boolean)
      )].sort((a, b) => a.localeCompare(b));

      renderCategoryMenu(categories);
      render();
    } catch (error) {
      list.innerHTML = `<p>${
        language === "hi"
          ? "लेख अभी लोड नहीं हो सके। कृपया बाद में फिर कोशिश करें।"
          : "Articles could not be loaded. Please try again later."
      }</p>`;
      console.error(error);
    }
  }

  categoryButton?.addEventListener("click", () => {
    const isOpen = categoryButton.getAttribute("aria-expanded") === "true";
    if (isOpen) {
      closeCategoryMenu();
    } else {
      categoryMenu.hidden = false;
      categoryButton.setAttribute("aria-expanded", "true");
    }
  });

  categoryMenu?.addEventListener("click", (event) => {
    const option = event.target.closest("[data-category]");
    if (!option) return;

    selectedCategory = option.dataset.category || "";

    renderCategoryMenu(
      [...new Set(blogs.map((post) => post.category).filter(Boolean))]
        .sort((a, b) => a.localeCompare(b))
    );

    closeCategoryMenu();
    render();
  });

  document.addEventListener("click", (event) => {
    if (
      categoryButton &&
      categoryMenu &&
      !categoryButton.contains(event.target) &&
      !categoryMenu.contains(event.target)
    ) {
      closeCategoryMenu();
    }
  });

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape") closeCategoryMenu();
  });

  search?.addEventListener("input", render);

  document.getElementById("langBtn")?.addEventListener("click", () => {
    window.setTimeout(() => {
      language = document.documentElement.lang === "hi" ? "hi" : "en";
      renderCategoryMenu(
        [...new Set(blogs.map((post) => post.category).filter(Boolean))]
          .sort((a, b) => a.localeCompare(b))
      );
      render();
    }, 0);
  });

  init();
})();
  
