
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
    taskTitle: 'Mevcut Interval',
    taskActive: 'Hedef',
    nextBreakTitle: 'Sıradaki Mola',
    pipPadHint: 'Sayaç',

    breaksTitle: 'Breaks',
    clearBreaks: 'Molaları Sil',
    durationMins: 'Süre',
    minUnit: 'dk',
    notePlaceholder: 'Molanı HH:MM formatında yaz',

    siTitle: 'Özel interval',
    siLen: 'Dakika',
    siStart: 'Vardiya',
    siLines: 'Değerler (her satır bir sayı)',
    siSave: 'Kaydet',
    siSaved: 'Kaydedildi.',

    // — Friends sekmesi
    frNoFriend: 'Arkadaş yok.',
    frOverlapsNone: 'Kesişim bulunamadı.',
    frConfirmDelete: 'Bu arkadaşı silmek istiyor musun?',
    frNewFriend: 'Yeni Arkadaş',

    // Wellness Defteri
    wnTitle: 'Wellness Defteri',
    wnAuto: 'Otomatik kaydet',
    wnResetWeek: 'Haftayı sıfırla',
    wnUndo: 'Geri al',
    wnTotal: 'Toplam',
    wnPlan: 'Plan',
    wnWeekSep: '→',  

    // — PiP 2 dk overlay
    pipSoonTitle: 'Mola Yaklaşıyor',
    pipPrepareHint: 'Hazırlan: su al, esneme yap, gözleri dinlendir…',

    // başlıklar
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
    taskTitle: 'Current Interval',
    taskActive: 'Target',
    nextBreakTitle: 'Next Break',
    pipPadHint: 'Counter',

    breaksTitle: 'Breaks',
    clearBreaks: 'Clear breaks',
    notePlaceholder: 'Enter your break time HH:MM',
    durationMins: 'Duration',
    minUnit: 'min',

    siTitle: 'Custom interval',
    siLen: 'Minutes',
    siStart: 'Shift start',
    siLines: 'Values (one per line)',
    siSave: 'Save',
    siSaved: 'Saved.',

    // — Friends
    frNoFriend: 'No friends.',
    frOverlapsNone: 'No overlap found.',
    frConfirmDelete: 'Delete this friend?',
    frNewFriend: 'New Friend',

    // Wellness Defteri
    wnTitle: 'Wellness Book',
    wnAuto: 'Auto log',
    wnResetWeek: 'Reset week',
    wnUndo: 'Undo',
    wnTotal: 'Total',
    wnPlan: 'Plan',
    wnWeekSep: '→',


    // — PiP overlay
    pipSoonTitle: 'Break Starting Soon',
    pipPrepareHint: 'Get ready: grab water, stretch, rest your eyes…',

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
    needTopLevel: 'Hinweis: Doc PiP funktioniert nur auf einer Top-Level-Seite (z. B. GitHub/Netlify).',
    intervalTitle: 'Intervall',
    intervalHelp: 'Leer gelassen, bleibt es im PiP verborgen.',
    intervalHidden: '— Im PiP ausgeblendet —',
    intervalPlaceholder: 'z. B. Mittag 12:00–12:45',
    taskTitle: 'Aktuelles Intervall',
    taskActive: 'Ziel',
    nextBreakTitle: 'Nächste Pause',
    pipPadHint: 'Zähler',

    breaksTitle: 'Breaks',
    clearBreaks: 'Pausen löschen',
    notePlaceholder: 'Trage deine Pause HH:MM ein',
    durationMins: 'Dauer',
    minUnit: 'Min',

    siTitle: 'Benutzerdef. Intervall',
    siLen: 'Minuten',
    siStart: 'Schichtbeginn',
    siLines: 'Werte (eine pro Zeile)',
    siSave: 'Speichern',
    siSaved: 'Gespeichert.',

    // — Friends
    frNoFriend: 'Kein Freund.',
    frOverlapsNone: 'Keine Überschneidung gefunden.',
    frConfirmDelete: 'Diesen Freund löschen?',
    frNewFriend: 'Neuer Freund',
    
    // Wellness Defteri
    wnTitle: 'Wellness-Buch',
    wnAuto: 'Auto-Log',
    wnResetWeek: 'Woche zurücksetzen',
    wnUndo: 'Rückgängig',
    wnTotal: 'Summe',
    wnPlan: 'Plan',
    wnWeekSep: '→',


    // — PiP overlay
    pipSoonTitle: 'Pause steht bevor',
    pipPrepareHint: 'Mach dich bereit: Wasser holen, dehnen, Augen entspannen…',

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
    intervalPlaceholder: 'напр. Обяд 12:00–12:45',
    taskTitle: 'Текущ интервал',
    taskActive: 'Цел',
    nextBreakTitle: 'Следваща почивка',
    pipPadHint: 'Брояч',

    breaksTitle: 'Почивки',
    clearBreaks: 'Изчисти почивките',
    notePlaceholder: 'Въведи час HH:MM',
    durationMins: 'Продължителност',
    minUnit: 'мин',

    siTitle: 'Специален интервал',
    siLen: 'Минути',
    siStart: 'Начало на смяна',
    siLines: 'Стойности (по ред)',
    siSave: 'Запази',
    siSaved: 'Запазено.',

    // — Friends
    frNoFriend: 'Няма приятели.',
    frOverlapsNone: 'Няма пресичане.',
    frConfirmDelete: 'Да изтрия ли този приятел?',
    frNewFriend: 'Нов приятел',

    // Wellness Defteri
    wnTitle: 'Wellness Книга',
    wnAuto: 'Авто запис',
    wnResetWeek: 'Нулирай седмицата',
    wnUndo: 'Отмени',
    wnTotal: 'Общо',
    wnPlan: 'План',
    wnWeekSep: '→',


    // — PiP overlay
    pipSoonTitle: 'Почивката наближава',
    pipPrepareHint: 'Подготви се: вода, разтягане, почивка за очите…',

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
};

function t(lang, key){
  return (I18N[lang] && I18N[lang][key]) || I18N.tr[key] || key;
}

export { I18N, t };


// --- Global bridge (module olmayan script'ler için) ---
if (typeof window !== 'undefined') {
  window.I18N = I18N;
  window.t = window.t || ((lang, key) =>
    (I18N[lang] && I18N[lang][key]) || I18N.tr[key] || key);
}
