
// src/pip.js
import { S, sub, setCounter, broadcast } from './state.js';
import { t } from './i18n.js';

export async function openDocPiP(){
  if (window.top !== window) { alert('Lütfen siteyi top-level aç (Netlify/GitHub).'); return; }
  if (!('documentPictureInPicture' in window)) { alert('Tarayıcı Document PiP desteklemiyor.'); return; }

  const pip = await window.documentPictureInPicture.requestWindow({ width: 420, height: 320 });
  window.__PIP__ = pip;
  // ============ HTML + CSS ============
  pip.document.body.innerHTML = `
  <style>
  /* Güvenli gizleme */
[hidden]{ display:none !important; }
.no-alert #pipAlert{ display:none !important; }
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

    /* ==== 2 dk kala uyarı görünümü (overlay) ==== */
    .pip-alert{
      position: fixed; inset: 0; z-index: 5;
      display: grid; place-items: center;
      background: rgba(0,0,0,.35);
      backdrop-filter: blur(2px);
    }
    .pip-alert[hidden]{ display:none; }

    .pip-alert .alert-box{
      text-align:center;
      padding:14px 16px;
      border-radius:16px;
      border:1px solid rgba(255,255,255,.14);
      background: linear-gradient(180deg, rgba(18,22,30,.96), rgba(18,22,30,.86));
      box-shadow: 0 22px 60px rgba(0,0,0,.45);
      min-width:min(360px, 90vw);
    }

    .pip-alert .soon{ font-weight:900; letter-spacing:.4px; margin-bottom:6px; }
    .pip-alert .breakname{ font-weight:800; opacity:.95; margin-bottom:10px; }
    .pip-alert .ring{
      width:160px; height:160px; margin:6px auto 10px;
      border-radius:50%; position:relative; display:grid; place-items:center;
      background: radial-gradient(60% 60% at 50% 50%, rgba(255,111,177,.18), transparent 60%);
    }
    .pip-alert .ring::after{
      content:""; position:absolute; inset:-6px; border-radius:50%;
      border:6px solid transparent; border-top-color:#ff6fb1; border-right-color:#ff6fb1;
      animation: pipSpin 1s linear infinite; opacity:.9;
    }
    @keyframes pipSpin { to { transform: rotate(360deg); } }

    .pip-alert .countdown{
      font: 900 44px/1 ui-monospace, SFMono-Regular, Menlo, Consolas, monospace;
      letter-spacing:1px;
      padding:8px 10px; border-radius:12px;
      border:1px solid rgba(255,255,255,.16);
      background:linear-gradient(180deg, rgba(21,27,44,.65), rgba(12,18,32,.85));
    }

    /* uyarıdayken pencere kenarı hafif parlasın */
    body.alerting .counter-card,
    body.alerting .hud{
      border-color:#ff6fb1 !important;
      box-shadow: 0 0 0 1px rgba(255,111,177,.25), 0 18px 54px rgba(255,111,177,.28);
    }
  </style>

  <div id="pipBackdrop"></div>

  <div class="wrap">
    <div class="hud">
      <div class="cell left" id="hudTask">
        <div class="label" id="pipTaskLabel">Mevcut Interval</div>
        <div class="val"   id="pipTaskAmount">0</div>
      </div>
      <div class="cell center" id="hudClock">
        <div class="clock" id="pipClock">--:--:--</div>
      </div>
      <div class="cell right" style="text-align:right" id="hudNext">
        <div class="label" id="pipNextLabel">Sıradaki Mola</div>
        <div class="val"   id="pipNextEta">--:--:--</div>
      </div>
    </div>

    <div class="counter-card" id="counterCard">
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

  <!-- 2 dk kala uyarı overlay (HTML BLOĞU STYLE’IN DIŞINDA!) -->
  <div id="pipAlert" class="pip-alert" hidden>
  <div class="alert-box">
    <div id="pipSoon" class="soon">Mola Yaklaşıyor</div>
    <div id="alertName" class="breakname">—</div>
    <div class="ring"><div id="alertCd" class="countdown">02:00</div></div>
    <div id="pipPrepare" class="hint tiny">Hazırlan: su al, esneme yap, gözleri dinlendir…</div>
  </div>
</div>
  `;

  const $ = (s, root=pip.document) => root.querySelector(s);
// === PiP ayarlarını oku ve uygula ===
function pipCfg(){
  try{
    return Object.assign(
      { showClock:true, showTask:true, showNext:true, showCounter:true, alertOverlay:true },
      window.__KZS_PIPCFG__ || JSON.parse(localStorage.getItem('kzs_pip_cfg_v1')||'{}')
    );
  }catch{
    return { showClock:true, showTask:true, showNext:true, showCounter:true, alertOverlay:true };
  }
}

function applyPipLayout(){
  const c = pipCfg();
  const D = pip.document;

  // Görünürlük
  D.getElementById('hudTask').hidden     = !c.showTask;
  D.getElementById('hudClock').hidden    = !c.showClock;
  D.getElementById('hudNext').hidden     = !c.showNext;
  D.getElementById('counterCard').hidden = !c.showCounter;

  // Üst HUD kolonlarını görünene göre ayarla
  const hud = D.querySelector('.hud');
  const vis = [c.showTask, c.showClock, c.showNext].filter(Boolean).length;
  if (hud){
    hud.style.gridTemplateColumns =
      vis===3 ? 'minmax(0,1fr) auto minmax(0,1fr)' :
      vis===2 ? '1fr 1fr' : '1fr';
  }

  // 2 dk overlay kapalıysa işaret bırak
  D.body.classList.toggle('no-alert', !c.alertOverlay);
}

// açılışta uygula + ayar değişince tekrar boya
applyPipLayout();
const unPipCfg = (sub && sub('pipCfg', applyPipLayout)) || null;



  // ==== UYARI MODU (2 dk kala) ====
  let inAlert = false;
  let lastBreakName = (document.getElementById('nextBreakName')?.textContent || 'Mola').trim();

  function parseEtaToSeconds(txt){
    const m = (txt||'').match(/(\d{1,2}):(\d{2}):(\d{2})/);
    if (!m) return null;
    return (+m[1])*3600 + (+m[2])*60 + (+m[3]);
  }
  function fmtMMSS(secs){
    const m = Math.floor(secs/60), s = secs%60;
    return String(m).padStart(2,'0') + ':' + String(s).padStart(2,'0');
  }
  function enterAlert(secs){
    if (inAlert) {
      $('#alertCd').textContent = fmtMMSS(secs);
      $('#alertName').textContent = lastBreakName;
      return;
    }
    inAlert = true;
    $('#alertName').textContent = lastBreakName;
    $('#alertCd').textContent = fmtMMSS(secs);
    pip.document.body.classList.add('alerting');
    $('#pipAlert').hidden = false;
  }
  function exitAlert(){
    if (!inAlert) return;
    inAlert = false;
    pip.document.body.classList.remove('alerting');
    $('#pipAlert').hidden = true;
  }
  
  function checkAlertByEta(){
  // Ayarlardan overlay kapalıysa hiçbir şey göstermeyelim
  if (pip.document.body.classList.contains('no-alert')) { 
    exitAlert(); 
    return; 
  }
  const txt  = $('#pipNextEta')?.textContent || '';
  const secs = parseEtaToSeconds(txt);
  if (secs!=null && secs <= 120 && secs >= 0) enterAlert(secs);
  else exitAlert();
}


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
  window.__DBG_copyWallToPip = copyWallpaperToPip;
  copyThemeVarsToPip();
  copyWallpaperToPip();

  // Tema değiştikçe ve #themeBackdrop güncellendikçe senkron tut
  const mo = new MutationObserver(() => { copyThemeVarsToPip(); copyWallpaperToPip(); });
  mo.observe(document.documentElement, { attributes:true, attributeFilter:['data-theme'] });

  // ——— i18n
  const paintTexts = () => {
    $('#pipTaskLabel').textContent = t(S.lang, 'taskTitle')      || 'Task';
    $('#pipNextLabel').textContent = t(S.lang, 'nextBreakTitle') || 'Next';
    $('#r').textContent            = t(S.lang, 'reset')          || 'Reset';
    $('#pipHint').textContent      = t(S.lang, 'pipPadHint')     || 'Sol tık +1 · Sağ tık −1';
    $('#pad').title                = $('#pipHint').textContent;
    const soon = $('#pipSoon');     if (soon) soon.textContent = t(S.lang, 'pipSoonTitle');
    const prep = $('#pipPrepare');  if (prep) prep.textContent = t(S.lang, 'pipPrepareHint');
};
  paintTexts();
  applyPipLayout();
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
    $('#pipClock').textContent       = d.clock || '--:--:--';
    $('#pipTaskAmount').textContent  = String(d.task?.amount ?? 0);
    if (d.next){
      // isim varsa al; yoksa ana sayfadaki #nextBreakName’den kopyala
      lastBreakName = (d.next.name || document.getElementById('nextBreakName')?.textContent || lastBreakName || 'Mola').trim();
      $('#pipNextEta').textContent  = d.next.eta;
    } else {
      $('#pipNextEta').textContent  = '--:--:--';
    }
  };

  applyDash(window.__KZS_LAST_DASH__);
  const syncTimer = setInterval(() => {
    if (pip.closed) { clearInterval(syncTimer); return; }
    applyDash(window.__KZS_LAST_DASH__);
    checkAlertByEta();          // 2 dk kala uyarıyı yönet
    copyThemeVarsToPip();
    copyWallpaperToPip();
    applyPipLayout();
  }, 1000);

 pip.addEventListener('pagehide', () => {
  unCounter(); unLang(); mo.disconnect(); unPipCfg && unPipCfg();
});
}


