// src/pip.js — PiP: saat + görev + sıradaki mola + sayaç (+2/+4/+8)
import { S, sub, setCounter, broadcast } from './state.js';

async function openDocPiP(){
  if (window.top !== window) { alert('Lütfen siteyi top-level aç (Netlify/GitHub).'); return; }
  if (!('documentPictureInPicture' in window)) { alert('Tarayıcı Document PiP desteklemiyor.'); return; }

  const pip = await window.documentPictureInPicture.requestWindow({ width: 420, height: 340 });

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
      </div>

      <div style="display:flex; gap:8px; align-items:center; justify-content:center; margin:8px 0 0">
        <button id="s2" style="padding:6px 10px">+2</button>
        <button id="s4" style="padding:6px 10px">+4</button>
        <button id="s8" style="padding:6px 10px">+8</button>
        <button id="r"  style="padding:6px 10px; margin-left:6px">Sıfırla</button>
      </div>
    </div>
  `;

  const $ = (s, root=pip.document) => root.querySelector(s);
  const v = $('#v'), m = $('#m'), p = $('#p'), r = $('#r');
  const s2 = $('#s2'), s4 = $('#s4'), s8 = $('#s8');

  // sayacı başlat
  v.textContent = String(S.counter);

  const bump = (d) => { setCounter(S.counter + d); broadcast('counter', S.counter); };

  // etkileşimler
  p.onclick = () => bump(+1);
  m.onclick = () => bump(-1);
  r.onclick = () => { setCounter(0); broadcast('counter', S.counter); };
  s2.onclick = () => bump(+2);
  s4.onclick = () => bump(+4);
  s8.onclick = () => bump(+8);

  // ana sayfa -> PiP senkronu (counter)
  const unCounter = sub('counter', (val) => { v.textContent = String(val); });

  // dashboard snapshot'ını düzenli uygula
  const applyDash = (d) => {
    if (!d) return;
    $('#pipClock').textContent = d.clock || '--:--:--';
    $('#pipTaskStatus').textContent = d.task?.active ? 'Active' : '—';
    $('#pipTaskAmount').textContent = String(d.task?.amount ?? 0);
    if (d.next){
      $('#pipNextName').textContent = `${d.next.keyOrName} ${d.next.at}`;
      $('#pipNextEta').textContent  = d.next.eta;
    }else{
      $('#pipNextName').textContent = '—';
      $('#pipNextEta').textContent  = '--:--:--';
    }
  };

  applyDash(window.__KZS_LAST_DASH__);
  const syncTimer = setInterval(() => {
    if (pip.closed) { clearInterval(syncTimer); return; }
    applyDash(window.__KZS_LAST_DASH__);
  }, 1000);

  pip.addEventListener('pagehide', () => {
    unCounter();
    clearInterval(syncTimer);
  });
}

export { openDocPiP };

