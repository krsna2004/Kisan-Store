
(() => {
  "use strict";

  const DATA_URL = "content/homepage-promotions.json";
  const ROTATION_MS = 7000;

  const section = document.getElementById("homepage-promo");
  const track = document.getElementById("homepage-promo-track");
  const dots = document.getElementById("homepage-promo-dots");

  if (!section || !track || !dots) return;

  let slides = [];
  let activeIndex = 0;
  let rotationTimer = null;
  let paused = false;

  const reducedMotion = window.matchMedia(
    "(prefers-reduced-motion: reduce)"
  );

  // Validate media paths before displaying them.
  function safePath(value) {
    const path = String(value || "").trim();

    if (
      !path ||
      path.startsWith("//") ||
      /^[a-z][a-z0-9+.-]*:/i.test(path) ||
      path.split("/").includes("..")
    ) {
      return "";
    }

    return path;
  }

  // Check optional promotion start and end dates.
  function isWithinSchedule(item) {
    const today = new Date();

    const localToday = [
      today.getFullYear(),
      String(today.getMonth() + 1).padStart(2, "0"),
      String(today.getDate()).padStart(2, "0")
    ].join("-");

    if (item.start_date && localToday < item.start_date) {
      return false;
    }

    if (item.end_date && localToday > item.end_date) {
      return false;
    }

    return true;
  }

  // Create an individual image or video slide.
  function makeSlide(item, index, total) {
    const slide = document.createElement("div");

    slide.className = "homepage-promo-slide";
    slide.setAttribute("role", "group");
    slide.setAttribute(
      "aria-label",
      "Promotion " + (index + 1) + " of " + total
    );
    slide.setAttribute("aria-hidden", "true");

    if (String(item.media_type || "").toLowerCase() === "video") {
      const source = safePath(item.video_file);

      if (!source) return null;

      const video = document.createElement("video");

      video.src = source;
      video.muted = true;
      video.defaultMuted = true;
      video.autoplay = true;
      video.loop = true;
      video.playsInline = true;
      video.controls = false;
      video.disablePictureInPicture = true;
      video.preload = "metadata";

      video.setAttribute(
        "aria-label",
        String(item.title || "Store promotion")
      );

      slide.appendChild(video);

    } else {
      const source = safePath(item.image);

      if (!source) return null;

      const image = document.createElement("img");

      image.src = source;
      image.alt = String(
        item.image_alt ||
        item.title ||
        "The Kisan Store promotion"
      );

      image.loading = index === 0 ? "eager" : "lazy";
      image.decoding = "async";

      if (index === 0) {
        image.fetchPriority = "high";
      }

      slide.appendChild(image);
    }

    return slide;
  }

  // Stop automatic slide rotation.
  function stopRotation() {
    if (rotationTimer !== null) {
      window.clearInterval(rotationTimer);
      rotationTimer = null;
    }
  }

  // Play only the active slide's video.
  function syncMediaPlayback() {
    slides.forEach((slide, index) => {
      const video = slide.querySelector("video");

      if (!video) return;

      if (index === activeIndex && !document.hidden) {
        const playPromise = video.play();

        if (
          playPromise &&
          typeof playPromise.catch === "function"
        ) {
          playPromise.catch(() => {});
        }

      } else {
        video.pause();

        try {
          video.currentTime = 0;
        } catch (_) {}
      }
    });
  }

  // Display a selected slide.
  function showSlide(index) {
    if (!slides.length) return;

    activeIndex = (index + slides.length) % slides.length;

    slides.forEach((slide, slideIndex) => {
      const active = slideIndex === activeIndex;

      slide.classList.toggle("is-active", active);
      slide.setAttribute("aria-hidden", String(!active));
    });

    dots.querySelectorAll("button").forEach((dot, dotIndex) => {
      dot.setAttribute(
        "aria-current",
        String(dotIndex === activeIndex)
      );

      dot.setAttribute(
        "aria-label",
        "Show promotion " + (dotIndex + 1)
      );
    });

    syncMediaPlayback();
  }

  // Start automatic rotation when appropriate.
  function startRotation() {
    stopRotation();

    if (
      slides.length < 2 ||
      paused ||
      reducedMotion.matches ||
      document.hidden
    ) {
      return;
    }

    rotationTimer = window.setInterval(() => {
      showSlide(activeIndex + 1);
    }, ROTATION_MS);
  }

  // Pause or resume rotation.
  function setPaused(value) {
    paused = value;

    if (paused) {
      stopRotation();
    } else {
      startRotation();
    }
  }

  // Build the carousel from CMS data.
  function render(items) {
    const todayItems = items
      .filter(item =>
        item &&
        item.active === true &&
        isWithinSchedule(item)
      )
      .sort((a, b) =>
        Number(a.order || 0) - Number(b.order || 0)
      );

    slides = [];
    track.replaceChildren();
    dots.replaceChildren();

    todayItems.forEach((item, index) => {
      const slide = makeSlide(
        item,
        index,
        todayItems.length
      );

      if (slide) {
        slides.push(slide);
        track.appendChild(slide);
      }
    });

    // Hide the entire carousel if there are no active slides.
    if (!slides.length) {
      section.hidden = true;
      return;
    }

    section.hidden = false;

    // Create navigation dots only when multiple slides exist.
    if (slides.length > 1) {
      dots.hidden = false;

      slides.forEach((_, index) => {
        const dot = document.createElement("button");

        dot.type = "button";
        dot.className = "homepage-promo-dot";

        dot.setAttribute(
          "aria-label",
          "Show promotion " + (index + 1)
        );

        dot.addEventListener("click", () => {
          showSlide(index);
          startRotation();
        });

        dots.appendChild(dot);
      });

    } else {
      dots.hidden = true;
    }

    showSlide(0);
    startRotation();
  }

  // Pause rotation when the pointer is over the carousel.
  section.addEventListener("mouseenter", () => {
    setPaused(true);
  });

  section.addEventListener("mouseleave", () => {
    setPaused(false);
  });

  // Also pause while keyboard focus is inside the carousel.
  section.addEventListener("focusin", () => {
    setPaused(true);
  });

  section.addEventListener("focusout", event => {
    if (!section.contains(event.relatedTarget)) {
      setPaused(false);
    }
  });

  // Pause videos and rotation when the browser tab is hidden.
  document.addEventListener("visibilitychange", () => {
    if (document.hidden) {
      stopRotation();

      slides.forEach(slide => {
        slide.querySelector("video")?.pause();
      });

    } else {
      syncMediaPlayback();
      startRotation();
    }
  });

  // Respect changes to the device's reduced-motion preference.
  reducedMotion.addEventListener?.("change", startRotation);

  // Load promotional media from the Pages CMS JSON file.
  fetch(DATA_URL)
    .then(response => {
      if (!response.ok) {
        throw new Error("Homepage promotion data unavailable");
      }

      return response.json();
    })
    .then(items => {
      if (!Array.isArray(items)) {
        throw new Error(
          "Homepage promotions must be a JSON array"
        );
      }

      render(items);
    })
    .catch(error => {
      section.hidden = true;

      console.error(
        "Homepage promotional carousel:",
        error
      );
    });

})();
