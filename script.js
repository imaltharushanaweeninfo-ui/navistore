// ========== INITIAL THEME (runs before page draws) ==========
(function () {
  const root = document.documentElement;
  const saved = localStorage.getItem("navi-theme");
  if (saved === "light" || saved === "dark") {
    root.setAttribute("data-theme", saved);
  } else {
    root.setAttribute("data-theme", "dark");
  }
})();

// ========== EDIT THIS WHEN YOU SELL ACCOUNTS ==========
// IDs must match data-id on cards in collections.html
// Example when acc1 and acc3 are sold:
// const SOLD_ACCOUNT_IDS = ["acc1", "acc3"];
const SOLD_ACCOUNT_IDS = ["acc1","acc2"]; // e.g. ["acc1", "acc2"]
// =====================================================

window.addEventListener("DOMContentLoaded", () => {
  // ---------- Theme toggle ----------
  const toggle = document.querySelector("[data-theme-toggle]");
  const iconSpan = toggle?.querySelector("[data-theme-icon]");
  const labelSpan = toggle?.querySelector("[data-theme-label]");

  function applyThemeLabel() {
    const current = document.documentElement.getAttribute("data-theme");
    if (!iconSpan || !labelSpan) return;
    if (current === "light") {
      iconSpan.textContent = "🌞";
      labelSpan.textContent = "Light";
    } else {
      iconSpan.textContent = "🌙";
      labelSpan.textContent = "Dark";
    }
  }

  function toggleTheme() {
    const current = document.documentElement.getAttribute("data-theme");
    const next = current === "light" ? "dark" : "light";
    document.documentElement.setAttribute("data-theme", next);
    localStorage.setItem("navi-theme", next);
    applyThemeLabel();
  }

  if (toggle) {
    toggle.addEventListener("click", toggleTheme);
    applyThemeLabel();
  }

  // ---------- Footer year ----------
  const yearEl = document.getElementById("year");
  if (yearEl) {
    yearEl.textContent = new Date().getFullYear();
  }

  // ---------- Collections: search + price filter + hide sold ----------
  const searchInput = document.querySelector("[data-search]");
  const priceSelect = document.querySelector("[data-price-filter]");
  const accountCards = Array.from(
    document.querySelectorAll(".account-card[data-id]")
  );

  function applyFilters() {
    if (!accountCards.length) return;

    const term = (searchInput?.value || "").trim().toLowerCase();
    const priceFilter = priceSelect ? priceSelect.value : "all";

    accountCards.forEach((card) => {
      const id = card.dataset.id || "";
      const text = card.innerText.toLowerCase();
      const price = parseInt(card.dataset.price, 10) || 0;

      // 1) Hide if marked as sold
      if (SOLD_ACCOUNT_IDS.includes(id)) {
        card.style.display = "none";
        return;
      }

      // 2) Search text match
      const matchesSearch = !term || text.includes(term);

      // 3) Price range match
      let matchesPrice = true;
      if (priceFilter === "0-10000") {
        matchesPrice = price >= 0 && price <= 10000;
      } else if (priceFilter === "10000-50000") {
        matchesPrice = price >= 10000 && price <= 50000;
      } else if (priceFilter === "50000-100000") {
        matchesPrice = price >= 50000 && price <= 100000;
      } else if (priceFilter === "100000-500000") {
        matchesPrice = price >= 100000 && price <= 500000;
      } else if (priceFilter === "500000+") {
        matchesPrice = price > 500000;
      }

      card.style.display = matchesSearch && matchesPrice ? "" : "none";
    });
  }

  if (searchInput) searchInput.addEventListener("input", applyFilters);
  if (priceSelect) priceSelect.addEventListener("change", applyFilters);
  if (accountCards.length) applyFilters();

  // ---------- Image preview (lightbox) ----------
  const previewOverlay = document.querySelector("[data-preview-overlay]");
  const previewImage = document.querySelector("[data-preview-image]");
  const previewClose = document.querySelector("[data-preview-close]");

  if (previewOverlay && previewImage) {
    const previewables = document.querySelectorAll("[data-preview]");

    previewables.forEach((el) => {
      el.style.cursor = "zoom-in";
      el.addEventListener("click", () => {
        const src =
          el.getAttribute("data-preview-src") || el.getAttribute("src");
        if (!src) return;
        previewImage.setAttribute("src", src);
        previewOverlay.classList.add("active");
      });
    });

    function hidePreview() {
      previewOverlay.classList.remove("active");
    }

    previewOverlay.addEventListener("click", (e) => {
      if (e.target === previewOverlay) hidePreview();
    });

    if (previewClose) {
      previewClose.addEventListener("click", hidePreview);
    }

    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape") hidePreview();
    });
  }

  // ---------- Reviews (local-only) ----------
  const reviewForm = document.getElementById("review-form");
  const reviewList = document.getElementById("review-list");
  const REVIEW_STORAGE_KEY = "navi-store-reviews";

  function createReviewElement(data) {
    const article = document.createElement("article");
    article.className = "review-card";
    article.innerHTML = `
      <div class="review-header">
        <div class="review-name"></div>
        <div class="review-rating"></div>
      </div>
      <div class="review-badge"></div>
      <p class="review-text"></p>
    `;
    article.querySelector(".review-name").textContent = data.name;
    article.querySelector(".review-rating").textContent = data.stars;
    article.querySelector(".review-badge").textContent =
      data.badge || "Player review";
    article.querySelector(".review-text").textContent = data.message;
    return article;
  }

  function loadStoredReviews() {
    if (!reviewList) return;
    const raw = localStorage.getItem(REVIEW_STORAGE_KEY);
    if (!raw) return;
    try {
      const arr = JSON.parse(raw);
      arr.forEach((r) => {
        const el = createReviewElement(r);
        reviewList.appendChild(el);
      });
    } catch {
      // ignore parse errors
    }
  }

  if (reviewForm && reviewList) {
    loadStoredReviews();

    reviewForm.addEventListener("submit", (e) => {
      e.preventDefault();
      const name = reviewForm.name.value.trim() || "Player";
      const rating = parseInt(reviewForm.rating.value, 10) || 5;
      const message = reviewForm.message.value.trim();
      if (!message) return;

      const stars = "★★★★★".slice(0, rating) + "☆☆☆☆☆".slice(rating);

      const reviewData = {
        name,
        rating,
        stars,
        message,
        badge: "Local review",
      };

      // add to UI
      const el = createReviewElement(reviewData);
      reviewList.appendChild(el);

      // store in localStorage (only on this device)
      let list = [];
      const raw = localStorage.getItem(REVIEW_STORAGE_KEY);
      if (raw) {
        try {
          list = JSON.parse(raw) || [];
        } catch {
          list = [];
        }
      }
      list.push(reviewData);
      localStorage.setItem(REVIEW_STORAGE_KEY, JSON.stringify(list));

      reviewForm.reset();
    });
  }


  // ---------- WhatsApp floating popup with badge + sound ----------
  const waBtn = document.getElementById("wa-float-btn");
  const waPopup = document.getElementById("wa-popup");
  const waClose = document.getElementById("wa-close");

  // Change path if your sound file name is different
  let waSound;
  try {
    waSound = new Audio("wa-popup-open.mp3");
  } catch (e) {
    waSound = null;
  }

  if (waBtn && waPopup && waClose) {
    // show red dot on first load
    waBtn.classList.add("has-notif");

    const openPopup = () => {
      // if currently hidden, open + play sound
      const isOpen = waPopup.style.display === "block";

      if (!isOpen) {
        waPopup.style.display = "block";
        waBtn.classList.remove("has-notif"); // remove red dot when opened

        // play sound (if file loaded & browser allows)
        if (waSound) {
          try {
            waSound.currentTime = 0;
            waSound.play();
          } catch (err) {
            // ignore autoplay error
          }
        }
      } else {
        waPopup.style.display = "none";
      }
    };

    const closePopup = () => {
      waPopup.style.display = "none";
    };

    waBtn.addEventListener("click", (e) => {
      e.stopPropagation();
      openPopup();
    });

    waClose.addEventListener("click", (e) => {
      e.stopPropagation();
      closePopup();
    });

    // click outside to close
    document.addEventListener("click", (e) => {
      if (!waPopup.contains(e.target) && !waBtn.contains(e.target)) {
        closePopup();
      }
    });
  }


// Mobile navigation toggle
const navToggle = document.getElementById("navToggle");
const mobileMenu = document.getElementById("mobileMenu");

if (navToggle && mobileMenu) {
  navToggle.addEventListener("click", (e) => {
    e.stopPropagation();
    mobileMenu.classList.toggle("open");
  });

  // close when clicking outside
  document.addEventListener("click", (e) => {
    if (!mobileMenu.contains(e.target) && !navToggle.contains(e.target)) {
      mobileMenu.classList.remove("open");
    }
  });
}

});




