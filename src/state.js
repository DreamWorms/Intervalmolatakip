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

/* ===== MOLA GRID — görünümü güçlendir ===== */
.break-grid{
  display:grid;
  grid-template-columns: repeat(5, minmax(220px,1fr));
  gap:18px;
}
@media (max-width: 1300px){ .break-grid{ grid-template-columns: repeat(4, minmax(220px,1fr)); } }
@media (max-width: 1100px){ .break-grid{ grid-template-columns: repeat(3, minmax(220px,1fr)); } }
@media (max-width: 800px){  .break-grid{ grid-template-columns: repeat(2, minmax(220px,1fr)); } }
@media (max-width: 560px){  .break-grid{ grid-template-columns: 1fr; } }

.break-tile{
  position: relative;
  background: linear-gradient(180deg, rgba(18,20,35,.75), rgba(14,16,28,.85));
  border:1px solid #2a3040;
  border-radius:16px;
  padding:12px;
  box-shadow: 0 8px 28px rgba(0,0,0,.35);
  transition: transform .12s ease, box-shadow .12s ease, border-color .12s ease;
}
.break-tile:hover{
  transform: translateY(-2px);
  box-shadow: 0 12px 36px rgba(0,0,0,.45);
  border-color:#3a4564;
}

.tile-head{ display:flex; align-items:center; justify-content:space-between; margin-bottom:8px; }
.tile-title{ font-weight:800; letter-spacing:.2px; }

.badge{
  font-size:12px; padding:2px 8px; border-radius:999px;
  border:1px solid #2a3040; background: rgba(10,12,20,.6);
}
.badge-rest{    border-color:#4a5066; }
.badge-lunch{   border-color:#2d6cdf; box-shadow: inset 0 0 0 1px rgba(45,108,223,.35); }
.badge-wellness{border-color:#1fa1aa; box-shadow: inset 0 0 0 1px rgba(31,161,170,.35); }
.badge-meeting{ border-color:#d9a736; box-shadow: inset 0 0 0 1px rgba(217,167,54,.35); }
.badge-custom{  border-color:#6b6f82; }

.break-tile .note{
  width:100%; min-height:92px; resize:vertical;
  padding:10px; border-radius:12px;
  border:1px solid var(--border);
  background:#0d1220; color:var(--fg);
}

/* Sağdaki süre kapsülü */
.mins-float{
  position:absolute; right:-34px; top:50%; transform: translateY(-50%);
  display:flex; align-items:center; gap:6px;
  background:#0b1020; border:1px solid #2a3040; border-radius:12px;
  padding:6px 8px;
  box-shadow: 0 6px 22px rgba(0,0,0,.35);
}
.mins-float-input{
  width:54px; text-align:right;
  padding:6px 8px; border-radius:8px; border:1px solid #2a3040;
  background:#0f1420; color:var(--fg);
}
.mins-unit{ font-size:12px; color:var(--muted) }

/* Küçük ekranlarda sağ kapsülü içeri al */
@media (max-width: 1100px){
  .mins-float{ position:static; transform:none; margin-top:8px; }
}
