// src/breaks.js — 15 kutu, yalnızca CUSTOM bloklarda başlık+dk düzenleme
import { S, sub } from './state.js';
import { t } from './i18n.js';

const LS_KEY = 'kzs_breaks_v2';

const DEFAULT_SLOTS = [
  // 10 sabit isimli
  { id:'rest1',   type:'fixed',   titleKey:'rest1',   title:'', mins:15, note:'' },
  { id:'rest2',   type:'fixed',   titleKey:'rest2',   title:'', mins:15, note:'' },
  { id:'lunch',   type:'fixed',   titleKey:'lunch',   title:'', mins:45, note:'' },
  { id:'well1',   type:'fixed',   titleKey:'well1',   title:'', mins:16, note:'' },
  { id:'well2',   type:'fixed',   titleKey:'well2',   title:'', mins:16, note:'' },
  { id:'well3',   type:'fixed',   titleKey:'well3',   title:'', mins:16, note:'' },
  { id:'meet15',  type:'fixed',   titleKey:'meet15',  title:'', mins:15, note:'' },
  { id:'meet30',  type:'fixed',   titleKey:'meet30',  title:'', mins:30, note:'' },
  { id:'meet45',  type:'fixed',   titleKey:'meet45',  title:'', mins:45, note:'' },
  { id:'meet60',  type:'fixed',   titleKey:'meet60',  title:'', mins:60, note:'' },

  // 5 custom (başlık + dakika kullanıcıdan)
  { id:'custom1', type:'custom',  titleKey:'', title:'Custom 1', mins:15, note:'' },
  { id:'custom2', type:'custom',  titleKey:'', title:'Custom 2', mins:15, note:'' },
  { id:'custom3', type:'custom',  titleKey:'', title:'Custom 3', mins:15, note:'' },
  { id:'custom4', type:'custom',  titleKey:'', title:'Custom 4', mins:15, note:'' },
  { id:'custom5', type:'custom',  titleKey:'', title:'Custom 5', mins:15, note:'' },
];

function load(){
  try{
    const raw = localStorage.getItem(LS_KEY);
    const arr = raw ? JSON.parse(raw) : null;
    if (Array.isArray(arr)) return arr;
  }catch{}
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
    const unit = t(S.lang, 'minUnit');
    root.innerHTML = '';

    data.forEach(slot => {
      // Başlık (fixed ise i18n, custom ise kullanıcı başlığı)
      const titleText = slot.type === 'fixed' ? t(S.lang, slot.titleKey) : (slot.title || 'Custom');
      const title = el('div', { class:'tile-title' }, titleText);
      const badge = el('span', { class:'badge pill' }, `${slot.mins} ${unit}`);
      const head  = el('div', { class:'tile-head' }, title, badge);

      // Not
      const note  = el('textarea', {
        class:'note', placeholder: t(S.lang, 'notePlaceholder'),
        oninput: ev => { slot.note = ev.target.value; save(data); }
      }, slot.note || '');

      const card  = el('div', { class:`break-tile ${slot.type==='custom'?'tile-custom':'tile-fixed'}` }, head, note);

      // Yalnızca CUSTOM kartlarda alt düzenleme alanı
      if (slot.type === 'custom'){
        const nameLbl = el('span', { class:'tiny muted' }, t(S.lang, 'labelName'));
        const nameInp = el('input', {
          class:'text small', value: slot.title,
          oninput: ev => { slot.title = ev.target.value; save(data); head.firstChild.textContent = slot.title || 'Custom'; }
        });

        const durLbl  = el('span', { class:'tiny muted' }, t(S.lang, 'durationMins'));
        const durInp  = el('input', {
          class:'text small num', type:'number', min:'0', step:'1', value:String(slot.mins),
          oninput: ev => {
            slot.mins = Math.max(0, Number(ev.target.value||0));
            save(data);
            badge.textContent = `${slot.mins} ${unit}`;
          }
        });
        const durUnit = el('span', { class:'tiny muted' }, unit);

        const footer = el('div', { class:'tile-footer' },
          nameLbl, nameInp,
          el('span', { class:'spacer' }),
          durLbl, durInp, durUnit
        );
        card.append(footer);
      }

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
