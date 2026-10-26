
(() => {
  "use strict";

  const SCRIPT_URL =
    "https://script.google.com/macros/s/AKfycbz1MukerA3rkKCoQEXxWbyuPqksVyeVF1eRR7QGJFc5TiPJeJRQgD-vV22TWkSnJLwu/exec";

  const WHATSAPP_NUMBER = "919667540112";
  const form = document.getElementById("tpPartnerForm");

  if (!form) return;

  form.addEventListener("submit", async (event) => {
    event.preventDefault();

    if (!form.reportValidity()) return;

    const status = document.getElementById("tpFormStatus");
    const button = form.querySelector('button[type="submit"]');

    if (button.disabled) return;

    const formData = new FormData(form);

    const name = (formData.get("name") || "").trim();
    const phone = (formData.get("phone") || "").trim();
    const partnerType = formData.get("partnerType") || "";
    const trade = (formData.get("trade") || "").trim();
    const location = (formData.get("location") || "").trim();
    const message = (formData.get("message") || "").trim();

    const whatsappMessage = [
      "Kisan Store - Partner Registration",
      "",
      `Name: ${name}`,
      `Mobile / WhatsApp: ${phone}`,
      `Programme: ${partnerType}`,
      `Profession / Shop: ${trade}`,
      `Village / Town / City: ${location}`,
      `Additional Message: ${message || "Not provided"}`
    ].join("\n");

    // Open WhatsApp in a new tab after the form submission.
    const whatsappWindow = window.open("about:blank", "_blank");

    if (!whatsappWindow) {
      if (status) {
        status.textContent =
          "Please allow pop-ups for this website and try again.";
      }
      return;
    }

    button.disabled = true;

    if (status) {
      status.textContent = "Submitting your registration...";
    }

    try {
      const response = await fetch(SCRIPT_URL, {
        method: "POST",
        body: new URLSearchParams(formData),
        mode: "no-cors"
      });

      // With no-cors, the response is opaque. Reaching here
      // does not prove that Google Sheets saved the application.
      void response;

      whatsappWindow.location.href =
        "https://wa.me/" +
        WHATSAPP_NUMBER +
        "?text=" +
        encodeURIComponent(whatsappMessage);

      if (status) {
        status.textContent =
          "WhatsApp is opening. Please check your message and tap Send.";
      }
    } catch (error) {
      whatsappWindow.close();

      if (status) {
        status.textContent =
          "We couldn't submit the request. Please check your internet and try again.";
      }
    } finally {
      button.disabled = false;
    }
  });
})();
