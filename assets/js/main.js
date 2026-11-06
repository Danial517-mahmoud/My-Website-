// ===== Settings =====
// EVENTS and CATEGORIES come from the data file (loaded before this file)
const EVENTS_PAGE = "events.html";
const EVENT_PAGE = "event.html";
const REMOTE_LOCATION = "عن بُعد";


// ===== Helper functions =====

// Replace special characters so text can be safely put inside HTML
function escapeHtml(value) {
  const replacements = {
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#039;"
  };
  return String(value).replace(/[&<>"']/g, function (char) {
    return replacements[char];
  });
}

// Show a date in Arabic (default: day + month + year)
function formatDate(date, options) {
  const defaultOptions = { day: "numeric", month: "long", year: "numeric" };
  return date.toLocaleDateString("ar-SY", options || defaultOptions);
}

// Short date without the year (used in the cards)
function formatShortDate(date) {
  return formatDate(date, { day: "numeric", month: "long" });
}

function eventUrl(event) {
  return EVENT_PAGE + "?id=" + encodeURIComponent(event.id);
}

function categoryUrl(category) {
  return EVENTS_PAGE + "?category=" + encodeURIComponent(category);
}


// ===== Theme (light / dark) =====

function applyTheme(theme) {
  document.documentElement.setAttribute("data-bs-theme", theme);

  const button = document.getElementById("themeToggle");
  if (button) {
    button.textContent = theme === "dark" ? "☀️ فاتح" : "🌙 داكن";
  }
}

function initTheme() {
  const savedTheme = localStorage.getItem("theme") || "light";
  applyTheme(savedTheme);

  const button = document.getElementById("themeToggle");
  if (!button) return;

  button.addEventListener("click", function () {
    const currentTheme = document.documentElement.getAttribute("data-bs-theme");
    const newTheme = currentTheme === "dark" ? "light" : "dark";
    localStorage.setItem("theme", newTheme);
    applyTheme(newTheme);
  });
}


// ===== Things shared by all pages =====

function highlightCurrentPage() {
  const currentPage = location.pathname.split("/").pop() || "index.html";
  const links = document.querySelectorAll(".site-nav .nav-link");

  links.forEach(function (link) {
    if (link.getAttribute("href") === currentPage) {
      link.classList.add("active");
    }
  });
}

function initScrollTopButton() {
  const button = document.getElementById("scrollTopBtn");
  if (!button) return;

  // Show the button only after scrolling down 300px
  function updateButton() {
    button.hidden = window.scrollY < 300;
  }

  window.addEventListener("scroll", updateButton);
  button.addEventListener("click", function () {
    window.scrollTo({ top: 0, behavior: "smooth" });
  });
  updateButton();
}

function initShared() {
  initTheme();
  highlightCurrentPage();
  initScrollTopButton();
}


// ===== HTML builders (return strings) =====

// Cover of an event: gradient + icon, then the photo on top, then the category chip
function coverHtml(event, extraClass) {
  const className = "cover cover-" + event.category + " " + (extraClass || "");

  return `
    <div class="${className}">
      <span class="cover-fallback" aria-hidden="true"></span>
      <img src="${event.image}" alt="${escapeHtml(event.title)}" loading="lazy">
      <span class="chip chip-${event.category}">${escapeHtml(CATEGORIES[event.category])}</span>
    </div>`;
}

// One event card (used in home, events and details pages).
// The details link always carries the event's stable ID.
function eventCard(event) {
  return `
    <div class="col-12 col-md-6 col-lg-4" data-event-id="${escapeHtml(event.id)}">
      <article class="event-card h-100">
        ${coverHtml(event)}
        <div class="event-card-body p-3 d-flex flex-column">
          <h3 class="h5 event-card-title">${escapeHtml(event.title)}</h3>
          <p class="event-meta mb-2">
            <span>📅 ${formatShortDate(event.date)}</span>
            <span> · 🕒 ${escapeHtml(event.time)}</span><br>
            <span>📍 ${escapeHtml(event.location)}</span>
          </p>
          <p class="event-card-description">${escapeHtml(event.short)}</p>
          <div class="event-card-actions mt-auto pt-3">
            <a href="${eventUrl(event)}" class="btn btn-primary event-details-btn"
               aria-label="عرض تفاصيل فعالية ${escapeHtml(event.title)}">
              تفاصيل الفعالية <span aria-hidden="true">←</span>
            </a>
          </div>
        </div>
      </article>
    </div>`;
}

