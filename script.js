(function () {
'use strict';

/* ============================================================
   for lunch time — e-reader
   app.js
   - منطق القارئ
   - الترجمة
   - الفهرس
   - الإشارات المرجعية
   - اختيار اللغة / الخط / المظهر
   ============================================================ */

/* ---------- الإعدادات ---------- */
const CONFIG = {
  translateEndpoint: 'https://translate.googleapis.com/translate_a/single',
  enableBodyTranslation: true,
  titleTranslateChunkSize: 30,
  wpmMin: 200,
  wpmMax: 250,
  storageKeys: {
    theme: 'flt_theme',
    font: 'flt_font',
    lang: 'flt_lang',
    bookmarks: 'flt_bookmarks',
    progress: 'flt_progress'
  }
};

const SEP = '\n@@FLT@@\n';
const RTL_LANGS = ['ar', 'he', 'fa', 'ur', 'ps', 'ku', 'yi'];

const LANG_OPTIONS = [
  { value: 'auto', label: 'English (Auto)' },
  { value: 'en', label: 'English' },
  { value: 'ar', label: 'العربية' },
  { value: 'fr', label: 'Français' },
  { value: 'de', label: 'Deutsch' },
  { value: 'es', label: 'Español' },
  { value: 'it', label: 'Italiano' },
  { value: 'pt', label: 'Português' },
  { value: 'pt-BR', label: 'Português (Brasil)' },
  { value: 'nl', label: 'Nederlands' },
  { value: 'pl', label: 'Polski' },
  { value: 'cs', label: 'Čeština' },
  { value: 'sk', label: 'Slovenčina' },
  { value: 'hu', label: 'Magyar' },
  { value: 'ro', label: 'Română' },
  { value: 'bg', label: 'Български' },
  { value: 'hr', label: 'Hrvatski' },
  { value: 'sr', label: 'Српски' },
  { value: 'sl', label: 'Slovenščina' },
  { value: 'sq', label: 'Shqip' },
  { value: 'el', label: 'Ελληνικά' },
  { value: 'ru', label: 'Русский' },
  { value: 'uk', label: 'Українська' },
  { value: 'be', label: 'Беларуская' },
  { value: 'mk', label: 'Македонски' },
  { value: 'tr', label: 'Türkçe' },
  { value: 'az', label: 'Azərbaycanca' },
  { value: 'ka', label: 'ქართული' },
  { value: 'hy', label: 'Հայերեն' },
  { value: 'he', label: 'עברית' },
  { value: 'fa', label: 'فارسی' },
  { value: 'ur', label: 'اردو' },
  { value: 'ps', label: 'پښتو' },
  { value: 'ku', label: 'Kurdî' },
  { value: 'yi', label: 'ייִדיש' },
  { value: 'hi', label: 'हिन्दी' },
  { value: 'bn', label: 'বাংলা' },
  { value: 'pa', label: 'ਪੰਜਾਬੀ' },
  { value: 'gu', label: 'ગુજરાતી' },
  { value: 'mr', label: 'मराठी' },
  { value: 'ne', label: 'नेपाली' },
  { value: 'si', label: 'සිංහල' },
  { value: 'ta', label: 'தமிழ்' },
  { value: 'te', label: 'తెలుగు' },
  { value: 'kn', label: 'ಕನ್ನಡ' },
  { value: 'ml', label: 'മലയാളം' },
  { value: 'or', label: 'ଓଡ଼ିଆ' },
  { value: 'as', label: 'অসমীয়া' },
  { value: 'sa', label: 'संस्कृतम्' },
  { value: 'my', label: 'မြန်မာ' },
  { value: 'lo', label: 'ລາວ' },
  { value: 'km', label: 'ខ្មែរ' },
  { value: 'th', label: 'ไทย' },
  { value: 'vi', label: 'Tiếng Việt' },
  { value: 'id', label: 'Bahasa Indonesia' },
  { value: 'ms', label: 'Bahasa Melayu' },
  { value: 'fil', label: 'Filipino' },
  { value: 'zh', label: '中文' },
  { value: 'zh-CN', label: '简体中文' },
  { value: 'zh-TW', label: '繁體中文' },
  { value: 'ja', label: '日本語' },
  { value: 'ko', label: '한국어' },
  { value: 'mn', label: 'Монгол' },
  { value: 'kk', label: 'Қазақ тілі' },
  { value: 'uz', label: 'Oʻzbekcha' },
  { value: 'tg', label: 'Тоҷикӣ' },
  { value: 'tk', label: 'Türkmençe' },
  { value: 'am', label: 'አማርኛ' },
  { value: 'sw', label: 'Kiswahili' },
  { value: 'zu', label: 'isiZulu' },
  { value: 'xh', label: 'isiXhosa' },
  { value: 'af', label: 'Afrikaans' },
  { value: 'et', label: 'Eesti' },
  { value: 'lv', label: 'Latviešu' },
  { value: 'lt', label: 'Lietuvių' },
  { value: 'fi', label: 'Suomi' },
  { value: 'sv', label: 'Svenska' },
  { value: 'no', label: 'Norsk' },
  { value: 'da', label: 'Dansk' },
  { value: 'is', label: 'Íslenska' },
  { value: 'ga', label: 'Gaeilge' },
  { value: 'cy', label: 'Cymraeg' },
  { value: 'mt', label: 'Malti' },
  { value: 'eo', label: 'Esperanto' }
];

const LANG_NAMES = Object.fromEntries(LANG_OPTIONS.map(o => [o.value, o.label]));

const TRANSLATIONS = {
  ar: {
    toc: 'فهرس المحتويات',
    fontLabel: 'الخط',
    themeLabel: 'المظهر',
    prevChapter: 'الفصل السابق',
    nextChapter: 'الفصل التالي',
    saveSelection: 'حفظ كإشارة',
    myBookmarks: 'إشاراتي المرجعية',
    verifiedTitle: 'مؤلف موثّق',
    ongoingStatus: 'مستمرة',
    finishedStatus: 'منتهية',
    statWords: 'كلمة',
    statChapters: 'فصل',
    statViews: 'مشاهدة',
    statRating: 'التقييم',
    minutesRead: 'دقائق قراءة',
    lessThanMinute: 'أقل من دقيقة',
    emptyBookmarks: 'لا توجد إشارات محفوظة بعد',
    bookmarkSaved: 'تم حفظ الإشارة',
    bookmarkRemoved: 'تم حذف الإشارة',
    undo: 'تراجع',
    copyBlocked: 'تم نسخ النص مع رابط المصدر لحماية حقوق الرواية',
    rightClickBlocked: 'هذا المحتوى محمي',
    devtoolsBlocked: 'أدوات المطوّر غير متاحة هنا',
    langDetected: 'تم اكتشاف لغتك تلقائيًا:',
    resumeReading: 'لديك تقدّم محفوظ في القراءة',
    resumeAction: 'متابعة القراءة',
    themeDay: 'نهار',
    themeNight: 'ليل',
    themeDusk: 'شفق',
    chapterWord: 'الفصل',
    readingTimeCalc: '— دقائق قراءة'
  },
  en: {
    toc: 'Table of Contents',
    fontLabel: 'Font',
    themeLabel: 'Theme',
    prevChapter: 'Previous Chapter',
    nextChapter: 'Next Chapter',
    saveSelection: 'Save as bookmark',
    myBookmarks: 'My Bookmarks',
    verifiedTitle: 'Verified author',
    ongoingStatus: 'Ongoing',
    finishedStatus: 'Completed',
    statWords: 'words',
    statChapters: 'chapters',
    statViews: 'views',
    statRating: 'Rating',
    minutesRead: 'min read',
    lessThanMinute: 'Less than a minute',
    emptyBookmarks: 'No bookmarks saved yet',
    bookmarkSaved: 'Bookmark saved',
    bookmarkRemoved: 'Bookmark removed',
    undo: 'Undo',
    copyBlocked: 'Text copied with a source link, to protect the novel’s rights',
    rightClickBlocked: 'This content is protected',
    devtoolsBlocked: 'Developer tools are unavailable here',
    langDetected: 'Your language was detected automatically:',
    resumeReading: 'You have saved reading progress',
    resumeAction: 'Resume reading',
    themeDay: 'Day',
    themeNight: 'Night',
    themeDusk: 'Dusk',
    chapterWord: 'Chapter',
    readingTimeCalc: '— min read'
  },
  fr: {
    toc: 'Table des matières',
    fontLabel: 'Police',
    themeLabel: 'Thème',
    prevChapter: 'Chapitre précédent',
    nextChapter: 'Chapitre suivant',
    saveSelection: 'Enregistrer comme signet',
    myBookmarks: 'Mes signets',
    verifiedTitle: 'Auteur vérifié',
    ongoingStatus: 'En cours',
    finishedStatus: 'Terminé',
    statWords: 'mots',
    statChapters: 'chapitres',
    statViews: 'vues',
    statRating: 'Note',
    minutesRead: 'min de lecture',
    lessThanMinute: 'Moins d’une minute',
    emptyBookmarks: 'Aucun signet enregistré pour le moment',
    bookmarkSaved: 'Signet enregistré',
    bookmarkRemoved: 'Signet supprimé',
    undo: 'Annuler',
    copyBlocked: 'Texte copié avec un lien source, pour protéger les droits du roman',
    rightClickBlocked: 'Ce contenu est protégé',
    devtoolsBlocked: 'Les outils de développement sont indisponibles ici',
    langDetected: 'Votre langue a été détectée automatiquement :',
    resumeReading: 'Vous avez une progression enregistrée',
    resumeAction: 'Reprendre la lecture',
    themeDay: 'Jour',
    themeNight: 'Nuit',
    themeDusk: 'Crépuscule',
    chapterWord: 'Chapitre',
    readingTimeCalc: '— min de lecture'
  },
  de: {
    toc: 'Inhaltsverzeichnis',
    fontLabel: 'Schrift',
    themeLabel: 'Thema',
    prevChapter: 'Vorheriges Kapitel',
    nextChapter: 'Nächstes Kapitel',
    saveSelection: 'Als Lesezeichen speichern',
    myBookmarks: 'Meine Lesezeichen',
    verifiedTitle: 'Verifizierter Autor',
    ongoingStatus: 'Laufend',
    finishedStatus: 'Abgeschlossen',
    statWords: 'Wörter',
    statChapters: 'Kapitel',
    statViews: 'Aufrufe',
    statRating: 'Bewertung',
    minutesRead: 'Min. Lesezeit',
    lessThanMinute: 'Weniger als eine Minute',
    emptyBookmarks: 'Noch keine Lesezeichen gespeichert',
    bookmarkSaved: 'Lesezeichen gespeichert',
    bookmarkRemoved: 'Lesezeichen entfernt',
    undo: 'Rückgängig',
    copyBlocked: 'Text mit Quellenlink kopiert, zum Schutz der Rechte des Romans',
    rightClickBlocked: 'Dieser Inhalt ist geschützt',
    devtoolsBlocked: 'Entwicklertools sind hier nicht verfügbar',
    langDetected: 'Ihre Sprache wurde automatisch erkannt:',
    resumeReading: 'Du hast einen gespeicherten Lesefortschritt',
    resumeAction: 'Weiterlesen',
    themeDay: 'Tag',
    themeNight: 'Nacht',
    themeDusk: 'Dämmerung',
    chapterWord: 'Kapitel',
    readingTimeCalc: '— Min. Lesezeit'
  },
  es: {
    toc: 'Índice',
    fontLabel: 'Fuente',
    themeLabel: 'Tema',
    prevChapter: 'Capítulo anterior',
    nextChapter: 'Capítulo siguiente',
    saveSelection: 'Guardar como marcador',
    myBookmarks: 'Mis marcadores',
    verifiedTitle: 'Autor verificado',
    ongoingStatus: 'En curso',
    finishedStatus: 'Finalizada',
    statWords: 'palabras',
    statChapters: 'capítulos',
    statViews: 'vistas',
    statRating: 'Valoración',
    minutesRead: 'min de lectura',
    lessThanMinute: 'Menos de un minuto',
    emptyBookmarks: 'Aún no hay marcadores guardados',
    bookmarkSaved: 'Marcador guardado',
    bookmarkRemoved: 'Marcador eliminado',
    undo: 'Deshacer',
    copyBlocked: 'Texto copiado con un enlace de origen, para proteger los derechos de la novela',
    rightClickBlocked: 'Este contenido está protegido',
    devtoolsBlocked: 'Las herramientas de desarrollo no están disponibles aquí',
    langDetected: 'Tu idioma se detectó automáticamente:',
    resumeReading: 'Tienes progreso de lectura guardado',
    resumeAction: 'Continuar leyendo',
    themeDay: 'Día',
    themeNight: 'Noche',
    themeDusk: 'Ocaso',
    chapterWord: 'Capítulo',
    readingTimeCalc: '— min de lectura'
  },
  it: {
    toc: 'Indice',
    fontLabel: 'Carattere',
    themeLabel: 'Tema',
    prevChapter: 'Capitolo precedente',
    nextChapter: 'Capitolo successivo',
    saveSelection: 'Salva come segnalibro',
    myBookmarks: 'I miei segnalibri',
    verifiedTitle: 'Autore verificato',
    ongoingStatus: 'In corso',
    finishedStatus: 'Concluso',
    statWords: 'parole',
    statChapters: 'capitoli',
    statViews: 'visualizzazioni',
    statRating: 'Valutazione',
    minutesRead: 'min di lettura',
    lessThanMinute: 'Meno di un minuto',
    emptyBookmarks: 'Nessun segnalibro salvato ancora',
    bookmarkSaved: 'Segnalibro salvato',
    bookmarkRemoved: 'Segnalibro rimosso',
    undo: 'Annulla',
    copyBlocked: 'Testo copiato con un link alla fonte, per proteggere i diritti del romanzo',
    rightClickBlocked: 'Questo contenuto è protetto',
    devtoolsBlocked: 'Gli strumenti per sviluppatori non sono disponibili qui',
    langDetected: 'La tua lingua è stata rilevata automaticamente:',
    resumeReading: 'Hai dei progressi di lettura salvati',
    resumeAction: 'Riprendi lettura',
    themeDay: 'Giorno',
    themeNight: 'Notte',
    themeDusk: 'Crepuscolo',
    chapterWord: 'Capitolo',
    readingTimeCalc: '— min di lettura'
  },
  ja: {
    toc: '目次',
    fontLabel: 'フォント',
    themeLabel: 'テーマ',
    prevChapter: '前の章',
    nextChapter: '次の章',
    saveSelection: 'しおりに保存',
    myBookmarks: 'マイしおり',
    verifiedTitle: '認証済み作者',
    ongoingStatus: '連載中',
    finishedStatus: '完結',
    statWords: '語',
    statChapters: '章',
    statViews: '閲覧数',
    statRating: '評価',
    minutesRead: '分で読める',
    lessThanMinute: '1分未満',
    emptyBookmarks: '保存されたしおりはまだありません',
    bookmarkSaved: 'しおりを保存しました',
    bookmarkRemoved: 'しおりを削除しました',
    undo: '元に戻す',
    copyBlocked: '著作権保護のため、出典リンク付きでコピーされました',
    rightClickBlocked: 'このコンテンツは保護されています',
    devtoolsBlocked: 'ここでは開発者ツールを使用できません',
    langDetected: '言語を自動検出しました:',
    resumeReading: '保存された続きがあります',
    resumeAction: '続きを読む',
    themeDay: '昼',
    themeNight: '夜',
    themeDusk: '黄昏',
    chapterWord: '第',
    readingTimeCalc: '— 分で読める'
  },
  ko: {
    toc: '목차',
    fontLabel: '글꼴',
    themeLabel: '테마',
    prevChapter: '이전 화',
    nextChapter: '다음 화',
    saveSelection: '북마크로 저장',
    myBookmarks: '내 북마크',
    verifiedTitle: '인증된 작가',
    ongoingStatus: '연재 중',
    finishedStatus: '완결',
    statWords: '단어',
    statChapters: '화',
    statViews: '조회수',
    statRating: '평점',
    minutesRead: '분 소요',
    lessThanMinute: '1분 미만',
    emptyBookmarks: '저장된 북마크가 아직 없습니다',
    bookmarkSaved: '북마크가 저장되었습니다',
    bookmarkRemoved: '북마크가 삭제되었습니다',
    undo: '실행 취소',
    copyBlocked: '소설 저작권 보호를 위해 출처 링크와 함께 복사되었습니다',
    rightClickBlocked: '이 콘텐츠는 보호되어 있습니다',
    devtoolsBlocked: '여기서는 개발자 도구를 사용할 수 없습니다',
    langDetected: '언어가 자동으로 감지되었습니다:',
    resumeReading: '저장된 읽기 진행 상황이 있습니다',
    resumeAction: '이어서 읽기',
    themeDay: '낮',
    themeNight: '밤',
    themeDusk: '황혼',
    chapterWord: '화',
    readingTimeCalc: '— 분 소요'
  },
  ru: {
    toc: 'Оглавление',
    fontLabel: 'Шрифт',
    themeLabel: 'Тема',
    prevChapter: 'Предыдущая глава',
    nextChapter: 'Следующая глава',
    saveSelection: 'Сохранить как закладку',
    myBookmarks: 'Мои закладки',
    verifiedTitle: 'Проверенный автор',
    ongoingStatus: 'Продолжается',
    finishedStatus: 'Завершено',
    statWords: 'слов',
    statChapters: 'глав',
    statViews: 'просмотров',
    statRating: 'Рейтинг',
    minutesRead: 'мин. чтения',
    lessThanMinute: 'Меньше минуты',
    emptyBookmarks: 'Пока нет сохранённых закладок',
    bookmarkSaved: 'Закладка сохранена',
    bookmarkRemoved: 'Закладка удалена',
    undo: 'Отменить',
    copyBlocked: 'Текст скопирован со ссылкой на источник для защиты прав романа',
    rightClickBlocked: 'Этот контент защищён',
    devtoolsBlocked: 'Инструменты разработчика здесь недоступны',
    langDetected: 'Ваш язык определён автоматически:',
    resumeReading: 'У вас есть сохранённый прогресс чтения',
    resumeAction: 'Продолжить чтение',
    themeDay: 'День',
    themeNight: 'Ночь',
    themeDusk: 'Сумерки',
    chapterWord: 'Глава',
    readingTimeCalc: '— мин. чтения'
  },
  tr: {
    toc: 'İçindekiler',
    fontLabel: 'Yazı Tipi',
    themeLabel: 'Tema',
    prevChapter: 'Önceki Bölüm',
    nextChapter: 'Sonraki Bölüm',
    saveSelection: 'Yer imi olarak kaydet',
    myBookmarks: 'Yer İmlerim',
    verifiedTitle: 'Onaylı yazar',
    ongoingStatus: 'Devam ediyor',
    finishedStatus: 'Tamamlandı',
    statWords: 'kelime',
    statChapters: 'bölüm',
    statViews: 'görüntülenme',
    statRating: 'Puan',
    minutesRead: 'dk okuma',
    lessThanMinute: 'Bir dakikadan az',
    emptyBookmarks: 'Henüz kaydedilmiş yer imi yok',
    bookmarkSaved: 'Yer imi kaydedildi',
    bookmarkRemoved: 'Yer imi silindi',
    undo: 'Geri al',
    copyBlocked: 'Roman haklarını korumak için metin kaynak bağlantısıyla kopyalandı',
    rightClickBlocked: 'Bu içerik korunmaktadır',
    devtoolsBlocked: 'Geliştirici araçları burada kullanılamaz',
    langDetected: 'Diliniz otomatik olarak algılandı:',
    resumeReading: 'Kaydedilmiş okuma ilerlemeniz var',
    resumeAction: 'Okumaya devam et',
    themeDay: 'Gündüz',
    themeNight: 'Gece',
    themeDusk: 'Alacakaranlık',
    chapterWord: 'Bölüm',
    readingTimeCalc: '— dk okuma'
  },
  pt: {
    toc: 'Índice',
    fontLabel: 'Fonte',
    themeLabel: 'Tema',
    prevChapter: 'Capítulo anterior',
    nextChapter: 'Próximo capítulo',
    saveSelection: 'Salvar como marcador',
    myBookmarks: 'Meus marcadores',
    verifiedTitle: 'Autor verificado',
    ongoingStatus: 'Em andamento',
    finishedStatus: 'Concluído',
    statWords: 'palavras',
    statChapters: 'capítulos',
    statViews: 'visualizações',
    statRating: 'Avaliação',
    minutesRead: 'min de leitura',
    lessThanMinute: 'Menos de um minuto',
    emptyBookmarks: 'Ainda não há marcadores salvos',
    bookmarkSaved: 'Marcador salvo',
    bookmarkRemoved: 'Marcador removido',
    undo: 'Desfazer',
    copyBlocked: 'Texto copiado com um link de origem, para proteger os direitos do romance',
    rightClickBlocked: 'Este conteúdo é protegido',
    devtoolsBlocked: 'As ferramentas de desenvolvedor não estão disponíveis aqui',
    langDetected: 'Seu idioma foi detectado automaticamente:',
    resumeReading: 'Você tem progresso de leitura salvo',
    resumeAction: 'Continuar lendo',
    themeDay: 'Dia',
    themeNight: 'Noite',
    themeDusk: 'Crepúsculo',
    chapterWord: 'Capítulo',
    readingTimeCalc: '— min de leitura'
  }
};

function t(key, lang) {
  const dict = TRANSLATIONS[lang] || TRANSLATIONS.en;
  return dict[key] || TRANSLATIONS.en[key] || key;
}

/* ---------- الحالة ---------- */
const state = {
  chapterIndex: 0,
  lang: 'en',
  langIsAuto: true,
  bookmarks: [],
  translationCache: {},
  currentTexts: [],
  lastRemovedBookmark: null
};

/* ---------- أدوات ---------- */
function $(id) {
  return document.getElementById(id);
}

function storageGet(key, fallback) {
  try {
    const v = localStorage.getItem(key);
    return v === null ? fallback : JSON.parse(v);
  } catch (e) {
    return fallback;
  }
}

function storageSet(key, val) {
  try {
    localStorage.setItem(key, JSON.stringify(val));
  } catch (e) {}
}

function countWords(text) {
  return (String(text).match(/[\p{L}\p{N}]+/gu) || []).length;
}

function escapeHtml(str) {
  return String(str).replace(/[&<>"']/g, s => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;'
  }[s]));
}

function chunkArray(arr, size) {
  const out = [];
  for (let i = 0; i < arr.length; i += size) out.push(arr.slice(i, i + size));
  return out;
}

function svgIcon(path, opts = {}) {
  return '<svg viewBox="0 0 24 24" fill="' + (opts.fill || 'none') + '" stroke="currentColor" stroke-width="' + (opts.sw || 1.75) + '" stroke-linecap="round" stroke-linejoin="round">' + path + '</svg>';
}

const ICONS = {
  words: svgIcon('<path d="M6 4h9l3 3v13H6z"/><path d="M9 9h6M9 13h6M9 17h4"/>'),
  chapters: svgIcon('<path d="M4 6a2 2 0 012-2h9v16H6a2 2 0 01-2-2V6z"/><path d="M15 4h3a2 2 0 012 2v14l-2-1.3-2 1.3V4z"/>'),
  eye: svgIcon('<path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7-10-7-10-7z"/><circle cx="12" cy="12" r="3"/>'),
  star: svgIcon('<path d="M12 3l2.6 5.6 6.1.6-4.6 4.1 1.3 6-5.4-3.2L6.6 19.3l1.3-6-4.6-4.1 6.1-.6z"/>', { fill: 'currentColor' }),
  starOutline: svgIcon('<path d="M12 3l2.6 5.6 6.1.6-4.6 4.1 1.3 6-5.4-3.2L6.6 19.3l1.3-6-4.6-4.1 6.1-.6z"/>'),
  bookmark: svgIcon('<path d="M6 4h12v17l-6-4-6 4V4z"/>'),
  bookmarkFilled: svgIcon('<path d="M6 4h12v17l-6-4-6 4V4z"/>', { fill: 'currentColor' }),
  trash: svgIcon('<path d="M4 7h16M9 7V4h6v3M6 7l1 13h10l1-13"/>'),
  chevron: svgIcon('<path d="M9 6l6 6-6 6"/>'),
  lock: svgIcon('<rect x="5" y="11" width="14" height="9" rx="2"/><path d="M8 11V7a4 4 0 018 0v4"/>'),
  check: svgIcon('<path d="M20 6L9 17l-5-5"/>')
};

/* ---------- Toast ---------- */
function showToast(message, opts = {}) {
  const stack = $('toastStack');
  if (!stack) return;

  const el = document.createElement('div');
  el.className = 'toast';
  el.innerHTML =
    (opts.icon || ICONS.lock) +
    '<span>' + escapeHtml(message) + '</span>' +
    (opts.actionLabel ? '<button class="toast-action">' + escapeHtml(opts.actionLabel) + '</button>' : '');

  stack.appendChild(el);
  requestAnimationFrame(() => el.classList.add('show'));

  let removed = false;
  const remove = () => {
    if (removed) return;
    removed = true;
    el.classList.remove('show');
    setTimeout(() => el.remove(), 300);
  };

  if (opts.actionLabel) {
    const actionBtn = el.querySelector('.toast-action');
    if (actionBtn) {
      actionBtn.addEventListener('click', () => {
        if (typeof opts.onAction === 'function') opts.onAction();
        remove();
      });
    }
  }

  setTimeout(remove, opts.timeout || 4200);
}

/* ============================================================
   الترجمة
   ============================================================ */
function applyStaticTranslations(lang) {
  document.querySelectorAll('[data-i18n]').forEach(el => {
    const key = el.getAttribute('data-i18n');
    const val = t(key, lang);
    if (val) el.textContent = val;
  });

  document.querySelectorAll('[data-i18n-title]').forEach(el => {
    const key = el.getAttribute('data-i18n-title');
    el.setAttribute('title', t(key, lang));
  });
}

async function translateText(text, targetLang) {
  const url =
    CONFIG.translateEndpoint +
    '?client=gtx&sl=ar&tl=' +
    encodeURIComponent(targetLang) +
    '&dt=t&q=' +
    encodeURIComponent(text);

  const res = await fetch(url);
  if (!res.ok) throw new Error('translate-http-' + res.status);

  const data = await res.json();
  return data[0].map(chunk => chunk[0]).join('');
}

async function translateStrings(strings, lang) {
  if (!strings.length) return strings;
  try {
    const joined = strings.join(SEP);
    const translated = await translateText(joined, lang);
    const parts = translated.split(SEP);
    if (parts.length === strings.length) return parts;
    return strings;
  } catch (e) {
    return strings;
  }
}

async function detectLanguage() {
  const saved = storageGet(CONFIG.storageKeys.lang, 'auto');

  if (saved !== 'auto') {
    return { lang: saved, isAuto: false };
  }

  return { lang: 'en', isAuto: true };
}

function setDirForLang(lang) {
  const dir = RTL_LANGS.includes(lang) ? 'rtl' : 'ltr';
  document.documentElement.setAttribute('dir', dir);
  document.documentElement.setAttribute('lang', lang);
}

function chapterTitle(ch) {
  return (ch._t && ch._t[state.lang]) || ch.title;
}

async function translateChapterTitles(lang) {
  if (lang === 'ar') return;

  const need = NOVEL.chapters.filter(c => !(c._t && c._t[lang]));
  if (!need.length) return;

  const chunks = chunkArray(need, CONFIG.titleTranslateChunkSize);
  for (const chunk of chunks) {
    try {
      const translated = await translateStrings(chunk.map(c => c.title), lang);
      chunk.forEach((c, i) => {
        c._t = c._t || {};
        c._t[lang] = translated[i];
      });
    } catch (e) {}
  }
}

async function applyLanguage(lang, isAuto, announce) {
  state.lang = lang;
  state.langIsAuto = !!isAuto;

  setDirForLang(lang);
  applyStaticTranslations(lang);
  updateLangTriggerLabel();
  renderStatsBar();
  renderStatusBadge();
  renderSynopsis();

  if (lang !== 'ar') {
    await translateChapterTitles(lang);
  }

  buildSidebar();
  renderBookmarksList();
  renderChapterEyebrow();
  updateReadingTimeDisplay();

  if (announce && lang !== 'ar') {
    showToast(t('langDetected', lang) + ' ' + (LANG_NAMES[lang] || lang));
  }

  if (lang !== 'ar' && CONFIG.enableBodyTranslation) {
    translateChapterBody(lang);
  } else {
    renderChapterTexts(getCurrentChapter());
  }
}

function updateLangTriggerLabel() {
  $('langTriggerLabel').textContent = state.langIsAuto
    ? (LANG_NAMES.auto || 'English')
    : (LANG_NAMES[state.lang] || state.lang);
}

async function translateChapterBody(lang) {
  const chapter = getCurrentChapter();
  if (!chapter) return;

  $('chapterTitle').textContent = chapterTitle(chapter);

  const bodyEl = $('chapterBody');
  const cacheKey = chapter.id + '::body::' + lang;

  if (state.translationCache[cacheKey]) {
    paintChapterTexts(state.translationCache[cacheKey]);
    return;
  }

  bodyEl.style.opacity = '.55';

  try {
    const translatedTexts = await translateStrings(state.currentTexts, lang);
    state.translationCache[cacheKey] = translatedTexts;
    paintChapterTexts(translatedTexts);
  } catch (e) {}
  bodyEl.style.opacity = '';
}

function paintChapterTexts(texts) {
  const nodes = document.querySelectorAll('#chapterBody [data-tidx]');
  nodes.forEach(node => {
    const idx = +node.getAttribute('data-tidx');
    if (texts[idx] !== undefined) node.textContent = texts[idx];
  });
}

/* ============================================================
   عرض الفصول
   ============================================================ */
function getCurrentChapter() {
  return NOVEL.chapters[state.chapterIndex];
}

function assignChapterIds() {
  NOVEL.chapters.forEach((ch, i) => {
    if (ch.id === undefined || ch.id === null) ch.id = i + 1;
  });
}

function computeGlobalWordCount() {
  let total = 0;
  NOVEL.chapters.forEach(ch => {
    ch.paragraphs.forEach(p => {
      total += countWords(typeof p === 'string' ? p : p.h2);
    });
  });
  return total;
}

function renderChapterTexts(chapter) {
  if (!chapter) return;

  $('chapterTitle').textContent = chapter.title;

  const bodyEl = $('chapterBody');
  bodyEl.innerHTML = '';
  const texts = [];

  chapter.paragraphs.forEach((p, i) => {
    if (typeof p === 'object' && p.h2) {
      const h2 = document.createElement('h2');
      h2.setAttribute('data-tidx', texts.length);
      h2.textContent = p.h2;
      texts.push(p.h2);
      bodyEl.appendChild(h2);
    } else {
      const wrap = document.createElement('div');
      wrap.className = 'p-wrap';
      wrap.setAttribute('data-pid', chapter.id + '-' + i);

      const para = document.createElement('p');
      para.setAttribute('data-tidx', texts.length);
      para.textContent = p;
      texts.push(p);

      const btn = document.createElement('button');
      btn.className = 'p-bookmark';
      btn.setAttribute('aria-label', 'حفظ الفقرة كإشارة');
      btn.setAttribute('aria-pressed', 'false');
      btn.innerHTML = ICONS.bookmark;
      btn.addEventListener('click', () => toggleParagraphBookmark(chapter, i, p, wrap, btn));

      wrap.appendChild(btn);
      wrap.appendChild(para);
      bodyEl.appendChild(wrap);
    }
  });

  state.currentTexts = texts;
  markSavedParagraphs(chapter);
}

function markSavedParagraphs(chapter) {
  document.querySelectorAll('#chapterBody .p-wrap').forEach(wrap => {
    const pid = wrap.getAttribute('data-pid');
    const btn = wrap.querySelector('.p-bookmark');
    if (!btn) return;

    const saved = state.bookmarks.some(b => b.pid === pid && b.type === 'paragraph');
    btn.classList.toggle('saved', saved);
    btn.setAttribute('aria-pressed', saved ? 'true' : 'false');
    btn.innerHTML = saved ? ICONS.bookmarkFilled : ICONS.bookmark;
  });
}

function updateReadingTimeDisplay() {
  const chapter = getCurrentChapter();
  if (!chapter) return;

  const words = chapter.paragraphs.reduce((sum, p) => sum + countWords(typeof p === 'string' ? p : p.h2), 0);
  const avgWpm = (CONFIG.wpmMin + CONFIG.wpmMax) / 2;
  const minutes = Math.round(words / avgWpm);
  const label = minutes < 1 ? t('lessThanMinute', state.lang) : (minutes + ' ' + t('minutesRead', state.lang));
  $('readingTimeText').textContent = label;
}

function renderChapterEyebrow() {
  const total = NOVEL.chapters.length;
  $('chapterEyebrow').textContent = t('chapterWord', state.lang) + ' ' + (state.chapterIndex + 1) + ' / ' + total;
}

function renderChapterNav() {
  $('prevBtn').disabled = state.chapterIndex === 0;
  $('nextBtn').disabled = state.chapterIndex === NOVEL.chapters.length - 1;
}

function renderChapter(c, opts = {}) {
  state.chapterIndex = c;
  const chapter = getCurrentChapter();
  if (!chapter) return;

  renderChapterEyebrow();
  renderChapterTexts(chapter);
  renderChapterNav();
  updateReadingTimeDisplay();
  document.title = chapter.title + ' — for lunch time';
  storageSet(CONFIG.storageKeys.progress, c);
  updateActiveSidebarLink();

  if (state.lang !== 'ar' && CONFIG.enableBodyTranslation) {
    translateChapterBody(state.lang);
  }

  if (!opts.silentScroll) {
    const target = $('readerPage');
    const top = target.getBoundingClientRect().top + window.scrollY - 90;
    window.scrollTo({ top, behavior: opts.jump ? 'smooth' : 'auto' });
  }

  requestAnimationFrame(updateProgressBeam);
}

function goNext() {
  if (state.chapterIndex < NOVEL.chapters.length - 1) renderChapter(state.chapterIndex + 1);
}

function goPrev() {
  if (state.chapterIndex > 0) renderChapter(state.chapterIndex - 1);
}

/* ============================================================
   الفهرس
   ============================================================ */
function buildSidebar() {
  const list = $('chapterList');
  list.innerHTML = '';

  NOVEL.chapters.forEach((ch, ci) => {
    const link = document.createElement('button');
    link.className = 'chapter-link' + (ci === state.chapterIndex ? ' active' : '');
    link.setAttribute('data-idx', ci);
    link.innerHTML = '<span class="num">' + (ci + 1) + '</span><span></span>';
    link.querySelector('span:last-child').textContent = chapterTitle(ch);

    link.addEventListener('click', () => {
      renderChapter(ci, { jump: true });
      closeSidebar();
    });

    list.appendChild(link);
  });
}

function updateActiveSidebarLink() {
  document.querySelectorAll('.chapter-link').forEach(link => {
    link.classList.toggle('active', +link.getAttribute('data-idx') === state.chapterIndex);
  });
}

function openSidebar() {
  $('sidebar').classList.add('open');
  $('sidebarOverlay').classList.add('show');
}

function closeSidebar() {
  $('sidebar').classList.remove('open');
  $('sidebarOverlay').classList.remove('show');
}

/* ============================================================
   الإحصاءات وشارة الحالة
   ============================================================ */
function renderStarRating(ratingOutOf10) {
  const pct = Math.max(0, Math.min(100, (ratingOutOf10 / 10) * 100));
  return (
    '<span class="stars" style="position:relative;display:inline-flex;">' +
      '<span style="display:flex;gap:2px;opacity:.3;">' + Array(5).fill('<i style="width:15px;height:15px;display:inline-flex">' + ICONS.star + '</i>').join('') + '</span>' +
      '<span style="position:absolute;inset:0;overflow:hidden;width:' + pct + '%;display:flex;gap:2px;color:var(--sky);">' + Array(5).fill('<i style="width:15px;height:15px;display:inline-flex">' + ICONS.star + '</i>').join('') + '</span>' +
    '</span>'
  );
}

function renderStatsBar() {
  const words = computeGlobalWordCount();
  const bar = $('statsBar');

  bar.innerHTML =
    statItem(ICONS.words, words.toLocaleString(state.lang === 'ar' ? 'ar' : state.lang), t('statWords', state.lang)) +
    statItem(ICONS.chapters, NOVEL.chapters.length, t('statChapters', state.lang)) +
    statItem(ICONS.eye, (NOVEL.views || 0).toLocaleString(state.lang === 'ar' ? 'ar' : state.lang), t('statViews', state.lang)) +
    '<div class="stat-item"><span style="color:var(--sky);display:flex">' + ICONS.starOutline + '</span><div class="stat-text"><span class="stat-value">' + (NOVEL.rating || 0).toFixed(1) + '/10</span>' + renderStarRating(NOVEL.rating || 0) + '</div></div>';
}

function statItem(icon, value, label) {
  return '<div class="stat-item">' + icon + '<div class="stat-text"><span class="stat-value">' + value + '</span><span class="stat-label">' + label + '</span></div></div>';
}

function renderStatusBadge() {
  const badge = $('statusBadge');
  const isOngoing = NOVEL.status === 'ongoing';

  badge.classList.toggle('ongoing', isOngoing);
  badge.classList.toggle('finished', !isOngoing);
  $('statusText').textContent = isOngoing ? t('ongoingStatus', state.lang) : t('finishedStatus', state.lang);
}

function renderSynopsis() {
  const el = $('novelSynopsis');
  if (NOVEL.synopsis) {
    el.textContent = NOVEL.synopsis;
    el.style.display = '';
  } else {
    el.style.display = 'none';
  }
}

function renderHeroStatic() {
  $('novelTitle').textContent = NOVEL.title;
  $('novelAuthor').textContent = NOVEL.author;

  if (NOVEL.coverImage) {
    $('coverFrame').innerHTML = '<img src="' + NOVEL.coverImage + '" alt="' + escapeHtml(NOVEL.title) + '" draggable="false">';
  }
}

/* ============================================================
   شريط التقدم
   ============================================================ */
let beamTicking = false;

function updateProgressBeam() {
  const doc = document.documentElement;
  const scrollable = doc.scrollHeight - doc.clientHeight;
  const pct = scrollable > 0 ? (window.scrollY / scrollable) * 100 : 0;
  const clamped = Math.min(100, Math.max(0, pct));

  $('progressBeam').style.width = clamped + '%';
  $('progressBeam').setAttribute('aria-valuenow', Math.round(clamped));
  beamTicking = false;
}

function onScroll() {
  if (!beamTicking) {
    requestAnimationFrame(updateProgressBeam);
    beamTicking = true;
  }
}

/* ============================================================
   الإشارات المرجعية
   ============================================================ */
function loadBookmarks() {
  state.bookmarks = storageGet(CONFIG.storageKeys.bookmarks, []);
}

function persistBookmarks() {
  storageSet(CONFIG.storageKeys.bookmarks, state.bookmarks);
  updateBookmarksBadge();
}

function updateBookmarksBadge() {
  const el = $('bmCount');
  const n = state.bookmarks.length;
  el.textContent = n;
  el.classList.toggle('show', n > 0);
}

function addBookmark(bm) {
  bm.id = Date.now() + '-' + Math.random().toString(36).slice(2, 7);
  bm.savedAt = new Date().toISOString();
  state.bookmarks.unshift(bm);
  persistBookmarks();
  renderBookmarksList();
  showToast(t('bookmarkSaved', state.lang), { icon: ICONS.bookmarkFilled });
}

function removeBookmark(id) {
  const idx = state.bookmarks.findIndex(b => b.id === id);
  if (idx === -1) return;

  state.lastRemovedBookmark = { item: state.bookmarks[idx], index: idx };
  state.bookmarks.splice(idx, 1);
  persistBookmarks();
  renderBookmarksList();

  showToast(t('bookmarkRemoved', state.lang), {
    icon: ICONS.trash,
    actionLabel: t('undo', state.lang),
    onAction: () => {
      if (state.lastRemovedBookmark) {
        state.bookmarks.splice(state.lastRemovedBookmark.index, 0, state.lastRemovedBookmark.item);
        persistBookmarks();
        renderBookmarksList();
      }
    }
  });

  markSavedParagraphs(getCurrentChapter());
}

function toggleParagraphBookmark(chapter, i, text) {
  const pid = chapter.id + '-' + i;
  const existing = state.bookmarks.find(b => b.pid === pid && b.type === 'paragraph');

  if (existing) {
    removeBookmark(existing.id);
    return;
  }

  addBookmark({
    type: 'paragraph',
    pid,
    chapterIndex: state.chapterIndex,
    chapterTitle: chapter.title,
    excerpt: text.slice(0, 140) + (text.length > 140 ? '…' : '')
  });

  markSavedParagraphs(chapter);
}

function renderBookmarksList() {
  const list = $('bookmarksList');
  list.innerHTML = '';

  if (!state.bookmarks.length) {
    list.innerHTML = '<div class="empty-state">' + ICONS.bookmark + '<p>' + t('emptyBookmarks', state.lang) + '</p></div>';
    return;
  }

  state.bookmarks.forEach(bm => {
    const card = document.createElement('div');
    card.className = 'bookmark-card';

    const date = new Date(bm.savedAt);
    const dateStr =
      date.toLocaleDateString(state.lang === 'ar' ? 'ar' : state.lang, { day: 'numeric', month: 'short' }) +
      ' · ' +
      date.toLocaleTimeString(state.lang === 'ar' ? 'ar' : state.lang, { hour: '2-digit', minute: '2-digit' });

    card.innerHTML =
      '<div class="bm-top"><div><div class="bm-chapter"></div><div class="bm-excerpt"></div></div>' +
      '<button class="bm-delete" aria-label="حذف">' + ICONS.trash + '</button></div>' +
      '<div class="bm-date">' + dateStr + '</div>';

    card.querySelector('.bm-chapter').textContent = bm.chapterTitle;
    card.querySelector('.bm-excerpt').textContent = bm.excerpt;

    card.querySelector('.bm-delete').addEventListener('click', (e) => {
      e.stopPropagation();
      removeBookmark(bm.id);
    });

    card.addEventListener('click', () => jumpToBookmark(bm));
    list.appendChild(card);
  });
}

function jumpToBookmark(bm) {
  const needsNav = state.chapterIndex !== bm.chapterIndex;
  if (needsNav) renderChapter(bm.chapterIndex, { silentScroll: true });

  closeDrawer();

  setTimeout(() => {
    const el = document.querySelector('[data-pid="' + bm.pid + '"]');
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'center' });
      el.classList.add('flash');
      setTimeout(() => el.classList.remove('flash'), 1600);
    }
  }, needsNav ? 200 : 60);
}

