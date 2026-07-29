/**
 * script.js
 * منطق موقع "for lunch time" لقراءة الروايات.
 * المحتوى نفسه موجود في novel-data.js — هذا الملف لا يحتاج تعديلاً
 * إلا إذا أردت تغيير سلوك الموقع.
 */
(function () {
  "use strict";

  /* ------------------------------------------------------------
     أدوات مساعدة
     ------------------------------------------------------------ */
  const EASTERN_DIGITS = ["٠", "١", "٢", "٣", "٤", "٥", "٦", "٧", "٨", "٩"];

  function toArabicDigits(value) {
    return String(value).replace(/[0-9]/g, (d) => EASTERN_DIGITS[+d]);
  }

  function arabicMinutesLabel(n) {
    if (n <= 0) return "أقل من دقيقة";
    if (n === 1) return "دقيقة واحدة";
    if (n === 2) return "دقيقتان";
    if (n >= 3 && n <= 10) return `${toArabicDigits(n)} دقائق`;
    return `${toArabicDigits(n)} دقيقة`;
  }

  const WORDS_PER_MINUTE = 200;
  function computeReadingMinutes(chapter) {
    const words = chapter.paragraphs
      .join(" ")
      .trim()
      .split(/\s+/)
      .filter(Boolean).length;
    return Math.max(1, Math.round(words / WORDS_PER_MINUTE));
  }

  const FONT_STACKS = {
    amiri: "'Amiri', serif",
    notoNaskh: "'Noto Naskh Arabic', serif",
    cairo: "'Cairo', sans-serif",
    tajawal: "'Tajawal', sans-serif",
  };

  const LOCALE_DEFAULT_FONT = {
    ar: "amiri",
    fr: "cairo",
    en: "tajawal",
    default: "notoNaskh",
  };

  function getDeviceLocale() {
    return (
      (navigator.languages && navigator.languages[0]) ||
      navigator.language ||
      Intl.DateTimeFormat().resolvedOptions().locale ||
      "ar"
    ).toLowerCase();
  }

  function getLocaleCode(locale) {
    return String(locale || "").split("-")[0];
  }

  function getDefaultFontForLocale(locale) {
    const code = getLocaleCode(locale);
    return LOCALE_DEFAULT_FONT[code] || LOCALE_DEFAULT_FONT.default;
  }

  /* ------------------------------------------------------------
     الحالة العامة
     ------------------------------------------------------------ */
  const deviceLocale = getDeviceLocale();

  const state = {
    chapterIndex: 0,
    locale: deviceLocale,
    font: getDefaultFontForLocale(deviceLocale),
    fontSize: 19,
    theme: "sepia",
    bookmarks: [], // { chapterId, paraIndex, chapterTitle, snippet }
  };

  /* ------------------------------------------------------------
     مراجع العناصر
     ------------------------------------------------------------ */
  const els = {
    progressFill: document.getElementById("progressFill"),
    sidebar: document.getElementById("sidebar"),
    scrim: document.getElementById("scrim"),
    tocToggle: document.getElementById("tocToggle"),
    tocList: document.getElementById("tocList"),
    novelCover: document.getElementById("novelCover"),
    novelTitle: document.getElementById("novelTitle"),
    novelAuthor: document.getElementById("novelAuthor"),
    novelStatus: document.getElementById("novelStatus"),
    novelSynopsis: document.getElementById("novelSynopsis"),
    reader: document.getElementById("reader"),
    chapterEyebrow: document.getElementById("chapterEyebrow"),
    chapterTitle: document.getElementById("chapterTitle"),
    readingTime: document.getElementById("readingTime"),
    chapterBody: document.getElementById("chapterBody"),
    prevBtn: document.getElementById("prevBtn"),
    nextBtn: document.getElementById("nextBtn"),
    chapterProgressLabel: document.getElementById("chapterProgressLabel"),
    settingsBtn: document.getElementById("settingsBtn"),
    settingsPopover: document.getElementById("settingsPopover"),
    settingsClose: document.getElementById("settingsClose"),
    fontOptions: document.getElementById("fontOptions"),
    fontDec: document.getElementById("fontDec"),
    fontInc: document.getElementById("fontInc"),
    fontSizeLabel: document.getElementById("fontSizeLabel"),
    themeOptions: document.getElementById("themeOptions"),
    bookmarksBtn: document.getElementById("bookmarksBtn"),
    bookmarksBadge: document.getElementById("bookmarksBadge"),
    bookmarksPopover: document.getElementById("bookmarksPopover"),
    bookmarksClose: document.getElementById("bookmarksClose"),
    bookmarksList: document.getElementById("bookmarksList"),
    toast: document.getElementById("toast"),
  };

  /* ------------------------------------------------------------
     الشريط الجانبي: بيانات الرواية + الفهرس
     ------------------------------------------------------------ */
  function renderNovelInfo() {
    els.novelTitle.textContent = NOVEL.title;
    els.novelAuthor.textContent = NOVEL.author;

    const isOngoing = NOVEL.status === "ongoing";
    els.novelStatus.textContent = isOngoing ? "مستمرة" : "منتهية";
    els.novelStatus.classList.remove("ongoing", "completed");
    els.novelStatus.classList.add(isOngoing ? "ongoing" : "completed");

    els.novelSynopsis.textContent = NOVEL.synopsis;

    els.novelCover.classList.remove("has-image");
    els.novelCover.classList.add("empty");
    els.novelCover.style.removeProperty("--cover-url");
    els.novelCover.textContent = "أضف الغلاف لاحقًا";
    els.novelCover.setAttribute("aria-label", "غلاف فارغ لإضافته لاحقًا");
  }

  function renderTOC() {
    els.tocList.innerHTML = "";
    NOVEL.chapters.forEach((chapter, idx) => {
      const minutes = computeReadingMinutes(chapter);
      const li = document.createElement("li");
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "toc-item";
      btn.dataset.index = String(idx);
      btn.innerHTML = `
        <span class="toc-num">${toArabicDigits(idx + 1)}.</span>
        <span class="toc-name">${chapter.title}</span>
        <span class="toc-leader" aria-hidden="true"></span>
        <span class="toc-time">${toArabicDigits(minutes)} د</span>
      `;
      btn.addEventListener("click", () => {
        goToChapter(idx);
        if (window.matchMedia("(max-width: 959px)").matches) closeSidebar();
      });
      li.appendChild(btn);
      els.tocList.appendChild(li);
    });
  }

  function updateActiveTOCItem() {
    els.tocList.querySelectorAll(".toc-item").forEach((btn) => {
      btn.classList.toggle("is-active", Number(btn.dataset.index) === state.chapterIndex);
    });
  }

  /* ------------------------------------------------------------
     عرض الفصل
     ------------------------------------------------------------ */
  function renderChapter() {
    const chapter = NOVEL.chapters[state.chapterIndex];
    const total = NOVEL.chapters.length;

    els.chapterEyebrow.textContent = `الفصل ${toArabicDigits(state.chapterIndex + 1)} من ${toArabicDigits(total)}`;
    els.chapterTitle.textContent = chapter.title;

    const minutes = computeReadingMinutes(chapter);
    els.readingTime.textContent = `وقت القراءة المقدّر: ${arabicMinutesLabel(minutes)}`;

    els.chapterBody.innerHTML = "";
    chapter.paragraphs.forEach((text, paraIndex) => {
      const wrap = document.createElement("div");
      wrap.className = "para-wrap";

      const bmBtn = document.createElement("button");
      bmBtn.type = "button";
      bmBtn.className = "para-bookmark";
      bmBtn.setAttribute("aria-label", "إشارة مرجعية لهذه الفقرة");
      bmBtn.innerHTML = `
        <svg viewBox="0 0 24 24" aria-hidden="true" class="icon-svg">
          <path d="M7 4.5A1.5 1.5 0 0 1 8.5 3h7A1.5 1.5 0 0 1 17 4.5V21l-5-3-5 3V4.5Z" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linejoin="round"/>
        </svg>
      `;
      bmBtn.dataset.paraIndex = String(paraIndex);
      bmBtn.addEventListener("click", () => toggleBookmark(chapter.id, paraIndex, text));

      const p = document.createElement("p");
      p.className = "para";
      p.textContent = text;
      p.dataset.paraIndex = String(paraIndex);

      wrap.appendChild(bmBtn);
      wrap.appendChild(p);
      els.chapterBody.appendChild(wrap);
    });

    refreshBookmarkIcons();

    els.prevBtn.disabled = state.chapterIndex === 0;
    els.nextBtn.disabled = state.chapterIndex === total - 1;
    els.chapterProgressLabel.textContent = `${toArabicDigits(state.chapterIndex + 1)} / ${toArabicDigits(total)}`;

    updateActiveTOCItem();
    els.reader.scrollTop = 0;
    updateProgressBar();
  }

  function goToChapter(idx) {
    if (idx < 0 || idx >= NOVEL.chapters.length) return;
    state.chapterIndex = idx;
    renderChapter();
  }

  /* ------------------------------------------------------------
     شريط تقدّم القراءة
     ------------------------------------------------------------ */
  function updateProgressBar() {
    const el = els.reader;
    const scrollable = el.scrollHeight - el.clientHeight;
    const pct = scrollable > 0 ? (el.scrollTop / scrollable) * 100 : 0;
    els.progressFill.style.width = `${Math.min(100, Math.max(0, pct))}%`;
  }

  els.reader.addEventListener("scroll", updateProgressBar, { passive: true });
  window.addEventListener("resize", updateProgressBar);

  /* ------------------------------------------------------------
     الإشارات المرجعية
     ------------------------------------------------------------ */
  function bookmarkKey(chapterId, paraIndex) {
    return `${chapterId}_${paraIndex}`;
  }

  function toggleBookmark(chapterId, paraIndex, text) {
    const key = bookmarkKey(chapterId, paraIndex);
    const existingIdx = state.bookmarks.findIndex(
      (b) => bookmarkKey(b.chapterId, b.paraIndex) === key
    );

    if (existingIdx > -1) {
      state.bookmarks.splice(existingIdx, 1);
      showToast("تمت إزالة الإشارة المرجعية");
    } else {
      const chapter = NOVEL.chapters.find((c) => c.id === chapterId);
      state.bookmarks.push({
        chapterId,
        paraIndex,
        chapterTitle: chapter ? chapter.title : "",
        snippet: text.length > 70 ? text.slice(0, 70).trim() + "…" : text,
      });
      showToast("تم حفظ الإشارة المرجعية");
    }

    refreshBookmarkIcons();
    renderBookmarksPopover();
  }

  function refreshBookmarkIcons() {
    const chapter = NOVEL.chapters[state.chapterIndex];
    els.chapterBody.querySelectorAll(".para-bookmark").forEach((btn) => {
      const paraIndex = Number(btn.dataset.paraIndex);
      const isSaved = state.bookmarks.some(
        (b) => b.chapterId === chapter.id && b.paraIndex === paraIndex
      );
      btn.classList.toggle("is-active", isSaved);
    });

    const count = state.bookmarks.length;
    els.bookmarksBadge.hidden = count === 0;
    els.bookmarksBadge.textContent = toArabicDigits(count);
  }

  function renderBookmarksPopover() {
    els.bookmarksList.innerHTML = "";
    if (state.bookmarks.length === 0) {
      const empty = document.createElement("p");
      empty.className = "bookmarks-empty";
      empty.textContent = "لم تحفظ أي إشارة مرجعية بعد. اضغط على الأيقونة بجانب أي فقرة لحفظها.";
      els.bookmarksList.appendChild(empty);
      return;
    }

    state.bookmarks.forEach((b) => {
      const li = document.createElement("li");
      li.className = "bookmark-item";

      const btn = document.createElement("button");
      btn.type = "button";
      btn.innerHTML = `
        <span class="bookmark-chapter">${b.chapterTitle}</span>
        <span class="bookmark-snippet">${b.snippet}</span>
      `;
      btn.addEventListener("click", () => {
        const chapterIdx = NOVEL.chapters.findIndex((c) => c.id === b.chapterId);
        if (chapterIdx === -1) return;
        goToChapter(chapterIdx);
        closePopover(els.bookmarksPopover, els.bookmarksBtn);
        requestAnimationFrame(() => {
          const target = els.chapterBody.querySelector(
            `.para[data-para-index="${b.paraIndex}"]`
          );
          if (target) {
            target.scrollIntoView({ block: "center", behavior: "smooth" });
            target.classList.add("para-flash");
            setTimeout(() => target.classList.remove("para-flash"), 1600);
          }
        });
      });

      li.appendChild(btn);
      els.bookmarksList.appendChild(li);
    });
  }

  /* ------------------------------------------------------------
     إعدادات القراءة
     ------------------------------------------------------------ */
  function setFont(fontKey) {
    const safeFont = FONT_STACKS[fontKey] ? fontKey : getDefaultFontForLocale(state.locale);
    state.font = safeFont;

    document.documentElement.style.setProperty("--font-reading", FONT_STACKS[safeFont]);
    document.documentElement.style.setProperty("--font-display", FONT_STACKS[safeFont]);

    els.fontOptions.querySelectorAll(".option-chip").forEach((chip) => {
      chip.classList.toggle("is-active", chip.dataset.font === safeFont);
    });
  }

  function setFontSize(size) {
    state.fontSize = Math.min(26, Math.max(14, size));
    document.documentElement.style.setProperty("--reading-font-size", `${state.fontSize}px`);
    els.fontSizeLabel.textContent = toArabicDigits(state.fontSize);
  }

  function setTheme(themeKey) {
    state.theme = themeKey;
    document.documentElement.setAttribute("data-theme", themeKey);
    els.themeOptions.querySelectorAll(".theme-swatch").forEach((sw) => {
      sw.classList.toggle("is-active", sw.dataset.theme === themeKey);
    });
  }

  els.fontOptions.addEventListener("click", (e) => {
    const chip = e.target.closest(".option-chip");
    if (chip) setFont(chip.dataset.font);
  });

  els.fontDec.addEventListener("click", () => setFontSize(state.fontSize - 1));
  els.fontInc.addEventListener("click", () => setFontSize(state.fontSize + 1));

  els.themeOptions.addEventListener("click", (e) => {
    const sw = e.target.closest(".theme-swatch");
    if (sw) setTheme(sw.dataset.theme);
  });

  /* ------------------------------------------------------------
     التنقل بين الفصول
     ------------------------------------------------------------ */
  els.prevBtn.addEventListener("click", () => goToChapter(state.chapterIndex - 1));
  els.nextBtn.addEventListener("click", () => goToChapter(state.chapterIndex + 1));

  /* ------------------------------------------------------------
     فتح/إغلاق القوائم المنبثقة
     ------------------------------------------------------------ */
  function openPopover(popoverEl, btnEl) {
    popoverEl.hidden = false;
    btnEl.setAttribute("aria-expanded", "true");
  }

  function closePopover(popoverEl, btnEl) {
    popoverEl.hidden = true;
    btnEl.setAttribute("aria-expanded", "false");
  }

  function togglePopover(popoverEl, btnEl) {
    if (popoverEl.hidden) {
      [els.settingsPopover, els.bookmarksPopover].forEach((p) => {
        if (p !== popoverEl) p.hidden = true;
      });
      openPopover(popoverEl, btnEl);
    } else {
      closePopover(popoverEl, btnEl);
    }
  }

  els.settingsBtn.addEventListener("click", () => togglePopover(els.settingsPopover, els.settingsBtn));

  els.settingsClose.addEventListener("click", () => closePopover(els.settingsPopover, els.settingsBtn));

  els.bookmarksBtn.addEventListener("click", () => {
    renderBookmarksPopover();
    togglePopover(els.bookmarksPopover, els.bookmarksBtn);
  });

  els.bookmarksClose.addEventListener("click", () => closePopover(els.bookmarksPopover, els.bookmarksBtn));

  document.addEventListener("click", (e) => {
    if (
      !els.settingsPopover.hidden &&
      !els.settingsPopover.contains(e.target) &&
      !els.settingsBtn.contains(e.target)
    ) {
      closePopover(els.settingsPopover, els.settingsBtn);
    }

    if (
      !els.bookmarksPopover.hidden &&
      !els.bookmarksPopover.contains(e.target) &&
      !els.bookmarksBtn.contains(e.target)
    ) {
      closePopover(els.bookmarksPopover, els.bookmarksBtn);
    }
  });

  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") {
      closePopover(els.settingsPopover, els.settingsBtn);
      closePopover(els.bookmarksPopover, els.bookmarksBtn);
      closeSidebar();
    }
  });

  /* ------------------------------------------------------------
     قائمة الفهرس على الجوال
     ------------------------------------------------------------ */
  function openSidebar() {
    els.sidebar.classList.add("is-open");
    els.scrim.hidden = false;
    els.tocToggle.setAttribute("aria-expanded", "true");
  }

  function closeSidebar() {
    els.sidebar.classList.remove("is-open");
    els.scrim.hidden = true;
    els.tocToggle.setAttribute("aria-expanded", "false");
  }

  els.tocToggle.addEventListener("click", () => {
    els.sidebar.classList.contains("is-open") ? closeSidebar() : openSidebar();
  });

  els.scrim.addEventListener("click", closeSidebar);

  /* ------------------------------------------------------------
     حماية بسيطة من النسخ
     ------------------------------------------------------------ */
  function shieldNote() {
    showToast("هذا المحتوى محمي من النسخ");
  }

  document.addEventListener("contextmenu", (e) => {
    e.preventDefault();
    shieldNote();
  });

  document.addEventListener("selectstart", (e) => e.preventDefault());
  document.addEventListener("dragstart", (e) => e.preventDefault());

  document.addEventListener("copy", (e) => {
    e.preventDefault();
    shieldNote();
  });

  document.addEventListener("cut", (e) => e.preventDefault());

  document.addEventListener("keydown", (e) => {
    const k = e.key.toLowerCase();
    const blockedCombo = (e.ctrlKey || e.metaKey) && ["c", "u", "s", "p"].includes(k);
    if (blockedCombo || k === "f12") {
      e.preventDefault();
      shieldNote();
    }
  });

  /* ------------------------------------------------------------
     التنبيهات
     ------------------------------------------------------------ */
  let toastTimer = null;

  function showToast(message) {
    els.toast.textContent = message;
    els.toast.hidden = false;
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => {
      els.toast.hidden = true;
    }, 1800);
  }

  /* ------------------------------------------------------------
     التهيئة
     ------------------------------------------------------------ */
  function init() {
    renderNovelInfo();
    renderTOC();
    renderChapter();
    renderBookmarksPopover();

    setFont(state.font);
    setFontSize(state.fontSize);
    setTheme(document.documentElement.getAttribute("data-theme") || state.theme);
  }

  document.addEventListener("DOMContentLoaded", init);
})();