// Link to Google Maps (or a note if the event is online)
function locationLink(event) {
  if (event.location === REMOTE_LOCATION) {
    return '<span class="text-muted">الرابط يرسل إلى المشاركين قبل بدء الفعالية</span>';
  }

  const mapUrl = "https://www.google.com/maps/search/?api=1&query=" + encodeURIComponent(event.location);
  return `<a href="${mapUrl}" target="_blank" rel="noopener">فتح الموقع على الخريطة ↗</a>`;
}


// ===== Home page =====

function renderFeatured() {
  const slides = document.getElementById("featuredSlides");
  const featured = EVENTS.filter(function (event) {
    return event.featured;
  });

  slides.innerHTML = featured.map(function (event, index) {
    const activeClass = index === 0 ? "active" : "";

    return `
      <div class="carousel-item ${activeClass}">
        <a href="${eventUrl(event)}" class="featured-slide cover cover-${event.category}">
          <span class="cover-fallback" aria-hidden="true"></span>
          <img src="${event.image}" alt="${escapeHtml(event.title)}">
          <div class="featured-caption">
            <h3 class="mb-1">${escapeHtml(event.title)}</h3>
            <span>📅 ${formatShortDate(event.date)} · 📍 ${escapeHtml(event.location)}</span>
          </div>
        </a>
      </div>`;
  }).join("");
}

function renderCategoryChips() {
  const container = document.getElementById("categoryChips");
  const keys = Object.keys(CATEGORIES);

  container.innerHTML = keys.map(function (key) {
    return `<a href="${categoryUrl(key)}" class="chip chip-${key} fs-6">${CATEGORIES[key]}</a>`;
  }).join("");
}

function renderLatestEvents() {
  const container = document.getElementById("latestEvents");

  // slice() makes a copy so the original EVENTS array is not changed by sort()
  // b.date - a.date = newest event first
  const sortedEvents = EVENTS.slice().sort(function (a, b) {
    return b.date - a.date;
  });
  const firstSix = sortedEvents.slice(0, 6);

  container.innerHTML = firstSix.map(eventCard).join("");
}

// Return the closest event that has not started yet (or null if there is none)
function findNextEvent() {
  const now = new Date();

  const upcoming = EVENTS.filter(function (event) {
    return event.date >= now;
  });

  // The closest date first
  upcoming.sort(function (a, b) {
    return a.date - b.date;
  });

  return upcoming.length > 0 ? upcoming[0] : null;
}

function renderTodayEvent() {
  const container = document.getElementById("todayEvent");
  if (!container) return;

  const event = findNextEvent();

  // No upcoming event: show nothing
  if (!event) {
    container.innerHTML = "";
    return;
  }

  container.innerHTML = `
    <div class="today-card p-3 d-flex flex-wrap align-items-center justify-content-between gap-2">
      <div><strong>📌 قريباً:</strong> ${escapeHtml(event.title)} في ${event.time}</div>
      <a href="${eventUrl(event)}" class="btn btn-grad btn-sm">التفاصيل</a>
    </div>`;
}

function renderHome() {
  // If this element does not exist, we are not on the home page
  if (!document.getElementById("featuredSlides")) return;

  renderFeatured();
  renderCategoryChips();
  renderLatestEvents();
  renderTodayEvent();
}


// ===== Events page (search + filters) =====