function openDrawer() {
  $('bookmarksDrawer').classList.add('open');
  $('drawerOverlay').classList.add('show');
}

function closeDrawer() {
  $('bookmarksDrawer').classList.remove('open');
  $('drawerOverlay').classList.remove('show');
}

/* زر الحفظ العائم عند تحديد النص */
function initSelectionBookmark() {
  const btn = $('selectionBookmarkBtn');
  let pendingRange = null;

  function handleSelection() {
    const sel = window.getSelection();

    if (!sel || sel.isCollapsed || !sel.toString().trim()) {
      btn.classList.remove('show');
      return;
    }

    const anchor = sel.anchorNode;
    const wrap = anchor && anchor.nodeType === 3
      ? anchor.parentElement.closest('.p-wrap')
      : (anchor && anchor.closest && anchor.closest('.p-wrap'));

    if (!wrap) {
      btn.classList.remove('show');
      return;
    }

    pendingRange = {
      text: sel.toString().trim(),
      pid: wrap.getAttribute('data-pid')
    };

    const rect = sel.getRangeAt(0).getBoundingClientRect();
    btn.style.top = Math.max(10, rect.top - 46) + 'px';
    btn.style.left = Math.max(10, rect.left + rect.width / 2 - 70) + 'px';
    btn.classList.add('show');
  }

  document.addEventListener('mouseup', handleSelection);
  document.addEventListener('touchend', handleSelection);

  btn.addEventListener('click', () => {
    if (!pendingRange) return;

    const chapter = getCurrentChapter();
    addBookmark({
      type: 'excerpt',
      pid: pendingRange.pid,
      chapterIndex: state.chapterIndex,
      chapterTitle: chapter.title,
      excerpt: pendingRange.text.slice(0, 160) + (pendingRange.text.length > 160 ? '…' : '')
    });

    btn.classList.remove('show');
    window.getSelection().removeAllRanges();
  });

  document.addEventListener('scroll', () => btn.classList.remove('show'), { passive: true });
}

