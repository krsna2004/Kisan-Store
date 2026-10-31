
(function () {
  "use strict";

  const url = SUPABASE_URL.replace(/\/$/, "");
  const key = SUPABASE_ANON_KEY;

  // Replace this with your exact Cloudflare Worker URL.
  const WORKER_URL = "https://kisan-store-review-api.krishnayadav422004.workers.dev/";

  const carousel = document.getElementById("reviews-carousel");
  const form = document.getElementById("customer-review-form");
  const statusMessage = document.getElementById("review-form-status");

  if (!carousel || !form) return;

  const headers = {
    "apikey": key,
    "Authorization": "Bearer " + key,
    "Content-Type": "application/json"
  };

  function setMessage(message, isError) {
    if (!statusMessage) return;
    statusMessage.textContent = message;
    statusMessage.style.color = isError ? "#b91c1c" : "#267342";
  }

  function resetCaptcha() {
    if (window.turnstile) {
      window.turnstile.reset();
    }
  }

  function createReviewCard(review) {
    const card = document.createElement("article");
    card.className = "review-card";

    const stars = document.createElement("div");
    stars.className = "review-stars";
    stars.textContent =
      "★".repeat(review.rating) +
      "☆".repeat(5 - review.rating);
    stars.setAttribute(
      "aria-label",
      review.rating + " out of 5 stars"
    );

    const name = document.createElement("h3");
    name.textContent = review.customer_name;

    const location = document.createElement("div");
    location.className = "review-location";
    location.textContent = review.location || "Customer";

    const message = document.createElement("p");
    message.className = "review-message";
    message.textContent = review.review_text;

    card.append(stars, name, location, message);
    return card;
  }

  async function loadReviews() {
    carousel.setAttribute("aria-busy", "true");

    try {
      const params = new URLSearchParams({
        select: "customer_name,location,rating,review_text,created_at",
        status: "eq.approved",
        order: "created_at.desc",
        limit: "12"
      });

      const response = await fetch(
        url + "/rest/v1/reviews?" + params.toString(),
        { headers: headers }
      );

      if (!response.ok) {
        throw new Error("Could not load customer reviews.");
      }

      const reviews = await response.json();
      carousel.replaceChildren();

      if (!reviews.length) {
        const empty = document.createElement("p");
        empty.className = "review-empty";
        empty.textContent =
          "Customer reviews will appear here as they are approved.";
        carousel.appendChild(empty);
        return;
      }

      reviews.forEach(function (review) {
        carousel.appendChild(createReviewCard(review));
      });

    } catch (error) {
      console.error("Review loading error:", error);

      const empty = document.createElement("p");
      empty.className = "review-empty";
      empty.textContent =
        "Reviews could not load right now. Please try again later.";
      carousel.replaceChildren(empty);

    } finally {
      carousel.setAttribute("aria-busy", "false");
    }
  }

  form.addEventListener("submit", async function (event) {
    event.preventDefault();

    const submitButton = form.querySelector('[type="submit"]');
    if (submitButton.disabled) return;

    const customerName =
      form.elements.customer_name.value.trim();

    const location =
      form.elements.location.value.trim();

    const rating =
      Number(form.elements.rating.value);

    const reviewText =
      form.elements.review_text.value.trim();

    const captchaField =
      form.querySelector('[name="cf-turnstile-response"]');

    const turnstileToken = captchaField
      ? captchaField.value
      : "";

    if (
      customerName.length < 2 ||
      customerName.length > 80 ||
      !Number.isInteger(rating) ||
      rating < 1 ||
      rating > 5 ||
      reviewText.length < 10 ||
      reviewText.length > 1000 ||
      location.length > 100
    ) {
      setMessage("Please check your details and try again.", true);
      return;
    }

    if (!turnstileToken) {
      setMessage("Please complete the security verification.", true);
      return;
    }

    if (WORKER_URL === "PASTE_YOUR_WORKER_URL_HERE") {
      setMessage("Review submission is not configured yet.", true);
      return;
    }

    submitButton.disabled = true;
    setMessage("Submitting your review...", false);

    try {
      const response = await fetch(WORKER_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          customer_name: customerName,
          location: location || null,
          rating: rating,
          review_text: reviewText,
          turnstileToken: turnstileToken
        })
      });

      const result = await response.json().catch(() => ({}));

      if (!response.ok || !result.success) {
        throw new Error(
          result.error || "Review submission failed."
        );
      }

      form.reset();
      resetCaptcha();

      setMessage(
        "Thank you! Your review has been submitted and is awaiting approval.",
        false
      );

    } catch (error) {
      console.error("Review submission error:", error);

      setMessage(
        error.message || "Sorry, your review could not be submitted. Please try again.",
        true
      );

      resetCaptcha();

    } finally {
      submitButton.disabled = false;
    }
  });

  loadReviews();
})();
    
