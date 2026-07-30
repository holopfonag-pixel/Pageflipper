/**
 * novel-data.js
 * ---------------------------------------------------------------
 * Single source of truth for all novel content and UI translations.
 * The object below is deep-frozen and attached to `window.NOVEL_DATA`
 * as a non-writable, non-configurable property, so nothing in the
 * page (including a compromised third-party script) can mutate,
 * replace, or delete it at runtime.
 * ---------------------------------------------------------------
 */
(function () {
  "use strict";

  const NOVEL_DATA_SOURCE = {
    // ---------------------------------------------------------
    // Global novel metadata
    // ---------------------------------------------------------
    meta: {
      title: {
        ar: "ساعة قبل الفجر",
        en: "An Hour Before Dawn",
        ja: "夜明け前の刻",
      },
      author: {
        ar: "زكريا",
        en: "Zakaria",
        ja: "ザカリア",
      },
      status: {
        key: "ongoing",
        ar: "مستمرة",
        en: "Ongoing",
        ja: "連載中",
      },
      tagline: {
        ar: "رواية رقمية",
        en: "A Web Novel",
        ja: "ウェブ小説",
      },
      synopsis: {
        ar: "زوال التفكير اليومي المعتاد.",
        en: "The quiet unraveling of ordinary thought.",
        ja: "日常という思考の、静かな崩壊。",
      },
    },

    // ---------------------------------------------------------
    // Interface labels (every static string in the shell)
    // ---------------------------------------------------------
    ui: {
      navHome: { ar: "الرئيسية", en: "Home", ja: "ホーム" },
      navChapters: { ar: "الفصول", en: "Chapters", ja: "章" },
      navAbout: { ar: "نبذة", en: "About", ja: "概要" },

      langLabel: { ar: "اللغة", en: "Language", ja: "言語" },

      authorLabel: { ar: "الكاتب", en: "Author", ja: "著者" },
      statusLabel: { ar: "الحالة", en: "Status", ja: "状態" },
      synopsisLabel: { ar: "نبذة عن الرواية", en: "Synopsis", ja: "あらすじ" },

      startReading: { ar: "ابدأ القراءة", en: "Start Reading", ja: "読み始める" },
      chapterListTitle: { ar: "قائمة الفصول", en: "Chapter List", ja: "章一覧" },
      readNow: { ar: "قراءة", en: "Read", ja: "読む" },

      backToChapters: { ar: "العودة إلى الفصول", en: "Back to Chapters", ja: "章リストに戻る" },
      nextChapter: { ar: "الفصل التالي", en: "Next Chapter", ja: "次の章" },
      prevChapter: { ar: "الفصل السابق", en: "Previous Chapter", ja: "前の章" },

      increaseFont: { ar: "تكبير الخط", en: "Increase text size", ja: "文字を大きく" },
      decreaseFont: { ar: "تصغير الخط", en: "Decrease text size", ja: "文字を小さく" },

      aboutBody: {
        ar: "عمل أدبي نفسي يتتبع لحظة انكسار هادئة داخل يوم عادي، حين يتحول الروتين فجأة إلى سؤال لا يملك الإنسان له جوابًا جاهزًا.",
        en: "A psychological literary work that follows one quiet fracture inside an ordinary day — the moment routine suddenly turns into a question no one has a ready answer for.",
        ja: "平凡な一日の中に生じる、静かな亀裂を追う心理文学作品。ルーティンが不意に、誰も即答できない問いへと変わる瞬間を描く。",
      },

      footerRights: { ar: "جميع الحقوق محفوظة", en: "All rights reserved", ja: "全著作権所有" },

      copyBlocked: {
        ar: "المحتوى محمي من النسخ",
        en: "This content is protected",
        ja: "このコンテンツは保護されています",
      },

      closeMenu: { ar: "إغلاق القائمة", en: "Close menu", ja: "メニューを閉じる" },
      openMenu: { ar: "فتح القائمة", en: "Open menu", ja: "メニューを開く" },
    },

    // ---------------------------------------------------------
    // Chapters
    // ---------------------------------------------------------
    chapters: [
      {
        id: 1,
        title: {
          ar: "الفصل الأول: ساعة قبل الفجر",
          en: "Chapter One: An Hour Before Dawn",
          ja: "第一章:夜明け前の刻",
        },
        paragraphs: {
          ar: [
            "أمرٌ غريبٌ حدث… ولا يزال يحدث إلى يومنا هذا.",
            "في ذلك اليوم… نعم، في يومنا هذا تحديدًا، شعرتُ بشرارة صغيرة غيّرت مساري كإنسانٍ كان يعيش حياةً عادية.",
            "تشرق الشمس كل صباح، لا لأن في داخله رغبة حقيقية للنهوض، بل لأن الحياة لا تنتظر أحدًا يتأخر عنها.",
            "يغسل وجهه على عجل، يرتدي ملابسه المعتادة التي فقدت مع الوقت أي معنى للأناقة أو الترتيب، ثم يخرج إلى الشارع المكتظ بأشخاص يشبهونه أكثر مما يظن.",
            "وجوه مرهقة، خطوات مسرعة، وأفكار تدور حول السؤال ذاته: كيف سيمر هذا اليوم؟",
            "تمضي الساعات بين العمل والتعب والانشغال بما يجب فعله كما ينبغي.",
            "يكدح الإنسان كل يوم ليحافظ على حياةٍ يرضاها الله له، ويتمسك بعباداته التي خُلق من أجلها؛ دعاءٌ يهمس به في طريقه، أو استغفارٌ يردده بصمت وسط ضجيج الحياة.",
            "نعم… كان الأمر كذلك تمامًا.",
            "يومٌ آخر من السعي، والصبر، والعبادة، والاستمرار.",
            "لكن… في ذلك اليوم، شعرتُ بشيءٍ لم أعرف كيف أتعامل معه.",
          ],
          en: [
            "Something strange happened… and it is still happening to this day.",
            "On that day… yes, on this very day, I felt a small spark that changed my course as a person who had been living an ordinary life.",
            "The sun rises every morning, not because he holds any real wish to get up, but because life waits for no one who falls behind.",
            "He washes his face in haste, puts on the same clothes that long ago lost any meaning of elegance or order, then steps out into a street crowded with people who resemble him more than he thinks.",
            "Weary faces, hurried steps, and thoughts circling the same question: how will this day pass?",
            "The hours pass between work, exhaustion, and the quiet obligation to do what must be done as it should be done.",
            "Every day, a person toils to hold on to a life that pleases God, clinging to the acts of worship he was created for; a prayer whispered along the way, or words of repentance murmured quietly amid the noise of life.",
            "Yes… that was exactly how it was.",
            "Another day of striving, of patience, of worship, of pressing on.",
            "But… on that day, I felt something I did not know how to face.",
          ],
          ja: [
            "奇妙な出来事が起きた——そして今もなお、起き続けている。",
            "あの日……そう、まさに今日という日に、平凡な人生を送っていた一人の人間としての私の道筋を変える、小さな火花を感じた。",
            "太陽は毎朝昇る。彼の内に本当に起き上がりたいという願いがあるからではなく、人生は誰かが遅れるのを待ってはくれないからだ。",
            "彼は急いで顔を洗い、優雅さや秩序の意味などとうに失ったいつもの服をまとうと、彼自身が思う以上に彼に似た人々で溢れる通りへと出て行く。",
            "疲れた顔、急ぐ足取り、そして誰もが同じ問いを巡らせる——今日という日はどう過ぎていくのだろうか。",
            "時間は、仕事と疲労、そしてなすべきことを正しくこなすことへの静かな没頭の間を過ぎていく。",
            "人は毎日、神が望まれる人生を保つために労苦し、そのために創られた礼拝に固く縋りつく——道すがら囁く祈り、あるいは人生の喧騒の中で静かに繰り返す悔悟の言葉。",
            "そう……まさにその通りだった。",
            "努力と忍耐、礼拝、そして歩み続ける、もう一日。",
            "だが……あの日、私はどう向き合えばいいのか分からない何かを感じた。",
          ],
        },
      },
    ],
  };

  /**
   * Recursively freezes an object graph (objects and arrays alike),
   * so nested chapters/paragraphs/ui strings are just as immutable
   * as the top-level object.
   */
  function deepFreeze(value) {
    if (value === null || typeof value !== "object" || Object.isFrozen(value)) {
      return value;
    }
    Object.getOwnPropertyNames(value).forEach(function (key) {
      deepFreeze(value[key]);
    });
    return Object.freeze(value);
  }

  deepFreeze(NOVEL_DATA_SOURCE);

  // Attach as a non-writable, non-configurable global so it cannot be
  // reassigned, deleted, or redefined from the console or another script.
  Object.defineProperty(window, "NOVEL_DATA", {
    value: NOVEL_DATA_SOURCE,
    writable: false,
    configurable: false,
    enumerable: true,
  });
})();
