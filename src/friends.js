// ===== FRIENDS (eski stil, canlı hesap, autosync "benim molalarım") =====
(function(){
  const $  = (s, r=document) => r.querySelector(s);
  const $$ = (s, r=document) => Array.from(r.querySelectorAll(s));
  const on = (el, ev, fn) => el && el.addEventListener(ev, fn);

  // --- SLot tanımları (soldaki kutular)
  const SLOT_DEFS = [
    ['Rest 1',15], ['Rest 2',15], ['Lunch',45], ['Wellness 1',16], ['Wellness 2',16],
    ['Wellness 3',62], ['Meeting',15], ['Meeting/Quiz',30], ['Meeting/Training',45],
    ['Meeting/Training 2',60], ['Özel 1',15], ['Özel 2',15], ['Özel 3',15], ['Özel 4',15], ['Özel 5',15],
  ];

  // --- Zaman yardımcıları
  const toMin = (hhmm) => {
    if (!hhmm || !/^\d{2}:\d{2}$/.test(hhmm)) return null;
    const [h,m] = hhmm.split(':').map(Number);
    return h*60 + m;
  };
  const fromMin = (mins) => {
    const m = ((mins%1440)+1440)%1440;
    const h = String(Math.floor(m/60)).padStart(2,'0');
    const mm= String(m%60).padStart(2,'0');
    return `${h}:${mm}`;
  };
  const endByDur = (start, dur) => fromMin(toMin(start) + Number(dur||0));

  // --- Durum
  let myBreaks = []; // [{label,start,end}]
  const friend = { name:'', slots:[] }; // [{label,start,min,end,note}]

  // --- UI refs
  const openBtn = $('#openFriends');
  const grid = $('#frGrid');
  const olapList = $('#olapList');
  const frName = $('#frName');

  // --- Soldaki kutuları oluştur
  function renderSlots(){
    if (!grid) return;
    grid.innerHTML = '';
    SLOT_DEFS.forEach(([label, defMin], i)=>{
      const id = `slot_${i}`;
      const tile = document.createElement('div');
      tile.className = 'frTile';
      tile.dataset.label = label;
      tile.innerHTML = `
        <div class="tileHead">
          <div class="label">${label}</div>
          <span class="pill" id="${id}_pill">${defMin} dk</span>
        </div>
        <div class="tileBody">
          <input id="${id}_start" type="time">
          <input id="${id}_min" type="number" class="mins" min="1" max="240" value="${defMin}">
        </div>
        <textarea id="${id}_note" class="note" placeholder=""></textarea>
      `;
      grid.appendChild(tile);
      // canlı haberleşme
      const startEl = $(`#${id}_start`);
      const minEl   = $(`#${id}_min`);
      const noteEl  = $(`#${id}_note`);
      const pill    = $(`#${id}_pill`);
      const push = ()=>{
        const s = startEl.value;
        const m = Number(minEl.value||0);
        pill.textContent = (m>0? m : defMin) + ' dk';
        // slotu friend.slots içine yaz
        const idx = friend.slots.findIndex(x=>x.id===id);
        const obj = { id, label, start:s||'', min:m||0, end: s && m>0 ? endByDur(s,m) : '', note: (noteEl.value||'') };
        if (idx>=0) friend.slots[idx] = obj; else friend.slots.push(obj);
        calcOverlaps(); // her değişimde canlı hesap
      };
      on(startEl,'input',push);
      on(minEl,'input',push);
      on(noteEl,'input',push);
    });
  }

  // --- Kesişim hesap
  function overlap(a,b){
    const s = Math.max(toMin(a.start), toMin(b.start));
    const e = Math.min(toMin(a.end),   toMin(b.end));
    if (isFinite(s) && isFinite(e) && e > s) return { start: fromMin(s), end: fromMin(e), min: e-s };
    return null;
  }

  function calcOverlaps(){
    // friend.slots -> geçerli olanlar
    const slots = friend.slots.filter(x=>x.start && x.min>0)
                              .map(x=>({label:x.label, start:x.start, end:endByDur(x.start,x.min)}));
    const out = [];
    slots.forEach(s=>{
      myBreaks.forEach(m=>{
        const o = overlap(m,s);
        if (o) out.push({ me:m.label, fr:s.label, start:o.start, end:o.end, min:o.min });
      });
    });
    out.sort((a,b)=> toMin(a.start)-toMin(b.start));
    olapList.innerHTML = out.length
      ? out.map(r=>`<div>• <strong>${r.me}</strong> ↔ <em>${r.fr}</em>: ${r.start}–${r.end} (${r.min} dk)</div>`).join('')
      : 'Kesişim bulunamadı.';
  }

  // --- Benim molalarımı otomatik çek
  // 1) Tercih edilen: main.js tarafı bize bildirir
  window.kzSetMyBreaks = (arr /* [{label,start,min}] veya [{label,start,end}] */) => {
    myBreaks = (arr||[]).map(x=>{
      const start = x.start;
      const end   = x.end || (x.min ? endByDur(x.start, x.min) : '');
      return start && end ? {label:x.label||'-', start, end} : null;
    }).filter(Boolean);
    calcOverlaps();
  };

  // 2) Yedek: DOM’dan data-attr okuyalım (break tile üreten koduna 2 satır eklemen yeter)
  function readMyBreaksFromDOM(){
    const tiles = $$('#breakGrid [data-start][data-min]');
    if (!tiles.length) return;   // henüz ekli değilse boş bırak
    myBreaks = tiles.map(el=>{
      const label = el.getAttribute('data-label') || (el.querySelector('.tile-title')?.textContent?.trim() || 'Break');
      const start = el.getAttribute('data-start');
      const min   = Number(el.getAttribute('data-min')||0);
      const end   = start && min>0 ? endByDur(start, min) : '';
      return (start && end) ? {label, start, end} : null;
    }).filter(Boolean);
    calcOverlaps();
  }

  // 3) Yedeklerin yedeği: #breakGrid değişince yeniden dene
  const tryObserveBreakGrid = ()=>{
    const grid = $('#breakGrid');
    if (!grid) return;
    const mo = new MutationObserver(()=> readMyBreaksFromDOM());
    mo.observe(grid, {subtree:true, childList:true, attributes:true});
  };

  // Arkadaş adı canlı
  on(frName, 'input', ()=>{ friend.name = frName.value.trim(); });

  // Modal açılırken kurulum
  on(openBtn, 'click', ()=>{
    renderSlots();
    // main.js bize data veriyorsa hemen hesap olur; yoksa DOM düşer
    readMyBreaksFromDOM();
    tryObserveBreakGrid();
    calcOverlaps();
  });

})();
