// src/pip.js — PiP: saat + görev + sıradaki mola + sayaç
import { S, sub, setCounter, broadcast } from './state.js';

async function openDocPiP(){
  if (window.top !== window) { alert('Lütfen siteyi top-level aç (Netlify/GitHub).'); return; }
  if (!('documentPictureInPicture' in window)) { alert('Tarayıcı Document PiP desteklemiyor.'); return; }

  const pip = await window.documentPictureInPicture.requestWindow({ width: 420, height: 320 });

  pip.document.body.innerHTML = `
    <div style="font:14px system-ui,Inter; padding:12px; color:#e8ecf3; background:#0b0d12;">
      <div id="pipClock" style="font-size:28px; font-weight:900; text-align:center; margin:2px 0 8px">--:--:--</div>

      <div style="display:grid; grid-template-columns: 1fr 1fr; gap:8px;">
        <div style="border:1px solid #2a3040; border-radius:12px; padding:8px;">
          <div style="opacity:.8; font-weight:700; margin-bottom:4px">Task</div>
          <div id="pipTaskStatus" style="opacity:.7">—</div>
          <div id="pipTaskAmount" style="font-size:20px; font-weight:800; margin-top:4px">0</div>
        </div>

        <div style="border:1px solid #2a3040; border-radius:12px; padding:8px;">
          <div style="opacity:.8; font-weight:700; margin-bottom:4px">Next</div>
          <div id="pipNextName" style="opacity:.7">—</div>
          <div id="pipNextEta" style="font-size:20px; font-weight:800; margin-top:4px">--:--:--</div>
        </div>
      </div>

      <div style="display:flex; gap:8px; align-items:center; justify-content:center; margin:10px 0 0">
        <button id="m" style="padding:6px 10px">−1</button>
        <div id="v" style="font-size:34px; font-weight:900; min-width:70px; text-align:center">0</div>
        <button id="p" style="padding:6px 10px">+1</button>
        <button id="r" style="padding:6px 10px; margin-left:6px">Reset</button>
      </div>
    </div>
  `;

  const applyDash = (d)=>{
    if (!d) return;
    pip.document.getElementById('pipClock').textContent = d.clock || '--:--:--';
    pip.document.getElementById('pipTaskStatus').textContent = d.task?.active ? 'Active' : '—';
    pip.document.getElementById('pipTaskAmount').textContent = String(d.task?.amount ?? 0);
    if (d.next){
      pip.document.getElementById('pipNextName').textContent = `${d.next.keyOrName} ${d.next.at}`;
      pip.document.getElementById('pipNextEta').textContent = d.next.eta;
    }else{
      pip.document.getElementById('pipNextName').textContent = '—';
      pip.document.getElementById('pipNextEta').textContent = '--:--:--';
    }
  };

  // AÇILIŞTA ANINDA DOLDUR
  applyDash(window.__KZS_LAST_DASH__);

  const $ = (s, root=pip.document) => root.querySelector(s);
  const v = $('#v'), m = $('#m'), p = $('#p'), r = $('#r');

  // Sayaç ilk değeri
  v.textContent = String(S.counter);

  // Sayaç etkileşim
  p.onclick = () => { setCounter(S.counter + 1); broadcast('counter', S.counter); };
  m.onclick = () => { setCounter(S.counter - 1); broadcast('counter', S.counter); };
  r.onclick = () => { setCounter(0); broadcast('counter', S.counter); };

  // Ana pencereden yayınlara abone ol: counter + dashboard
  const un1 = sub('counter', (val) => { v.textContent = String(val); });
  const unDash = sub('dashboard', (d) => {
    if (!d) return;
    $('#pipClock').textContent = d.clock || '--:--:--';
    $('#pipTaskStatus').textContent = d.task?.active ? 'Active' : '—';
    $('#pipTaskAmount').textContent = String(d.task?.amount ?? 0);
    if (d.next){
      $('#pipNextName').textContent = `${d.next.keyOrName} ${d.next.at}`;
      $('#pipNextEta').textContent = d.next.eta;
    }else{
      $('#pipNextName').textContent = '—';
      $('#pipNextEta').textContent = '--:--:--';
    }
  });

  pip.addEventListener('pagehide', () => { un1(); unDash(); });
}

export { openDocPiP };
