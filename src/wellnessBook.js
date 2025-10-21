// ===== WELLNESS DEFTERİ =====
(function () {
  const $ = (s, r = document) => r.querySelector(s);
  const on = (el, ev, fn) => el && el.addEventListener(ev, fn);

  const LS_KEY = 'kzs_wellness_book_v1';
  const state = { activeStart: null, items: [] }; // items: [{id,start,end,durMin,note}]

  const load = () => {
    try{
      const raw = localStorage.getItem(LS_KEY);
      if (raw){
        const d = JSON.parse(raw);
        state.items = d.items || [];
        state.activeStart = d.activeStart || null;
      }
    }catch(e){}
  };
  const save = () => localStorage.setItem(LS_KEY, JSON.stringify(state));

  const fmt = (iso) => {
    if (!iso) return '-';
    const d = new Date(iso);
    const dd = String(d.getDate()).padStart(2,'0');
    const mm = String(d.getMonth()+1).padStart(2,'0');
    const hh = String(d.getHours()).padStart(2,'0');
    const mi = String(d.getMinutes()).padStart(2,'0');
    return `${dd}.${mm} ${hh}:${mi}`;
  };

  const statusEl = $('#wnStatus');
  const tbody = $('#wnTable tbody');

  const render = () => {
    statusEl.textContent = state.activeStart ? `Wellness aktif: ${fmt(state.activeStart)}` : 'Wellness pasif';
    tbody.innerHTML = '';
    state.items.slice().reverse().forEach(it=>{
      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td>${fmt(it.start)}</td>
        <td>${fmt(it.end)}</td>
        <td>${it.durMin ? it.durMin+' dk' : '-'}</td>
        <td>${it.note || ''}</td>
        <td><button class="kzBtn" data-del="${it.id}">Sil</button></td>
      `;
      tbody.appendChild(tr);
    });
  };

  const start = () => {
    if (state.activeStart){ alert('Zaten aktif.'); return; }
    state.activeStart = new Date().toISOString();
    save(); render();
  };

  const end = () => {
    if (!state.activeStart){ alert('Önce başlat.'); return; }
    const startD = new Date(state.activeStart);
    const endD = new Date();
    const dur = Math.max(1, Math.round((endD - startD)/60000));
    state.items.push({ id:String(Date.now()), start: state.activeStart, end: endD.toISOString(), durMin: dur, note: '' });
    state.activeStart = null;
    save(); render();
  };

  const addNote = () => {
    if (state.items.length===0) return alert('Henüz kayıt yok.');
    const note = prompt('Not ekle (son kayda):','');
    if (note==null) return;
    state.items[state.items.length-1].note = note;
    save(); render();
  };

  // events
  on($('#wnStart'), 'click', start);
  on($('#wnEnd'), 'click', end);
  on($('#wnNote'), 'click', addNote);

  on(tbody, 'click', (e)=>{
    const id = e.target.getAttribute('data-del');
    if (!id) return;
    if (confirm('Silinsin mi?')){
      state.items = state.items.filter(x=>x.id!==id);
      save(); render();
    }
  });

  on($('#wnExport'), 'click', ()=>{
    const blob = new Blob([ JSON.stringify({items:state.items}, null, 2) ], {type:'application/json'});
    const url = URL.createObjectURL(blob);
    const a = Object.assign(document.createElement('a'), {href:url, download:'wellness_book.json'});
    document.body.appendChild(a); a.click(); a.remove(); URL.revokeObjectURL(url);
  });

  on($('#wnClear'), 'click', ()=>{
    if (!confirm('Tüm kayıtlar silinsin mi?')) return;
    state.items = []; state.activeStart = null; save(); render();
  });

  // Modal açılırken güncelle
  on($('#openWellness'), 'click', ()=> { load(); render(); });

  // ---- Entegrasyon kancası (otomatik kayıt için)
  // Mevcut kodundan wellness başlarken: window.kzWellness('start')
  // biterken: window.kzWellness('end')
  window.kzWellness = (act) => { if (act==='start') start(); else if (act==='end') end(); };

  // init
  load();
})();
