/**
 * app.js
 * ---------------------------------------------------------------
 * View routing, the translation/render engine, the reader (progress
 * ring + font size), and the anti-copy protections. Reads only from
 * the frozen `window.NOVEL_DATA` — never mutates it.
 * ---------------------------------------------------------------
 */
(function () {
  "use strict";

  const DIRS = { ar: "rtl", en: "ltr", ja: "ltr" };
  const FALLBACK_LANG = "en";

  const state = {
    lang: "ar",
    view: "home",
    chapterId: null,
    fontSize: 1.125, // rem, mirrors the --reading-size default in style.css
  };

  const FONT_MIN = 0.95;
  const FONT_MAX = 1.5;
  const FONT_STEP = 0.0625;

  const els = {
    root: document.documentElement,
    navLinks: document.querySelectorAll(".nav__link"),
    langButtons: document.querySelectorAll(".lang-switch__btn"),
    viewPanels: document.querySelectorAll("[data-view-panel]"),
    brand: document.querySelector(".brand"),
    chapterList: document.getElementById("chapter-list"),
    readerTitle: document.getElementById("reader-title"),
    readerBody: document.getElementById("reader-body"),
    btnPrev: document.getElementById("btn-prev"),
    btnNext: document.getElementById("btn-next"),
    fontInc: document.getElementById("font-inc"),
    fontDec: document.getElementById("font-dec"),
    progressRing: document.getElementById("progress-ring"),
    toast: document.getElementById("toast"),
  };

  const RING_CIRCUMFERENCE = 2 * Math.PI * 17; // matches the SVG circle r=17

  // ---------------------------------------------------------------
  // Translation helpers
  // ---------------------------------------------------------------
  function resolvePath(path) {
    return path.split(".").reduce(function (node, key) {
      return node && node[key] !== undefined ? node[key] : undefined;
    }, window.NOVEL_DATA);
  }

  function t(path) {
    const node = resolvePath(path);
    if (node == null) return "";
    if (typeof node === "string") return node;
    return node[state.lang] || node[FALLBACK_LANG] || "";
  }

  function translateField(field) {
    if (!field) return "";
    return field[state.lang] || field[FALLBACK_LANG] || "";
  }

  function renderStaticText() {
    document.querySelectorAll("[data-i18n]").forEach(function (el) {
      el.textContent = t(el.getAttribute("data-i18n"));
    });
    document.querySelectorAll("[data-i18n-aria]").forEach(function (el) {
      el.setAttribute("aria-label", t(el.getAttribute("data-i18n-aria")));
    });
    document.title = t("meta.title");
  }

  // ---------------------------------------------------------------
  // Language switching
  // ---------------------------------------------------------------
  function setLanguage(lang) {
    if (!DIRS[lang]) return;
    state.lang = lang;
    els.root.setAttribute("lang", lang);
    els.root.setAttribute("dir", DIRS[lang]);

    els.langButtons.forEach(function (btn) {
      btn.classList.toggle("is-active", btn.getAttribute("data-lang") === lang);
    });

    renderStaticText();
    renderChapterList();

    if (state.view === "reader" && state.chapterId != null) {
      renderReaderContent(state.chapterId, { preserveScroll: true });
    }
  }

  // ---------------------------------------------------------------
  // View routing
  // ---------------------------------------------------------------
  function setView(view) {
    state.view = view;

    els.viewPanels.forEach(function (panel) {
      panel.classList.toggle("is-active", panel.getAttribute("data-view-panel") === view);
    });
    els.navLinks.forEach(function (link) {
      link.classList.toggle("is-active", link.getAttribute("data-view") === view);
    });

    window.scrollTo({ top: 0, behavior: "instant" in window ? "instant" : "auto" });
  }

  // ---------------------------------------------------------------
  // Chapters
  // ---------------------------------------------------------------
  function renderChapterList() {
    const chapters = window.NOVEL_DATA.chapters;
    els.chapterList.innerHTML = "";

    chapters.forEach(function (chapter, index) {
      const li = document.createElement("li");
      li.className = "chapter-list__item";
      li.setAttribute("role", "button");
      li.setAttribute("tabindex", "0");

      const num = document.createElement("span");
      num.className = "chapter-list__num";
      num.textContent = String(index + 1).padStart(2, "0");

      const title = document.createElement("span");
      title.className = "chapter-list__title";
      title.textContent = translateField(chapter.title);

      const cta = document.createElement("span");
      cta.className = "chapter-list__cta";
      cta.textContent = t("ui.readNow");

      li.append(num, title, cta);
      li.addEventListener("click", function () {
        openChapter(chapter.id);
      });
      li.addEventListener("keydown", function (e) {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          openChapter(chapter.id);
        }
      });

      els.chapterList.appendChild(li);
    });
  }

  function renderReaderContent(chapterId, options) {
    const opts = options || {};
    const chapters = window.NOVEL_DATA.chapters;
    const index = chapters.findIndex(function (c) { return c.id === chapterId; });
    if (index === -1) return;
    const chapter = chapters[index];

    els.readerTitle.textContent = translateField(chapter.title);

    els.readerBody.innerHTML = "";
    const paragraphs = chapter.paragraphs[state.lang] || chapter.paragraphs[FALLBACK_LANG] || [];
    paragraphs.forEach(function (paragraph) {
      const p = document.createElement("p");
      p.textContent = paragraph;
      els.readerBody.appendChild(p);
    });

    const prevChapter = chapters[index - 1];
    const nextChapter = chapters[index + 1];
    els.btnPrev.disabled = !prevChapter;
    els.btnNext.disabled = !nextChapter;
    els.btnPrev.onclick = prevChapter ? function () { openChapter(prevChapter.id); } : null;
    els.btnNext.onclick = nextChapter ? function () { openChapter(nextChapter.id); } : null;

    if (!opts.preserveScroll) {
      updateProgressRing(0);
    }
  }

  function openChapter(chapterId) {
    state.chapterId = chapterId;
    renderReaderContent(chapterId);
    setView("reader");
    window.scrollTo({ top: 0 });
  }

  // ---------------------------------------------------------------
  // Reading progress ring
  // ---------------------------------------------------------------
  function updateProgressRing(ratio) {
    const clamped = Math.max(0, Math.min(1, ratio));
    els.progressRing.style.strokeDashoffset = String(RING_CIRCUMFERENCE * (1 - clamped));
  }

  function handleScrollProgress() {
    if (state.view !== "reader") return;
    const docHeight = document.documentElement.scrollHeight - window.innerHeight;
    const ratio = docHeight > 0 ? window.scrollY / docHeight : 0;
    updateProgressRing(ratio);
  }

  // ---------------------------------------------------------------
  // Font size controls
  // ---------------------------------------------------------------
  function applyFontSize() {
    document.documentElement.style.setProperty("--reading-size", state.fontSize.toFixed(4) + "rem");
  }

  function changeFontSize(delta) {
    const next = Math.round((state.fontSize + delta) * 10000) / 10000;
    state.fontSize = Math.max(FONT_MIN, Math.min(FONT_MAX, next));
    applyFontSize();
  }

  // ---------------------------------------------------------------
  // Toast feedback
  // ---------------------------------------------------------------
  let toastTimer = null;
  let lastToastAt = 0;
  function showToast(message) {
    const now = Date.now();
    if (now - lastToastAt < 1200) return; // throttle rapid repeated triggers
    lastToastAt = now;

    els.toast.textContent = message;
    els.toast.classList.add("is-visible");
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function () {
      els.toast.classList.remove("is-visible");
    }, 2200);
  }

  // ---------------------------------------------------------------
  // Anti-copy protections
  // ---------------------------------------------------------------
  function initProtections() {
    document.addEventListener("contextmenu", function (e) {
      e.preventDefault();
      showToast(t("ui.copyBlocked"));
    });

    document.addEventListener("selectstart", function (e) {
      e.preventDefault();
    });

    document.addEventListener("dragstart", function (e) {
      e.preventDefault();
    });

    document.addEventListener("copy", function (e) {
      e.preventDefault();
      showToast(t("ui.copyBlocked"));
    });

    document.addEventListener("keydown", function (e) {
      const mod = e.ctrlKey || e.metaKey;
      const key = e.key.toLowerCase();
      const blocked =
        (mod && key === "c") ||
        (mod && key === "u") ||
        (mod && key === "s") ||
        (mod && key === "p") ||
        (mod && key === "a") ||
        (mod && e.shiftKey && (key === "i" || key === "j" || key === "c")) ||
        key === "f12";

      if (blocked) {
        e.preventDefault();
        showToast(t("ui.copyBlocked"));
      }
    });
  }

  // ---------------------------------------------------------------
  // Event wiring
  // ---------------------------------------------------------------
  function initNavigation() {
    document.querySelectorAll("[data-view]").forEach(function (el) {
      el.addEventListener("click", function () {
        const view = el.getAttribute("data-view");
        const chapterId = el.getAttribute("data-chapter");
        if (chapterId) {
          openChapter(Number(chapterId));
        } else {
          setView(view);
        }
      });
    });

    if (els.brand) {
      els.brand.addEventListener("click", function () { setView("home"); });
    }

    els.langButtons.forEach(function (btn) {
      btn.addEventListener("click", function () {
        setLanguage(btn.getAttribute("data-lang"));
      });
    });

    els.fontInc.addEventListener("click", function () { changeFontSize(FONT_STEP); });
    els.fontDec.addEventListener("click", function () { changeFontSize(-FONT_STEP); });

    window.addEventListener("scroll", handleScrollProgress, { passive: true });
  }

  // ---------------------------------------------------------------
  // Boot
  // ---------------------------------------------------------------
  function init() {
    initProtections();
    initNavigation();
    applyFontSize();
    renderStaticText();
    renderChapterList();
    setView("home");
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
