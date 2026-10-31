(function () {
  "use strict";

  const SUPABASE_ROOT = String(SUPABASE_URL || "").replace(/\/$/, "");
  const SUPABASE_KEY = SUPABASE_ANON_KEY;
  const WORKER_URL = "https://kisan-store-review-api.krishnayadav422004.workers.dev/";
  const PAGE_SIZE = 12;

  const grid = document.getElementById("reviews-page-grid");
  const averageEl = document.getElementById("reviews-average");
  const averageStarsEl = document.getElementById("reviews-average-stars");
  const totalEl = document.getElementById("reviews-total");
  const breakdownEl = document.getElementById("rating-breakdown");
  const filterWrap = document.getElementById("reviews-filter");
  const filterTrigger = document.getElementById("reviews-filter-trigger");
  const filterMenu = document.getElementById("reviews-filter-menu");
  const filterValue = document.getElementById("reviews-filter-value");
  const filterOptions = Array.from(
    document.querySelectorAll(".custom-filter-option")
  );
  const moreButton = document.getElementById("reviews-load-more");
  const status = document.getElementById("reviews-page-status");
  const resultsLabel = document.getElementById("reviews-results-label");
  const form = document.getElementById("customer-review-form");
  const formStatus = document.getElementById("review-form-status");

  const headers = {
    apikey: SUPABASE_KEY,
    Authorization: "Bearer " + SUPABASE_KEY
  };

  let offset = 0;
  let selectedRating = "all";
  let loading = false;
  let finished = false;

  function setFormMessage(message, isError) {
    if (!formStatus) return;

    formStatus.textContent = message;
    formStatus.style.color = isError ? "#b91c1c" : "#267342";
  }

  function resetCaptcha() {
    if (window.turnstile) {
      try {
        window.turnstile.reset();
      } catch (error) {
        console.warn("Turnstile reset could not be completed:", error);
      }
    }
  }

  // Custom rating dropdown
  function closeFilter(returnFocus) {
    if (!filterMenu || !filterTrigger) return;

    filterMenu.hidden = true;
    filterTrigger.setAttribute("aria-expanded", "false");

    if (returnFocus) filterTrigger.focus();
  }

  function openFilter() {
    if (!filterMenu || !filterTrigger) return;

    filterMenu.hidden = false;
    filterTrigger.setAttribute("aria-expanded", "true");

    const selected = filterMenu.querySelector('[aria-selected="true"]');

    if (selected) selected.focus();
  }

  function chooseRating(value, option) {
    selectedRating = value;
    filterValue.textContent = option.textContent.trim();

    filterOptions.forEach(function (item) {
      const active = item.dataset.value === value;

      item.classList.toggle("is-selected", active);
      item.setAttribute(
        "aria-selected",
        active ? "true" : "false"
      );
    });

    closeFilter(false);
    loadReviews(true);
  }

  if (filterTrigger && filterMenu) {
    filterTrigger.addEventListener("click", function () {
      const isOpen =
        filterTrigger.getAttribute("aria-expanded") === "true";

      if (isOpen) {
        closeFilter(false);
      } else {
        openFilter();
      }
    });

    filterOptions.forEach(function (option) {
      option.addEventListener("click", function () {
        chooseRating(option.dataset.value, option);
      });

      option.addEventListener("keydown", function (event) {
        const currentIndex = filterOptions.indexOf(option);

        if (
          event.key === "ArrowDown" ||
          event.key === "ArrowUp"
        ) {
          event.preventDefault();

          const direction =
            event.key === "ArrowDown" ? 1 : -1;

          filterOptions[
            (currentIndex + direction + filterOptions.length) %
              filterOptions.length
          ].focus();

        } else if (event.key === "Escape") {
          event.preventDefault();
          closeFilter(true);
        }
      });
    });

    document.addEventListener("click", function (event) {
      if (
        filterWrap &&
        !filterWrap.contains(event.target)
      ) {
        closeFilter(false);
      }
    });

    filterTrigger.addEventListener("keydown", function (event) {
      if (
        event.key === "ArrowDown" ||
        event.key === "Enter" ||
        event.key === " "
      ) {
        event.preventDefault();
        openFilter();
      }
    });
  }

  // Create customer review cards safely.
  function createReviewCard(review) {
    const card = document.createElement("article");
    card.className = "review-card";

    const rating = Math.max(
      1,
      Math.min(5, Number(review.rating) || 0)
    );

    const stars = document.createElement("div");
    stars.className = "review-stars";
    stars.textContent =
      "★".repeat(rating) +
      "☆".repeat(5 - rating);

    stars.setAttribute(
      "aria-label",
      rating + " out of 5 stars"
    );

    const name = document.createElement("h3");
    name.textContent = review.customer_name || "Customer";

    const location = document.createElement("div");
    location.className = "review-location";
    location.textContent = review.location || "Customer";

    const message = document.createElement("p");
    message.className = "review-message";
    message.textContent = review.review_text || "";

    card.append(stars, name, location, message);

    return card;
  }

  // Load overall rating and rating breakdown.
  async function loadSummary() {
    const counts = {
      1: 0,
      2: 0,
      3: 0,
      4: 0,
      5: 0
    };

    let total = 0;
    let pageOffset = 0;

    while (true) {
      const params = new URLSearchParams({
        select: "rating",
        status: "eq.approved",
        order: "created_at.desc",
        limit: "1000",
        offset: String(pageOffset)
      });

      const response = await fetch(
        SUPABASE_ROOT + "/rest/v1/reviews?" + params,
        { headers: headers }
      );

      if (!response.ok) {
        throw new Error("Could not load rating summary.");
      }

      const rows = await response.json();

      rows.forEach(function (row) {
        const rating = Number(row.rating);

        if (
          Object.prototype.hasOwnProperty.call(counts, rating)
        ) {
          counts[rating] += 1;
          total += 1;
        }
      });

      if (rows.length < 1000) break;

      pageOffset += rows.length;
    }

    const weightedTotal = Object.keys(counts).reduce(
      function (sum, rating) {
        return sum + Number(rating) * counts[rating];
      },
      0
    );

    const average = total
      ? weightedTotal / total
      : 0;

    if (averageEl) {
      averageEl.textContent = total
        ? average.toFixed(1)
        : "—";
    }

    if (averageStarsEl) {
      const rounded = Math.round(average);

      averageStarsEl.textContent = total
        ? "★".repeat(rounded) +
          "☆".repeat(5 - rounded)
        : "☆☆☆☆☆";
    }

    if (totalEl) {
      totalEl.textContent =
        total +
        " approved customer " +
        (total === 1 ? "review" : "reviews");
    }

    if (breakdownEl) {
      breakdownEl.replaceChildren();

      [5, 4, 3, 2, 1].forEach(function (rating) {
        const row = document.createElement("div");
        row.className = "rating-row";

        const label = document.createElement("span");
        label.textContent = rating + " star";

        const track = document.createElement("div");
        track.className = "rating-track";

        track.setAttribute("role", "img");

        track.setAttribute(
          "aria-label",
          counts[rating] + " of " + total + " reviews"
        );

        const fill = document.createElement("div");
        fill.className = "rating-fill";

        fill.style.width = total
          ? (counts[rating] / total * 100) + "%"
          : "0%";

        track.appendChild(fill);

        const count = document.createElement("span");
        count.textContent = String(counts[rating]);

        row.append(label, track, count);
        breakdownEl.appendChild(row);
      });
    }
  }

  // Load approved reviews with rating filters and pagination.
  async function loadReviews(reset) {
    if (!grid || loading || (finished && !reset)) {
      return;
    }

    if (reset) {
      offset = 0;
      finished = false;

      grid.replaceChildren();

      if (moreButton) {
        moreButton.hidden = true;
      }
    }

    loading = true;

    grid.setAttribute("aria-busy", "true");

    if (moreButton) {
      moreButton.disabled = true;
      moreButton.textContent = "Loading…";
    }

    if (status) {
      status.textContent = "Loading approved reviews…";
    }

    try {
      const params = new URLSearchParams({
        select: "customer_name,location,rating,review_text,created_at",
        status: "eq.approved",
        order: "created_at.desc",
        limit: String(PAGE_SIZE),
        offset: String(offset)
      });

      if (selectedRating !== "all") {
        params.set("rating", "eq." + selectedRating);
      }

      const response = await fetch(
        SUPABASE_ROOT + "/rest/v1/reviews?" + params,
        { headers: headers }
      );

      if (!response.ok) {
        throw new Error("Could not load customer reviews.");
      }

      const reviews = await response.json();

      if (reset && reviews.length === 0) {
        const empty = document.createElement("p");

        empty.className = "review-empty";

        empty.textContent =
          selectedRating === "all"
            ? "No approved customer reviews have been published yet."
            : "There are no approved reviews with this star rating yet.";

        grid.appendChild(empty);

      } else {
        reviews.forEach(function (review) {
          grid.appendChild(createReviewCard(review));
        });
      }

      offset += reviews.length;
      finished = reviews.length < PAGE_SIZE;

      if (moreButton) {
        moreButton.hidden = finished;
      }

      if (resultsLabel) {
        resultsLabel.textContent =
          selectedRating === "all"
            ? "Latest approved reviews"
            : "Showing " + selectedRating + "-star reviews";
      }

      if (status) {
        status.textContent = reviews.length
          ? "Showing " +
            offset +
            " review" +
            (offset === 1 ? "" : "s") +
            " in this view."
          : "";
      }

    } catch (error) {
      console.error("Reviews page loading error:", error);

      if (reset) {
        const empty = document.createElement("p");

        empty.className = "review-empty";

        empty.textContent =
          "Reviews could not load right now. Please refresh the page and try again.";

        grid.replaceChildren(empty);
      }

      if (status) {
        status.textContent =
          "Unable to load reviews at the moment.";
      }

    } finally {
      loading = false;

      grid.setAttribute("aria-busy", "false");

      if (moreButton) {
        moreButton.disabled = false;
        moreButton.textContent = "Load more reviews";
      }
    }
  }

  // Submit reviews through the existing Cloudflare Worker.
  function setupReviewForm() {
    if (!form) return;

    form.addEventListener("submit", async function (event) {
      event.preventDefault();

      const submitButton =
        form.querySelector('[type="submit"]');

      if (!submitButton || submitButton.disabled) {
        return;
      }

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
        setFormMessage(
          "Please check your details and try again.",
          true
        );
        return;
      }

      if (!turnstileToken) {
        setFormMessage(
          "Please complete the security verification.",
          true
        );
        return;
      }

      submitButton.disabled = true;

      setFormMessage(
        "Submitting your review...",
        false
      );

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

        const result = await response.json().catch(
          function () {
            return {};
          }
        );

        if (!response.ok || !result.success) {
          throw new Error(
            result.error || "Review submission failed."
          );
        }

        form.reset();
        resetCaptcha();

        setFormMessage(
          "Thank you! Your review has been submitted and is awaiting approval.",
          false
        );

      } catch (error) {
        console.error("Review submission error:", error);

        setFormMessage(
          error.message ||
            "Sorry, your review could not be submitted. Please try again.",
          true
        );

        resetCaptcha();

      } finally {
        submitButton.disabled = false;
      }
    });
  }

  // Load more reviews.
  if (moreButton) {
    moreButton.addEventListener("click", function () {
      loadReviews(false);
    });
  }

  // Initialize the page.
  setupReviewForm();

  loadSummary().catch(function (error) {
    console.error("Review summary error:", error);

    if (averageEl) averageEl.textContent = "—";
    if (averageStarsEl) averageStarsEl.textContent = "☆☆☆☆☆";

    if (totalEl) {
      totalEl.textContent =
        "Rating summary is temporarily unavailable.";
    }

    if (breakdownEl) {
      breakdownEl.textContent =
        "Rating breakdown is temporarily unavailable.";
    }
  });

  loadReviews(true);

})();
