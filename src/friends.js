// ===== FRIENDS HUB =====
(function () {
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));
  const on = (el, ev, fn) => el && el.addEventListener(ev, fn);

  const LS_KEY = 'kzs_friends_v1';

  const state = {
    myBreaks: [],   // [{label,start,end}]
    friends: []     // [{id,name,slots:[{label,start,end}]}]
  };

  // time helpers
  const toMin = (hhmm) => {
    if (!hhmm) return null;
    const [h, m] = hhmm.split(':').map(Number);
    return (h*60 + m);
  };
  const fromMin = (mins) => {
    const m = ((mins % 1440)+1440)%1440;
    const h = String(Math.floor(m/60)).padStart(2,'0');
    const mm = String(m%60).padStart(2,'0');
    return `${h}:${mm}`;
  };
  const addDur = (startHHMM, dur) => fromMin(toMin(startHHMM) + Number(dur||0));

  // storage
  const load = () => {
    try {
      const raw = localStorage.getItem(LS_KEY);
      if (raw) {
        const data = JSON.parse(raw);
        state.myBreaks = data.myBreaks || [];
        state.friends  = data.friends  || [];
      }
    } catch(e){}
  };
  const save = () => localStorage.setItem(LS_KEY, JSON.stringify({
    myBreaks: state.myBreaks, friends: state.friends
  }));

  // UI refs
  const modal = $('#friendsModal');
  const formMy = $('#myBreaksForm');
  const formFriend = $('#friendForm');
  const slotsWrap = $('#slotsWrap');
  const list = $('#friendsList');

  // ---- My breaks form
  const collectMyBreaks = () => {
    const f = new FormData(formMy);
    const items = [];
    const push = (label, keyStart, keyMin) => {
      const s = f.get(keyStart);
      const d = Number(f.get(keyMin) || 0);
      if (s && d > 0) items.push({ label, start: s, end: addDur(s, d) });
    };
    push('Rest 1', 'rest1_start', 'rest1_min');
    push('Rest 2', 'rest2_start', 'rest2_min');
    push('Lunch',  'lunch_start', 'lunch_min');
    push('Wellness 1', 'well1_start', 'well1_min');
    push('Wellness 2', 'well2_start', 'well2_min');
    state.myBreaks = items;
    save(); renderFriends();
  };

  on(formMy, 'submit', (e)=>{ e.preventDefault(); collectMyBreaks(); });
  on($('#myBreaksClear'), 'click', ()=>{
    formMy.reset(); state.myBreaks = []; save(); renderFriends();
  });

  // ---- Friend form
  const slotRowTpl = (i, slot={label:'Rest', start:'', min:15}) => {
    return `<div class="slotRow" data-i="${i}">
      <select name="type_${i}">
        <option ${slot.label==='Rest'?'selected':''}>Rest</option>
        <option ${slot.label==='Lunch'?'selected':''}>Lunch</option>
        <option ${slot.label==='Meeting'?'selected':''}>Meeting</option>
        <option ${slot.label==='Wellness'?'selected':''}>Wellness</option>
        <option ${slot.label==='Other'?'selected':''}>Other</option>
      </select>
      <input type="time" name="start_${i}" value="${slot.start||''}">
      <input type="number" name="min_${i}" min="1" max="240" value="${slot.min??15}">
      <button type="button" class="kzBtn" data-del="${i}" title="Sil">✕</button>
    </div>`;
  };

  const rebuildSlots = (slots) => {
    slotsWrap.innerHTML = '';
    (slots && slots.length ? slots : [{},{},{}]).forEach((s, i)=>{
      slotsWrap.insertAdjacentHTML('beforeend', slotRowTpl(i, s));
    });
  };

  on(slotsWrap, 'click', (e)=>{
    const i = e.target.getAttribute('data-del');
    if (!i) return;
    const row = slotsWrap.querySelector(`.slotRow[data-i="${i}"]`);
    row && row.remove();
  });

  on($('#addSlot'), 'click', ()=>{
    const i = slotsWrap.querySelectorAll('.slotRow').length;
    slotsWrap.insertAdjacentHTML('beforeend', slotRowTpl(i, {}));
  });

  const fillFriendForm = (friend) => {
    formFriend.reset();
    formFriend.elements.id.value   = friend?.id || '';
    formFriend.elements.name.value = friend?.name || '';
    const slots = (friend?.slots || []).map(s=>({
      label:s.label, start:s.start, min: Math.max(1, toMin(s.end)-toMin(s.start))
    }));
    rebuildSlots(slots);
  };

  const collectFriend = () => {
    const f = new FormData(formFriend);
    const id = f.get('id') || String(Date.now());
    const name = (f.get('name')||'').trim();
    const rows = $$('.slotRow', slotsWrap);
    const slots = rows.map(r=>{
      const i = r.getAttribute('data-i');
      const label = f.get(`type_${i}`) || 'Other';
      const start = f.get(`start_${i}`) || '';
      const min = Number(f.get(`min_${i}`) || 0);
      if (!start || !min) return null;
      return { label, start, end: addDur(start, min) };
    }).filter(Boolean);
    return { id, name, slots };
  };

  on($('#resetFriendForm'), 'click', ()=> fillFriendForm(null));

  on(formFriend, 'submit', (e)=>{
    e.preventDefault();
    const fr = collectFriend();
    if (!fr.name || fr.slots.length===0) return alert('İsim ve en az 1 slot gerekli.');
    const idx = state.friends.findIndex(x=>x.id===fr.id);
    if (idx>=0) state.friends[idx] = fr; else state.friends.push(fr);
    save(); renderFriends(); fillFriendForm(null);
  });

  // ---- Intersection
  const overlap = (a, b) => {
    const s = Math.max(toMin(a.start), toMin(b.start));
    const e = Math.min(toMin(a.end), toMin(b.end));
    if (e > s) return { start: fromMin(s), end: fromMin(e), min: e - s };
    return null;
  };

  const friendOverlaps = (fr) => {
    const out = [];
    state.myBreaks.forEach(m=>{
      fr.slots.forEach(s=>{
        const o = overlap(m,s);
        if (o) out.push({ me:m.label, friend: s.label, start:o.start, end:o.end, min:o.min });
      });
    });
    out.sort((a,b)=> toMin(a.start)-toMin(b.start));
    return out;
  };

  // ---- Render list
  const renderFriends = () => {
    list.innerHTML = '';
    if (state.friends.length===0){
      list.innerHTML = `<div class="kzHint">Henüz arkadaş yok. Üstte ekleyebilirsin.</div>`;
      return;
    }
    state.friends.forEach(fr=>{
      const card = document.createElement('div');
      card.className = 'kzCard';
      const pills = fr.slots.map(s=>`<span class="kzPill">${s.label}: ${s.start}–${s.end}</span>`).join(' ');
      card.innerHTML = `
        <div class="kzCardHead">
          <strong>${fr.name}</strong>
          <span>${pills}</span>
          <div class="kzCardBtns">
            <button class="kzBtn" data-act="olap" data-id="${fr.id}">Kesişim</button>
            <button class="kzBtn" data-act="edit" data-id="${fr.id}">Düzenle</button>
            <button class="kzBtn danger" data-act="del" data-id="${fr.id}">Sil</button>
          </div>
        </div>
        <div class="kzOlap kzHint" id="olap_${fr.id}" style="margin-top:8px;"></div>
      `;
      list.appendChild(card);
    });
  };

  on(list, 'click', (e)=>{
    const id = e.target.getAttribute('data-id');
    const act = e.target.getAttribute('data-act');
    if (!id || !act) return;
    const fr = state.friends.find(x=>x.id===id);
    if (!fr) return;
    if (act==='del'){
      if (confirm('Silinsin mi?')){
        state.friends = state.friends.filter(x=>x.id!==id);
        save(); renderFriends();
      }
    } else if (act==='edit'){
      fillFriendForm(fr);
    } else if (act==='olap'){
      const res = friendOverlaps(fr);
      const box = $(`#olap_${id}`);
      if (res.length===0){ box.innerHTML = 'Kesişim yok.'; return; }
      box.innerHTML = res.map(r=>`<div>• <strong>${r.me}</strong> ↔ <em>${r.friend}</em>: ${r.start}–${r.end} (${r.min} dk)</div>`).join('');
    }
  });

  // ---- Export / Import / Clear
  on($('#exportFriends'), 'click', ()=>{
    const blob = new Blob([ JSON.stringify({myBreaks:state.myBreaks,friends:state.friends}, null, 2) ], {type:'application/json'});
    const url = URL.createObjectURL(blob);
    const a = Object.assign(document.createElement('a'), {href:url, download:'friends_export.json'});
    document.body.appendChild(a); a.click(); a.remove(); URL.revokeObjectURL(url);
  });
  on($('#importFriends'), 'click', ()=> $('#importFriendsFile').click());
  on($('#importFriendsFile'), 'change', async (e)=>{
    const file = e.target.files[0]; if(!file) return;
    const txt = await file.text();
    try{
      const data = JSON.parse(txt);
      state.myBreaks = data.myBreaks||[]; state.friends = data.friends||[];
      save(); renderFriends();
      alert('İçe aktarıldı.');
    }catch(err){ alert('JSON okunamadı.'); }
    e.target.value = '';
  });
  on($('#clearFriends'), 'click', ()=>{
    if (confirm('Arkadaşlar ve Benim Molalarım sıfırlansın mı?')){
      state.myBreaks = []; state.friends = []; save(); renderFriends(); formMy.reset(); fillFriendForm(null);
    }
  });

  // open modal refresh
  on($('#openFriends'), 'click', ()=>{
    load(); renderFriends(); fillFriendForm(null);
  });

  // init
  load();
})();
