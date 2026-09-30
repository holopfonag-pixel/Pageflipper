(function () {
  "use strict";

  var DATA = window.LUNCH_TIME_DATA;

  if (!DATA) {
    console.error("Lunch Time: novel-data.js failed to load.");
    return;
  }

  function readStoredLanguage() {
    try {
      var stored = window.localStorage.getItem("lunch-time-language");
      return DATA.meta.supportedLanguages.indexOf(stored) !== -1 ? stored : DATA.meta.defaultLanguage;
    } catch (error) {
      return DATA.meta.defaultLanguage;
    }
  }

  var state = {
    lang: readStoredLanguage(),
    view: "home",
    chapterId: null
  };

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
      if (state.chapterId === chapter.id) {
        btn.classList.add("is-active");
        btn.setAttribute("aria-current", "page");
      }

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

    var countLabel = $("#chapterCountLabel");
    if (countLabel) {
      countLabel.textContent = DATA.novel.chapters.length === 1
        ? ui().chapterCount
        : (DATA.novel.chapters.length + " " + (state.lang === "ar" ? "فصول" : state.lang === "ja" ? "章" : "Chapters"));
    }
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
    var nextHash = view === "reader" && state.chapterId
      ? "#chapter/" + encodeURIComponent(state.chapterId)
      : "#library";
    if (window.location.hash !== nextHash) {
      window.history.replaceState(null, "", nextHash);
    }
    if (view === "reader") {
      window.dispatchEvent(new Event("scroll"));
    }
  }

  function openChapter(chapterId) {
    state.chapterId = chapterId;
    renderReader();
    switchView("reader");
  }

  function setLanguage(lang) {
    if (DATA.meta.supportedLanguages.indexOf(lang) === -1) return;

    state.lang = lang;
    try {
      window.localStorage.setItem("lunch-time-language", lang);
    } catch (error) {
      // Preferences remain optional when storage is unavailable.
    }
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

  function initBreathTracking() {
    var dot = $("#breathDot");
    var frame = $(".reader-frame__inner");
    var progress = $(".reader-progress");
    var progressBar = $("#readerProgressBar");
    var progressValue = $("#readerProgressValue");
    if (!dot || !frame) return;

    var ticking = false;

    function update() {
      if ($("#view-reader").hidden) return;
      var rect = frame.getBoundingClientRect();
      var travel = Math.max(rect.height - window.innerHeight * 0.35, 1);
      var scrolled = Math.min(Math.max(-rect.top, 0), travel);
      var pct = scrolled / travel;
      dot.style.top = (pct * 100).toFixed(2) + "%";
      if (progressBar && progressValue && progress) {
        var rounded = Math.round(pct * 100);
        progressBar.style.width = rounded + "%";
        progressValue.textContent = rounded + "%";
        progress.setAttribute("aria-valuenow", String(rounded));
      }
    }

    function scheduleUpdate() {
      if (ticking) return;
      ticking = true;
      window.requestAnimationFrame(function () {
        ticking = false;
        update();
      });
    }

    window.addEventListener("scroll", scheduleUpdate, { passive: true });
    window.addEventListener("resize", scheduleUpdate);
    update();
  }

  function initProtections() {
    // Keep native selection, context menus, and keyboard shortcuts available
    // for accessibility, translation, and assistive reading workflows.
  }

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

    window.addEventListener("hashchange", function () {
      var match = window.location.hash.match(/^#chapter\/(.+)$/);
      if (match) {
        var chapterId = decodeURIComponent(match[1]);
        if (findChapter(chapterId)) openChapter(chapterId);
      } else {
        switchView("home");
      }
    });
  }

  function openHashRoute() {
    var match = window.location.hash.match(/^#chapter\/(.+)$/);
    if (match) {
      var chapterId = decodeURIComponent(match[1]);
      if (findChapter(chapterId)) {
        openChapter(chapterId);
        return;
      }
    }
    switchView("home");
  }

  document.addEventListener("DOMContentLoaded", function () {
    initProtections();
    initEvents();
    initBreathTracking();
    setLanguage(state.lang);
    openHashRoute();

    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.register("./sw.js").catch(function () {
        // Offline caching is an enhancement; the reader remains fully usable without it.
      });
    }
  });
})();
