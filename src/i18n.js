// src/i18n.js — çok dilli metinler (TR/EN/DE/BG)
const I18N = {
  tr: {
    labelLang: 'Dil',
    docpip: 'Doc PiP',
    counterTitle: 'Sayaç',
    reset: 'Sıfırla',
    kbHint: 'Klavye: ↑ / ↓ / R / + / −',
    needTopLevel: 'Not: Doc PiP yalnızca top-level sayfada çalışır (GitHub/Netlify gibi).',
    intervalTitle: 'Interval',
    intervalHelp: 'Boş bırakırsan PiP’te gizlenir.',
    intervalHidden: '— PiP’te gizlenecek —',
    intervalPlaceholder: 'ör. Lunch 12:00–12:45',

    // Breaks
    breaksTitle: 'Molalar',
    clearBreaks: 'Molaları Sil',
    durationMins: 'Süre',
    minUnit: 'dk',
    notePlaceholder: 'Not (opsiyonel)',
    editNamePrompt: 'Başlığı yazın',
editMinsPrompt: 'Süre (dakika) yazın',


    // Slot başlıkları
    rest1: 'Dinlenme 1',
    rest2: 'Dinlenme 2',
    lunch: 'Öğle',
    well1: 'Wellness 1',
    well2: 'Wellness 2',
    well3: 'Wellness 3',
    meet15: 'Toplantı (15)',
    meet30: 'Toplantı (30)',
    meet45: 'Toplantı (45)',
    meet60: 'Toplantı (60)',
    custom1: 'Özel 1',
    custom2: 'Özel 2',
  },

  en: {
    labelLang: 'Language',
    docpip: 'Doc PiP',
    counterTitle: 'Counter',
    reset: 'Reset',
    kbHint: 'Keyboard: ↑ / ↓ / R / + / −',
    needTopLevel: 'Note: Doc PiP works only on a top-level page (e.g., GitHub/Netlify).',
    intervalTitle: 'Interval',
    intervalHelp: 'If empty, it stays hidden in PiP.',
    intervalHidden: '— Will be hidden in PiP —',
    intervalPlaceholder: 'e.g., Lunch 12:00–12:45',

    breaksTitle: 'Breaks',
    clearBreaks: 'Clear breaks',
    durationMins: 'Duration',
    minUnit: 'min',
    notePlaceholder: 'Note (optional)',
    editNamePrompt: 'Enter title',
editMinsPrompt: 'Enter duration (minutes)',


    rest1: 'Rest 1',
    rest2: 'Rest 2',
    lunch: 'Lunch',
    well1: 'Wellness 1',
    well2: 'Wellness 2',
    well3: 'Wellness 3',
    meet15: 'Meeting (15)',
    meet30: 'Meeting (30)',
    meet45: 'Meeting (45)',
    meet60: 'Meeting (60)',
    custom1: 'Custom 1',
    custom2: 'Custom 2',
  },

  de: {
    labelLang: 'Sprache',
    docpip: 'Doc PiP',
    counterTitle: 'Zähler',
    reset: 'Zurücksetzen',
    kbHint: 'Tastatur: ↑ / ↓ / R / + / −',
    needTopLevel: 'Hinweis: Doc PiP funktioniert nur auf einer Top-Level-Seite (z.B. GitHub/Netlify).',
    intervalTitle: 'Intervall',
    intervalHelp: 'Wenn leer, bleibt es im PiP verborgen.',
    intervalHidden: '— Im PiP ausgeblendet —',
    intervalPlaceholder: 'z.B. Mittag 12:00–12:45',

    breaksTitle: 'Pausen',
    clearBreaks: 'Pausen löschen',
    durationMins: 'Dauer',
    minUnit: 'Min',
    notePlaceholder: 'Notiz (optional)',
    editNamePrompt: 'Titel eingeben',
editMinsPrompt: 'Dauer in Minuten eingeben',

    rest1: 'Pause 1',
    rest2: 'Pause 2',
    lunch: 'Mittag',
    well1: 'Wellness 1',
    well2: 'Wellness 2',
    well3: 'Wellness 3',
    meet15: 'Meeting (15)',
    meet30: 'Meeting (30)',
    meet45: 'Meeting (45)',
    meet60: 'Meeting (60)',
    custom1: 'Benutzerdef. 1',
    custom2: 'Benutzerdef. 2',
  },

  bg: {
    labelLang: 'Език',
    docpip: 'Doc PiP',
    counterTitle: 'Брояч',
    reset: 'Нулирай',
    kbHint: 'Клавиатура: ↑ / ↓ / R / + / −',
    needTopLevel: 'Бележка: Doc PiP работи само на top-level страница (GitHub/Netlify).',
    intervalTitle: 'Интервал',
    intervalHelp: 'Ако е празно, остава скрито в PiP.',
    intervalHidden: '— Ще бъде скрито в PiP —',
    intervalPlaceholder: 'напр. Lunch 12:00–12:45',

    breaksTitle: 'Почивки',
    clearBreaks: 'Изтриване на почивки',
    durationMins: 'Продължителност',
    minUnit: 'мин',
    notePlaceholder: 'Бележка (по избор)',
editNamePrompt: 'Въведете заглавие',
editMinsPrompt: 'Въведете продълж. (минути)',


    rest1: 'Почивка 1',
    rest2: 'Почивка 2',
    lunch: 'Обяд',
    well1: 'Уелнес 1',
    well2: 'Уелнес 2',
    well3: 'Уелнес 3',
    meet15: 'Среща (15)',
    meet30: 'Среща (30)',
    meet45: 'Среща (45)',
    meet60: 'Среща (60)',
    custom1: 'Специално 1',
    custom2: 'Специално 2',
  },
};

function t(lang, key){
  return (I18N[lang] && I18N[lang][key]) || I18N.tr[key] || key;
}

export { I18N, t };
