
(() => {
  "use strict";

  const section = document.querySelector(".top-brands");
  const track = document.getElementById("brand-track");

  if (!section || !track) return;

  const SPEED = 45; // pixels per second
  let animationFrame = 0;
  let previousTime = 0;
  let offset = 0;

  async function loadBrands() {
    try {
      const response = await fetch("/content/brands.json");

      if (!response.ok) throw new Error("Unable to load brands");

      const brands = await response.json();

      if (!Array.isArray(brands) || brands.length === 0) {
        section.hidden = true;
        return;
      }

      const validBrands = brands.filter(brand =>
        brand &&
        typeof brand.name === "string" &&
        typeof brand.image === "string" &&
        /^[a-zA-Z0-9 _-]+\.(png|webp|jpe?g|svg)$/i.test(brand.image)
      );

      if (!validBrands.length) {
        section.hidden = true;
        return;
      }

      const fragment = document.createDocumentFragment();

      validBrands.forEach(brand => {
        const item = document.createElement("div");
        item.className = "brand-item";

        const img = document.createElement("img");
        img.src = `/assets/brands/${brand.image}`;
        img.alt = "";
        img.width = 100;
        img.height = 100;
        img.decoding = "async";

        const label = document.createElement("span");
        label.textContent = brand.name;

        item.append(img, label);
        fragment.appendChild(item);
      });

      track.replaceChildren(fragment);
      section.hidden = false;

      // Wait for layout before measuring logo positions.
      requestAnimationFrame(() => {
        previousTime = 0;
        animationFrame = requestAnimationFrame(animate);
      });
    } catch (error) {
      console.error("Brand carousel:", error);
      section.hidden = true;
    }
  }

  function animate(time) {
    if (!track.children.length) return;

    if (previousTime) {
      const delta = Math.min((time - previousTime) / 1000, 0.05);
      offset += SPEED * delta;
    }

    previousTime = time;

    const first = track.firstElementChild;

    if (first) {
      const style = getComputedStyle(track);
      const gap = parseFloat(style.columnGap) || 0;
      const firstWidth = first.getBoundingClientRect().width + gap;

      if (firstWidth > 0 && offset >= firstWidth) {
        offset -= firstWidth;
        track.appendChild(first);
      }
    }

    track.style.transform = `translateX(${-offset}px)`;
    animationFrame = requestAnimationFrame(animate);
  }

  loadBrands();
})();
