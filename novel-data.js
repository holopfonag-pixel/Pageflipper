(function () {
"use strict";

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
meta: {
brand: "Lunch Time",
tagline: {
ar: "حكايات نفسية عميقة، تُروى بذوقٍ هادئ وأنيق.",
en: "Psychological fiction, told with quiet restraint and elegance.",
ja: "静かな品格をまとった、心理小説の世界。"
},
supportedLanguages: ["ar", "en", "ja"],
defaultLanguage: "en",
languageMeta: {
ar: { label: "العربية", dir: "rtl", short: "AR" },
en: { label: "English", dir: "ltr", short: "EN" },
ja: { label: "日本語", dir: "ltr", short: "JA" }
}
},

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
    protectedNotice: "هذا المحتوى محمي. النسخ والتحديد معطّلان."
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
    protectedNotice: "This content is protected. Copying and selection are disabled."
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
    protectedNotice: "本コンテンツは保護されています。コピーおよび選択は無効化されています。"
  }
},

novel: {
  slug: "one-way-reset",
  status: "ongoing",

  title: {
    ar: "إعادة ضبط باتجاه واحد — النظر إلى الداخل من زاوية مختلفة",
    en: "One-Way Reset — Looking Inside from a Different Angle",
    ja: "ワンウェイ・リセット ― 別の角度から内側を見つめる"
  },

  author: {
    ar: "زكريا",
    en: "Zakaria",
    ja: "ザカリア"
  },

  statusLabel: {
    ar: "مستمر",
    en: "Ongoing",
    ja: "連載中"
  },

  synopsis: {
    ar: "تفككٌ هادئ لما اعتاده الذهن من أفكارٍ يوميةٍ مكرورة.",
    en: "A quiet unraveling of the mind’s ordinary, repeated thoughts.",
    ja: "日常に慣れきった思考が、静かにほどけていく物語。"
  },

  chapters: [
    {
      id: "ch-01",
      number: 1,
      title: {
        ar: "الفصل الأول: ساعة قبل الفجر",
        en: "Chapter One: An Hour Before Dawn",
        ja: "第一章：夜明け前の一時間"
      },
      paragraphs: {
        ar: [
          "حدث أمرٌ غريب… ولا يزال يحدث إلى يومنا هذا.",
          "في ذلك اليوم تحديدًا، شعرتُ بشرارةٍ صغيرةٍ غيّرت مساري؛ شرارةٍ لم يبدُ لها أثرٌ في البداية، لكنها كانت كافيةً لتقلب ترتيب الحياة في داخلي.",
          "تشرق الشمس كل صباح، لا لأن في النفس رغبةً صادقة في النهوض، بل لأن الحياة لا تمنح المتأخرين مهلةً طويلة.",
          "يغسل وجهه على عجل، ويرتدي ثيابه المعتادة؛ ثيابًا فقدت، مع مرور الوقت، أيّ معنىً للأناقة أو الترتيب، ثم يخرج إلى شارعٍ مزدحمٍ بأناسٍ يشبهونه أكثر مما يظن.",
          "وجوه مرهقة، وخطوات مسرعة، وأفكار تدور حول السؤال نفسه: كيف سيمضي هذا اليوم؟",
          "تمضي الساعات بين العمل والتعب والانشغال بما ينبغي إنجازه كما ينبغي.",
          "يكدح الإنسان كل يومٍ ليحفظ حياةً يرضاها الله له، ويتمسك بما خُلق لأجله من عبادةٍ وصبر؛ دعاءٌ يهمس به في طريقه، واستغفارٌ يردده بصمتٍ وسط ضجيج الحياة.",
          "نعم… كان الأمر كذلك تمامًا.",
          "يومٌ آخر من السعي، والصبر، والعبادة، والاستمرار.",
          "لكن… في ذلك اليوم، شعرتُ بشيءٍ لم أعرف كيف أتعامل معه."
        ],
        en: [
          "Something strange happened… and it is still happening to this very day.",
          "On that day, I felt a small spark that altered my path — a spark so slight at first that I almost dismissed it.",
          "The sun rises every morning, not because there is any genuine will to rise within him, but because life does not wait for those who fall behind.",
          "He washes his face in haste, puts on his usual clothes — clothes that, over time, have lost any trace of elegance or order — then steps out into a street crowded with people who resemble him more than he realizes.",
          "Tired faces, hurried footsteps, and thoughts circling the same question: how will this day pass?",
          "The hours go by between work, exhaustion, and the constant pressure of doing what must be done.",
          "Each day, a person labors to preserve a life pleasing to God, holding fast to the worship for which he was created: a prayer whispered along the road, or words of forgiveness repeated silently amid the noise of life.",
          "Yes… it was exactly like that.",
          "Another day of striving, patience, worship, and persistence.",
          "But on that day, I felt something I did not know how to face."
        ],
        ja: [
          "奇妙な出来事が起きた――そして、それは今も続いている。",
          "あの日、私は小さな火花を感じた。それは一見あまりにもささやかだったが、私の歩む道を変えるには十分だった。",
          "太陽は毎朝昇る。そこに本当の意志があるからではない。ただ、人生は遅れた者を待ってはくれない。",
          "彼は急いで顔を洗い、いつもの服を身につける。その服は、いつしか上品さや整いといったものを失っていた。そして彼は、雑踏の街へ踏み出す。そこには、彼が思う以上に彼自身によく似た人々がいる。",
          "疲れ切った顔、急ぎ足、そして頭の中を巡る同じ問い――今日という日は、どう過ぎていくのだろうか。",
          "時間は、仕事と疲労、そして果たすべきことを果たさねばならないという圧のあいだを過ぎていく。",
          "人は毎日、神が望まれるような人生を守るために働き、自らが創られた目的である礼拝にすがる――道すがら小さく唱える祈り、あるいは日々の喧騒の中で静かに繰り返す悔悟の言葉。",
          "そう……まさにその通りだった。",
          "努力と忍耐、礼拝、そして継続の、また一つの日。",
          "けれど……あの日、私は自分でもどう向き合えばいいのか分からない何かを、確かに感じたのだ。"
        ]
      }
    }
  ]
}

};

deepFreeze(DATA);

Object.defineProperty(window, "LUNCH_TIME_DATA", {
value: DATA,
writable: false,
configurable: false,
enumerable: true
});
})();
