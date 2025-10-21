// ===== FRIENDS HUB (CodePen tarzı, CANLI) =====
(function () {
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));
  const on = (el, ev, fn) => el && el.addEventListener(ev, fn);

  // ---------- Slots şablonu (eski proje düzeni) ----------
  const SLOT_KINDS = [
    'Rest 1','Rest 2','Lunch','Wellness 1','Wellness 2','Wellness 3',
    'Meeting','Meeting/Training','Meeting/Quiz',
    'Özel 1','Özel 2','Özel 3','Özel 4','Özel 5'
  ];

  // ---------- Depo ----------
  const LS_KEY = 'kzs_friends_v2';
  const state = { activeId: null, friends: {} };
  // friends[id] = { name, slots: { kind: { min: number, starts: ["HH:MM", ...] } } }

  const load = () => {
    try{
      const raw = localStorage.getItem(LS_KEY);
      if (raw) Object.assign(state, JSON.parse(raw));
    }catch(e){}
  };
  const save = () => localStorage.setItem(LS_KEY, JSON.stringify(state));

  // ---------- Zaman yardımcıları ----------
  const toMin = (hhmm) => {
    const m = /^(\d{1,2}):(\d{2})$/.exec(hhmm?.trim()||''); if(!m) return null;
    const h = +m[1], mm = +m[2];
    return (h*60 + mm);
  };
  const fromMin = (mins) => {
    if (mins==null) return '--:--';
    const m = ((mins%1440)+1440)%1440;
    return String(Math.floor(m/60)).padStart(2,'0') + ':' + String(m%60).padStart(2,'0');
  };
  const addDur = (startHHMM, dur) => fromMin(toMin(startHHMM) + Number(dur||0));

  // ---------- BENİM MOLALARIM: Otomatik Toplayıcı ----------
  // 1) Eğer global sağlanmışsa (window.__KZ_MY_BREAKS__), onu kullan
  // 2) Yoksa DOM'dan #breakGrid -> .break-tile içindeki:
  //    - Başlık: .tile-title (label)
  //    - Süre:   input.mins (veya badge)
  //    - Saatler: textarea.note içindeki HH:MM desenleri
  function getMyBreaks() {
    if (Array.isArray(window.__KZ_MY_BREAKS__) && window.__KZ_MY_BREAKS__.length) {
      return window.__KZ_MY_BREAKS__.slice();
    }
    const grid = document.getElementById('breakGrid');
    if (!grid) return [];
    const out = [];
    $$('.break-tile', grid).forEach(tile=>{
      const label = $('.tile-title', tile)?.textContent?.trim();
      if (!label) return;
      let minVal = parseInt($('.mins', tile)?.value || $('.badge', tile)?.textContent || '0', 10);
      if (!Number.isFinite(minVal) || minVal<=0) minVal = 15; // varsayılan

      // Not kutusundaki saatleri topla: "09:45, 13:10" gibi
      const noteTxt = $('.note', tile)?.value || $('.note', tile)?.textContent || '';
      const matches = noteTxt.match(/\b([01]?\d|2[0-3]):[0-5]\d\b/g) || [];
      matches.forEach(hhmm=>{
        out.push({ label, start: hhmm, end: addDur(hhmm, minVal), min: minVal });
      });
    });
    return out;
  }

  // ---------- Kesişim ----------
  const overlap = (a, b) => {
    const s = Math.max(toMin(a.start), toMin(b.start));
    const e = Math.min(toMin(a.end),   toMin(b.end));
    if (s==null || e==null) return null;
    if (e > s) return { start: fromMin(s), end: fromMin(e), min: e - s, me: a.label, friend: b.label };
    return null;
  };

  function friendToIntervals(fr){
    const out = [];
    Object.entries(fr.slots||{}).forEach(([kind, cfg])=>{
      const dur = Number(cfg?.min || 0);
      const starts = Array.isArray(cfg?.starts)? cfg.starts : [];
      starts.forEach(st=>{
        if (!/^\d{1,2}:\d{2}$/.test(st)) return;
        out.push({ label: kind, start: st, end: addDur(st, dur), min: dur });
      });
    });
    return out;
  }

  function calcOverlaps(fr){
    const mine = getMyBreaks();          // [{label,start,end,min}]
    const his  = friendToIntervals(fr);  // [{label,start,end,min}]
    const res = [];
    mine.forEach(m => his.forEach(h => {
      const o = overlap(m, h);
      if (o) res.push(o);
    }));
    res.sort((a,b)=> toMin(a.start)-toMin(b.start));
    return res;
  }

  // ---------- UI ----------
  const modal     = $('#friendsModal');
  const pick      = $('#friendPick');
  const nameInput = $('#friendName');
  const addBtn    = $('#friendAdd');
  const delBtn    = $('#friendDel');
  const liveChk   = $('#liveIntersect');
  const slotsWrap = $('#fSlots');
  const olapPanel = $('#olapPanel');

  const ensureFriend = (id) => {
    if (!state.friends[id]) {
      const slots = {};
      SLOT_KINDS.forEach(k => slots[k] = { min: (k.startsWith('Lunch')?45:(k.startsWith('Wellness')?16:15)), starts: [] });
      state.friends[id] = { name:'Yeni', slots };
    }
    return state.friends[id];
  };

  function refreshPick(){
    pick.innerHTML = '';
    const ids = Object.keys(state.friends);
    if (ids.length===0){
      const id = String(Date.now());
      state.activeId = id; ensureFriend(id);
    }
    Object.entries(state.friends).forEach(([id, fr])=>{
      const opt = document.createElement('option');
      opt.value = id; opt.textContent = fr.name || 'Adsız';
      pick.appendChild(opt);
    });
    pick.value = state.activeId;
  }

  function renderSlots(fr){
    slotsWrap.innerHTML = '';
    SLOT_KINDS.forEach(kind=>{
      const cfg = fr.slots[kind] || { min: 15, starts: [] };
      const startsText = (cfg.starts||[]).join(', ');
      const el = document.createElement('div');
      el.className = 'fslot';
      el.innerHTML = `
        <div class="fslot-head">
          <div class="fslot-title">${kind}</div>
          <div class="fslot-min"><input type="number" min="1" max="240" value="${cfg.min||15}"><span>dk</span></div>
        </div>
        <textarea class="starts" placeholder="Örn: 09:45, 13:10, 17:30">${startsText}</textarea>
      `;
      // events
      const minInp = $('.fslot-min input', el);
      const ta     = $('.starts', el);
      on(minInp, 'input', ()=>{
        fr.slots[kind].min = Math.max(1, Math.min(240, Number(minInp.value||0)));
        save(); if (liveChk.checked) drawOverlaps(fr);
      });
      on(ta, 'input', ()=>{
        const times = ta.value.match(/\b([01]?\d|2[0-3]):[0-5]\d\b/g) || [];
        fr.slots[kind].starts = times;
        save(); if (liveChk.checked) drawOverlaps(fr);
      });
      slotsWrap.appendChild(el);
    });
  }

  function drawOverlaps(fr){
    const res = calcOverlaps(fr);
    if (res.length===0){ olapPanel.innerHTML = 'Kesişim bulunamadı.'; return; }
    olapPanel.innerHTML = res.map(r=>(
      `<div class="row">• <span class="t">${r.start}–${r.end}</span> (${r.min} dk) — <strong>${r.me}</strong> ↔ <em>${r.friend}</em></div>`
    )).join('');
  }

  function loadActiveFriend(){
    refreshPick();
    const fr = ensureFriend(state.activeId);
    nameInput.value = fr.name || '';
    renderSlots(fr);
    drawOverlaps(fr);
  }

  // ---------- Toolbar events ----------
  on(addBtn, 'click', ()=>{
    const id = String(Date.now());
    state.activeId = id; ensureFriend(id);
    save(); loadActiveFriend();
  });
  on(delBtn, 'click', ()=>{
    const id = state.activeId; if (!id) return;
    if (!confirm('Bu arkadaşı silmek istiyor musun?')) return;
    delete state.friends[id];
    state.activeId = Object.keys(state.friends)[0] || null;
    save(); loadActiveFriend();
  });
  on(pick, 'change', ()=>{ state.activeId = pick.value; save(); loadActiveFriend(); });
  on(nameInput, 'input', ()=>{
    const fr = ensureFriend(state.activeId);
    fr.name = nameInput.value.trim() || 'Adsız';
    // select option etiketini de güncelle
    const opt = pick.options[pick.selectedIndex]; if (opt) opt.textContent = fr.name;
    save(); if (liveChk.checked) drawOverlaps(fr);
  });

  // Modal açılırken tazele
  on($('#openFriends'), 'click', ()=>{
    load(); loadActiveFriend();
    // Ana ekrandaki notlara saat yazıldıkça canlı tazeleme (input event'ini dinle)
    const grid = document.getElementById('breakGrid');
    if (grid){
      grid.addEventListener('input', (e)=>{
        if (liveChk.checked && e
