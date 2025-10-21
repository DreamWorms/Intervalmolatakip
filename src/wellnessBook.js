// src/wellnessBook.js — Wellness Defteri (haftalık)
// Not: modül değil. Dock'tan açılınca kendi UI'sını kurar.

(function () {
  const $  = (s, r=document) => r.querySelector(s);
  const $$ = (s, r=document) => Array.from(r.querySelectorAll(s));
  const on = (el, ev, fn) => el && el.addEventListener(ev, fn, {passive:false});

  // ---- i18n helper
  const getLang = () => ($('#langSelect')?.value || 'tr');
  const TT = (k) => {
    const L = getLang(); const P = window.I18N || {};
    return (P[L] && P[L][k]) || (P.tr && P.tr[k]) || k;
  };
  const LOCALE = { tr:'tr-TR', en:'en-US', de:'de-DE', bg:'bg-BG' };

  // ---- Config (plan & hedef)
  const WEEK_TARGET = 150;           // alt barda "Toplam X / 150 dk"
  const PLAN = [62, 16, 16, 16];     // alt barda "Plan: 62 + 16 + 16 + 16"
  const ACCEPTED = new Set([16, 62]); // eklenebilecek değerler

  // ---- Storage
  const LS = 'kzs_wellbook_v1';
  const S = load();
  function load(){
    try{ return JSON.parse(localStorage.getItem(LS)||'{}') || {}; }catch{ return {}; }
  }
  function save(){ localStorage.setItem(LS, JSON.stringify(S)); }

  // helpers
  const pad = n => String(n).padStart(2,'0');
  const ymd = d => `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}`;
  const addDays = (d, n) => { const k = new Date(d); k.setDate(k.getDate()+n); return k; };
  const mondayOf = (d) => { const k = new Date(d); const wd = (k.getDay()+6)%7; k.setHours(0,0,0,0); k.setDate(k.getDate()-wd); return k; };

  const fmtDay = (d) => new Intl.DateTimeFormat(LOCALE[getLang()]||'tr-TR',{weekday:'short'}).format(d);
  const fmtDate = (d) => `${pad(d.getMonth()+1)}-${pad(d.getDate())}`;

  // iç durum
  let curStart = mondayOf(new Date()); // haftanın pazartesisi
  ensureWeek(curStart);

  // ---- Public API: canlı log (16/62) için
  // başka yerden çağır: window.kzWB_log(16) veya window.kzWB_log(62, new Date())
  window.kzWB_log = function(mins, at=new Date()){
    if (!ACCEPTED.has(mins)) return;
    const d = new Date(at);
    const wk = mondayOf(d);
    const keyWeek = ymd(wk);
    ensureWeek(wk); // oluşturur
    const keyDay = ymd(d);
    S[keyWeek].days[keyDay].push({ mins, at: timeHHMM(d) });
    save();
    if (ymd(curStart) === keyWeek) render(); // açık hafta ise güncelle
  };

  function timeHHMM(d){ return `${pad(d.getHours())}:${pad(d.getMinutes())}`; }

  // ---- Hafta iskeleti
  function ensureWeek(startDate){
    const key = ymd(startDate);
    if (!S[key]) S[key] = { days:{} };
    const wk = S[key];
    for (let i=0;i<7;i++){
      const d = addDays(startDate, i); const k = ymd(d);
      if (!wk.days[k]) wk.days[k] = []; // [{mins:16, at:'10:00'}]
    }
    return wk;
  }

  // ---- Render
  function buildUI(){
    const modal = $('#wellnessBookModal'); if (!modal) return;
    const body  = modal.querySelector('.kzModal-body'); if (!body) return;

    body.innerHTML = `
      <section class="kzSec">
        <div class="wbHead">
          <button class="kzBtn wbNav" id="wbPrev" aria-label="Prev">◀</button>
          <div class="wbRange"><strong id="wbTitle">${TT('wnTitle')}</strong> —
            <span id="wbFrom"></span> ${TT('wnWeekSep')} <span id="wbTo"></span>
          </div>
          <button class="kzBtn wbNav" id="wbNext" aria-label="Next">▶</button>

          <span class="kzFlex"></span>
          <label class="wbChk"><input id="wbAuto" type="checkbox" ${S._auto? 'checked':''}> ${TT('wnAuto')}</label>
          <button class="kzBtn" id="wbReset">${TT('wnResetWeek')}</button>
        </div>
      </section>

      <section class="kzSec">
        <div id="wbList" class="wbList"></div>
      </section>

      <section class="kzSec">
        <div class="wbFoot">
          <div><strong>${TT('wnTotal')}:</strong> <span id="wbTotal">0</span> / ${WEEK_TARGET} dk</div>
          <div><strong>${TT('wnPlan')}:</strong> <span id="wbPlan"></span></div>
        </div>
      </section>
    `;

    // events
    on($('#wbPrev', body),'click', ()=>{ curStart = addDays(curStart, -7); ensureWeek(curStart); render(); });
    on($('#wbNext', body),'click', ()=>{ curStart = addDays(curStart, +7); ensureWeek(curStart); render(); });
    on($('#wbReset', body),'click', ()=>{
      const key = ymd(curStart);
      if (!confirm('Haftayı sıfırlamak istiyor musun?')) return;
      S[key] = { days:{} }; ensureWeek(curStart); save(); render();
    });
    on($('#wbAuto', body),'change', (e)=>{ S._auto = !!e.target.checked; save(); });

    render();
  }

  function render(){
    const body = $('#wellnessBookModal .kzModal-body'); if (!body) return;

    const wk = ensureWeek(curStart);
    const from = new Date(curStart);
    const to   = addDays(curStart, 6);

    $('#wbFrom', body).textContent = `${from.getFullYear()}-${fmtDate(from)}`;
    $('#wbTo',   body).textContent = `${to.getFullYear()}-${fmtDate(to)}`;

    // plan yazısı
    $('#wbPlan', body).textContent = PLAN.map(n=>String(n)).join(' + ');

    const list = $('#wbList', body);
    list.innerHTML = '';
    let weekSum = 0;

    for (let i=0;i<7;i++){
      const d = addDays(curStart, i);
      const dayKey = ymd(d);
      const items = (wk.days[dayKey]||[]);
      const daySum = items.reduce((a,x)=>a+Number(x.mins||0),0);
      weekSum += daySum;

      const row = document.createElement('div');
      row.className = 'wbRow';

      row.innerHTML = `
        <div class="wbDay">
          <div class="wbDayLine">
            <span class="wbWkd">${fmtDay(d)}</span>
            <span class="wbDate">${fmtDate(d)}</span>
            <span class="wbSum">${daySum} dk</span>
          </div>
          <div class="wbChips">${items.map(renderChip).join('')}</div>
        </div>
        <div class="wbBtns">
          <button class="kzBtn chip" data-add="16">+16</button>
          <button class="kzBtn chip" data-add="62">+62</button>
          <button class="kzBtn ghost" data-undo>${TT('wnUndo')}</button>
        </div>
      `;

      // click handlers
      row.querySelectorAll('[data-add]').forEach(b=>{
        b.addEventListener('click', ()=>{
          const mins = Number(b.getAttribute('data-add'));
          if (!ACCEPTED.has(mins)) return;
          const at = new Date(); // şimdi
          wk.days[dayKey].push({ mins, at: timeHHMM(at) });
          save(); render();
        });
      });
      row.querySelector('[data-undo]').addEventListener('click', ()=>{
        wk.days[dayKey].pop();
        save(); render();
      });

      list.appendChild(row);
    }

    $('#wbTotal', body).textContent = weekSum;
  }

  function renderChip(x){
    const t = x.at ? ` @ ${x.at}` : '';
    // görsel rozet
    return `<span class="wbChip">${x.mins} dk${t}</span>`;
  }

  // Dock butonuna bağla (modal açıldığında yeniden boya)
  on($('#openWellness'), 'click', ()=> buildUI());

  // sayfa yüklenince bir kere hazır et (modal açıksa görünür)
  buildUI();

})();
