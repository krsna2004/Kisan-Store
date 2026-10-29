
(() => {
  "use strict";

  const section = document.querySelector(".top-brands");
  const track = document.getElementById("brand-track");

  if (!section || !track) return;

  async function loadBrands() {
    try {
      const response = await fetch("/content/brands.json");

      if (!response.ok) {
        throw new Error("Could not load brands.json");
      }

      const brands = await response.json();

      if (!Array.isArray(brands) || brands.length === 0) {
        throw new Error("No brands found");
      }

      const validBrands = brands.filter(brand =>
        brand &&
        typeof brand.name === "string" &&
        brand.name.trim() &&
        typeof brand.image === "string" &&
        /^[a-zA-Z0-9_-]+\.(png|webp|jpe?g|svg)$/i.test(brand.image)
      );

      if (!validBrands.length) {
        throw new Error("No valid brand entries found");
      }

      function createBrand(brand, duplicate = false) {
        const item = document.createElement("div");
        item.className = "brand-item";

        if (duplicate) {
          item.setAttribute("aria-hidden", "true");
        }

        const img = document.createElement("img");
        img.src = `/assets/brands/${brand.image}`;
        img.alt = duplicate ? "" : brand.name;
        img.width = 200;
        img.height = 200;
        img.loading = "lazy";
        img.decoding = "async";

        const label = document.createElement("span");
        label.textContent = brand.name;

        item.append(img, label);
        return item;
      }

      // Build two identical sets for the infinite animation.
      const fragment = document.createDocumentFragment();

      validBrands.forEach(brand => {
        fragment.appendChild(createBrand(brand));
      });

      validBrands.forEach(brand => {
        fragment.appendChild(createBrand(brand, true));
      });

      track.replaceChildren(fragment);

      // Move exactly one set, regardless of the number of brands.
      track.style.setProperty("--brand-set-width", "50%");
      track.classList.add("brand-track-ready");

    } catch (error) {
      console.error("Brand carousel:", error);
      section.hidden = true;
    }
  }

  loadBrands();
})();
