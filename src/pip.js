// src/pip.js — Doc PiP: 2 dk kala uyarı ekranı
let pipEl, visible = false, watchTimer = null, inAlert = false;

export function openDocPiP() {
  ensurePip();
  visible = !visible;
  pipEl.hidden = !visible;
  pipEl.setAttribute('aria-hidden', String(!visible));
  if (visible) startWatch(); else stopWatch();
}

/* ----------------- helpers ----------------- */
function ensurePip(){
  if (pipEl) return;
  pipEl = document.createElement('div');
  pipEl.id = 'docPip';
  pipEl.className = 'docpip';
  pipEl.setAttribute('aria-hidden','true');
  pipEl.hidden = true;

  pipEl.innerHTML = `
    <div class="docpip-head">
      <strong class="title">Doc PiP</strong>
      <div class="head-actions">
        <button id="docpipClose" class="kzBtn">✕</button>
      </div>
    </div>
    <div class="docpip-body">
      <!-- Normal görünüm -->
      <div class="docpip-normal">
        <div class="row">
          <div class="mini muted">Sıradaki Mola</div>
          <div id="docpipNextName" class="k strong">—</div>
        </div>
        <div class="row">
          <div class="mini muted">ETA</div>
          <div id="docpipNextEta" class="k mono">--:--:--</div>
        </div>
        <div class="tiny muted" style="margin-top:6px">2 dk kala otomatik uyarı görünümüne geçer.</div>
      </div>

      <!-- Uyarı görünümü (2 dk kala) -->
      <div class="docpip-alert" hidden>
        <div class="soon">Mola Yaklaşıyor</div>
        <div id="docpipBreak" class="breakname">—</div>
        <div class="ring">
          <div id="docpipCountdown" class="countdown">02:00</div>
        </div>
        <div class="hint tiny">Hazırlan: su molası, esneme, hızlı göz dinlendirme…</div>
      </div>
    </div>
  `;
  document.body.appendChild(pipEl);

  const closeBtn = pipEl.querySelector('#docpipClose');
  closeBtn.addEventListener('click', () => { visible = false; pipEl.hidden = true; pipEl.setAttribute('aria-hidden','true'); stopWatch(); });

  // ilk boyama
  updateNormal();
}

function startWatch(){
  if (watchTimer) return;
  updateNormal();
  watchTimer = setInterval(checkEta, 1000);
}
function stopWatch(){
  if (watchTimer) clearInterval(watchTimer);
  watchTimer = null;
  // görünümü güvenli hâle getir
  exitAlert(true);
}

/* ---- ETA okuma: #nextBreakEta / #nextBreakName üzerinden ---- */
function checkEta(){
  const etaEl  = document.getElementById('nextBreakEta');
  const nameEl = document.getElementById('nextBreakName');
  const secs = parseEtaToSeconds(etaEl?.textContent || '');
  if (secs != null && secs <= 120 && secs >= 0){
    enterAlert(secs, (nameEl?.textContent || 'Mola').trim());
  } else {
    exitAlert();
    updateNormal();
  }
}

function updateNormal(){
  const nameEl = document.getElementById('nextBreakName');
  const etaEl  = document.getElementById('nextBreakEta');
  const n = pipEl?.querySelector('#docpipNextName');
  const e = pipEl?.querySelector('#docpipNextEta');
  if (n) n.textContent = (nameEl?.textContent || '—').trim();
  if (e) e.textContent = (etaEl?.textContent || '--:--:--').trim();
}

function parseEtaToSeconds(txt){
  const m = (txt||'').match(/(\d{1,2}):(\d{2}):(\d{2})/);
  if (!m) return null;
  const h = +m[1], min = +m[2], s = +m[3];
  return h*3600 + min*60 + s;
}
function fmtMMSS(secs){
  const m = Math.floor(secs/60);
  const s = secs % 60;
  return String(m).padStart(2,'0') + ':' + String(s).padStart(2,'0');
}

/* ---- Uyarı görünümü ---- */
function enterAlert(secs, name){
  if (!pipEl) return;
  if (!inAlert){
    inAlert = true;
    pipEl.classList.add('alert');
    pipEl.querySelector('.docpip-normal').hidden = true;
    pipEl.querySelector('.docpip-alert').hidden  = false;
  }
  const cd = pipEl.querySelector('#docpipCountdown');
  const nm = pipEl.querySelector('#docpipBreak');
  if (cd) cd.textContent = fmtMMSS(secs);
  if (nm) nm.textContent = name || 'Mola';
  if (secs <= 0) exitAlert(); // bittiğinde normal görünüme dön
}
function exitAlert(force=false){
  if (!pipEl) return;
  if (!inAlert && !force) return;
  inAlert = false;
  pipEl.classList.remove('alert');
  const alertBox = pipEl.querySelector('.docpip-alert');
  const normal   = pipEl.querySelector('.docpip-normal');
  if (alertBox) alertBox.hidden = true;
  if (normal)   normal.hidden   = false;
}