/* ============================================================
   الحماية من النسخ
   ============================================================ */
function initAntiCopy() {
  document.addEventListener('contextmenu', e => {
    e.preventDefault();
    showToast(t('rightClickBlocked', state.lang));
  });

  document.addEventListener('copy', e => {
    const sel = window.getSelection().toString();
    if (!sel) return;

    e.preventDefault();
    const watermark = '\n\n— for lunch time: ' + NOVEL.title + ' — ' + location.href;
    e.clipboardData.setData('text/plain', sel + watermark);
    showToast(t('copyBlocked', state.lang));
  });

  document.addEventListener('keydown', e => {
    const k = e.key.toLowerCase();

    if ((e.ctrlKey || e.metaKey) && (k === 's' || k === 'u')) {
      e.preventDefault();
      showToast(t('rightClickBlocked', state.lang));
    }

    if (
      k === 'f12' ||
      ((e.ctrlKey || e.metaKey) && e.shiftKey && (k === 'i' || k === 'j' || k === 'c'))
    ) {
      e.preventDefault();
      showToast(t('devtoolsBlocked', state.lang));
    }
  });

  document.addEventListener('dragstart', e => {
    if (e.target.tagName === 'IMG') e.preventDefault();
  });
}

/* ============================================================
   لوحات التحكم
   ============================================================ */
