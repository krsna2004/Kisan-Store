(() => {
  "use strict";
  const languageButton = document.getElementById("langBtn");
  const menuButton = document.getElementById("menuBtn");
  const nav = document.getElementById("navlinks");
  const year = document.getElementById("year");
  const storageKey = "kisan-hardware-language";
  let currentLanguage = "en";

  function applyLanguage(language) {
    currentLanguage = language === "hi" ? "hi" : "en";
    document.documentElement.lang = currentLanguage;
    document.querySelectorAll("[data-en][data-hi]").forEach((element) => {
      const translated = element.getAttribute(`data-${currentLanguage}`);
      if (translated !== null) element.textContent = translated;
    });
    if (languageButton) {
      languageButton.textContent = currentLanguage === "en" ? "हिन्दी" : "English";
      languageButton.setAttribute(
        "aria-label",
        currentLanguage === "en" ? "Switch website to Hindi" : "Switch website to English"
      );
      languageButton.setAttribute("aria-pressed", String(currentLanguage === "hi"));
    }
    try { localStorage.setItem(storageKey, currentLanguage); } catch (_) { /* Storage may be unavailable. */ }
  }

  if (languageButton) {
    languageButton.addEventListener("click", () => {
      applyLanguage(currentLanguage === "en" ? "hi" : "en");
    });
  }

  if (menuButton && nav) {
    menuButton.addEventListener("click", () => {
      const isOpen = nav.classList.toggle("open");
      menuButton.setAttribute("aria-expanded", String(isOpen));
      menuButton.setAttribute("aria-label", isOpen ? "Close navigation" : "Open navigation");
    });
    nav.querySelectorAll("a").forEach((link) => {
      link.addEventListener("click", () => {
        nav.classList.remove("open");
        menuButton.setAttribute("aria-expanded", "false");
        menuButton.setAttribute("aria-label", "Open navigation");
      });
    });
    document.addEventListener("keydown", (event) => {
      if (event.key === "Escape" && nav.classList.contains("open")) {
        nav.classList.remove("open");
        menuButton.setAttribute("aria-expanded", "false");
        menuButton.setAttribute("aria-label", "Open navigation");
        menuButton.focus();
      }
    });
  }

  if (year) year.textContent = String(new Date().getFullYear());
  try {
    const savedLanguage = localStorage.getItem(storageKey);
    if (savedLanguage === "hi" || savedLanguage === "en") applyLanguage(savedLanguage);
  } catch (_) { /* The site remains usable without local storage. */ }
})();