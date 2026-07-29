/**
 * script.js
 * منطق موقع "for lunch time" لقراءة الروايات.
 * المحتوى نفسه موجود في novel-data.js — هذا الملف لا يحتاج تعديلاً
 * إلا إذا أردت تغيير سلوك الموقع.
 *
 * ميزة الخطوط التلقائية: عند التحميل، يكتشف السكربت لغة متصفح
 * الزائر (navigator.language) ويحدد إحدى أربع مجموعات خطوط —
 * عربية / إنجليزية / فرنسية / افتراضية — ثم يعرض في "إعدادات
 * القراءة" أربعة خطوط مناسبة لتلك اللغة، مع خط عربي احتياطي
 * مضمّن في كل مجموعة (fallback) بحيث يبقى نص الرواية نفسه —
 * وهو عربي دائماً — أنيقاً مهما كانت لغة الزائر.
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

  /* ------------------------------------------------------------
     مجموعات الخطوط حسب اللغة (أربعة خطوط لكل لغة)
     كل خط ينتهي بخط عربي احتياطي حتى يبقى نص الفصل أنيقاً
     دوماً، أياً كانت اللغة المكتشفة.
     ------------------------------------------------------------ */
  const LANG_PROFILES = {
    ar: {
      label: "العربية",
      fonts: [
        { id: "amiri", label: "أميري", stack: "'Amiri', 'Noto Naskh Arabic', serif" },
        { id: "notoNaskh", label: "نسخ نوتو", stack: "'Noto Naskh Arabic', 'Amiri', serif" },
        { id: "cairo", label: "القاهرة", stack: "'Cairo', 'Tajawal', sans-serif" },
        { id: "tajawal", label: "تجوّل", stack: "'Tajawal', 'Cairo', sans-serif" },
      ],
    },
    en: {
      label: "الإنجليزية",
      fonts: [
        { id: "playfair", label: "Playfair", stack: "'Playfair Display', 'Amiri', serif" },
        { id: "lora", label: "Lora", stack: "'Lora', 'Amiri', serif" },
        { id: "merriweather", label: "Merriweather", stack: "'Merriweather', 'Amiri', serif" },
        { id: "inter", label: "Inter", stack: "'Inter', 'Tajawal', sans-serif" },
      ],
    },
    fr: {
      label: "الفرنسية",
      fonts: [
        { id: "ebGaramond", label: "EB Garamond", stack: "'EB Garamond', 'Amiri', serif" },
        { id: "cormorant", label: "Cormorant", stack: "'Cormorant Garamond', 'Amiri', serif" },
        { id: "libreBaskerville", label: "Libre Baskerville", stack: "'Libre Baskerville', 'Amiri', serif" },
        { id: "nunitoSans", label: "Nunito Sans", stack: "'Nunito Sans', 'Tajawal', sans-serif" },
      ],
    },
    default: {
      label: "لغتك",
      fonts: [
        { id: "spectral", label: "Spectral", stack: "'Spectral', 'Amiri', serif" },
        { id: "ptSerif", label: "PT Serif", stack: "'PT Serif', 'Amiri', serif" },
        { id: "sourceSerif", label: "Source Serif 4", stack: "'Source Serif 4', 'Amiri', serif" },
        { id: "workSans", label: "Work Sans", stack: "'Work Sans', 'Tajawal', sans-serif" },
      ],
    },
  };

  /* روابط Google Fonts لكل مجموعة (غير العربية، فهي محمّلة سلفاً
     في index.html). تُحقن عند الحاجة فقط لتفادي تحميل خطوط زائدة. */
  const GOOGLE_FONT_HREF = {
    en: "https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;600;700&family=Lora:wght@400;500;600;700&family=Merriweather:wght@300;400;700&family=Inter:wght@400;500;600;700&display=swap",
    fr: "https://fonts.googleapis.com/css2?family=EB+Garamond:wght@400;500;600;700&family=Cormorant+Garamond:wght@400;500;600;700&family=Libre+Baskerville:wght@400;700&family=Nunito+Sans:wght@400;600;700&display=swap",
    default: "https://fonts.googleapis.com/css2?family=Spectral:wght@400;500;600;700&family=PT+Serif:wght@400;700&family=Source+Serif+4:wght@400;500;600;700&family=Work+Sans:wght@400;500;600;700&display=swap",
  };

  function loadGoogleFontsForProfile(profileKey) {
    if (profileKey === "ar") return; // محمّلة سلفاً في <head>
    if (document.getElementById("langFontLink")) return;
    const href = GOOGLE_FONT_HREF[profileKey];
    if (!href) return;
    const link = document.createElement("link");
    link.id = "langFontLink";
    link.rel = "stylesheet";
    link.href = href;
    document.head.appendChild(link);
  }

  function detectLangProfile() {
    try {
      const langs =
        navigator.languages && navigator.languages.length
          ? navigator.languages
          : [navigator.language || navigator.userLanguage || "ar"];
      const sub = String(langs[0] || "ar").toLowerCase().split("-")[0];
      if (sub === "ar") return "ar";
      if (sub === "en") return "en";
      if (sub === "fr") return "fr";
      return "default";
    } catch (e) {
      return "ar";
    }
  }

  /* ------------------------------------------------------------
     الحالة العامة (كل شيء هنا يبقى في الذاكرة فقط لهذه الجلسة —
     لا يُستخدم أي تخزين متصفح حتى تعمل المعاينة في كل مكان.
     إن أردت أن تبقى الإشارات المرجعية والإعدادات محفوظة بعد إغلاق
     المتصفح على موقعك الحقيقي، استبدل القراءة/الكتابة هنا بـ
     localStorage الخاص بالمتصفح.)
     ------------------------------------------------------------ */
  const state = {
    chapterIndex: 0,
    langProfile: "ar",
    font: "amiri",
    fontSize: 19,
    theme: "dark",
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
    langHint: document.getElementById("langHint"),
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
    els.novelStatus.classList.add(isOngoing ? "ongoing" : "completed");

    els.novelSynopsis.textContent = NOVEL.synopsis;

    // الغلاف: إن لم تُحدَّد صورة، يبقى لوحاً مزخرفاً بانتظار غلاف
    // الرواية الحقيقي — لا حاجة لأي صورة مؤقتة.
    if (NOVEL.coverImage) {
      els.novelCover.style.setProperty("--cover-url", `url('${NOVEL.coverImage}')`);
      els.novelCover.classList.add("has-image");
    } else {
      els.novelCover.textContent = NOVEL.title;
    }
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
    els.readingTime.textContent = `⏱ وقت القراءة المقدَّر: ${arabicMinutesLabel(minutes)}`;

    els.chapterBody.innerHTML = "";
    chapter.paragraphs.forEach((text, paraIndex) => {
      const wrap = document.createElement("div");
      wrap.className = "para-wrap";

      const bmBtn = document.createElement("button");
      bmBtn.type = "button";
      bmBtn.className = "para-bookmark";
      bmBtn.setAttribute("aria-label", "إشارة مرجعية لهذه الفقرة");
      bmBtn.innerHTML = '<span aria-hidden="true">🔖</span>';
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
      empty.textContent = "لم تحفظ أي إشارة مرجعية بعد. اضغط 🔖 بجانب أي فقرة لحفظها.";
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
     إعدادات القراءة: اللغة/الخط، الحجم، المظهر
     ------------------------------------------------------------ */

  // يبني شرائح اختيار الخط (أربعة) المناسبة للغة المكتشفة،
  // ويكتب تلميحاً صغيراً يوضح أي لغة اكتُشفت.
  function buildFontChips(profileKey) {
    const profile = LANG_PROFILES[profileKey] || LANG_PROFILES.ar;
    els.fontOptions.innerHTML = "";
    profile.fonts.forEach((f) => {
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "option-chip";
      btn.dataset.font = f.id;
      btn.style.fontFamily = f.stack;
      btn.textContent = f.label;
      els.fontOptions.appendChild(btn);
    });
    if (els.langHint) {
      els.langHint.textContent = `🌐 لغة متصفحك: ${profile.label} — إليك خطوطاً تناسبها`;
    }
  }

  function setFont(fontId) {
    const profile = LANG_PROFILES[state.langProfile] || LANG_PROFILES.ar;
    const entry = profile.fonts.find((f) => f.id === fontId) || profile.fonts[0];
    state.font = entry.id;
    document.documentElement.style.setProperty("--font-reading", entry.stack);
    document.documentElement.style.setProperty("--font-ui", entry.stack);
    els.fontOptions.querySelectorAll(".option-chip").forEach((chip) => {
      chip.classList.toggle("is-active", chip.dataset.font === entry.id);
    });
  }

  // يشغَّل مرة واحدة عند التحميل: يكتشف اللغة، يحمّل خطوطها إن لزم،
  // يبني الشرائح، ويطبّق أول خط في مجموعتها كافتراضي.
  function initLanguageFonts() {
    const profileKey = detectLangProfile();
    state.langProfile = profileKey;
    loadGoogleFontsForProfile(profileKey);
    buildFontChips(profileKey);
    setFont(LANG_PROFILES[profileKey].fonts[0].id);
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
     فتح/إغلاق القوائم المنبثقة (الإعدادات والإشارات المرجعية)
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
      // أغلق أي قائمة أخرى مفتوحة أولاً
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
     قائمة الفهرس على الجوال (Drawer)
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
     حماية بسيطة من النسخ (رادع وليس حماية مطلقة)
     ------------------------------------------------------------ */
  function shieldNote() {
    showToast("🔒 هذا المحتوى محمي من النسخ");
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
     التنبيهات (Toast)
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

    initLanguageFonts();
    setFontSize(state.fontSize);
    setTheme(document.documentElement.getAttribute("data-theme") || state.theme);
  }

  document.addEventListener("DOMContentLoaded", init);
})();
