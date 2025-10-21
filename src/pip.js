// src/pip.js — PiP: saat + görev + sıradaki mola + sayaç (pad tüm alan)
import { S, sub, setCounter, broadcast } from './state.js';
import { t } from './i18n.js';

export async function openDocPiP(){
  if (window.top !== window) { alert('Lütfen siteyi top-level aç (Netlify/GitHub).'); return; }
  if (!('documentPictureInPicture' in window)) { alert('Tarayıcı Document PiP desteklemiyor.'); return; }

  const pip = await window.documentPictureInPicture.requestWindow({ width: 460, height: 360 });

  // === UI (tam ekran pad) ===
  pip.document.body.innerHTML = `
  <style>
    :root{
      --bg:#0b0d12; --panel:#0f1522cc; --stroke:#273246; --fg:#e9edf4; --muted:#9aa6b2;
    }
    *{box-sizing:border-box}
    body{ margin:0; font:14px/1.55 system-ui,Inter,Segoe UI,Roboto,Helvetica,Arial,sans-serif;
          color:var(--fg); background:radial-gradient(600px 280px at 15% -10%, #15233f 0%, transparent 55%), var(--bg); }
    .wrap{ padding:12px; display:grid; gap:10px; }
    .clock{ font-size:28px; font-weight:900; text-align:center; margin:2px 0 6px; }
    .grid{ display:grid; grid-template-columns:1fr 1fr; gap:10px; }
    .card{ background:var(--panel); border:1px solid var(--stroke); border-radius:14px; padding:10px; }
    .label{ opacity:.8; font-weight:700; margin-bottom:4px }
    .muted{ color:var(--muted) }

    /* Sayaç kartı alt sırada ve iki sütunu da kaplasın */
    .counter-card{ grid-column:1 / -1; display:flex; flex-direction:column; gap:8px; }

    /* PAD: kartın kalan tüm yüksekliğini kapla */
    .pad{
      flex:1 1 auto; width:100%;
      min-height:120px;            /* burayı istersen 100–160 arası oynatabilirsin */
      border:1px solid var(--stroke);
      border-radius:14px;
      background:linear-gradient(180deg, rgba(18,20,35,.78), rgba(14,16,28,.9));
      display:flex; align-items:center; justify-content:center;
      cursor:zoom-in; user-select:none;
      transition:transform .06s ease, box-shadow .12s ease, border-color .12s ease;
      box-shadow:0 8px 28px rgba(0,0,0,.35);
    }
    .pad:hover{ border-color:#3a4564; box-shadow:0 12px 36px rgba(0,0,0,.45); }
    .pad:active{ transform:scale(.995); }

    .face{
    color: var(--fg);
      font-size:56px; font-weight:900; line-height:1;
      padding:10px 18px; border-radius:12px; min-width:92px; text-align:center;
      background:#0d1220; border:1px solid var(--stroke);
    }

    .row{ display:flex; gap:8px; align-items:center; justify-content:center; flex-wrap:wrap; }
    .chip{ padding:6px 12px; border-radius:999px; border:1px solid var(--stroke); background:#0c1425; color:var(--fg); cursor:pointer; }
    .ghost{ background:transparent }
    .top-hint{ text-align:right; font-size:12px; color:var(--muted); }
  </style>

  <div class="wrap">
    <div id="pipClock" class="clock">--:--:--</div>

    <div class="grid">
      <div class="card">
        <div id="pipTaskLabel" class="label">Task</div>
        <div id="pipTaskStatus" class="muted">—</div>
        <div id="pipTaskAmount" style="font-size:20px; font-weight:800; margin-top:4px">0</div>
      </div>

      <div class="card">
        <div id="pipNextLabel" class="label">Next</div>
        <div id="pipNextName" class="muted">—</div>
        <div id="pipNextEta" style="font-size:20px; font-weight:800; margin-top:4px">--:--:--</div>
      </div>

      <!-- Sayaç -->
      <div class="card counter-card">
        <div class="top-hint" id="pipHint">Sol tık +1 · Sağ tık −1</div>
        <button id="pad" class="pad" title="Sol tık +1 · Sağ tık −1">
          <span id="v" class="face">0</span>
        </button>
        <div class="row">
          <button class="chip" data-step="2">+2</button>
          <button class="chip" data-step="4">+4</button>
          <button class="chip" data-step="8">+8</button>
          <button id="r" class="chip ghost">Sıfırla</button>
        </div>
      </div>
    </div>
  </div>
  `;

  // PiP arka planını ana sayfadaki wallpaper ile eşle
const copyWallpaperToPip = () => {
  const bg = getComputedStyle(document.getElementById('themeBackdrop')).background;
  pip.document.body.style.background = bg;
  pip.document.body.style.backgroundSize = 'cover';
  pip.document.body.style.backgroundPosition = 'center';
};
copyWallpaperToPip();


  const $ = (s, root=pip.document) => root.querySelector(s);

  // === i18n etiketleri (dil değişince PiP de boyansın)
  const paintTexts = () => {
    $('#pipTaskLabel').textContent = t(S.lang, 'taskTitle')          || 'Task';
    $('#pipNextLabel').textContent = t(S.lang, 'nextBreakTitle')     || 'Next';
    $('#r').textContent            = t(S.lang, 'reset')              || 'Reset';
    $('#pipHint').textContent      = t(S.lang, 'pipPadHint')         || 'Sol tık +1 · Sağ tık −1';
    $('#pad').title                = $('#pipHint').textContent;
  };
  paintTexts();
  const unLang = sub('lang', paintTexts);

  // === Sayaç başlangıç + pad etkileşimi
  const v   = $('#v');
  const pad = $('#pad');
  v.textContent = String(S.counter);

  // Sol tık: +1
  pad.addEventListener('click', (e) => {
    setCounter(S.counter + 1);
    broadcast('counter', S.counter);
  });

  // Sağ tık: −1
  pad.addEventListener('contextmenu', (e) => {
    e.preventDefault();
    setCounter(S.counter - 1);
    broadcast('counter', S.counter);
  });

  // Kısayol çipleri
  pip.document.querySelectorAll('.chip[data-step]').forEach(btn=>{
    btn.addEventListener('click', () => {
      const inc = Number(btn.getAttribute('data-step')) || 0;
      setCounter(S.counter + inc);
      broadcast('counter', S.counter);
    });
  });

  // Reset
  $('#r').addEventListener('click', () => { setCounter(0); broadcast('counter', S.counter); });

  // Sayaç senkronu
  const unCounter = sub('counter', (val) => { v.textContent = String(val); });

  // === Dashboard snapshot'ını uygula
  const applyDash = (d) => {
    if (!d) return;
    $('#pipClock').textContent   = d.clock || '--:--:--';
    $('#pipTaskStatus').textContent = d.task?.active ? (t(S.lang,'taskActive') || 'Active') : '—';
    $('#pipTaskAmount').textContent  = String(d.task?.amount ?? 0);
    if (d.next){
      $('#pipNextName').textContent = `${d.next.keyOrName} ${d.next.at}`;
      $('#pipNextEta').textContent  = d.next.eta;
    }else{
      $('#pipNextName').textContent = '—';
      $('#pipNextEta').textContent  = '--:--:--';
    }
  };

  // Açılışta doldur + her saniye snapshot tazele
  applyDash(window.__KZS_LAST_DASH__);
  const syncTimer = setInterval(() => {
    if (pip.closed) { clearInterval(syncTimer); return; }
    applyDash(window.__KZS_LAST_DASH__);
  }, 1000);

  // Temizlik
  pip.addEventListener('pagehide', () => {
    unCounter(); unLang(); clearInterval(syncTimer);
  });
}
