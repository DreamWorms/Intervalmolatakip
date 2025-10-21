// src/pip.js — PiP: üst bar (interval • saat • mola ETA) + büyük sayaç
import { S, sub, setCounter, broadcast } from './state.js';
import { t } from './i18n.js';

export async function openDocPiP(){
  if (window.top !== window) { alert('Lütfen siteyi top-level aç (Netlify/GitHub).'); return; }
  if (!('documentPictureInPicture' in window)) { alert('Tarayıcı Document PiP desteklemiyor.'); return; }

  const pip = await window.documentPictureInPicture.requestWindow({ width: 460, height: 340 });

  pip.document.body.innerHTML = `
  <style>
    html,body{height:100%; background:transparent !important; overflow:hidden}
    *{box-sizing:border-box}

    /* Arka planı ana sayfadaki #themeBackdrop'tan kopyalayacağız */
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
    .wrap{
      height:100%;
      padding:10px;
      display:grid;
      grid-template-rows:auto 1fr auto;
      gap:8px;
    }

    /* ÜST BAR — 3 sütun: interval • saat • mola ETA */
    .topbar{
      display:grid;
      grid-template-columns: 1fr auto 1fr;
      align-items:center;
      gap:8px;
      padding:6px 8px;
      border:1px solid var(--stroke);
      border-radius:12px;
      background:var(--panel);
      backdrop-filter:saturate(120%) blur(6px);
    }
    .seg{min-width:0; display:flex; align-items:center; gap:6px}
    .seg.l{justify-content:flex-start}
    .seg.c{justify-content:center}
    .seg.r{justify-content:flex-end; text-align:right}

    .k{font-weight:800; opacity:.9; font-size:clamp(11px,2.5vw,12px)}
    .v{font-weight:800; font-size:clamp(14px,3.6vw,18px)}
    .sub{color:var(--muted); font-size:clamp(11px,2.8vw,12px)}
    .clock{
      font-weight:900;
      font-size:clamp(18px,6.2vw,28px);
      text-shadow:0 2px 10px rgba(0,0,0,.45);
    }

    /* SAYAÇ alanı: tüm kalan alanı doldurur */
    .counter{
      display:flex; flex-direction:column; gap:6px; min-height:0;
    }
    .pad{
      flex:1 1 auto; width:100%;
      min-height:clamp(110px, 26vh, 200px);
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
      font-size:clamp(40px, 12vw, 68px);
      font-weight:900; line-height:1;
      padding:10px 16px; border-radius:10px;
      min-width:clamp(74px, 30vw, 120px);
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
  </style>

  <div id="pipBackdrop" aria-hidden="true"></div>

  <div class="wrap">
    <div class="topbar">
      <div class="seg l">
        <span class="k" id="tbTaskLabel">Interval</span>
        <span class="v" id="tbTaskVal">0</span>
      </div>
      <div class="seg c">
        <div id="pipClock" class="clock">--:--:--</div>
      </div>
      <div class="seg r">
        <div style="display:flex;flex-direction:column;align-items:flex-end;gap:2px;min-width:0">
          <div><span class="k" id="tbNextLabel">Next</span> · <span class="v" id="tbNextEta">--:--:--</span></div>
          <div class="sub" id="tbNextName">—</div>
        </div>
      </div>
    </div>

    <div class="counter">
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

  /* === Tema/WALLPAPER senkronu === */
  const copyWallpaperToPip = () => {
    const src  = document.getElementById('themeBackdrop');
    const wall = pip.document.getElementById('pipBackdrop');
    if (!src || !wall) return;
    const cs = getComputedStyle(src);
    wall.style.backgroundImage      = cs.backgroundImage;
    wall.style.backgroundColor      = (cs.backgroundColor && cs.backgroundColor !== 'rgba(0, 0, 0, 0)') ? cs.backgroundColor : '#0b0d12';
    wall.style.backgroundPosition   = cs.backgroundPosition || 'center';
    wall.style.backgroundRepeat     = 'no-repeat';
    wall.style.backgroundSize       = 'cover';
    wall.style.backgroundAttachment = 'fixed';
  };
  copyWallpaperToPip();
  const themeObserver = new MutationObserver(copyWallpaperToPip);
  themeObserver.observe(document.documentElement, { attributes:true, attributeFilter:['data-theme'] });

  /* === i18n === */
  const paintTexts = () => {
    $('#tbTaskLabel').textContent = t(S.lang,'taskTitle')      || 'Interval';
    $('#tbNextLabel').textContent = t(S.lang,'nextBreakTitle') || 'Next';
    $('#r').textContent           = t(S.lang,'reset')          || 'Reset';

    // Pad ipucu başlıkta kalsın
    const hint = t(S.lang,'pipPadHint') || 'Sol tık +1 · Sağ tık −1';
    $('#pad').title = hint;
  };
  paintTexts();
  const unLang = sub('lang', paintTexts);

  /* === Sayaç === */
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

  /* === Dashboard snapshot: üst barı doldur === */
  const applyDash = (d) => {
    if (!d) return;
    $('#pipClock').textContent = d.clock || '--:--:--';

    // Sol segment: mevcut interval (eski "task" miktarını kullanıyoruz)
    $('#tbTaskVal').textContent = String(d.task?.amount ?? 0);

    // Sağ segment: sıradaki mola
    if (d.next){
      const nameAt = `${d.next.keyOrName} ${d.next.at}`;
      $('#tbNextName').textContent = nameAt;
      $('#tbNextEta').textContent  = d.next.eta;
    }else{
      $('#tbNextName').textContent = '—';
      $('#tbNextEta').textContent  = '--:--:--';
    }
  };

  applyDash(window.__KZS_LAST_DASH__);
  const syncTimer = setInterval(() => {
    if (pip.closed) { clearInterval(syncTimer); return; }
    applyDash(window.__KZS_LAST_DASH__);
    copyWallpaperToPip();
  }, 1000);

  pip.addEventListener('resize', () => { /* layout, clamp ile otomatik */ });

  pip.addEventListener('pagehide', () => {
    unCounter(); unLang(); clearInterval(syncTimer); themeObserver.disconnect();
  });
}
