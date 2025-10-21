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
      --bg:#0b0d12; --stroke:#273246; --fg:#e9edf4; --muted:#9aa6b2;
    }
    *{box-sizing:border-box}
    html,body{height:100%}
    body{
      margin:0;
      font:14px/1.55 system-ui,Inter,Segoe UI,Roboto,Helvetica,Arial,sans-serif;
      color:var(--fg);
      background:transparent;         /* wallpaper alttan görünsün */
      overflow:hidden;                 /* alt beyazlık yok */
    }

    /* KAPSAYICI */
    .wrap{ padding:10px; display:grid; gap:8px; }

    /* ── HUD (üst tek satır) ───────────────────────────────────── */
    .hud{
      display:grid;
      grid-template-columns:minmax(0,1fr) auto minmax(0,1fr);
      align-items:center; gap:6px; min-width:0;
    }
    .clock{
      font-size:clamp(18px,6.2vw,28px);
      font-weight:900; text-align:center; white-space:nowrap;
    }
    .chip{
      display:flex; align-items:center; gap:6px; min-width:0;
      padding:4px 8px; border-radius:999px;
      background:rgba(13,17,26,.55);
      border:1px solid var(--stroke);
      backdrop-filter:saturate(120%) blur(6px);
      font-weight:800;
    }
    .chip .k{ font-size:clamp(11px,2.4vw,13px); opacity:.9 }
    .chip .v{ font-size:clamp(12px,2.8vw,14px); overflow:hidden; text-overflow:ellipsis; white-space:nowrap; }
    .chip .eta{ font-size:clamp(12px,3vw,16px); font-weight:900 }
    .chip .dot{
      width:8px;height:8px;border-radius:50%;
      background:#38d39f; box-shadow:0 0 8px #38d39f80;
    }
    @media (max-width:360px){ .chip .k{display:none} } /* aşırı darda etiketleri gizle */

    /* ── Sayaç alanı ───────────────────────────────────────────── */
    .counter{ display:flex; flex-direction:column; gap:6px }
    .top-hint{ text-align:right; font-size:clamp(10px,2.1vw,12px); color:var(--muted) }
    .pad{
      flex:1 1 auto; width:100%;
      min-height:clamp(100px,28vh,150px);
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
      font-size:clamp(36px,10.5vw,56px);
      font-weight:900; line-height:1;
      padding:10px 16px; border-radius:10px;
      min-width:clamp(74px,26vw,110px);
      text-align:center;
      background:#0d1220; border:1px solid var(--stroke);
    }
    .row{ display:flex; gap:6px; align-items:center; justify-content:center; flex-wrap:wrap }
    .chip-btn{
      padding:6px 12px; border-radius:999px; border:1px solid var(--stroke);
      background:#0c1425; color:var(--fg); cursor:pointer;
      font-weight:800; font-size:clamp(12px,2.6vw,14px)
    }
    .ghost{ background:transparent }
  </style>

  <div class="wrap">
    <!-- HUD -->
    <div class="hud">
      <div class="chip" id="leftChip">
        <span class="dot" id="taskDot" hidden></span>
        <span class="k" id="leftLabel">Mevcut</span>
        <span class="v" id="leftVal">0</span>
      </div>

      <div id="pipClock" class="clock">--:--:--</div>

      <div class="chip" id="rightChip">
        <span class="k" id="rightLabel">Sıradaki</span>
        <span class="v" id="nextName">—</span>
        <span class="eta" id="nextEta">--:--:--</span>
      </div>
    </div>

    <!-- Sayaç -->
    <div class="counter">
      <div class="top-hint" id="pipHint">Sol tık +1 · Sağ tık −1</div>
      <button id="pad" class="pad" title="Sol tık +1 · Sağ tık −1">
        <span id="v" class="face">0</span>
      </button>
      <div class="row">
        <button class="chip-btn" data-step="2">+2</button>
        <button class="chip-btn" data-step="4">+4</button>
        <button class="chip-btn" data-step="8">+8</button>
        <button id="r" class="chip-btn ghost">Sıfırla</button>
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

   // i18n etiketleri
  const paintTexts = () => {
    pip.document.getElementById('leftLabel').textContent  = t(S.lang,'taskTitle')       || 'Task';
    pip.document.getElementById('rightLabel').textContent = t(S.lang,'nextBreakTitle')  || 'Next';
    pip.document.getElementById('r').textContent          = t(S.lang,'reset')           || 'Reset';
    const hint = t(S.lang,'pipPadHint') || 'Sol tık +1 · Sağ tık −1';
    pip.document.getElementById('pipHint').textContent = hint;
    pip.document.getElementById('pad').title = hint;
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

   // Dashboard snapshot'ını HUD'a uygula
  const applyDash = (d) => {
    if (!d) return;
    pip.document.getElementById('pipClock').textContent = d.clock || '--:--:--';

    // Sol chip: mevcut görev/interval miktarı
    pip.document.getElementById('leftVal').textContent = String(d.task?.amount ?? 0);
    const dot = pip.document.getElementById('taskDot');
    if (d.task?.active) { dot.hidden = false; } else { dot.hidden = true; }

    // Sağ chip: sıradaki mola + ETA (tek satır)
    if (d.next){
      const name = [d.next.keyOrName, d.next.at].filter(Boolean).join(' ');
      pip.document.getElementById('nextName').textContent = name || '—';
      pip.document.getElementById('nextEta').textContent  = d.next.eta || '--:--:--';
    }else{
      pip.document.getElementById('nextName').textContent = '—';
      pip.document.getElementById('nextEta').textContent  = '--:--:--';
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
