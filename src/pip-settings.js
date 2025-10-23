(function(){
  const LS_KEY = 'kzs_pip_cfg_v1';
  const DEF = { showClock:true, showTask:true, showNext:true, showCounter:true, alertOverlay:true };

  function loadCfg(){
    try{ return Object.assign({}, DEF, JSON.parse(localStorage.getItem(LS_KEY)||'{}')); }
    catch{ return {...DEF}; }
  }
  function saveCfg(v){
    localStorage.setItem(LS_KEY, JSON.stringify(v));
    window.__KZS_PIPCFG__ = v;
    // dashboard + pip'e duyur
    try{ window.broadcast && window.broadcast('pipCfg', v); }catch{}
  }

  function row(id, label, checked){
    return `
      <label class="kzRow" style="grid-template-columns: 1fr auto;">
        <div>${label}</div>
        <input type="checkbox" id="${id}" ${checked?'checked':''}>
      </label>`;
  }

  function presetBtn(id, txt){ 
    return `<button class="kzBtn" data-preset="${id}">${txt}</button>`; 
  }

  function buildModal(){
    const cfg = loadCfg();
    const T = (k)=> (window.t?.(window.S?.lang, k) || k);

    const wrap = document.createElement('div');
    wrap.className = 'kzModal';
    wrap.innerHTML = `
<div class="kzModal-overlay"></div>
<div class="kzModal-dialog" role="dialog" aria-modal="true">
  <div class="kzModal-head">
    <h3>${T('pipSettingsTitle')}</h3>
    <button class="kzModal-close" id="pipSetClose">✕</button>
  </div>
  <div class="kzModal-body">
    <section class="kzSec">
      <h4>${T('pipPresets')}</h4>
      <div class="btn-group">
        ${presetBtn('all', T('pipPresetAll'))}
        ${presetBtn('minimal', T('pipPresetMinimal'))}
        ${presetBtn('focus', T('pipPresetFocus'))}
        <button class="kzBtn ghost" id="pipSetReset">${T('pipReset')}</button>
      </div>
    </section>

    <section class="kzSec">
      <h4>PiP</h4>
      <div class="kzGrid">
        ${row('pipShowClock',   T('pipShowClock'),   cfg.showClock)}
        ${row('pipShowTask',    T('pipShowTask'),    cfg.showTask)}
        ${row('pipShowNext',    T('pipShowNext'),    cfg.showNext)}
        ${row('pipShowCounter', T('pipShowCounter'), cfg.showCounter)}
        ${row('pipAlertOverlay',T('pipAlertOverlay'),cfg.alertOverlay)}
      </div>
    </section>

    <div class="kzRowEnd" style="justify-content:flex-end">
      <button class="kzBtn" id="pipSetCancel">${T('close')}</button>
      <button class="kzBtn pri" id="pipSetSave">${T('save')}</button>
    </div>
  </div>
</div>`;

    // kapat
    const close = ()=> wrap.remove();
    wrap.querySelector('.kzModal-overlay')?.addEventListener('click', close);
    wrap.querySelector('#pipSetClose')?.addEventListener('click', close);
    wrap.querySelector('#pipSetCancel')?.addEventListener('click', close);

    // presetler
    wrap.querySelectorAll('[data-preset]').forEach(b=>{
      b.addEventListener('click', ()=>{
        const id = b.getAttribute('data-preset');
        let v = {...cfg};
        if(id==='all')      v = {...DEF};
        if(id==='minimal')  v = { showClock:true, showTask:false, showNext:true, showCounter:false, alertOverlay:true };
        if(id==='focus')    v = { showClock:false, showTask:false, showNext:false, showCounter:true,  alertOverlay:true };
        // kutuları yansıt
        ['Clock','Task','Next','Counter','AlertOverlay'].forEach(k=>{
          const el = wrap.querySelector('#pipShow'+k); if(el) el.checked = v['show'+k] ?? v['alertOverlay'];
        });
      });
    });

    // kaydet
    wrap.querySelector('#pipSetSave')?.addEventListener('click', ()=>{
      const v = {
        showClock:   wrap.querySelector('#pipShowClock').checked,
        showTask:    wrap.querySelector('#pipShowTask').checked,
        showNext:    wrap.querySelector('#pipShowNext').checked,
        showCounter: wrap.querySelector('#pipShowCounter').checked,
        alertOverlay:wrap.querySelector('#pipAlertOverlay').checked,
      };
      saveCfg(v);
      close();
    });

    // varsayılanlara dön
    wrap.querySelector('#pipSetReset')?.addEventListener('click', ()=>{
      ['Clock','Task','Next','Counter','AlertOverlay'].forEach(k=>{
        const el = wrap.querySelector('#pipShow'+k); if(el) el.checked = DEF['show'+k] ?? DEF['alertOverlay'];
      });
    });

    document.body.appendChild(wrap);
  }

  // dışarı aç
  window.openPipSettings = buildModal;

  // global başlangıç
  window.__KZS_PIPCFG__ = loadCfg();
})();
