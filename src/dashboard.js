// src/dashboard.js — canlı saat + görev (özel interval) + sıradaki mola
import { S, broadcast } from './state.js';
import { getCfg, activeAmount, two } from './special-interval.js';
import { t } from './i18n.js';

const LS_BREAKS = 'kzs_breaks_v3';

function readBreaks(){
  try{
    const raw = localStorage.getItem(LS_BREAKS);
    const arr = raw ? JSON.parse(raw) : null;
    return Array.isArray(arr) ? arr : [];
  }catch{ return []; }
}

// NOTE içindeki ilk HH:MM'yi yakala
function firstTimeInNote(txt){
  if (!txt) return null;
  const m = txt.match(/\b(\d{1,2}):(\d{2})\b/);
  if (!m) return null;
  const H = Number(m[1]), M = Number(m[2]);
  if (H>23 || M>59) return null;
  return { H, M };
}

// EN YAKIN MOLAYI BUL (geçmişse yarına ata)
function findNextBreak(now=new Date()){
  const items = readBreaks();
  const list = [];
  for (const it of items){
    const tIn = firstTimeInNote(it.note);
    if (!tIn) continue;

    const dt = new Date(now);
    dt.setHours(tIn.H, tIn.M, 0, 0);
    if (dt < now) dt.setDate(dt.getDate() + 1); // geçmişse yarın

    const title = it.type === 'fixed'
      ? (t ? t(S.lang, it.titleKey) : it.titleKey)   // i18n
      : (it.title || 'Custom');

    list.push({ title, when: dt });
  }
  list.sort((a,b)=>a.when-b.when);
  const pick = list[0];
  if (!pick) return null;

  const diff = Math.max(0, Math.floor((pick.when - now)/1000));
  const hh = two(Math.floor(diff/3600));
  const mm = two(Math.floor((diff%3600)/60));
  const ss = two(diff%60);
  return {
    keyOrName: pick.title,
    at: `${two(pick.when.getHours())}:${two(pick.when.getMinutes())}`,
    eta: `${hh}:${mm}:${ss}`,
  };
}

function paintClock(now){
  const el = document.getElementById('liveClock');
  if (el) el.textContent = `${two(now.getHours())}:${two(now.getMinutes())}:${two(now.getSeconds())}`;
}

function paintTask(a){
  const title = document.getElementById('taskTitle');
  const status= document.getElementById('taskStatus');
  const amount= document.getElementById('taskAmount');
  if (title)  title.textContent = t ? t(S.lang, 'taskTitle') : 'Görev';
  if (status) status.textContent = a.active ? (t ? t(S.lang,'taskActive') : 'Aktif') : (t ? t(S.lang,'taskNotStarted') : 'Başlamadı');
  if (amount) amount.textContent = String(a.amount || 0);
}

function paintNextBreak(n){
  const nTitle = document.getElementById('nextBreakTitle');
  const nName  = document.getElementById('nextBreakName');
  const nEta   = document.getElementById('nextBreakEta');
  if (nTitle) nTitle.textContent = t ? t(S.lang,'nextBreakTitle') : 'Sıradaki Mola';

  if (!n){
    if (nName) nName.textContent = '—';
    if (nEta)  nEta.textContent  = '--:--:--';
    return;
  }
  if (nName) nName.textContent = `${n.keyOrName} ${n.at}`;
  if (nEta)  nEta.textContent  = n.eta;
}

export function startDashboardTicker(){
  function tick(){
    const now = new Date();
    paintClock(now);

    const cfg = getCfg();
    const a = activeAmount(cfg, now);
    paintTask(a);

    const nb = findNextBreak(now);
    paintNextBreak(nb);

    // PiP için son durumu önbelleğe al + yayınla
    const snap = {
      clock: document.getElementById('liveClock')?.textContent || '',
      task: { len: a.len || cfg.len, active: a.active, amount: a.amount },
      next: nb || null,
    };
    window.__KZS_LAST_DASH__ = snap;
    broadcast('dashboard', snap);
  }
  tick();
  return window.setInterval(tick, 1000);
}
