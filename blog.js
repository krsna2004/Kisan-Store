
(() => {
  "use strict";

  const INDEX_URL = "content/blog-index.json";
  const list = document.getElementById("blogList");
  const featured = document.getElementById("featuredBlog");
  const search = document.getElementById("blogSearch");
  const category = document.getElementById("blogCategory");
  const status = document.getElementById("blogStatus");

  if (!list || !featured) return;

  let blogs = [];
  let language = document.documentElement.lang === "hi" ? "hi" : "en";

  function field(post, english, hindi) {
    if (language === "hi" && post[hindi]) return post[hindi];
    return post[english] || "";
  }

  function escapeHTML(value) {
    return String(value).replace(/[&<>"']/g, (char) => ({
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
      ? `<img src="${escapeHTML(post.image)}" alt="${escapeHTML(post.image_alt || title)}" loading="lazy">`
      : "";

    return `
      <article class="article-card">
        ${image}
        <div class="article-number">${escapeHTML(post.category || "Guide")}</div>
        <div class="article-body">
          <h3><a href="${postURL(post)}">${escapeHTML(title)}</a></h3>
          <p>${escapeHTML(description)}</p>
          <p><a href="${postURL(post)}">${language === "hi" ? "पूरा लेख पढ़ें →" : "Read article →"}</a></p>
        </div>
      </article>`;
  }

  function render() {
    const query = (search?.value || "").trim().toLowerCase();
    const selectedCategory = category?.value || "";

    const filtered = blogs.filter((post) => {
      const searchable = [
        post.title, post.title_hi,
        post.description, post.description_hi,
        post.category, post.tags
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
      status.textContent = `${filtered.length} ${language === "hi" ? "लेख" : "articles"}`;
    }
  }

  async function init() {
    try {
      const response = await fetch(INDEX_URL);
      if (!response.ok) throw new Error("Blog index could not be loaded.");

      blogs = await response.json();

      if (!Array.isArray(blogs)) {
        throw new Error("Blog index format is invalid.");
      }

      blogs = blogs.filter((post) => post.status === "Published");

      const categories = [...new Set(
        blogs.map((post) => post.category).filter(Boolean)
      )].sort();

      categories.forEach((name) => {
        const option = document.createElement("option");
        option.value = name;
        option.textContent = name;
        category?.appendChild(option);
      });

      render();
    } catch (error) {
      list.innerHTML = `<p>${language === "hi"
        ? "लेख अभी लोड नहीं हो सके। कृपया बाद में फिर कोशिश करें।"
        : "Articles could not be loaded. Please try again later."}</p>`;
      console.error(error);
    }
  }

  search?.addEventListener("input", render);
  category?.addEventListener("change", render);

  document.getElementById("langBtn")?.addEventListener("click", () => {
    window.setTimeout(() => {
      language = document.documentElement.lang === "hi" ? "hi" : "en";
      render();
    }, 0);
  });

  init();
})();
                         
