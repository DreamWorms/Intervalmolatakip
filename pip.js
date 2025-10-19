// src/pip.js — Doc PiP penceresi
import { S, sub, setCounter, broadcast } from './state.js';

async function openDocPiP(){
  if (window.top !== window) {
    alert('Bu sayfa iframe içinde. Lütfen GitHub Pages / Netlify URL’sinde aç.');
    return;
  }
  if (!('documentPictureInPicture' in window)) {
    alert('Tarayıcı Document PiP desteklemiyor (Chrome/Edge önerilir).');
    return;
  }

  const pip = await window.documentPictureInPicture.requestWindow({ width: 380, height: 260, preferInitialWindowPlacement: true });

  pip.document.body.innerHTML = `
    <div style="font:14px system-ui,Inter; padding:12px; color:#e8ecf3; background:#0b0d12;">
      <div style="opacity:.7; margin-bottom:6px">Doc PiP</div>
      <div id="intervalWrap" style="opacity:.85; font-size:12px; margin-bottom:8px; display:none">
        <span id="intLabel"></span>
      </div>
      <div style="display:flex; gap:8px; align-items:center; justify-content:center; margin:6px 0">
        <button id="m" style="padding:6px 10px">−1</button>
        <div id="v" style="font-size:40px; font-weight:900; min-width:70px; text-align:center">0</div>
        <button id="p" style="padding:6px 10px">+1</button>
      </div>
      <div style="display:flex; justify-content:center">
        <button id="r" style="padding:6px 10px">Reset</button>
      </div>
      <div style="opacity:.6;font-size:11px;text-align:center;margin-top:6px">
        ↑ / ↓ / R / + / −
      </div>
    </div>
  `;

  const $ = (s, root=pip.document) => root.querySelector(s);
  const v = $('#v'), m = $('#m'), p = $('#p'), r = $('#r');
  const intWrap = $('#intervalWrap'), intLabel = $('#intLabel');

  // İlk değerleri boya
  v.textContent = String(S.counter);
  if (S.interval && S.interval.trim()){
    intLabel.textContent = S.interval;
    intWrap.style.display = '';
  }

  // Etkileşim
  p.onclick = () => { setCounter(S.counter + 1); broadcast('counter', S.counter); };
  m.onclick = () => { setCounter(S.counter - 1); broadcast('counter', S.counter); };
  r.onclick = () => { setCounter(0); broadcast('counter', S.counter); };

  // Ana pencere değişince PiP'i güncelle
  const un1 = sub('counter', (val) => { v.textContent = String(val); });
  const un2 = sub('interval', (txt) => {
    if (txt && txt.trim()){ intLabel.textContent = txt; intWrap.style.display = ''; }
    else { intWrap.style.display = 'none'; }
  });

  pip.addEventListener('pagehide', () => { un1(); un2(); });
}

export { openDocPiP };
