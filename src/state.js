// src/state.js — tek yerde durum + kalıcılık + yayın
const KEYS = { counter:'kzs_counter', lang:'kzs_lang', interval:'kzs_interval' };

const S = {
  counter: Number(localStorage.getItem(KEYS.counter) || '0'),
  lang: localStorage.getItem(KEYS.lang) || 'tr',
  interval: localStorage.getItem(KEYS.interval) || '',
};

const bus = new Map(); // event -> [fn]
function emit(type, val){ (bus.get(type)||[]).forEach(fn => fn(val)); }
function sub(type, fn){ bus.set(type, (bus.get(type)||[]).concat(fn)); return () => {
  bus.set(type, (bus.get(type)||[]).filter(f=>f!==fn));
}; }

function setCounter(n){ S.counter = n; localStorage.setItem(KEYS.counter, String(n)); emit('counter', n); }
function setLang(code){ S.lang = code; localStorage.setItem(KEYS.lang, code); emit('lang', code); }
function setIntervalText(txt){ S.interval = txt; localStorage.setItem(KEYS.interval, txt); emit('interval', txt); }

// PiP <-> ana pencere için kanal
const chan = new BroadcastChannel('kzs:pip');
chan.onmessage = (ev) => {
  const { type, value } = ev.data || {};
  if (type === 'counter') setCounter(value);
  if (type === 'interval') setIntervalText(value);
  if (type === 'lang') setLang(value);
};
function broadcast(type, value){ chan.postMessage({ type, value }); }

export { S, setCounter, setLang, setIntervalText, sub, broadcast };