function buildControlPanel(containerId, options, currentGetter, onSelect) {
  const panel = $(containerId);
  panel.innerHTML = '';

  options.forEach(opt => {
    const row = document.createElement('div');
    row.className = 'control-option' + (currentGetter() === opt.value ? ' active' : '');
    row.innerHTML = '<span>' + opt.label + '</span><span class="dot"></span>';
    row.addEventListener('click', () => onSelect(opt.value));
    panel.appendChild(row);
  });
}

function initDropdowns() {
  const groups = ['langControl', 'fontControl', 'themeControl'];

  groups.forEach(id => {
    const group = $(id);
    const trigger = group.querySelector('.control-trigger');

    trigger.addEventListener('click', (e) => {
      e.stopPropagation();
      const willOpen = !group.classList.contains('open');
      groups.forEach(g => $(g).classList.remove('open'));
      if (willOpen) group.classList.add('open');
    });
  });

  document.addEventListener('click', () => groups.forEach(g => $(g).classList.remove('open')));
  document.addEventListener('keydown', e => {
    if (e.key === 'Escape') groups.forEach(g => $(g).classList.remove('open'));
  });
}

function initLangPanel() {
  buildControlPanel('langPanel', LANG_OPTIONS, () => (state.langIsAuto ? 'auto' : state.lang), async (value) => {
    storageSet(CONFIG.storageKeys.lang, value);

    if (value === 'auto') {
      const { lang } = await detectLanguage(); // always en
      await applyLanguage(lang, true, false);
    } else {
      await applyLanguage(value, false, false);
    }

    initLangPanel();
    $('langControl').classList.remove('open');
  });
}

