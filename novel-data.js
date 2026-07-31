/**
 * novel-data.js
 * ------------------------------------------------------------------
 * "Lunch Time" — protected platform configuration & novel data store.
 *
 * This file is intentionally self-contained and tamper-resistant:
 *   1. The entire data graph is recursively frozen with deepFreeze(),
 *      so nested objects/arrays cannot be mutated at runtime.
 *   2. It is attached to `window` via Object.defineProperty with
 *      writable: false and configurable: false, so it cannot be
 *      reassigned, redefined, or deleted from the console.
 *
 * app.js should only ever READ from window.LUNCH_TIME_DATA.
 * ------------------------------------------------------------------
 */
(function () {
  "use strict";

  /** Recursively freezes an object graph (objects + arrays). */
  function deepFreeze(value) {
    if (value === null || typeof value !== "object") return value;
    if (Object.isFrozen(value)) return value;

    Object.getOwnPropertyNames(value).forEach(function (key) {
      var child = value[key];
      if (child !== null && typeof child === "object") {
        deepFreeze(child);
      }
    });

    return Object.freeze(value);
  }

  var DATA = {
    /* ----------------------------------------------------------------
     * PLATFORM CONFIGURATION
     * ---------------------------------------------------------------- */
    meta: {
      brand: "Lunch Time",
      tagline: {
        ar: "قصصٌ نفسية عميقة، بأناقة لا تشبه غيرها.",
        en: "Psychological fiction, told with quiet luxury.",
        ja: "静かな贅を纏った、心理小説の世界。",
      },
      supportedLanguages: ["ar", "en", "ja"],
      defaultLanguage: "en",
      languageMeta: {
        ar: { label: "العربية", dir: "rtl", short: "AR" },
        en: { label: "English", dir: "ltr", short: "EN" },
        ja: { label: "日本語", dir: "ltr", short: "JA" },
      },
    },

    /* ----------------------------------------------------------------
     * UI STRING TRANSLATIONS
     * ---------------------------------------------------------------- */
    ui: {
      ar: {
        navLibrary: "المكتبة",
        navAbout: "عن المنصة",
        statusLabel: "الحالة",
        authorLabel: "الكاتب",
        synopsisLabel: "نبذة",
        chaptersLabel: "الفصول",
        chapterCount: "فصل واحد",
        beginReading: "ابدأ القراءة",
        continueReading: "متابعة القراءة",
        backToLibrary: "العودة إلى المكتبة",
        tagPsychological: "أدب نفسي",
        readingTime: "٦ دقائق قراءة",
        footerNote: "تجربة قراءة صُممت للتأمل الهادئ.",
        footerRights: "جميع الحقوق محفوظة",
        protectedNotice: "هذا المحتوى محمي. النسخ والتحديد معطّلان.",
      },
      en: {
        navLibrary: "Library",
        navAbout: "About",
        statusLabel: "Status",
        authorLabel: "Author",
        synopsisLabel: "Synopsis",
        chaptersLabel: "Chapters",
        chapterCount: "1 Chapter",
        beginReading: "Begin Reading",
        continueReading: "Continue Reading",
        backToLibrary: "Back to Library",
        tagPsychological: "Psychological Fiction",
        readingTime: "6 min read",
        footerNote: "A reading experience built for quiet reflection.",
        footerRights: "All rights reserved",
        protectedNotice: "This content is protected. Copying and selection are disabled.",
      },
      ja: {
        navLibrary: "ライブラリ",
        navAbout: "プラットフォームについて",
        statusLabel: "連載状況",
        authorLabel: "著者",
        synopsisLabel: "あらすじ",
        chaptersLabel: "章",
        chapterCount: "全1章",
        beginReading: "読み始める",
        continueReading: "続きを読む",
        backToLibrary: "ライブラリへ戻る",
        tagPsychological: "心理小説",
        readingTime: "読了目安 6分",
        footerNote: "静かな内省のために設計された読書体験。",
        footerRights: "全ての権利を保有します",
        protectedNotice: "本コンテンツは保護されています。コピーおよび選択は無効化されています。",
      },
    },

    /* ----------------------------------------------------------------
     * NOVEL METADATA + CHAPTERS
     * ---------------------------------------------------------------- */
    novel: {
      slug: "one-way-reset",
      status: "ongoing",

      title: {
        ar: "إعادة ضبط باتجاه واحد — النظر إلى الداخل من زاوية مختلفة",
        en: "One-Way Reset — Looking Inside a Different Way",
        ja: "ワンウェイ・リセット ― 違う角度から内側を見つめて",
      },

      author: {
        ar: "زكريا",
        en: "Zakaria",
        ja: "ザカリア",
      },

      statusLabel: {
        ar: "مستمر",
        en: "Ongoing",
        ja: "連載中",
      },

      synopsis: {
        ar: "زوال التفكير اليومي المعتاد.",
        en: "The quiet dissolution of ordinary, everyday thought.",
        ja: "ありふれた日常的思考が、静かに消えていく物語。",
      },

      chapters: [
        {
          id: "ch-01",
          number: 1,
          title: {
            ar: "الفصل الأول: ساعة قبل الفجر",
            en: "Chapter One: An Hour Before Dawn",
            ja: "第一章：夜明け前の一時間",
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
              "Something strange happened… and it is still happening, to this very day.",
              "On that day… yes, on this very day, I felt a small spark that changed the course of my life — a man who had been living an ordinary life.",
              "The sun rises every morning, not because there is any real desire within him to rise, but because life waits for no one who falls behind.",
              "He washes his face in haste, puts on his usual clothes, clothes that, over time, have lost any meaning of elegance or order, then steps out into a street crowded with people who resemble him more than he realizes.",
              "Exhausted faces, hurried footsteps, and thoughts circling the same question: how will this day pass?",
              "The hours pass between work, fatigue, and the quiet preoccupation of doing what must be done, as it should be done.",
              "Each day, a person toils to preserve a life that God finds pleasing for him, holding fast to the acts of worship for which he was created — a prayer whispered along the way, or words of forgiveness repeated silently amid the noise of life.",
              "Yes… that is exactly how it was.",
              "Another day of striving, of patience, of worship, and of going on.",
              "But… on that day, I felt something I did not know how to deal with.",
            ],
            ja: [
              "奇妙な出来事が起きた――そして、それは今日に至るまで続いている。",
              "あの日……そう、まさに今日という日に、私は小さな火花を感じた。ごく普通の人生を送っていた一人の人間としての、私の進む道を変えてしまう火花を。",
              "太陽は毎朝昇る。彼の中に起き上がりたいという本当の願いがあるからではない。ただ、人生は遅れる者を待ってはくれないからだ。",
              "彼は急いで顔を洗い、いつもの服を身につける。その服はいつしか、上品さや身だしなみといった意味を失ってしまっていた。そして彼は、雑踏の街へと踏み出す。そこには、彼が思う以上に彼自身によく似た人々がいる。",
              "疲れ果てた顔、急ぎ足、そして頭の中を巡る同じ問い――今日という日は、どう過ぎていくのだろうか。",
              "時間は、仕事と疲労、そして為すべきことを為さねばならないという思いの狭間を過ぎていく。",
              "人は毎日、神が望まれるような人生を守るために働き、自らが創られた目的である礼拝にすがりつく――道すがら小さく唱える祈り、あるいは日々の喧騒の中で静かに繰り返す悔悟の言葉。",
              "そう……まさにその通りだった。",
              "努力と忍耐、礼拝、そして継続の、また一つの日。",
              "けれど……あの日、私は自分でもどう向き合えばいいのか分からない何かを、確かに感じたのだ。",
            ],
          },
        },
      ],
    },
  };

  deepFreeze(DATA);

  Object.defineProperty(window, "LUNCH_TIME_DATA", {
    value: DATA,
    writable: false,
    configurable: false,
    enumerable: true,
  });
})();
