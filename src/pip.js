// src/pip.js
import { S, sub, setCounter, broadcast } from './state.js';
import { t } from './i18n.js';

export async function openDocPiP(){
  if (window.top !== window) { alert('Lütfen siteyi top-level aç (Netlify/GitHub).'); return; }
  if (!('documentPictureInPicture' in window)) { alert('Tarayıcı Document PiP desteklemiyor.'); return; }

  const pip = await window.documentPictureInPicture.requestWindow({ width: 420, height: 320 });

  // ============ HTML + CSS ============
  pip.document.body.innerHTML = `
  <style>
    :root{
      /* Ana ekrandan kopyalanacak; şimdilik yedek değerler */
      --fg:#e9edf4; --muted:#9aa6b2; --surface:rgba(12,16,22,.58); --bd:rgba(144,224,255,.22);
      --accent:#19d4ff; --accent2:#ff2d95; --chip-bg:rgba(255,255,255,.06); --chip-bd:rgba(255,255,255,.16);
    }
    html, body{ height:100%; background:transparent !important; }
    body{ margin:0; font:14px/1.55 Inter,system-ui,Segoe UI,Roboto,Arial,sans-serif; color:var(--fg); }

    /* Duvar kâğıdı (ana ekrandan gelir) */
    #pipBackdrop{ position:fixed; inset:0; z-index:-1; background:#0b0d12 center/cover no-repeat fixed; }

    .wrap{ padding:10px; display:grid; gap:8px; }

    /* ÜST HUD: sol (interval), orta (saat), sağ (sıradaki) — tek satır, taşmadan */
    .hud{
      display:grid; grid-template-columns: minmax(0,1fr) auto minmax(0,1fr);
      align-items:center; gap:8px;
      background:var(--surface); border:1px solid var(--bd); border-radius:12px; padding:8px 10px;
    }
    .hud .cell{ min-width:0; }
    .hud .label{ font-weight:800; font-size:clamp(11px,2.6vw,12px); opacity:.9; }
    .hud .val{ font-weight:900; font-size:clamp(13px,3.4vw,16px); white-space:nowrap; overflow:hidden; text-overflow:ellipsis; }
    .hud .center{ text-align:center; }
    .clock{ font-size:clamp(18px,6vw,28px); font-weight:900; letter-spacing:.5px; }

    /* Sayaç kartı: alt tarafta tek büyük pad */
    .counter-card{
      display:flex; flex-direction:column; gap:6px;
      background:var(--surface); border:1px solid var(--bd); border-radius:12px; padding:8px;
    }
    .top-hint{ text-align:right; font-size:clamp(11px,2.2vw,12px); color:var(--muted); }

    .pad{
      flex:1 1 auto; width:100%;
      min-height:clamp(96px,26vh,150px);
      border:1px solid var(--bd); border-radius:12px;
      background:linear-gradient(180deg, rgba(14,16,28,.92), rgba(12,14,22,.88));
      display:flex; align-items:center; justify-content:center;
      cursor:zoom-in; user-select:none;
      transition:transform .06s ease, box-shadow .12s ease, border-color .12s ease;
      box-shadow:0 8px 24px rgba(0,0,0,.35);
    }
    .pad:hover{ border-color:var(--accent); box-shadow:0 12px 32px rgba(0,0,0,.45) }
    .pad:active{ transform:scale(.995) }

    .face{
      font-size:clamp(34px,10.5vw,56px); font-weight:900; line-height:1;
      padding:10px 16px; border-radius:10px; min-width:clamp(72px,26vw,110px); text-align:center;
      background:#0d1220; border:1px solid var(--accent); color:#fff;
      box-shadow: inset 0 0 10px color-mix(in srgb, var(--accent) 55%, transparent);
    }

    .row{ display:flex; gap:6px; align-items:center; justify-content:center; flex-wrap:wrap }
    .chip{
      padding:6px 12px; border-radius:999px; border:1px solid var(--bd);
      background:var(--chip-bg); color:var(--fg); cursor:pointer;
      font-weight:800; font-size:clamp(12px,2.6vw,14px)
    }
    .ghost{ background:transparent }
  </style>

  <div id="pipBackdrop"></div>

  <div class="wrap">
    <div class="hud">
      <div class="cell left">
        <div class="label" id="pipTaskLabel">Mevcut Interval</div>
        <div class="val"   id="pipTaskAmount">0</div>
      </div>
      <div class="cell center">
        <div class="clock" id="pipClock">--:--:--</div>
      </div>
      <div class="cell right" style="text-align:right">
        <div class="label" id="pipNextLabel">Sıradaki Mola</div>
        <div class="val"   id="pipNextEta">--:--:--</div>
      </div>
    </div>

    <div class="counter-card">
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
  `;

  const $ = (s, root=pip.document) => root.querySelector(s);

  // ——— Tema: değişkenleri ve duvar kâğıdını ana ekrandan aynen al
  const copyThemeVarsToPip = () => {
    const names = ['--fg','--muted','--surface','--bd','--accent','--accent2','--chip-bg','--chip-bd'];
    const cs = getComputedStyle(document.documentElement);
    names.forEach(n => {
      pip.document.documentElement.style.setProperty(n, cs.getPropertyValue(n).trim());
    });
  };

  const copyWallpaperToPip = () => {
    const src = document.getElementById('themeBackdrop');
    const wall = pip.document.getElementById('pipBackdrop');
    if (!src || !wall) return;
    const cs = getComputedStyle(src);
    wall.style.backgroundImage  = cs.backgroundImage;
    wall.style.backgroundColor  = cs.backgroundColor || '#0b0d12';
    wall.style.backgroundPosition = cs.backgroundPosition || 'center';
    wall.style.backgroundRepeat   = 'no-repeat';
    wall.style.backgroundSize     = 'cover';
    wall.style.backgroundAttachment = 'fixed';
  };

  copyThemeVarsToPip();
  copyWallpaperToPip();

  // Tema değiştikçe ve #themeBackdrop güncellendikçe senkron tut
  const mo = new MutationObserver(() => { copyThemeVarsToPip(); copyWallpaperToPip(); });
  mo.observe(document.documentElement, { attributes:true, attributeFilter:['data-theme'] });

  // ——— i18n
  const paintTexts = () => {
    $('#pipTaskLabel').textContent = t(S.lang, 'taskTitle')          || 'Task';
    $('#pipNextLabel').textContent = t(S.lang, 'nextBreakTitle')     || 'Next';
    $('#r').textContent            = t(S.lang, 'reset')              || 'Reset';
    $('#pipHint').textContent      = t(S.lang, 'pipPadHint')         || 'Sol tık +1 · Sağ tık −1';
    $('#pad').title                = $('#pipHint').textContent;
  };
  paintTexts();
  const unLang = sub('lang', paintTexts);

  // ——— Sayaç
  const v   = $('#v');
  const pad = $('#pad');
  v.textContent = String(S.counter);

  pad.addEventListener('click', () => {
    setCounter(S.counter + 1); broadcast('counter', S.counter);
  });
  pad.addEventListener('contextmenu', (e) => {
    e.preventDefault(); setCounter(S.counter - 1); broadcast('counter', S.counter);
  });
  pip.document.querySelectorAll('.chip[data-step]').forEach(btn=>{
    btn.addEventListener('click', () => {
      const inc = Number(btn.getAttribute('data-step')) || 0;
      setCounter(S.counter + inc); broadcast('counter', S.counter);
    });
  });
  $('#r').addEventListener('click', () => { setCounter(0); broadcast('counter', S.counter); });

  const unCounter = sub('counter', (val) => { v.textContent = String(val); });

  // ——— Dashboard snapshot
  const applyDash = (d) => {
    if (!d) return;
    $('#pipClock').textContent   = d.clock || '--:--:--';
    $('#pipTaskAmount').textContent  = String(d.task?.amount ?? 0);
    if (d.next){
      $('#pipNextEta').textContent  = d.next.eta;
    }else{
      $('#pipNextEta').textContent  = '--:--:--';
    }
  };

  applyDash(window.__KZS_LAST_DASH__);
  const syncTimer = setInterval(() => {
    if (pip.closed) { clearInterval(syncTimer); return; }
    applyDash(window.__KZS_LAST_DASH__);
    copyThemeVarsToPip();
    copyWallpaperToPip();
  }, 1000);

  pip.addEventListener('pagehide', () => {
    unCounter(); unLang(); mo.disconnect();
  });
}
