// ===== FRIENDS v2 (kalıcı, çoklu arkadaş, PiP, canlı hesap) =====
(function () {
  const $  = (s, r=document) => r.querySelector(s);
  const $$ = (s, r=document) => Array.from(r.querySelectorAll(s));
  const on = (el, ev, fn) => el && el.addEventListener(ev, fn);

  // --- UI refs
  const openBtn   = $('#openFriends');

  const bodyWrap  = $('#friendsBody');
  const grid      = $('#frGrid');
  const olapList  = $('#olapList');

  const frSelect  = $('#frSelect');
  const frName    = $('#frName');
  const frAdd     = $('#btnFrAdd');
  const frDel     = $('#btnFrDel');
  const frPipChk  = $('#frPip');

  const pip       = $('#frPipPanel');
  const pipTitle  = $('#frPipTitle');
  const pipBreaks = $('#frPipBreaks');
  const pipOlap   = $('#frPipOverlaps');
  const pipMin    = $('#frPipMin');
  const pipClose  = $('#frPipClose');

  // --- Slot şablonları
  const SLOT_DEFS = [
    ['Rest 1',15], ['Rest 2',15], ['Lunch',45], ['Wellness 1',16], ['Wellness 2',16],
    ['Wellness 3',62], ['Meeting',15], ['Meeting/Quiz',30], ['Meeting/Training',45],
    ['Meeting/Training 2',60], ['Özel 1',15], ['Özel 2',15], ['Özel 3',15], ['Özel 4',15], ['Özel 5',15]
  ];

  // --- Zaman yardımcıları
  const toMin = (hhmm) => (hhmm && /^\d{2}:\d{2}$/.test(hhmm)) ? (hhmm.split(':')[0]*60 + (+hhmm.split(':')[1])) : NaN;
  const fromMin = (mins) => {
    const m = ((mins % 1440) + 1440) % 1440;
    const h = String(Math.floor(m/60)).padStart(2,'0');
    const mm= String(m%60).padStart(2,'0');
    return `${h}:${mm}`;
  };
  const endByDur = (start, dur) => fromMin(toMin(start) + Number(dur||0));

  // --- Kalıcı durum
  const LS_KEY = 'kzs_friends_v2';
  const state = {
    friends: [],            // {id, name, slots:[{id,label,start,min,end,note}]}
    selectedId: null,
    pipVisible: false,
    pipCollapsed: false
  };

  function load(){
    try{
      const raw = localStorage.getItem(LS_KEY);
      if (raw){
        const d = JSON.parse(raw);
        state.friends      = d.friends || [];
        state.selectedId   = d.selectedId || null;
        state.pipVisible   = !!d.pipVisible;
        state.pipCollapsed = !!d.pipCollapsed;
      }
    }catch(e){}
  }
  function save(){
    localStorage.setItem(LS_KEY, JSON.stringify(state));
  }

  function uid(){ return Date.now().toString(36)+Math.random().toString(36).slice(2,6); }

  function current(){
    let f = state.friends.find(x => x.id === state.selectedId);
    if (!f && state.friends.length){
      state.selectedId = state.friends[0].id;
      f = state.friends[0]; save();
    }
    return f || null;
  }

  // --- Benim molalarım (ana ekrandan)
  let myBreaks = []; // [{label,start,end}]
  window.kzSetMyBreaks = (arr) => {
    myBreaks = (arr||[]).map(x=>{
      const start = x.start;
      const end   = x.end || (x.min ? endByDur(x.start, x.min) : '');
      return (start && end) ? { label: x.label||'-', start, end } : null;
    }).filter(Boolean);
    calcOverlaps();
    renderPip();
  };
  function readMyBreaksFromDOM(){
    const tiles = $$('#breakGrid [data-start][data-min]');
    if (!tiles.length) return;
    myBreaks = tiles.map(el=>{
      const label = el.getAttribute('data-label') || (el.querySelector('.tile-title')?.textContent?.trim() || 'Break');
      const start = el.getAttribute('data-start');
      const min   = Number(el.getAttribute('data-min')||0);
      const end   = start && min>0 ? endByDur(start, min) : '';
      return (start && end) ? {label, start, end} : null;
    }).filter(Boolean);
    calcOverlaps();
    renderPip();
  }
  function observeBreakGrid(){
    const g = $('#breakGrid'); if(!g) return;
    const mo = new MutationObserver(()=> readMyBreaksFromDOM());
    mo.observe(g, {subtree:true, childList:true, attributes:true});
  }

  // --- Grid slotlarını bir defa kur
  function buildSlotsOnce(){
    if (!grid || grid.childElementCount) return;
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
          <input id="${id}_start" type="time" placeholder="--:--">
          <input id="${id}_min" type="number" class="mins" min="1" max="240" value="${defMin}">
        </div>
        <textarea id="${id}_note" class="note" placeholder=""></textarea>
      `;
      grid.appendChild(tile);

      const startEl = $(`#${id}_start`);
      const minEl   = $(`#${id}_min`);
      const noteEl  = $(`#${id}_note`);
      const pill    = $(`#${id}_pill`);
      const push = ()=>{
        const f = current(); if(!f) return;
        const m = Number(minEl.value||0);
        pill.textContent = (m>0? m : defMin) + ' dk';
        let s = f.slots.find(x=>x.id===id);
        if (!s){ s = { id, label, start:'', min:defMin, end:'', note:'' }; f.slots.push(s); }
        s.start = startEl.value || '';
        s.min   = m || 0;
        s.end   = s.start && s.min>0 ? endByDur(s.start, s.min) : '';
        s.note  = noteEl.value || '';
        save(); calcOverlaps(); renderPip();
      };
      on(startEl,'input',push);
      on(minEl,'input',push);
      on(noteEl,'input',push);
    });
  }

  // --- Seçilen arkadaşın verisini inputlara bas
  function fillUIFromFriend(){
    const f = current();
    // select + ad
    renderFriendSelect();
    frName.value = f?.name || '';
    frPipChk.checked = !!state.pipVisible;

    // slot değerleri
    SLOT_DEFS.forEach(([label,_def], i)=>{
      const id = `slot_${i}`;
      const slot = f?.slots?.find(s=>s.id===id) || null;
      const startEl = $(`#${id}_start`);
      const minEl   = $(`#${id}_min`);
      const noteEl  = $(`#${id}_note`);
      const pill    = $(`#${id}_pill`);
      startEl.value = slot?.start || '';
      minEl.value   = slot?.min ?? _def;
      noteEl.value  = slot?.note || '';
      pill.textContent = (slot?.min || _def) + ' dk';
    });

    calcOverlaps(); renderPip();
  }

  function renderFriendSelect(){
    const sel = frSelect;
    const curId = state.selectedId;
    sel.innerHTML = state.friends.map(f=>`<option value="${f.id}">${f.name || '(adsız)'}</option>`).join('');
    if (curId) sel.value = curId;
  }

  // --- Kesişim
  function overlap(a,b){
    const s = Math.max(toMin(a.start), toMin(b.start));
    const e = Math.min(toMin(a.end),   toMin(b.end));
    return (isFinite(s) && isFinite(e) && e > s) ? { start: fromMin(s), end: fromMin(e), min: e-s } : null;
  }

  function calcOverlaps(){
    const f = current(); if(!f){ olapList.innerHTML='Arkadaş yok.'; return; }
    const slots = f.slots.filter(x=>x.start && x.min>0).map(x=>({label:x.label,start:x.start,end:endByDur(x.start,x.min)}));
    const out=[];
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
    // pip güncellemesi üstte renderPip() ile yapılır
  }

  // --- PiP
  function renderPip(){
    if (!pip) return;
    pip.setAttribute('aria-hidden', String(!state.pipVisible));
    pip.dataset.collapsed = state.pipCollapsed ? 'true' : 'false';
    const f = current();
    pipTitle.textContent = f ? `Arkadaş: ${f.name || '(adsız)'}` : 'Arkadaşlar';

    if (!f){ pipBreaks.textContent='–'; pipOlap.textContent='–'; return; }

    const b = f.slots.filter(x=>x.start && x.min>0)
      .map(x=>`• ${x.label}: ${x.start} → ${endByDur(x.start,x.min)} (${x.min} dk)`)
      .join('<br>');
    pipBreaks.innerHTML = b || '–';

    // aynı hesaplamayı tekrar etmeyelim, küçük bir tekrar kabul:
    const tmp=[];
    (f.slots||[]).filter(x=>x.start&&x.min>0).forEach(s=>{
      myBreaks.forEach(m=>{
        const o = overlap(m,{start:s.start,end:endByDur(s.start,s.min)});
        if(o) tmp.push({me:m.label, fr:s.label, start:o.start, end:o.end, min:o.min});
      });
    });
    pipOlap.innerHTML = tmp.length
      ? tmp.map(r=>`• ${r.me} ↔ ${r.fr}: ${r.start}–${r.end} (${r.min} dk)`).join('<br>')
      : '–';
  }

  // --- Arkadaş CRUD
  function addFriend(){
    const f = { id: uid(), name: frName.value.trim() || 'Yeni Arkadaş', slots: [] };
    state.friends.push(f);
    state.selectedId = f.id;
    save(); renderFriendSelect(); fillUIFromFriend();
  }
  function delFriend(){
    const id = state.selectedId; if(!id) return;
    if (!confirm('Bu arkadaşı silmek ister misin?')) return;
    state.friends = state.friends.filter(x=>x.id!==id);
    state.selectedId = state.friends[0]?.id || null;
    save(); renderFriendSelect(); fillUIFromFriend();
  }

  // --- Events
  on(frSelect,'change', ()=>{ state.selectedId = frSelect.value || null; save(); fillUIFromFriend(); });
  on(frName,'input', ()=>{ const f=current(); if(!f) return; f.name = frName.value; save(); renderFriendSelect(); renderPip(); });
  on(frAdd,'click', addFriend);
  on(frDel,'click', delFriend);

  on(frPipChk,'change', ()=>{ state.pipVisible = frPipChk.checked; save(); renderPip(); });
  on(pipMin,'click', ()=>{ state.pipCollapsed = !state.pipCollapsed; save(); renderPip(); });
  on(pipClose,'click', ()=>{ state.pipVisible = false; frPipChk.checked = false; save(); renderPip(); });

  on(openBtn,'click', ()=>{
    buildSlotsOnce();
    renderFriendSelect();
    fillUIFromFriend();
    readMyBreaksFromDOM(); // fallback
    observeBreakGrid();
  });

  // --- init
  load();
  // hiç arkadaş yoksa bir tane aç
  if (state.friends.length===0){
    state.friends.push({ id: uid(), name: 'Arkadaş 1', slots: [] });
    state.selectedId = state.friends[0].id;
    save();
  }
  // sayfa yüklenir yüklenmez PiP state'i uygula
  renderPip();
})();
