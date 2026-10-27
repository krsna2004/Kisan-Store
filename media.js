(() => {
  "use strict";

  const INDEX_URL = "content/media-index.json";
  const gallery = document.getElementById("mediaGallery");
  const categoryButton = document.getElementById("mediaCategoryButton");
  const categoryMenu = document.getElementById("mediaCategoryMenu");
  const categoryLabel = document.getElementById("mediaCategoryLabel");
  const status = document.getElementById("mediaStatus");

  if (!gallery) return;

  let items = [];
  let visibleImages = [];
  let selectedCategory = "";
  let language = document.documentElement.lang === "hi" ? "hi" : "en";
  let activeImageIndex = 0;
  let lastFocusedElement = null;
  let lightboxOpen = false;
  let historyEntryAdded = false;

  const esc = (value) => String(value ?? "").replace(/[&<>"']/g, (c) => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;"
  })[c]);

  function caption(item) {
    return language === "hi" && item.caption_hi
      ? item.caption_hi
      : (item.caption || "");
  }

  function imageLabel(item, index) {
    return caption(item) || item.title || (
      language === "hi" ? `फोटो ${index + 1}` : `Photo ${index + 1}`
    );
  }

  function ensureLightbox() {
    if (document.getElementById("mediaLightbox")) return;

    const lightbox = document.createElement("div");
    lightbox.id = "mediaLightbox";
    lightbox.className = "media-lightbox";
    lightbox.hidden = true;
    lightbox.innerHTML = `
      <div class="media-lightbox-topbar">
        <span id="mediaLightboxCounter" class="media-lightbox-counter"></span>
        <button class="media-lightbox-close" type="button" aria-label="Close full-screen image" title="Close">×</button>
      </div>
      <button class="media-lightbox-nav media-lightbox-prev" type="button" aria-label="Previous image" title="Previous image">‹</button>
      <figure class="media-lightbox-figure">
        <img id="mediaLightboxImage" alt="">
        <figcaption id="mediaLightboxCaption"></figcaption>
      </figure>
      <button class="media-lightbox-nav media-lightbox-next" type="button" aria-label="Next image" title="Next image">›</button>
    `;
    document.body.appendChild(lightbox);

    lightbox.addEventListener("click", (event) => {
      if (event.target === lightbox) closeLightbox();
    });
    lightbox.querySelector(".media-lightbox-close").addEventListener("click", closeLightbox);
    lightbox.querySelector(".media-lightbox-prev").addEventListener("click", () => moveImage(-1));
    lightbox.querySelector(".media-lightbox-next").addEventListener("click", () => moveImage(1));
  }

  function showLightboxImage() {
    const item = visibleImages[activeImageIndex];
    if (!item) return;

    const image = document.getElementById("mediaLightboxImage");
    const captionElement = document.getElementById("mediaLightboxCaption");
    const counter = document.getElementById("mediaLightboxCounter");
    const label = imageLabel(item, activeImageIndex);

    image.src = item.image;
    image.alt = item.image_alt || label;
    captionElement.textContent = caption(item);
    captionElement.hidden = !caption(item);
    counter.textContent = `${activeImageIndex + 1} / ${visibleImages.length}`;

    const multiple = visibleImages.length > 1;
    document.querySelector(".media-lightbox-prev").hidden = !multiple;
    document.querySelector(".media-lightbox-next").hidden = !multiple;
  }

  function openLightbox(index) {
    if (!visibleImages[index]) return;
    ensureLightbox();

    activeImageIndex = index;
    lastFocusedElement = document.activeElement;
    lightboxOpen = true;
    const lightbox = document.getElementById("mediaLightbox");
    lightbox.hidden = false;
    document.body.classList.add("media-lightbox-active");
    showLightboxImage();

    // Add a history entry so the phone/browser Back button closes the viewer first.
    historyEntryAdded = true;
    history.pushState({ ...(history.state || {}), kisanGalleryLightbox: true }, "");
    lightbox.querySelector(".media-lightbox-close").focus();
  }

  function closeLightbox(fromPopState = false) {
    if (!lightboxOpen) return;

    if (!fromPopState && historyEntryAdded && history.state?.kisanGalleryLightbox) {
      historyEntryAdded = false;
      history.back();
      return;
    }

    lightboxOpen = false;
    historyEntryAdded = false;
    const lightbox = document.getElementById("mediaLightbox");
    if (lightbox) lightbox.hidden = true;
    document.body.classList.remove("media-lightbox-active");

    const image = document.getElementById("mediaLightboxImage");
    if (image) image.removeAttribute("src");

    if (lastFocusedElement && typeof lastFocusedElement.focus === "function") {
      lastFocusedElement.focus();
    }
  }

  function moveImage(direction) {
    if (!visibleImages.length) return;
    activeImageIndex = (activeImageIndex + direction + visibleImages.length) % visibleImages.length;
    showLightboxImage();
  }

  window.addEventListener("popstate", (event) => {
    if (lightboxOpen) closeLightbox(true);
  });

  document.addEventListener("keydown", (event) => {
    if (!lightboxOpen) return;
    if (event.key === "Escape") {
      event.preventDefault();
      closeLightbox();
    } else if (event.key === "ArrowLeft") {
      event.preventDefault();
      moveImage(-1);
    } else if (event.key === "ArrowRight") {
      event.preventDefault();
      moveImage(1);
    }
  });

  function render() {
    const filtered = items.filter(item => !selectedCategory || item.category === selectedCategory);
    visibleImages = filtered.filter(item => {
      const type = String(item.media_type || "Image").toLowerCase();
      return Boolean(item.image) && !item.video_url &&
        type !== "video" && type !== "video url";
    });

    let imageIndex = 0;
    if (!filtered.length) {
      gallery.innerHTML = `<p>${language === "hi" ? "अभी कोई फोटो या वीडियो उपलब्ध नहीं है।" : "No photos or videos have been published yet."}</p>`;
    } else {
      gallery.innerHTML = filtered.map(item => {
        const text = caption(item);
        const type = String(item.media_type || "Image").toLowerCase();
        let media = "";

        if (type === "video url" || type === "video" || item.video_url) {
          const url = String(item.video_url || "").trim();
          const yt = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([A-Za-z0-9_-]{6,})/);
          if (yt) {
            media = `<div class="gallery-video"><iframe src="https://www.youtube-nocookie.com/embed/${esc(yt[1])}" title="${esc(text || item.title || "Store video")}" loading="lazy" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" allowfullscreen></iframe></div>`;
          } else if (/^https:\/\/.+/i.test(url)) {
            media = `<a class="gallery-video-link" href="${esc(url)}" target="_blank" rel="noopener noreferrer">${language === "hi" ? "वीडियो देखें ↗" : "Watch video ↗"}</a>`;
          }
        } else if (item.image) {
          const currentImageIndex = imageIndex++;
          const alt = item.image_alt || text || item.title || "Store gallery photo";
          media = `<button class="gallery-image-open" type="button" data-gallery-image-index="${currentImageIndex}" aria-label="${esc(language === "hi" ? "फोटो को पूरी स्क्रीन पर देखें" : "View image full screen")}">
            <img src="${esc(item.image)}" alt="${esc(alt)}" loading="lazy">
            <span class="gallery-image-expand" aria-hidden="true">⛶</span>
          </button>`;
        }

        return `<article class="gallery-item">
  <div class="gallery-item-media${item.image && !item.video_url ? " has-gallery-image" : ""}">
    ${media || `<div class="gallery-media-missing">${language === "hi" ? "मीडिया उपलब्ध नहीं है" : "Media unavailable"}</div>`}
    ${item.category && item.image && !item.video_url
      ? `<span class="gallery-item-category">${esc(item.category)}</span>`
      : ""}
    ${text && item.image && !item.video_url
      ? `<span class="gallery-item-caption">${esc(text)}</span>`
      : ""}
  </div>
  ${text && (!item.image || item.video_url)
    ? `<div class="gallery-item-caption">${esc(text)}</div>`
    : ""}
  ${item.category && (!item.image || item.video_url)
    ? `<span class="gallery-item-category">${esc(item.category)}</span>`
    : ""}
</article>`;
      }).join("");
    }

    if (status) {
      status.textContent = `${filtered.length} ${language === "hi" ? "मीडिया आइटम" : "items"}`;
    }
  }

  gallery.addEventListener("click", (event) => {
    const button = event.target.closest("[data-gallery-image-index]");
    if (!button) return;
    openLightbox(Number(button.dataset.galleryImageIndex));
  });

  async function init() {
    try {
      const response = await fetch(INDEX_URL);
      if (!response.ok) throw new Error("Media index could not be loaded.");

      const data = await response.json();
      if (!Array.isArray(data)) throw new Error("Invalid media index.");

      items = data
        .filter(item => item.status === "Published")
        .sort((a, b) => (b.date || "").localeCompare(a.date || ""));

      buildCategoryOptions();
      render();
    } catch (error) {
      gallery.innerHTML = `<p>${language === "hi" ? "गैलरी अभी लोड नहीं हो सकी।" : "The gallery could not be loaded. Please try again later."}</p>`;
      console.error(error);
    }
  }

  function buildCategoryOptions() {
    const categories = [...new Set(items.map(item => item.category).filter(Boolean))].sort();
    const options = ["", ...categories];

    if (categoryMenu) {
      categoryMenu.innerHTML = options.map(value => `
        <button class="blog-category-option${value === selectedCategory ? " is-selected" : ""}"
          type="button" role="option" aria-selected="${value === selectedCategory}"
          data-category="${esc(value)}">
          <span>${esc(value || (language === "hi" ? "सभी मीडिया" : "All media"))}</span>
          <span class="blog-category-check" aria-hidden="true">${value === selectedCategory ? "✓" : ""}</span>
        </button>
      `).join("");
    }

    if (categoryLabel) {
      categoryLabel.textContent = selectedCategory || (language === "hi" ? "सभी मीडिया" : "All media");
    }
  }

  function closeCategoryMenu() {
    if (!categoryMenu || !categoryButton) return;
    categoryMenu.hidden = true;
    categoryButton.setAttribute("aria-expanded", "false");
  }

  categoryButton?.addEventListener("click", () => {
    const open = categoryButton.getAttribute("aria-expanded") === "true";
    if (categoryMenu) categoryMenu.hidden = open;
    categoryButton.setAttribute("aria-expanded", String(!open));
  });

  categoryMenu?.addEventListener("click", (event) => {
    const option = event.target.closest("[data-category]");
    if (!option) return;
    selectedCategory = option.dataset.category || "";
    buildCategoryOptions();
    closeCategoryMenu();
    render();
  });

  document.addEventListener("click", (event) => {
    if (categoryButton && categoryMenu &&
        !categoryButton.contains(event.target) &&
        !categoryMenu.contains(event.target)) {
      closeCategoryMenu();
    }
  });

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape") closeCategoryMenu();
  });

  document.getElementById("langBtn")?.addEventListener("click", () => {
    setTimeout(() => {
      language = document.documentElement.lang === "hi" ? "hi" : "en";
      buildCategoryOptions();
      render();
      if (lightboxOpen) showLightboxImage();
    }, 0);
  });

  init();
})();
