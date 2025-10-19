// src/breaks.js — Molalar (basit grid + kalıcı kayıt)
import { S, sub } from './state.js';
import { t } from './i18n.js';

const LS_KEY = 'kzs_breaks_v1';

// Varsayılan 12 kutu (istediğimiz kadar çoğaltabiliriz)
const DEFAULT_SLOTS = [
  { id:'rest1',   titleKey:'rest1',   mins:15, note:'' },
  { id:'rest2',   titleKey:'rest2',   mins:15, note:'' },
  { id:'lunch',   titleKey:'lunch',   mins:45, note:'' },
  { id:'well1',   titleKey:'well1',   mins:16, note:'' },
  { id:'well2',   titleKey:'well2',   mins:16, note:'' },
  { id:'well3',   titleKey:'well3',   mins:16, note:'' },
  { id:'meet15',  titleKey:'meet15',  mins:15, note:'' },
  { id:'meet30',  titleKey:'meet30',  mins:30, note:'' },
  { id:'meet45',  titleKey:'meet45',  mins:45, note:'' },
  { id:'meet60',  titleKey:'meet60',  mins:60, note:'' },
  { id:'custom1', titleKey:'custom1', mins:15, note:'' },
  { id:'custom2', titleKey:'custom2', mins:15, note:'' },
];

function loadSlots(){
  try{
    const raw = localStorage.getItem(LS_KEY);
    const arr = raw ? JSON.parse(raw) : null;
    if (Array.isArray(arr)) return arr;
  }catch{}
  return structuredClone(DEFAULT_SLOTS);
}
function saveSlots(arr){ localStorage.setItem(LS_KEY, JSON.stringify(arr)); }

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

  let data = loadSlots();

  function paint(){
    root.innerHTML = '';
    data.forEach(slot => {
      const badge = el('span', { class:'badge' }, `${slot.mins} dk`);
      const head  = el('div', { class:'tile-head' },
                      el('div', { class:'tile-title' }, t(S.lang, slot.titleKey), ' ', badge)
                    );

      const minsInput = el('input', {
        class:'mins', type:'number', min:'0', step:'1', value:String(slot.mins),
        oninput: (ev) => {
          slot.mins = Math.max(0, Number(ev.target.value||0));
          badge.textContent = `${slot.mins} dk`;
          saveSlots(data);
        }
      });

      const note = el('textarea', {
        class:'note', placeholder: t(S.lang, 'notePlaceholder'),
        oninput: (ev) => { slot.note = ev.target.value; saveSlots(data); }
      }, slot.note || '');

      const body  = el('div', { class:'tile-body' },
                      el('label', { class:'tiny muted' }, t(S.lang, 'durationMins')), minsInput, note
                    );

      const card  = el('div', { class:'break-tile' }, head, body);
      root.append(card);
    });
  }

  // İlk çizim + dil değişince yenile
  paint();
  sub('lang', paint);

  // “Molaları Sil” butonu
  const clearBtn = document.getElementById('clearBreaksBtn');
  if (clearBtn) {
    clearBtn.onclick = () => {
      data = structuredClone(DEFAULT_SLOTS);
      saveSlots(data);
      paint();
    };
  }
}
