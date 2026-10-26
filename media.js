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
      items = data.filter(item => item.status === "Published")
        .sort((a, b) => (b.date || "").localeCompare(a.date || ""));

      const categories = [...new Set(items.map(item => item.category).filter(Boolean))].sort();
      categories.forEach(name => {
        const option = document.createElement("option");
        option.value = name;
        option.textContent = name;
        categorySelect?.appendChild(option);
      });
      render();
    } catch (error) {
      gallery.innerHTML = `<p>${language === "hi" ? "गैलरी अभी लोड नहीं हो सकी।" : "The gallery could not be loaded. Please try again later."}</p>`;
      console.error(error);
    }
  }

  categorySelect?.addEventListener("change", render);
  document.getElementById("langBtn")?.addEventListener("click", () => {
    setTimeout(() => {
      language = document.documentElement.lang === "hi" ? "hi" : "en";
      render();
    }, 0);
  });
  init();
})();