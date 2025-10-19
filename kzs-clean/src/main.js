// src/main.js — UI bağlama
import { S, setCounter, setLang, setIntervalText, sub, broadcast } from './state.js';
import { t } from './i18n.js';
import { openDocPiP } from './pip.js';

const $ = (s, root=document) => root.querySelector(s);

// Elemanlar
const labelLang = $('#labelLang');
const langSelect = $('#langSelect');
const openDocPipBtn = $('#openDocPipBtn');
const countVal = $('#countVal');
const plusBtn = $('#plusBtn');
const minusBtn = $('#minusBtn');
const resetBtn = $('#resetBtn');
const counterTitle = $('#counterTitle');
const kbHint = $('#kbHint');
const topLevelHint = $('#topLevelHint');
const intervalTitle = $('#intervalTitle');
const intervalHelp = $('#intervalHelp');
const intervalInput = $('#intervalInput');
const statusLine = $('#statusLine');

// İlk durum
langSelect.value = S.lang;
countVal.textContent = String(S.counter);
intervalInput.value = S.interval;

// Metinleri boyayan fonksiyon
function paintTexts(){
  labelLang.textContent = t(S.lang, 'labelLang');
  openDocPipBtn.textContent = t(S.lang, 'docpip');
  counterTitle.textContent = t(S.lang, 'counterTitle');
  resetBtn.textContent = t(S.lang, 'reset');
  kbHint.textContent = t(S.lang, 'kbHint');
  intervalTitle.textContent = t(S.lang, 'intervalTitle');
  intervalHelp.textContent = t(S.lang, 'intervalHelp');
  intervalInput.placeholder = t(S.lang, 'intervalPlaceholder');
  topLevelHint.textContent = (window.top !== window) ? t(S.lang, 'needTopLevel') : '';
  statusLine.textContent = S.interval ? '' : t(S.lang, 'intervalHidden');
}
paintTexts();

// Sayaç etkileşimi
plusBtn.onclick  = () => { setCounter(S.counter + 1); broadcast('counter', S.counter); };
minusBtn.onclick = () => { setCounter(S.counter - 1); broadcast('counter', S.counter); };
resetBtn.onclick = () => { setCounter(0); broadcast('counter', S.counter); };

// Klavye kısayolları
window.addEventListener('keydown', (e) => {
  const tag = (e.target && e.target.tagName) || '';
  if (tag === 'INPUT' || tag === 'TEXTAREA') return;
  if (e.key === 'ArrowUp' || e.key === '+') { setCounter(S.counter + 1); broadcast('counter', S.counter); }
  if (e.key === 'ArrowDown' || e.key === '-') { setCounter(S.counter - 1); broadcast('counter', S.counter); }
  if (e.key.toLowerCase() === 'r') { setCounter(0); broadcast('counter', S.counter); }
});

// Dil
langSelect.onchange = () => { setLang(langSelect.value); broadcast('lang', S.lang); paintTexts(); };
sub('lang', paintTexts);

// Interval
intervalInput.oninput = () => {
  const v = intervalInput.value.trim();
  setIntervalText(v);
  broadcast('interval', v);
  statusLine.textContent = v ? '' : t(S.lang, 'intervalHidden');
};

// Doc PiP
openDocPipBtn.onclick = () => openDocPiP();

// Senkron
sub('counter', (val) => { countVal.textContent = String(val); });
sub('interval', (txt) => {
  if (intervalInput.value !== txt) intervalInput.value = txt || '';
  statusLine.textContent = txt ? '' : t(S.lang, 'intervalHidden');
});
