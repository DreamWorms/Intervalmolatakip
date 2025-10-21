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
  html, body{ height:100%; background:transparent !important; }  /* beyazlık yok */
#pipBackdrop{
  position:fixed; inset:0; z-index:-1;              /* tüm pencereyi kapla */
  background:#0b0d12 center/cover no-repeat fixed;  /* fallback + cover */
}
   :root{
    --bg:#0b0d12; --panel:#0f1522cc; --stroke:#273246; --fg:#e9edf4; --muted:#9aa6b2;
  }
  *{box-sizing:border-box}
  html,body{height:100%}
  body{
    margin:0;
    font:14px/1.55 system-ui,Inter,Segoe UI,Roboto,Helvetica,Arial,sans-serif;
    color:var(--fg);
    background:transparent; /* wallpaper arkadan gelsin */
  }

  /* daha sıkı, daha okunur yerleşim */
  .wrap{ padding:10px; display:grid; gap:8px; }
  .clock{
    font-size:clamp(16px,4.2vw,26px);
    font-weight:900; text-align:center; margin:0 0 4px;
  }

  .grid{ display:grid; grid-template-columns:1fr 1fr; gap:8px; align-items:start }
  @media (max-width:420px){ .grid{ grid-template-columns:1fr } } /* dar alanda tek sütun */

  .card{
    background:rgba(10,14,22,.70);
    backdrop-filter:saturate(120%) blur(6px);
    border:1px solid var(--stroke);
    border-radius:12px;
    padding:8px;
    min-width:0;
  }
  .label{ opacity:.85; font-weight:800; letter-spacing:.2px; margin-bottom:2px;
          font-size:clamp(11px,2.2vw,13px) }
  .muted{ color:var(--muted); font-size:clamp(11px,2.4vw,13px) }
  .value-lg{ font-size:clamp(16px,4vw,20px); font-weight:800; margin-top:4px }

  /* Sayaç */
  .counter-card{ grid-column:1 / -1; display:flex; flex-direction:column; gap:6px; }
  .top-hint{ text-align:right; font-size:clamp(10px,2vw,12px); color:var(--muted); }
  @media (max-height:280px){ .top-hint{ display:none } } /* yükseklik çok kısaysa ipucu gizle */

  .pad{
    flex:1 1 auto; width:100%;
    min-height:clamp(80px,24vh,130px);
    border:1px solid var(--stroke);
    border-radius:12px;
    background:linear-gradient(180deg, rgba(14,16,28,.92), rgba(12,14,22,.88));
    display:flex; align-items:center; justify-content:center;
    cursor:zoom-in; user-select:none;
    transition:transform .06s ease, box-shadow .12s ease, border-color .12s ease;
    box-shadow:0 8px 24px rgba(0,0,0,.35);
  }
  .pad:hover{ border-color:#3a4564; box-shadow:0 12px 32px rgba(0,0,0,.45) }
  .pad:active{ transform:scale(.995) }

  .face{
    color:#fff;
    font-size:clamp(32px,9.5vw,48px);
    font-weight:900; line-height:1;
    padding:8px 14px; border-radius:10px;
    min-width:clamp(64px,22vw,96px);
    text-align:center;
    background:#0d1220; border:1px solid var(--stroke);
  }

  .row{ display:flex; gap:6px; align-items:center; justify-content:center; flex-wrap:wrap }
  .chip{
    padding:6px 10px; border-radius:999px; border:1px solid var(--stroke);
    background:#0c1425; color:var(--fg); cursor:pointer;
    font-weight:700; font-size:clamp(11px,2.2vw,13px)
  }
  .ghost{ background:transparent }
  </style>

  <div id="pipBackdrop"></div>
  <div class="wrap">
    <div id="pipClock" class="clock">--:--:--</div>

    <div class="grid">
      <div class="card">
        <div id="pipTaskLabel" class="label">Task</div>
        <div id="pipTaskStatus" class="muted">—</div>
         <div id="pipTaskAmount" class="value-lg">0</div>
      </div>

      <div class="card">
        <div id="pipNextLabel" class="label">Next</div>
        <div id="pipNextName" class="muted">—</div>
        <div id="pipNextEta"    class="value-lg">--:--:--</div>
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

 // === Tema/WALLPAPER'ı PiP'e kopyala (cover, center, no-repeat) ===
const copyWallpaperToPip = () => {
  const src = document.getElementById('themeBackdrop');
  const wall = pip.document.getElementById('pipBackdrop');
  if (!src || !wall) return;

  const cs = getComputedStyle(src);

  // Görsel/gradient katmanlarını ve rengi al
  wall.style.backgroundImage    = cs.backgroundImage;    // url(...) veya gradient(...)
  wall.style.backgroundColor    = (cs.backgroundColor && cs.backgroundColor !== 'rgba(0, 0, 0, 0)') ? cs.backgroundColor : '#0b0d12';
  wall.style.backgroundPosition = cs.backgroundPosition || 'center';
  wall.style.backgroundRepeat   = 'no-repeat';
  wall.style.backgroundSize     = 'cover';
  wall.style.backgroundAttachment = 'fixed';             // pencereye sabitle
};

// ilk boyama
copyWallpaperToPip();

// Tema (html[data-theme]) değişince yeniden boya
const _mo = new MutationObserver(copyWallpaperToPip);
_mo.observe(document.documentElement, { attributes:true, attributeFilter:['data-theme'] });



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
    copyWallpaperToPip();
  }, 1000);

  // Temizlik
  pip.addEventListener('pagehide', () => {
    unCounter(); unLang(); clearInterval(syncTimer);
    _mo.disconnect();
  });
}
