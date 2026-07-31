/**
 * app.js
 * ------------------------------------------------------------------
 * "Lunch Time" — front-end application logic.
 * Reads exclusively from window.LUNCH_TIME_DATA (novel-data.js).
 * ------------------------------------------------------------------
 */
(function () {
  "use strict";

  var DATA = window.LUNCH_TIME_DATA;

  if (!DATA) {
    console.error("Lunch Time: novel-data.js failed to load.");
    return;
  }

  var state = {
    lang: DATA.meta.defaultLanguage,
    view: "home",
    chapterId: null,
  };

  /* ------------------------------------------------------------------
   * Helpers
   * ------------------------------------------------------------------ */
  function ui() {
    return DATA.ui[state.lang];
  }

  function $(selector, root) {
    return (root || document).querySelector(selector);
  }

  function $all(selector, root) {
    return Array.prototype.slice.call((root || document).querySelectorAll(selector));
  }

  function makeArrowIcon(className) {
    var svgNS = "http://www.w3.org/2000/svg";
    var svg = document.createElementNS(svgNS, "svg");
    if (className) svg.setAttribute("class", className);
    var use = document.createElementNS(svgNS, "use");
    use.setAttributeNS("http://www.w3.org/1999/xlink", "href", "#icon-arrow");
    use.setAttribute("href", "#icon-arrow");
    svg.appendChild(use);
    return svg;
  }

  /* ------------------------------------------------------------------
   * Rendering
   * ------------------------------------------------------------------ */
  function renderStaticText() {
    var dict = ui();
    $all("[data-i18n]").forEach(function (el) {
      var key = el.getAttribute("data-i18n");
      if (Object.prototype.hasOwnProperty.call(dict, key)) {
        el.textContent = dict[key];
      }
    });
  }

  function renderNovelMeta() {
    var novel = DATA.novel;
    var lang = state.lang;
    var dict = ui();

    $("#novelTitle").textContent = novel.title[lang];
    $("#novelAuthor").textContent = novel.author[lang];
    $("#novelStatus").textContent = novel.statusLabel[lang];
    $("#novelSynopsis").textContent = novel.synopsis[lang];
    $("#aboutTagline").textContent = DATA.meta.tagline[lang];
    $("#footerBrandLine").textContent = DATA.meta.brand + " \u2014 " + dict.footerRights;
    document.title = DATA.meta.brand + " \u2014 " + novel.title[lang];
  }

  function renderChapterList() {
    var listEl = $("#chapterList");
    var lang = state.lang;
    listEl.innerHTML = "";

    DATA.novel.chapters.forEach(function (chapter) {
      var li = document.createElement("li");
      var btn = document.createElement("button");
      btn.type = "button";
      btn.className = "chapter-item";
      btn.setAttribute("data-chapter-id", chapter.id);

      var number = document.createElement("span");
      number.className = "chapter-item__number";
      number.textContent = String(chapter.number).padStart(2, "0");

      var title = document.createElement("span");
      title.className = "chapter-item__title";
      title.textContent = chapter.title[lang];

      var arrow = makeArrowIcon("chapter-item__arrow");

      btn.appendChild(number);
      btn.appendChild(title);
      btn.appendChild(arrow);
      btn.addEventListener("click", function () {
        openChapter(chapter.id);
      });

      li.appendChild(btn);
      listEl.appendChild(li);
    });
  }

  function findChapter(chapterId) {
    var chapters = DATA.novel.chapters;
    for (var i = 0; i < chapters.length; i++) {
      if (chapters[i].id === chapterId) return chapters[i];
    }
    return chapters[0];
  }

  function renderReader() {
    var chapter = findChapter(state.chapterId);
    var lang = state.lang;

    $("#chapterEyebrow").textContent = DATA.novel.title[lang];
    $("#chapterTitle").textContent = chapter.title[lang];

    var body = $("#chapterBody");
    body.innerHTML = "";
    chapter.paragraphs[lang].forEach(function (paragraphText) {
      var p = document.createElement("p");
      p.textContent = paragraphText;
      body.appendChild(p);
    });
  }

  function renderAll() {
    renderStaticText();
    renderNovelMeta();
    renderChapterList();
    if (state.view === "reader" && state.chapterId) {
      renderReader();
    }
  }

  /* ------------------------------------------------------------------
   * View / navigation
   * ------------------------------------------------------------------ */
  function switchView(view) {
    state.view = view;
    var home = $("#view-home");
    var reader = $("#view-reader");

    if (view === "reader") {
      home.hidden = true;
      reader.hidden = false;
    } else {
      reader.hidden = true;
      home.hidden = false;
    }
    window.scrollTo({ top: 0, behavior: "auto" });
  }

  function openChapter(chapterId) {
    state.chapterId = chapterId;
    renderReader();
    switchView("reader");
  }

  function setLanguage(lang) {
    if (DATA.meta.supportedLanguages.indexOf(lang) === -1) return;

    state.lang = lang;
    var langMeta = DATA.meta.languageMeta[lang];

    document.documentElement.setAttribute("lang", lang);
    document.documentElement.setAttribute("dir", langMeta.dir);

    document.body.classList.remove("lang-ar", "lang-en", "lang-ja");
    document.body.classList.add("lang-" + lang);

    $all(".lang-switch__btn").forEach(function (btn) {
      var pressed = btn.getAttribute("data-lang") === lang;
      btn.setAttribute("aria-pressed", pressed ? "true" : "false");
    });

    renderAll();
  }

  /* ------------------------------------------------------------------
   * Signature element: ambient reading-progress "breath line"
   * ------------------------------------------------------------------ */
  function initBreathTracking() {
    var dot = $("#breathDot");
    var frame = $(".reader-frame__inner");
    if (!dot || !frame) return;

    function update() {
      if ($("#view-reader").hidden) return;
      var rect = frame.getBoundingClientRect();
      var travel = Math.max(rect.height - window.innerHeight * 0.35, 1);
      var scrolled = Math.min(Math.max(-rect.top, 0), travel);
      var pct = scrolled / travel;
      dot.style.top = (pct * 100).toFixed(2) + "%";
    }

    window.addEventListener("scroll", update, { passive: true });
    window.addEventListener("resize", update);
    update();
  }

  /* ------------------------------------------------------------------
   * Anti-copy protections
   * ------------------------------------------------------------------ */
  function initProtections() {
    document.body.classList.add("no-select");

    document.addEventListener("contextmenu", function (e) {
      e.preventDefault();
    });

    document.addEventListener("selectstart", function (e) {
      e.preventDefault();
    });

    document.addEventListener("dragstart", function (e) {
      e.preventDefault();
    });

    document.addEventListener("copy", function (e) {
      e.preventDefault();
    });

    document.addEventListener("keydown", function (e) {
      var key = (e.key || "").toLowerCase();
      var mod = e.ctrlKey || e.metaKey;

      // Ctrl/Cmd + C, U, S, P
      if (mod && !e.shiftKey && (key === "c" || key === "u" || key === "s" || key === "p")) {
        e.preventDefault();
        return;
      }
      // DevTools: F12, Ctrl/Cmd+Shift+I/J/C
      if (key === "f12") {
        e.preventDefault();
        return;
      }
      if (mod && e.shiftKey && (key === "i" || key === "j" || key === "c")) {
        e.preventDefault();
      }
    });
  }

  /* ------------------------------------------------------------------
   * Event wiring
   * ------------------------------------------------------------------ */
  function initEvents() {
    $all(".lang-switch__btn").forEach(function (btn) {
      btn.addEventListener("click", function () {
        setLanguage(btn.getAttribute("data-lang"));
      });
    });

    $("#beginReadingBtn").addEventListener("click", function () {
      openChapter(DATA.novel.chapters[0].id);
    });

    $("#backToLibraryBtn").addEventListener("click", function () {
      switchView("home");
    });

    var libraryNav = $('[data-nav="home"]');
    if (libraryNav) {
      libraryNav.addEventListener("click", function (e) {
        e.preventDefault();
        switchView("home");
      });
    }
  }

  /* ------------------------------------------------------------------
   * Init
   * ------------------------------------------------------------------ */
  document.addEventListener("DOMContentLoaded", function () {
    initProtections();
    initEvents();
    initBreathTracking();
    setLanguage(state.lang);
  });
})();