function renderEventsPage() {
  const grid = document.getElementById("eventsGrid");
  if (!grid) return;

  const searchInput = document.getElementById("eventSearch");
  const categorySelect = document.getElementById("categoryFilter");
  const dateInput = document.getElementById("dateFilter");
  const locationSelect = document.getElementById("locationFilter");
  const resultsCount = document.getElementById("resultsCount");
  const emptyState = document.getElementById("emptyState");

  // If the URL has ?category=..., select it in the filter
  const params = new URLSearchParams(window.location.search);
  const categoryFromUrl = params.get("category");
  if (categoryFromUrl && CATEGORIES[categoryFromUrl]) {
    categorySelect.value = categoryFromUrl;
  }

  function filterEvents() {
    const query = searchInput.value.trim().toLowerCase();
    const selectedCategory = categorySelect.value;
    const selectedDate = dateInput.value;
    const selectedLocation = locationSelect.value;

    const results = EVENTS.filter(function (event) {
      const text = (event.title + " " + event.short).toLowerCase();
      const eventDate = event.date.toISOString().slice(0, 10);

      const matchesQuery = !query || text.includes(query);
      const matchesCategory = !selectedCategory || event.category === selectedCategory;
      const matchesLocation = !selectedLocation || event.location === selectedLocation;
      const matchesDate = !selectedDate || eventDate === selectedDate;

      return matchesQuery && matchesCategory && matchesLocation && matchesDate;
    });

    grid.innerHTML = results.map(eventCard).join("");
    resultsCount.textContent = results.length + " فعالية";
    emptyState.hidden = results.length !== 0;
  }

  // Filter again every time the user changes any input
  const inputs = [searchInput, categorySelect, dateInput, locationSelect];
  inputs.forEach(function (input) {
    input.addEventListener("input", filterEvents);
  });

  document.getElementById("resetFilters").addEventListener("click", function () {
    searchInput.value = "";
    categorySelect.value = "";
    dateInput.value = "";
    locationSelect.value = "";
    filterEvents();
  });

  filterEvents();
}


// ===== Event details page =====

// In .ics files these characters have a special meaning, so they must be escaped
function escapeIcsText(value) {
  return String(value)
    .replace(/\\/g, "\\\\")    // backslash first
    .replace(/;/g, "\\;")
    .replace(/,/g, "\\,")
    .replace(/\r?\n/g, "\\n");
}

// Build the text of an .ics calendar file
function makeCalendar(event) {
  // UTC time so the file works in any calendar app
  const date = event.date.toISOString().replace(/[-:]/g, "").split(".")[0] + "Z";

  const lines = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//BWP401//Events Guide//AR",
    "BEGIN:VEVENT",
    "UID:" + event.id + "@events-guide",
    "DTSTAMP:" + date,
    "DTSTART:" + date,
    "SUMMARY:" + escapeIcsText(event.title),
    "LOCATION:" + escapeIcsText(event.location),
    "DESCRIPTION:" + escapeIcsText(event.description),
    "END:VEVENT",
    "END:VCALENDAR"
  ];

  return lines.join("\r\n");
}

function galleryHtml(event) {
  const hasGallery = Array.isArray(event.gallery) && event.gallery.length > 0;
  if (!hasGallery) return "";

  const images = event.gallery.map(function (image, index) {
    return `
      <div class="col-6 col-md-4">
        <img class="img-fluid rounded-3 gallery-image" src="${image}"
             alt="${escapeHtml(event.title)} - صورة ${index + 1}" loading="lazy">
      </div>`;
  }).join("");

  return `
    <section class="mt-5" aria-labelledby="galleryTitle">
      <h2 id="galleryTitle" class="h4">معرض الصور</h2>
      <div class="row g-3">${images}</div>
    </section>`;
}

function relatedEventsHtml(event) {
  // Same category, but not the current event, maximum 3
  const related = EVENTS.filter(function (item) {
    return item.category === event.category && item.id !== event.id;
  }).slice(0, 3);

  return `
    <section class="mt-5">
      <h2 class="h4">فعاليات ذات صلة</h2>
      <div class="row g-4 mt-1">${related.map(eventCard).join("")}</div>
    </section>`;
}

function downloadCalendar(event) {
  const blob = new Blob([makeCalendar(event)], { type: "text/calendar;charset=utf-8" });
  const link = document.createElement("a");

  link.href = URL.createObjectURL(blob);
  link.download = event.id + ".ics";
  link.click();
  URL.revokeObjectURL(link.href);
}

async function shareEvent(event, button) {
  const shareData = {
    title: event.title,
    text: event.short,
    url: window.location.href
  };

  try {
    if (navigator.share) {
      await navigator.share(shareData);
    } else if (navigator.clipboard) {
      await navigator.clipboard.writeText(window.location.href);
      button.textContent = "تم نسخ الرابط";
    } else {
      button.textContent = "انسخ الرابط من شريط العنوان";
    }
  } catch (error) {
    // AbortError means the user closed the share window, so it is not a real error
    if (error.name !== "AbortError") {
      button.textContent = "تعذرت المشاركة";
    }
  }
}

