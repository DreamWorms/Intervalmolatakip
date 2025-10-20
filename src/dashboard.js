// src/dashboard.js — canlı saat + görev (özel interval) + sıradaki mola
import { broadcast } from './state.js';
import { getCfg, activeAmount, two, parseTime } from './special-interval.js';

const LS_BREAKS = 'kzs_breaks_v3';

function readBreaks(){
  try{
    const raw = localStorage.getItem(LS_BREAKS);
    const arr = raw ? JSON.parse(raw) : null;
    return Array.isArray(arr) ? arr : [];
  }catch{ return []; }
}

// note içindeki ilk HH:MM'yi al
function firstTimeInNote(txt){
  if (!txt) return null;
  const m = txt.match(/\b(\d{1,2}):(\d{2})\b/);
  if (!m) return null;
  const H = Number(m[1]), M = Number(m[2]);
  if (H>23||M>59) return null;
  return {H,M};
}

function findNextBreak(now=new Date()){
  const items = readBreaks();
  const list = [];
  for (const it of items){
    const t = firstTimeInNote(it.note);
    if (!t) continue;
    const dt = new Date(now);
    dt.setHours(t.H, t.M, 0, 0);
    // GEÇMİŞSE YARINA AL
    if (dt < now) dt.setDate(dt.getDate() + 1);

    const title = it.type==='fixed' ? t(S.lang, it.titleKey) : (it.title || 'Custom');
    list.push({ title, when: dt });
  }
  list.sort((a,b)=>a.when-b.when);
  const pick = list[0];
  if (!pick) return null;

  const diffMs = pick.when - now;
  const s = Math.max(0, Math.floor(diffMs/1000));
  const hh = two(Math.floor(s/3600));
  const mm = two(Math.floor((s%3600)/60));
  const ss = two(s%60);
  return {
    keyOrName: pick.title,
    at: `${two(pick.when.getHours())}:${two(pick.when.getMinutes())}`,
    eta: `${hh}:${mm}:${ss}`,
  };
}


function painthtmlClock(now){
  const el = document.getElementById('liveClock');
  if (el){
    el.textContent = `${two(now.getHours())}:${two(now.getMinutes())}:${two(now.getSeconds())}`;
  }
}

function paintTask(a){
  const title = document.getElementById('taskTitle');
  const status= document.getElementById('taskStatus');
  const amount= document.getElementById('taskAmount');

  if (title)  title.textContent = `Görev (${a.len || getCfg().len} dk)`;
  if (status) status.textContent = a.active ? 'Aktif' : 'Başlamadı';
  if (amount) amount.textContent = String(a.amount || 0);
}

function paintNextBreak(n){
  const nTitle = document.getElementById('nextBreakTitle');
  const nName  = document.getElementById('nextBreakName');
  const nEta   = document.getElementById('nextBreakEta');
  if (!n){ if(nName) nName.textContent='—'; if(nEta) nEta.textContent='--:--:--'; return; }

  // titleKey olabilir; ekranda sadece ismini gösterelim
  const label = n.keyOrName.replace(/^.+?$/,'$&'); // olduğu gibi bırak
  if (nTitle) nTitle.textContent = 'Sıradaki Mola';
  if (nName)  nName.textContent  = `${label} ${n.at}`;
  if (nEta)   nEta.textContent   = n.eta;
}

export function startDashboardTicker(){
  function tick(){
    const now = new Date();
    painthtmlClock(now);

    const cfg = getCfg();
    const a = activeAmount(cfg, now);
    paintTask(a);

    const nb = findNextBreak(now);
    paintNextBreak(nb);

    const snap = {
      clock: document.getElementById('liveClock')?.textContent || '',
      task: { len: a.len || cfg.len, active: a.active, amount: a.amount },
      next: nb || null,
    };
    // ÖN BELLEK
    window.__KZS_LAST_DASH__ = snap;
    broadcast('dashboard', snap);
  }
  tick();
  return window.setInterval(tick, 1000);
}
