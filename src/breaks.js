// src/breaks.js — Molalar (görsel olarak zengin, 5 sütun, rozet + sağda süre kapsülü)
import { S, sub } from './state.js';
import { t } from './i18n.js';

const LS_KEY = 'kzs_breaks_v1';

// Her slota "type" ekledim: renk ve rozet stili için
const DEFAULT_SLOTS = [
  { id:'rest1',   titleKey:'rest1',   type:'rest',     mins:15, note:'' },
  { id:'rest2',   titleKey:'rest2',   type:'rest',     mins:15, note:'' },
  { id:'lunch',   titleKey:'lunch',   type:'lunch',    mins:45, note:'' },
  { id:'well1',   titleKey:'well1',   type:'wellness', mins:16, note:'' },
  { id:'well2',   titleKey:'well2',   type:'wellness', mins:16, note:'' },
  { id:'well3',   titleKey:'well3',   type:'wellness', mins:16, note:'' },
  { id:'meet15',  titleKey:'meet15',  type:'meeting',  mins:15, note:'' },
  { id:'meet30',  titleKey:'meet30',  type:'meeting',  mins:30, note:'' },
  { id:'meet45',  titleKey:'meet45',  type:'meeting',  mins:45, note:'' },
  { id:'meet60',  titleKey:'meet60',  type:'meeting',  mins:60, note:'' },
  { id:'custom1', titleKey:'custom1', type:'custom',   mins:15, note:'' },
  { id:'custom2', titleKey:'custom2', type:'custom',   mins:15, note:'' },
];

function load(){
  try{ const r = localStorage.getItem(LS_KEY); const a = r?JSON.parse(r):null; if(Array.isArray(a)) return a; }catch{}
  return structuredClone(DEFAULT_SLOTS);
}
function save(arr){ localStorage.setItem(LS_KEY, JSON.stringify(arr)); }

function el(tag, attrs={}, ...kids){
  const e = document.createElement(tag);
  for (const [k,v] of Object.entries(attrs)){
    if (k==='class') e.className = v;
    else if (k.startsWith('on') && typeof v==='function') e.addEventListener(k.slice(2), v);
    else if (v!=null) e.setAttribute(k, v);
  }
  for (const k of kids){ if (k!=null) e.append(k.nodeType?k:document.createTextNode(k)); }
  return e;
}

export function mountBreaks(rootSel='#breakGrid'){
  const root = document.querySelector(rootSel);
  if (!root) return;

  let data = load();

  function paint(){
    root.innerHTML = '';
    data.forEach(slot => {
      const unit = t(S.lang, 'minUnit');

      // Üst başlık + rozet
      const title = el('div', { class:'tile-title' }, t(S.lang, slot.titleKey));
      const badge = el('span', { class:`badge pill badge-${slot.type}` }, `${slot.mins} ${unit}`);
      const head  = el('div', { class:'tile-head' }, title, badge);

      // Not alanı (büyük)
      const note  = el('textarea', {
        class:'note',
        placeholder: t(S.lang, 'notePlaceholder'),
        oninput: (ev) => { slot.note = ev.target.value; save(data); }
      }, slot.note || '');

      // Sağdaki “süre” kapsülü (yüzer)
      const minsInput = el('input', {
        class:'mins-float-input',
        type:'number', min:'0', step:'1', value:String(slot.mins),
        oninput: (ev) => {
          slot.mins = Math.max(0, Number(ev.target.value || 0));
          badge.textContent = `${slot.mins} ${unit}`;
          save(data);
        }
      });
      const minsFloat = el('div', { class:'mins-float' }, minsInput, el('span',{class:'mins-unit'}, unit));

      const card  = el('div', { class:`break-tile tile-${slot.type}` }, head, note, minsFloat);
      root.append(card);
    });
  }

  paint();
  sub('lang', paint);

  const clearBtn = document.getElementById('clearBreaksBtn');
  if (clearBtn) {
    clearBtn.onclick = () => {
      data = structuredClone(DEFAULT_SLOTS);
      save(data);
      paint();
    };
  }
}