function renderDetails() {
  const container = document.getElementById("eventDetails");
  if (!container) return;

  // Resolve the requested event using its stable ID.
  const requestedId = new URLSearchParams(location.search).get("id");
  const event = EVENTS.find(function (item) {
    return item.id === requestedId;
  });

  if (!event) {
    container.innerHTML = `
      <section class="event-not-found hero p-4 p-md-5 text-center" role="status">
        <div class="mb-3" aria-hidden="true" style="font-size:2.5rem">🔎</div>
        <h1 class="h3 mb-2">لم نعثر على الفعالية</h1>
        <p class="text-muted mb-4">قد يكون الرابط غير صحيح أو أن الفعالية لم تعد متاحة.</p>
        <a href="${EVENTS_PAGE}" class="btn btn-primary">العودة إلى كل الفعاليات</a>
      </section>`;
    return;
  }

  container.innerHTML = `
    <article>
      <div class="row g-4 align-items-start">
        <div class="col-lg-6">
          ${coverHtml(event, "details-cover")}
        </div>
        <div class="col-lg-6">
          <span class="badge text-bg-primary mb-2">${CATEGORIES[event.category]}</span>
          <h1>${escapeHtml(event.title)}</h1>
          <p class="event-meta">
            📅 ${formatDate(event.date)} · 🕒 ${event.time}<br>
            📍 ${escapeHtml(event.location)}
          </p>
          <p class="lead">${escapeHtml(event.description)}</p>
          <div class="d-flex flex-wrap gap-2">
            <button id="calendarBtn" class="btn btn-grad">إضافة إلى التقويم</button>
            <button id="shareBtn" class="btn btn-outline-primary">مشاركة الفعالية</button>
            <a href="${EVENTS_PAGE}" class="btn btn-outline-secondary">العودة للفعاليات</a>
          </div>
        </div>
      </div>

      <div class="map-placeholder mt-5 p-4 text-center">
        <span aria-hidden="true">📍</span>
        <h2 class="h5">موقع الفعالية</h2>
        <p>${escapeHtml(event.location)}</p>
        <p class="mb-0">${locationLink(event)}</p>
      </div>

      ${galleryHtml(event)}
      ${relatedEventsHtml(event)}
    </article>`;

  // Buttons exist only after innerHTML is set, so we connect them here
  const calendarButton = document.getElementById("calendarBtn");
  const shareButton = document.getElementById("shareBtn");

  calendarButton.addEventListener("click", function () {
    downloadCalendar(event);
  });

  shareButton.addEventListener("click", function () {
    shareEvent(event, shareButton);
  });
}


// ===== Contact page =====

function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

// Every required field must have at least 2 characters
function areFieldsFilled(data) {
  const fieldNames = ["name", "subject", "message"];

  return fieldNames.every(function (name) {
    const value = String(data.get(name) || "").trim();
    return value.length > 1;
  });
}

function initContact() {
  const form = document.getElementById("contactForm");
  if (!form) return;

  form.addEventListener("submit", function (submitEvent) {
    submitEvent.preventDefault();

    const alertBox = document.getElementById("contactAlert");
    const data = new FormData(form);
    const email = String(data.get("email") || "").trim();
    const isValid = isValidEmail(email) && areFieldsFilled(data);

    if (isValid) {
      alertBox.className = "alert alert-success";
      alertBox.textContent = "تم التحقق من رسالتك بنجاح. هذا نموذج تجريبي ولا يرسل بريداً إلى خادم.";
      form.reset();
    } else {
      alertBox.className = "alert alert-danger";
      alertBox.textContent = "يرجى ملء جميع الحقول والتأكد من صحة البريد الإلكتروني.";
    }

    alertBox.hidden = false;
  });
}


// ===== Start =====
// Each render function checks if its page elements exist, so it is safe to call all of them
document.addEventListener("DOMContentLoaded", function () {
  initShared();
  renderHome();
  renderEventsPage();
  renderDetails();
  initContact();
});