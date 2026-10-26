(() => {
  "use strict";

  const INDEX_URL = "content/media-index.json";
  const gallery = document.getElementById("mediaGallery");
  const categoryButton = document.getElementById("mediaCategoryButton");
const categoryMenu = document.getElementById("mediaCategoryMenu");
const categoryLabel = document.getElementById("mediaCategoryLabel");

let selectedCategory = "";
  const status = document.getElementById("mediaStatus");
  if (!gallery) return;

  let items = [];
  let language = document.documentElement.lang === "hi" ? "hi" : "en";

  const esc = (value) => String(value ?? "").replace(/[&<>"']/g, (c) => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;"
  })[c]);

  function caption(item) {
    return language === "hi" && item.caption_hi ? item.caption_hi : (item.caption || "");
  }

  function render() {
    const chosen = selectedCategory;
    const filtered = items.filter(item => !chosen || item.category === chosen);

    if (!filtered.length) {
      gallery.innerHTML = `<p>${language === "hi" ? "अभी कोई फोटो या वीडियो उपलब्ध नहीं है।" : "No photos or videos have been published yet."}</p>`;
    } else {
      gallery.innerHTML = filtered.map(item => {
        const text = caption(item);
        const type = String(item.media_type || "Image").toLowerCase();
        let media = "";

        if (type === "video url" || type === "video" || item.video_url) {
          const url = String(item.video_url || "").trim();
          // YouTube links are embedded; other video URLs are linked safely.
          const yt = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([A-Za-z0-9_-]{6,})/);
          if (yt) {
            media = `<div class="gallery-video"><iframe src="https://www.youtube-nocookie.com/embed/${esc(yt[1])}" title="${esc(text || item.title || "Store video")}" loading="lazy" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" allowfullscreen></iframe></div>`;
          } else if (/^https:\/\/.+/i.test(url)) {
            media = `<a class="gallery-video-link" href="${esc(url)}" target="_blank" rel="noopener noreferrer">${language === "hi" ? "वीडियो देखें ↗" : "Watch video ↗"}</a>`;
          }
        } else if (item.image) {
          media = `<img src="${esc(item.image)}" alt="${esc(item.image_alt || text || item.title || "Store gallery photo")}" loading="lazy">`;
        }

        return `<article class="gallery-item">
          <div class="gallery-item-media">${media || `<div class="gallery-media-missing">${language === "hi" ? "मीडिया उपलब्ध नहीं है" : "Media unavailable"}</div>`}</div>
          ${text ? `<div class="gallery-item-caption">${esc(text)}</div>` : ""}
          ${item.category ? `<span class="gallery-item-category">${esc(item.category)}</span>` : ""}
        </article>`;
      }).join("");
    }

    if (status) status.textContent = `${filtered.length} ${language === "hi" ? "मीडिया आइटम" : "items"}`;
  }

  
  async function init() {
    try {
      const response = await fetch(INDEX_URL);
      if (!response.ok) throw new Error("Media index could not be loaded.");

      const data = await response.json();
      if (!Array.isArray(data)) throw new Error("Invalid media index.");

      items = data
        .filter(item => item.status === "Published")
        .sort((a, b) => (b.date || "").localeCompare(a.date || ""));

      const categories = [...new Set(
        items.map(item => item.category).filter(Boolean)
      )].sort();

      const options = ["", ...categories];

      if (categoryMenu) {
        categoryMenu.innerHTML = options.map(value => `
          <button
            class="blog-category-option${value === selectedCategory ? " is-selected" : ""}"
            type="button"
            role="option"
            aria-selected="${value === selectedCategory}"
            data-category="${esc(value)}">
            <span>${esc(value || (language === "hi" ? "सभी मीडिया" : "All media"))}</span>
            <span class="blog-category-check" aria-hidden="true">
              ${value === selectedCategory ? "✓" : ""}
            </span>
          </button>
        `).join("");
      }

      if (categoryLabel) {
        categoryLabel.textContent =
          selectedCategory || (language === "hi" ? "सभी मीडिया" : "All media");
      }

      render();
    } catch (error) {
      gallery.innerHTML = `<p>${
        language === "hi"
          ? "गैलरी अभी लोड नहीं हो सकी।"
          : "The gallery could not be loaded. Please try again later."
      }</p>`;
      console.error(error);
    }
  }

  document.getElementById("langBtn")?.addEventListener("click", () => {
    setTimeout(() => {
      language = document.documentElement.lang === "hi" ? "hi" : "en";
      render();
    }, 0);
  });
  function closeCategoryMenu() {
  if (!categoryMenu || !categoryButton) return;
  categoryMenu.hidden = true;
  categoryButton.setAttribute("aria-expanded", "false");
}

categoryButton?.addEventListener("click", () => {
  const open = categoryButton.getAttribute("aria-expanded") === "true";

  categoryMenu.hidden = open;
  categoryButton.setAttribute("aria-expanded", String(!open));
});

categoryMenu?.addEventListener("click", event => {
  const option = event.target.closest("[data-category]");
  if (!option) return;

  selectedCategory = option.dataset.category || "";

  const categories = [...new Set(
    items.map(item => item.category).filter(Boolean)
  )].sort();

  const options = ["", ...categories];

  categoryMenu.innerHTML = options.map(value => `
    <button
      class="blog-category-option${value === selectedCategory ? " is-selected" : ""}"
      type="button"
      role="option"
      aria-selected="${value === selectedCategory}"
      data-category="${esc(value)}">
      <span>${esc(value || (language === "hi" ? "सभी मीडिया" : "All media"))}</span>
      <span class="blog-category-check" aria-hidden="true">
        ${value === selectedCategory ? "✓" : ""}
      </span>
    </button>
  `).join("");

  categoryLabel.textContent =
    selectedCategory || (language === "hi" ? "सभी मीडिया" : "All media");

  closeCategoryMenu();
  render();
});

document.addEventListener("click", event => {
  if (
    categoryButton &&
    categoryMenu &&
    !categoryButton.contains(event.target) &&
    !categoryMenu.contains(event.target)
  ) {
    closeCategoryMenu();
  }
});

document.addEventListener("keydown", event => {
  if (event.key === "Escape") closeCategoryMenu();
});
  init();
})();
