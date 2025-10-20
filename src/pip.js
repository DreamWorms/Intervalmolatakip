// src/pip.js — PiP: saat + görev + sıradaki mola + sayaç (canlı senkron)
import { S, sub, setCounter, broadcast } from './state.js';
import { t } from './i18n.js';

export async function openDocPiP(){
  if (window.top !== window) { alert('Lütfen siteyi top-level aç (Netlify/GitHub).'); return; }
  if (!('documentPictureInPicture' in window)) { alert('Tarayıcı Document PiP desteklemiyor.'); return; }

  // Pencereyi aç
  const pip = await window.documentPictureInPicture.requestWindow({ width: 460, height: 360 });

  // === Aurora mini tema
  pip.document.head.innerHTML = `
    <meta charset="utf-8">
    <style>
      :root{
        --bg:#0b0d12;
        --panel:#101728cc;
        --stroke:#29344a;
        --fg:#e8ecf3;
        --muted:#97a3b4;
        --acc:#5b8cff;
        --r:14px;
        --glow:0 0 0 1px rgba(91,140,255,.22), 0 10px 26px rgba(91,140,255,.18);
      }
      *{box-sizing:border-box}
      html,body{height:100%}
      body{
        margin:0; color:var(--fg);
        font:14px/1.45 system-ui, Inter, Segoe UI, Roboto, Helvetica, Arial, sans-serif;
        background:
          radial-gradient(800px 400px at 10% -10%, #16233f 0%, transparent 60%),
          radial-gradient(700px 350px at 90% 110%, #13253f 0%, transparent 60%),
          var(--bg);
      }
      .wrap{ padding:12px; display:grid; gap:10px; }
      .clock{
        text-align:center; font-weight:900; font-size:28px; letter-spacing:.5px;
        padding:8px 10px; border-radius:var(--r);
        background:linear-gradient(180deg, rgba(23,29,47,.9), rgba(13,18,32,.9));
        border:1px solid #22304a;
      }
      .grid2{ display:grid; grid-template-columns:1fr 1fr; gap:10px; }
      .card{
        background:var(--panel); border:1px solid var(--stroke); border-radius:var(--r);
        padding:10px; box-shadow: 0 8px 24px rgba(0,0,0,.35);
      }
      .label{ font-weight:700; opacity:.9; margin-bottom:4px; }
      .muted{ color:var(--muted) }
      .big{ font-size:18px; font-weight:800; margin-top:4px }

      /* Sayaç pad */
      .pad{ display:flex; align-items:center; justify-content:center;
        height:64px; border:1px solid var(--stroke); border-radius:var(--r);
        background:linear-gradient(180deg, rgba(18,22,36,.85), rgba(13,18,32,.9));
        cursor: zoom-in; user-select:none; transition:.08s ease;
      }
      .pad:hover{ box-shadow:var(--glow); border-color:#344766; }
      .pad:active{ transform:scale(.995); }
      .face{
        font-size:36px; line-height:1; font-weight:900;
        padding:8px 14px; min-width:70px; text-align:center;
        background:#0d1220; border:1px solid var(--stroke); border-radius:12px;
      }

      .row{ display:flex; gap:8px; align-items:center; justify-content:center; flex-wrap:wrap; }
      .chip, .btn{
        padding:6px 12px; border-radius:999px; color:var(--fg);
        background:#0e1626; border:1px solid var(--stroke); cursor:pointer;
      }
      .chip:hover, .btn:hover{ box-shadow:var(--glow); }
      .ghost{ background:transparent; }
      .hint{ font-size:12px; color:var(--muted); text-align:center; margin-top:2px }
      .title-row{ display:flex; align-items:center; justify-content:space-between; margin-bottom:6px }
      .title{ font-weight:800 }
    </style>
  `;

  // === UI
  pip.document.body.innerHTML = `
    <div class="wrap">
      <div id="pipClock" class="clock">--:--:--</div>

      <div class="grid2">
        <div class="card">
          <div class="label" id="pipTaskLabel">Task</div>
          <div id="pipTaskStatus" class="muted">—</div>
          <div id="pipTaskAmount" class="big">0</div>
        </div>

        <div class="card">
          <div class="label" id="pipNextLabel">Next</div>
          <div id="pipNextName" class="muted">—</div>
          <div id="pipNextEta" class="big">--:--:--</div>
        </div>
      </div>

      <div class="card">
        <div class="title-row">
          <div id="pipCounterTitle" class="title">Sayaç</div>
          <div id="pipPadHint" class="hint">Sol tık +1 • Sağ tık −1</div>
        </div>

        <button id="pad" class="pad" title="Sol tık +1 • Sağ tık −1">
          <span id="v" class="face">0</span>
        </button>

        <div class="row" style="margin-top:8px">
          <button class="chip" data-step="2">+2</button>
          <button class="chip" data-step="4">+4</button>
          <button class="chip" data-step="8">+8</button>
          <button id="r" class="btn ghost">Sıfırla</button>
        </div>
      </div>
    </div>
  `;

  const $ = (s, root=pip.document) => root.querySelector(s);

  const v   = $('#v');
  const pad = $('#pad');
  const r   = $('#r');

  // === i18n boyama (DİL SENKRONU)
  const paintTexts = () => {
    $('#pipTaskLabel').textContent   = t(S.lang, 'taskTitle')        || 'Task';
    $('#pipNextLabel').textContent   = t(S.lang, 'nextBreakTitle')   || 'Next';
    $('#pipCounterTitle').textContent= t(S.lang, 'counterTitle')     || 'Counter';
    r.textContent                    = t(S.lang, 'reset')            || 'Reset';

    const padHint = (S.lang === 'tr')
      ? 'Sol tık +1 • Sağ tık −1'
      : 'Left click +1 • Right click −1';
    $('#pipPadHint').textContent = padHint;
    pad.title = padHint;
  };
  paintTexts();
  sub('lang', paintTexts); // << dil değişince PiP anında güncellenir

  // === Sayaç başlangıç + pad/kısayol etkileşimi
  v.textContent = String(S.counter);

  function apply(val){ setCounter(val); broadcast('counter', S.counter); }

  // Pad: sol tık +1, sağ tık −1
  pad.addEventListener('click', () => apply(S.counter + 1));
  pad.addEventListener('contextmenu', (e) => { e.preventDefault(); apply(S.counter - 1); });

  // Kısayol çipleri
  pip.document.querySelectorAll('[data-step]').forEach(btn=>{
    btn.addEventListener('click', () => {
      const step = Number(btn.getAttribute('data-step') || 0);
      apply(S.counter + step);
    });
  });

  // Reset
  r.onclick = () => apply(0);

  // Sayaç senkronu
  const unCounter = sub('counter', (val) => { v.textContent = String(val); });

  // === Dashboard snapshot'ını uygula (saat, görev, sıradaki mola)
  const applyDash = (d)=>{
    if (!d) return;
    $('#pipClock').textContent = d.clock || '--:--:--';

    // Görev
    $('#pipTaskStatus').textContent = d.task?.active ? (t(S.lang,'taskActive') || 'Active') : '—';
    $('#pipTaskAmount').textContent = String(d.task?.amount ?? 0);

    // Sıradaki
    if (d.next){
      $('#pipNextName').textContent = `${d.next.keyOrName} ${d.next.at}`;
      $('#pipNextEta').textContent  = d.next.eta;
    }else{
      $('#pipNextName').textContent = '—';
      $('#pipNextEta').textContent  = '--:--:--';
    }
  };

  // Açılışta doldur + her saniye güncel tut
  applyDash(window.__KZS_LAST_DASH__);
  const syncTimer = setInterval(() => {
    if (pip.closed) { clearInterval(syncTimer); return; }
    applyDash(window.__KZS_LAST_DASH__);
  }, 1000);

  // Temizlik
  pip.addEventListener('pagehide', () => {
    unCounter();
    clearInterval(syncTimer);
  });
}
