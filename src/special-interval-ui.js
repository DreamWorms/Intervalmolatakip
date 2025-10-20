// Özel Interval UI — 5/10/15/20, vardiya başlangıcı ve satır satır değerler
import { t } from './i18n.js';
import { S, broadcast, sub } from './state.js';
import { getCfg, setCfg, activeAmount } from './special-interval.js';

export function mountSpecialIntervalUI(){
  const block = document.getElementById('siBlock');
  if (!block) return;

  const lenWrap = document.getElementById('siLen');
  const startIn = document.getElementById('siStart');
  const linesTa = document.getElementById('siLines');
  const saveBtn = document.getElementById('siSave');
  const info    = document.getElementById('siInfo');
  const title   = document.getElementById('siTitle');
  const lenLbl  = document.getElementById('siLenLabel');
  const startLbl= document.getElementById('siStartLabel');
  const linesLbl= document.getElementById('siLinesLabel');

  function paintTexts(){
    title.textContent   = t(S.lang, 'siTitle');
    lenLbl.textContent  = t(S.lang, 'siLen');
    startLbl.textContent= t(S.lang, 'siStart');
    linesLbl.textContent= t(S.lang, 'siLines');
    saveBtn.textContent = t(S.lang, 'siSave');
  }

  function paintValues(){
    const cfg = getCfg();
    // dakika
    lenWrap.querySelectorAll('[data-len]').forEach(btn=>{
      btn.classList.toggle('active', Number(btn.dataset.len) === Number(cfg.len));
    });
    // saat ve liste
    startIn.value = cfg.start || '';
    linesTa.value = cfg.lines || '';
  }

  // olaylar
  lenWrap.addEventListener('click', (e)=>{
    const btn = e.target.closest('[data-len]');
    if (!btn) return;
    lenWrap.querySelectorAll('[data-len]').forEach(b=>b.classList.remove('active'));
    btn.classList.add('active');
  });

  saveBtn.addEventListener('click', ()=>{
    const activeBtn = lenWrap.querySelector('[data-len].active');
    const len = activeBtn ? Number(activeBtn.dataset.len) : 10;
    const start = startIn.value || '';
    const lines = linesTa.value || '';

    setCfg({ len, start, lines });
    info.textContent = t(S.lang, 'siSaved');

    // anında kartı güncellemek istersen yayınla; dashboard her saniye zaten güncelliyor
    const a = activeAmount(getCfg(), new Date());
    broadcast('dashboard', {
      clock: document.getElementById('liveClock')?.textContent || '',
      task: { len, active: a.active, amount: a.amount },
      next: null,
    });

    setTimeout(()=> info.textContent = '', 2000);
  });

  paintTexts();
  paintValues();
  sub('lang', ()=>{ paintTexts(); paintValues(); });
}
