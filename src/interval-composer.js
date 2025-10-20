// src/interval-composer.js — Interval metni üret, ana sayfaya + PiP'e gönder
import { S, setIntervalText, broadcast, sub } from './state.js';
import { t } from './i18n.js';

const LS_BREAKS = 'kzs_breaks_v3'; // breaks.js ile aynı

function loadBreaks(){
  try{
    const raw = localStorage.getItem(LS_BREAKS);
    const arr = raw ? JSON.parse(raw) : null;
    return Array.isArray(arr) ? arr : [];
  }catch{ return []; }
}

function two(n){ return String(n).padStart(2,'0'); }
function addMins(h, m, plus){
  const tot = h*60 + m + plus;
  let H = Math.floor((tot % (24*60) + (24*60)) % (24*60) / 60);
  let M = ((tot % 60) + 60) % 60;
  return [H, M];
}

function composeText(lang, title, startHH, startMM, mins){
  if (startHH == null || startMM == null || !title) return '';
  const [eh, em] = addMins(startHH, startMM, Number(mins||0));
  const s = `${two(startHH)}:${two(startMM)}`;
  const e = `${two(eh)}:${two(em)}`;
  return `${title} ${s}–${e}`;
}

export function mountIntervalComposer(){
  const block   = document.getElementById('icBlock');
  if (!block) return;

  // Elemanlar
  const slotSel = document.getElementById('icSlot');
  const startIn = document.getElementById('icStart');
  const minsIn  = document.getElementById('icMins');
  const nowBtn  = document.getElementById('icNow');
  const setBtn  = document.getElementById('icSet');
  const preview = document.getElementById('icPreview');

  const slotLbl = document.getElementById('icSlotLabel');
  const startLbl= document.getElementById('icStartLabel');
  const minsLbl = document.getElementById('icMinsLabel');

  // Break listesini i18n ile hazırla
  function optionsFromBreaks(){
    const arr = loadBreaks();
    // fixed önce, custom sonra
    const fixed  = arr.filter(a=>a.type==='fixed');
    const custom = arr.filter(a=>a.type==='custom');
    const map = (it) => ({
      id: it.id,
      title: it.type==='fixed' ? t(S.lang, it.titleKey) : (it.title || 'Custom'),
      mins: it.mins || 0
    });
    return [...fixed.map(map), ...custom.map(map)];
  }

  function paintTexts(){
    slotLbl.textContent  = t(S.lang, 'icBreak');
    startLbl.textContent = t(S.lang, 'icStart');
    minsLbl.textContent  = t(S.lang, 'icDuration');
    nowBtn.textContent   = t(S.lang, 'icNow');
    setBtn.textContent   = t(S.lang, 'icSet');
  }

  // Slotları doldur
  function renderSlots(keepId){
    const opts = optionsFromBreaks();
    slotSel.innerHTML = '';
    opts.forEach(o=>{
      const op = document.createElement('option');
      op.value = o.id; op.textContent = `${o.title}`;
      slotSel.append(op);
    });
    // önceki seçim varsa koru
    if (keepId && opts.some(o=>o.id===keepId)) slotSel.value = keepId;
    // dakika varsayılanı
    const cur = opts.find(o=>o.id===slotSel.value);
    if (cur) minsIn.value = String(cur.mins || 0);
  }

  // Önizleme
  function updatePreview(){
    const opts = optionsFromBreaks();
    const cur = opts.find(o=>o.id===slotSel.value);
    let hh=null, mm=null;
    if (startIn.value){
      const [H,M] = startIn.value.split(':').map(Number);
      hh=H; mm=M;
    }
    const txt = composeText(S.lang, cur?cur.title:'', hh, mm, Number(minsIn.value||0));
    preview.textContent = txt;
    return txt;
  }

  // Hızlı ekleme +10/+15/+20
  block.querySelectorAll('.chip[data-add]').forEach(btn=>{
    btn.addEventListener('click', ()=>{
      const add = Number(btn.getAttribute('data-add')||0);
      const v = Math.max(0, Number(minsIn.value||0)+add);
      minsIn.value = String(v);
      updatePreview();
    });
  });

  // Şimdi
  nowBtn.addEventListener('click', ()=>{
    const d = new Date();
    startIn.value = `${two(d.getHours())}:${two(d.getMinutes())}`;
    updatePreview();
  });

  // Ayarla → ana inputu, state’i ve PiP’i güncelle
  setBtn.addEventListener('click', ()=>{
    const txt = updatePreview();
    if (!txt) return;
    const intervalInput = document.getElementById('intervalInput');
    if (intervalInput) intervalInput.value = txt;
    setIntervalText(txt);
    broadcast('interval', txt);
    const statusLine = document.getElementById('statusLine');
    if (statusLine) statusLine.textContent = '';
  });

  // Etkileşimlerin hepsi önizleme günceller
  slotSel.addEventListener('change', ()=>{ renderSlots(slotSel.value); updatePreview(); });
  startIn.addEventListener('input', updatePreview);
  minsIn.addEventListener('input',  updatePreview);

  // İlk kurulum
  paintTexts();
  renderSlots();
  updatePreview();

  // Dil değişince metinler ve slot isimleri yenilensin
  sub('lang', ()=>{
    paintTexts();
    const keep = slotSel.value;
    renderSlots(keep);
    updatePreview();
  });
}
