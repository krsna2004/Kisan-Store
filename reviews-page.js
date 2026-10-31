(function () {
  "use strict";

  const root = SUPABASE_URL.replace(/\/$/, "");
  const pageSize = 12;

  const grid = document.getElementById("reviews-page-grid");
  const averageEl = document.getElementById("reviews-average");
  const starsEl = document.getElementById("reviews-average-stars");
  const totalEl = document.getElementById("reviews-total");
  const breakdownEl = document.getElementById("rating-breakdown");
  const filter = document.getElementById("reviews-filter");
  const moreButton = document.getElementById("reviews-load-more");
  const status = document.getElementById("reviews-page-status");
  const resultsLabel = document.getElementById("reviews-results-label");

  if (!grid || !filter || !moreButton) return;

  const headers = {
    apikey: SUPABASE_ANON_KEY,
    Authorization: "Bearer " + SUPABASE_ANON_KEY
  };

  let offset = 0;
  let selectedRating = "all";
  let loading = false;
  let finished = false;

  // Create a review card safely using textContent.
  function makeCard(review) {
    const card = document.createElement("article");
    card.className = "review-card";

    const stars = document.createElement("div");
    stars.className = "review-stars";
    stars.textContent =
      "★".repeat(review.rating) + "☆".repeat(5 - review.rating);
    stars.setAttribute(
      "aria-label",
      review.rating + " out of 5 stars"
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

  // Load average rating and rating breakdown.
  async function loadSummary() {
    const counts = {
      1: 0,
      2: 0,
      3: 0,
      4: 0,
      5: 0
    };

    let offset = 0;
    let total = 0;

    while (true) {
      const params = new URLSearchParams({
        select: "rating",
        status: "eq.approved",
        order: "created_at.desc",
        limit: "1000",
        offset: String(offset)
      });

      const response = await fetch(
        root + "/rest/v1/reviews?" + params,
        { headers }
      );

      if (!response.ok) {
        throw new Error("Rating summary unavailable");
      }

      const rows = await response.json();

      rows.forEach(function (row) {
        const rating = Number(row.rating);

        if (counts[rating] !== undefined) {
          counts[rating]++;
          total++;
        }
      });

      if (rows.length < 1000) break;

      offset += rows.length;
    }

    const weighted = Object.keys(counts).reduce(
      function (sum, rating) {
        return sum + Number(rating) * counts[rating];
      },
      0
    );

    const average = total ? weighted / total : 0;

    averageEl.textContent = total ? average.toFixed(1) : "—";

    starsEl.textContent = total
      ? "★".repeat(Math.round(average)) +
        "☆".repeat(5 - Math.round(average))
      : "☆☆☆☆☆";

    totalEl.textContent =
      "Based on " +
      total +
      " approved review" +
      (total === 1 ? "" : "s");

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

  // Load approved reviews from Supabase.
  async function loadReviews(reset) {
    if (loading || (finished && !reset)) return;

    if (reset) {
      offset = 0;
      finished = false;
      grid.replaceChildren();
      moreButton.hidden = true;
    }

    loading = true;

    grid.setAttribute("aria-busy", "true");
    moreButton.disabled = true;
    moreButton.textContent = "Loading…";
    status.textContent = "Loading approved reviews…";

    try {
      const params = new URLSearchParams({
        select: "customer_name,location,rating,review_text,created_at",
        status: "eq.approved",
        order: "created_at.desc",
        limit: String(pageSize),
        offset: String(offset)
      });

      if (selectedRating !== "all") {
        params.set("rating", "eq." + selectedRating);
      }

      const response = await fetch(
        root + "/rest/v1/reviews?" + params,
        { headers }
      );

      if (!response.ok) {
        throw new Error("Could not load reviews");
      }

      const reviews = await response.json();

      if (reset && !reviews.length) {
        const empty = document.createElement("p");
        empty.className = "review-empty";

        empty.textContent =
          selectedRating === "all"
            ? "No approved customer reviews have been published yet."
            : "There are no approved reviews with this star rating yet.";

        grid.appendChild(empty);
      } else {
        reviews.forEach(function (review) {
          grid.appendChild(makeCard(review));
        });
      }

      offset += reviews.length;
      finished = reviews.length < pageSize;

      moreButton.hidden = finished;

      resultsLabel.textContent =
        selectedRating === "all"
          ? "Latest approved reviews"
          : "Showing " + selectedRating + "-star reviews";

      status.textContent = reviews.length
        ? "Showing " +
          offset +
          " review" +
          (offset === 1 ? "" : "s") +
          " in this view."
        : "";

    } catch (error) {
      console.error("Reviews page error:", error);

      if (reset) {
        const empty = document.createElement("p");
        empty.className = "review-empty";
        empty.textContent =
          "Reviews could not load right now. Please refresh the page and try again.";

        grid.replaceChildren(empty);
      }

      status.textContent =
        "Unable to load reviews at the moment.";

    } finally {
      loading = false;

      grid.setAttribute("aria-busy", "false");
      moreButton.disabled = false;
      moreButton.textContent = "Load more reviews";
    }
  }

  // Filter reviews by star rating.
  filter.addEventListener("change", function () {
    selectedRating = filter.value;
    loadReviews(true);
  });

  // Load additional reviews.
  moreButton.addEventListener("click", function () {
    loadReviews(false);
  });

  // Initialize the page.
  (async function init() {
    try {
      await loadSummary();
    } catch (error) {
      console.error("Review summary error:", error);

      averageEl.textContent = "—";
      starsEl.textContent = "☆☆☆☆☆";

      totalEl.textContent =
        "Rating summary is temporarily unavailable.";

      breakdownEl.textContent =
        "Rating breakdown is temporarily unavailable.";
    }

    loadReviews(true);
  })();

})();