function initFontPanel() {
  const options = [
    { value: 'naskh', label: 'Noto Naskh' },
    { value: 'cairo', label: 'Cairo' },
    { value: 'tajawal', label: 'Tajawal' }
  ];

  buildControlPanel('fontPanel', options, () => document.documentElement.getAttribute('data-font'), (value) => {
    document.documentElement.setAttribute('data-font', value);
    storageSet(CONFIG.storageKeys.font, value);
    initFontPanel();
    $('fontControl').classList.remove('open');
  });
}

function initThemePanel() {
  const options = [
    { value: 'day', label: t('themeDay', state.lang) },
    { value: 'night', label: t('themeNight', state.lang) },
    { value: 'dusk', label: t('themeDusk', state.lang) }
  ];

  buildControlPanel('themePanel', options, () => document.documentElement.getAttribute('data-theme'), (value) => {
    document.documentElement.setAttribute('data-theme', value);
    storageSet(CONFIG.storageKeys.theme, value);
    initThemePanel();
    $('themeControl').classList.remove('open');
  });
}

/* ============================================================
   التنقل بلوحة المفاتيح
   ============================================================ */
function initKeyboardNav() {
  document.addEventListener('keydown', e => {
    const tag = (e.target.tagName || '').toLowerCase();
    if (tag === 'input' || tag === 'textarea') return;

    const dir = document.documentElement.getAttribute('dir');
    const forwardKey = dir === 'rtl' ? 'ArrowLeft' : 'ArrowRight';
    const backwardKey = dir === 'rtl' ? 'ArrowRight' : 'ArrowLeft';

    if (e.key === forwardKey) goNext();
    else if (e.key === backwardKey) goPrev();
  });
}

