// src/pip.js — PiP: saat + görev + sıradaki mola + sayaç (auto-compact + theme sync)
import { S, sub, setCounter, broadcast } from './state.js';
import { t } from './i18n.js';

export async function openDocPiP(){
  if (window.top !== window) { alert('Lütfen siteyi top-level aç (Netlify/GitHub).'); return; }
  if (!('documentPictureInPicture' in window)) { alert('Tarayıcı Document PiP desteklemiyor.'); return; }

  const pip = await window.documentPictureInPicture.requestWindow({ width: 460, height: 360 });

  // === UI ===
  pip.document.body.innerHTML = `
  <style>
    html,body{height:100%; background:transparent !important; overflow:hidden}
    *{box-sizing:border-box}

    /* --- Wallpaper: ana sayfadaki #themeBackdrop'tan kopyalanır --- */
    #pipBackdrop{
      position:fixed; inset:0; z-index:-1;
      background:#0b0d12 center/cover no-repeat fixed;
    }

    :root{
      --panel: rgba(10,14,22,.70);
      --stroke:#273246;
      --fg:#e9edf4;
      --muted:#9aa6b2;
    }
    body{
      margin:0; color:var(--fg);
      font:14px/1.55 system-ui,Inter,Segoe UI,Roboto,Helvetica,Arial,sans-serif;
    }

    /* Yerleşim: saat + (iki kart / ya da compact'ta mini-özet) + sayaç */
    .wrap{ padding:10px; display:grid; gap:8px; min-height:100% }

    .clock{
      font-size:clamp(18px,5.6vw,28px);
      font-weight:900; text-align:center; margin:0 0 4px;
      text-shadow:0 2px 10px rgba(0,0,0,.45);
    }

    /* Normal görünüm: iki kart yan yana */
    .grid{
      display:grid; grid-template-columns:1fr 1fr; gap:8px; align-items:start; min-width:0;
    }
    .card{
      background:var(--panel);
      backdrop-filter:saturate(120%) blur(6px);
      border:1px solid var(--stroke);
      border-radius:12px;
      padding:clamp(6px,1.6vw,10px);
      min-width:0;
    }
    .label{
      opacity:.9; font-weight:800; letter-spacing:.2px; margin-bottom:2px;
      font-size:clamp(12px,2.6vw,14px);
    }
    .muted{ color:var(--muted); font-size:clamp(12px,2.8vw,14px); }
    .value-lg{ font-size:clamp(18px,3.6vw,22px); font-weight:800; margin-top:4px; }

    /* Mini-özet satırı: sadece compact modda görünür */
    .mini-row{ display:none; gap:6px; }
    .stat{
      flex:1 1 0; display:flex; align-items:baseline; justify-content:space-between; gap:6px;
      padding:6px 8px; border-radius:12px; border:1px solid var(--stroke); background:var(--panel);
    }
    .stat .k{ font-weight:800; opacity:.9; font-size:clamp(11px,2.5vw,12px) }
    .stat .v{ font-weight:800; font-size:clamp(14px,3vw,16px) }

    /* Sayaç bloğu */
    .counter-card{ grid-column:1 / -1; display:flex; flex-direction:column; gap:6px; }
    .top-hint{ text-align:right; font-size:clamp(11px,2.2vw,12px); color:var(--muted); }

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
      text-shadow:0 2px 10px rgba(0,0,0,.35);
    }

    .row{ display:flex; gap:6px; align-items:center; justify-content:center; flex-wrap:wrap }
    .chip{
      padding:6px 12px; border-radius:999px; border:1px solid var(--stroke);
      background:#0c1425; color:var(--fg); cursor:pointer;
      font-weight:800; font-size:clamp(12px,2.6vw,14px)
    }
    .ghost{ background:transparent }

    /* --- COMPACT MOD: çok dar veya alçaksa alanı kurtar --- */
    body.compact .grid{ display:none; }
    body.compact .mini-row{ display:flex; }
    body.compact .pad{ min-height:clamp(84px,26vh,120px); }
    body.compact .clock{ font-size:clamp(16px,6.2vw,22px); }
    body.compact .face{ font-size:clamp(34px,12vmin,54px); min-width:clamp(70px,34vw,110px); }
  </style>

  <div id="pipBackdrop" aria-hidden="true"></div>

  <div class="wrap">
    <div id="pipClock" class="clock">--:--:--</div>

    <!-- Mini özet (compact'ta görünür) -->
    <div class="mini-row">
      <div class="stat">
        <span class="k" id="miniTaskLabel">Task</span>
        <span class="v" id="miniTaskV">0</span>
      </div>
      <div class="stat">
        <span style="display:flex;gap:6px;align-items:baseline">
          <span class="k" id="miniNextLabel">Next</span>
          <span class="v" id="miniNextV">—</span>
        </span>
        <span class="v" id="miniNextEta">--:--:--</span>
      </div>
    </div>

    <!-- Normal kartlar (compact dışı) -->
    <div class="grid">
      <div class="card">
        <div id="pipTaskLabel" class="label">Task</div>
        <div id="pipTaskStatus" class="muted">—</div>
        <div id="pipTaskAmount" class="value-lg">0</div>
      </div>

      <div class="card">
        <div id="pipNextLabel" class="label">Next</div>
        <div id="pipNextName" class="muted">—</div>
        <div id="pipNextEta" class="value-lg">--:--:--</div>
      </div>

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

  const $ = (s, root=pip.document) => root.querySelector(s);

  /* === Wallpaper/tema senkronu — ana sayfadaki #themeBackdrop'u kopyala === */
  const copyWallpaperToPip = () => {
    const src  = document.getElementById('themeBackdrop');
    const wall = pip.document.getElementById('pipBackdrop');
    if (!src || !wall) return;
    const cs = getComputedStyle(src);
    wall.style.backgroundImage      = cs.backgroundImage;                         // url(...) +/ veya gradient(...)
    wall.style.backgroundColor      = (cs.backgroundColor && cs.backgroundColor !== 'rgba(0, 0, 0, 0)') ? cs.backgroundColor : '#0b0d12';
    wall.style.backgroundPosition   = cs.backgroundPosition || 'center';
    wall.style.backgroundRepeat     = 'no-repeat';
    wall.style.backgroundSize       = 'cover';
    wall.style.backgroundAttachment = 'fixed';
  };
  copyWallpaperToPip();
  const themeObserver = new MutationObserver(copyWallpaperToPip);
  themeObserver.observe(document.documentElement, { attributes:true, attributeFilter:['data-theme'] });

  /* === Auto-compact: pencere çok dar/alçaksa bilgileri “çipe” indir === */
  function fitMode(){
    const compact = (pip.innerWidth < 430) || (pip.innerHeight < 320);
    pip.document.body.classList.toggle('compact', compact);
  }
  fitMode();
  pip.addEventListener('resize', fitMode);

  /* === i18n === */
  const paintTexts = () => {
    $('#pipTaskLabel').textContent  = t(S.lang,'taskTitle')      || 'Task';
    $('#miniTaskLabel').textContent = t(S.lang,'taskTitle')      || 'Task';

    $('#pipNextLabel').textContent  = t(S.lang,'nextBreakTitle') || 'Next';
    $('#miniNextLabel').textContent = t(S.lang,'nextBreakTitle') || 'Next';

    $('#r').textContent             = t(S.lang,'reset')          || 'Reset';
    const hint = t(S.lang,'pipPadHint') || 'Sol tık +1 · Sağ tık −1';
    $('#pipHint').textContent = hint;
    $('#pad').title          = hint;
  };
  paintTexts();
  const unLang = sub('lang', paintTexts);

  /* === Sayaç etkileşimi + senkron === */
  const v   = $('#v');
  const pad = $('#pad');
  v.textContent = String(S.counter);

  pad.addEventListener('click', () => {
    setCounter(S.counter + 1);
    broadcast('counter', S.counter);
  });
  pad.addEventListener('contextmenu', (e) => {
    e.preventDefault();
    setCounter(S.counter - 1);
    broadcast('counter', S.counter);
  });
  pip.document.querySelectorAll('.chip[data-step]').forEach(btn=>{
    btn.addEventListener('click', () => {
      const inc = Number(btn.getAttribute('data-step')) || 0;
      setCounter(S.counter + inc);
      broadcast('counter', S.counter);
    });
  });
  $('#r').addEventListener('click', () => { setCounter(0); broadcast('counter', S.counter); });
  const unCounter = sub('counter', (val) => { v.textContent = String(val); });

  /* === Dashboard snapshot'ını uygula (kart + mini-özet birlikte) === */
  const applyDash = (d) => {
    if (!d) return;
    $('#pipClock').textContent = d.clock || '--:--:--';

    // Görev
    $('#pipTaskStatus').textContent = d.task?.active ? (t(S.lang,'taskActive') || 'Active') : '—';
    $('#pipTaskAmount').textContent = String(d.task?.amount ?? 0);
    $('#miniTaskV').textContent     = String(d.task?.amount ?? 0);

    // Sıradaki mola
    if (d.next){
      const nameAt = `${d.next.keyOrName} ${d.next.at}`;
      $('#pipNextName').textContent = nameAt;
      $('#pipNextEta').textContent  = d.next.eta;

      $('#miniNextV').textContent   = nameAt;
      $('#miniNextEta').textContent = d.next.eta;
    }else{
      $('#pipNextName').textContent = '—';
      $('#pipNextEta').textContent  = '--:--:--';

      $('#miniNextV').textContent   = '—';
      $('#miniNextEta').textContent = '--:--:--';
    }
  };

  // Açılışta doldur + her saniye snapshot & wallpaper tazele
  applyDash(window.__KZS_LAST_DASH__);
  const syncTimer = setInterval(() => {
    if (pip.closed) { clearInterval(syncTimer); return; }
    applyDash(window.__KZS_LAST_DASH__);
    copyWallpaperToPip();
  }, 1000);

  // Temizlik
  pip.addEventListener('pagehide', () => {
    unCounter();
    unLang();
    clearInterval(syncTimer);
    themeObserver.disconnect();
  });
}
