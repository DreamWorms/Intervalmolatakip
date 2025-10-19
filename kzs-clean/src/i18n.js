// src/i18n.js — çok dilli metinler
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
  },
  en: {
    labelLang: 'Language',
    docpip: 'Doc PiP',
    counterTitle: 'Counter',
    reset: 'Reset',
    kbHint: 'Keyboard: ↑ / ↓ / R / + / −',
    needTopLevel: 'Note: Doc PiP works only on a top‑level page (e.g., GitHub/Netlify).',
    intervalTitle: 'Interval',
    intervalHelp: 'If empty, it stays hidden in PiP.',
    intervalHidden: '— Will be hidden in PiP —',
    intervalPlaceholder: 'e.g., Lunch 12:00–12:45',
  },
  de: {
    labelLang: 'Sprache',
    docpip: 'Doc PiP',
    counterTitle: 'Zähler',
    reset: 'Zurücksetzen',
    kbHint: 'Tastatur: ↑ / ↓ / R / + / −',
    needTopLevel: 'Hinweis: Doc PiP funktioniert nur auf einer Top‑Level‑Seite (z.B. GitHub/Netlify).',
    intervalTitle: 'Intervall',
    intervalHelp: 'Wenn leer, bleibt es im PiP verborgen.',
    intervalHidden: '— Im PiP ausgeblendet —',
    intervalPlaceholder: 'z.B. Mittag 12:00–12:45',
  },
  bg: {
    labelLang: 'Език',
    docpip: 'Doc PiP',
    counterTitle: 'Брояч',
    reset: 'Нулирай',
    kbHint: 'Клавиатура: ↑ / ↓ / R / + / −',
    needTopLevel: 'Бележка: Doc PiP работи само на top‑level страница (GitHub/Netlify).',
    intervalTitle: 'Интервал',
    intervalHelp: 'Ако е празно, остава скрито в PiP.',
    intervalHidden: '— Ще бъде скрито в PiP —',
    intervalPlaceholder: 'напр. Lunch 12:00–12:45',
  },
};

function t(lang, key){
  return (I18N[lang] && I18N[lang][key]) || I18N.tr[key] || key;
}

export { I18N, t };