/* ============================================================
   التهيئة
   ============================================================ */
function initToggles() {
  $('menuToggle').addEventListener('click', openSidebar);
  $('sidebarClose').addEventListener('click', closeSidebar);
  $('sidebarOverlay').addEventListener('click', closeSidebar);
  $('bookmarksToggle').addEventListener('click', openDrawer);
  $('drawerClose').addEventListener('click', closeDrawer);
  $('drawerOverlay').addEventListener('click', closeDrawer);
  $('tocMidBtn').addEventListener('click', openSidebar);
  $('prevBtn').addEventListener('click', goPrev);
  $('nextBtn').addEventListener('click', goNext);
}

function restoreThemeAndFont() {
  const theme = storageGet(CONFIG.storageKeys.theme, 'night');
  const font = storageGet(CONFIG.storageKeys.font, 'naskh');
  document.documentElement.setAttribute('data-theme', theme);
  document.documentElement.setAttribute('data-font', font);
}

function maybeOfferResume() {
  const saved = storageGet(CONFIG.storageKeys.progress, null);
  if (typeof saved === 'number' && saved !== 0) {
    showToast(t('resumeReading', state.lang), {
      actionLabel: t('resumeAction', state.lang),
      onAction: () => renderChapter(saved, { jump: true }),
      timeout: 7000
    });
  }
}

async function init() {
  if (typeof NOVEL === 'undefined') {
    console.error('NOVEL object is missing. Make sure novel-data.js is loaded.');
    return;
  }

  assignChapterIds();
  restoreThemeAndFont();
  loadBookmarks();

  renderHeroStatic();
  initToggles();
  initDropdowns();
  initFontPanel();
  initThemePanel();
  initSelectionBookmark();
  initAntiCopy();
  initKeyboardNav();

  window.addEventListener('scroll', onScroll, { passive: true });
  window.addEventListener('resize', updateProgressBeam);

  renderChapter(0, { silentScroll: true });
  updateBookmarksBadge();

  const { lang, isAuto } = await detectLanguage();
  await applyLanguage(lang, isAuto, isAuto);

  initLangPanel();
  maybeOfferResume();
  updateProgressBeam();
}

document.addEventListener('DOMContentLoaded', init);

})();
