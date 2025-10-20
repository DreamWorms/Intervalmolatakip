// src/special-interval.js — Özel interval: aktif miktarı hesapla (listeden), state'e yaz
import { S, sub } from './state.js';

// Kalıcılık anahtarları
const K = {
  len: 'kzs_si_len',   // 5/10/15/20
  start: 'kzs_si_start', // "HH:MM"
  lines: 'kzs_si_lines', // çok satırlı string
};

// Dışarıdan da kullanabilelim diye basit getter
function getCfg(){
  return {
    len: Number(localStorage.getItem(K.len) || 10),
    start: localStorage.getItem(K.start) || '',
    lines: localStorage.getItem(K.lines) || '',
  };
}
function setCfg(part){
  const cur = getCfg();
  const nx = { ...cur, ...part };
  localStorage.setItem(K.len,   String(nx.len));
  localStorage.setItem(K.start, nx.start || '');
  localStorage.setItem(K.lines, nx.lines || '');
  return nx;
}

// Yardımcılar
const two = n => String(n).padStart(2,'0');
function parseTime(hhmm){
  if (!hhmm || !/^\d{1,2}:\d{2}$/.test(hhmm)) return null;
  const [H,M] = hhmm.split(':').map(Number);
  if (H<0||H>23||M<0||M>59) return null;
  return {H,M};
}

// lines → [number,...]
function parseLines(txt){
  return (txt||'').split(/\r?\n/)
    .map(s => s.trim())
    .filter(Boolean)
    .map(s => Number(s))
    .filter(n => Number.isFinite(n));
}

// “şu an kaçıncı intervaldayız?”
function intervalIndex(startHHMM, lenMin, now=new Date()){
  const t = parseTime(startHHMM);
  if (!t) return -1;
  const base = new Date(now);
  base.setHours(t.H, t.M, 0, 0);
  const ms = now - base;
  return Math.floor(ms / (lenMin*60*1000));
}

// Aktif miktar: lines[idx] (yoksa 0)
function activeAmount(cfg, now=new Date()){
  const idx = intervalIndex(cfg.start, cfg.len, now);
  if (idx < 0) return { active:false, idx, amount:0 };
  const arr = parseLines(cfg.lines);
  const amount = (idx>=0 && idx<arr.length) ? arr[idx] : 0;
  return { active:true, idx, amount, len:cfg.len };
}

// Bu modül UI eklemiyor; hesaplanan değeri “dashboard.js” okuyacak.
export { getCfg, setCfg, activeAmount, parseLines, parseTime, intervalIndex, two };
