// src/topbar-icons.js — topbar icon davranışları (modül değil)
(function(){
  const $  = (s, r=document) => r.querySelector(s);
  const on = (el, ev, fn) => el && el.addEventListener(ev, fn);

  const btnTheme = $('#tbTheme');
  const btnLang  = $('#tbLang');
  const btnFr    = $('#tbFriends');
  const btnWn    = $('#tbWellness');
  const btnPip   = $('#tbPip');

  const popTheme = $('#popTheme');
  const popLang  = $('#popLang');

  // Popover toggler
  function toggle(pop){
    if (!pop) return;
    const nowOpen = pop.hasAttribute('hidden');
    // önce hepsini kapat
    [popTheme, popLang].forEach(p => p && p.setAttribute('hidden',''));
    if (nowOpen) pop.removeAttribute('hidden');
  }

  on(btnTheme, 'click', () => toggle(popTheme));
  on(btnLang,  'click', () => toggle(popLang));

  // Dışarı tıklayınca kapat
  document.addEventListener('pointerdown', (e) => {
    const inside = e.target.closest?.('.tb-pop') || e.target.closest?.('.tb-icn');
    if (!inside){ [popTheme, popLang].forEach(p => p && p.setAttribute('hidden','')); }
  });
  // ESC kapatsın
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape'){ [popTheme, popLang].forEach(p => p && p.setAttribute('hidden','')); }
  });

  // Arkadaşlar / Wellness ⇒ mevcut butonları tetikle
  on(btnFr, 'click', () => { $('#openFriends')?.click(); });
  on(btnWn, 'click', () => { $('#openWellness')?.click(); });

  // Doc PiP ⇒ gizli orijinal butonu tetikle
  on(btnPip, 'click', () => { $('#openDocPipBtn')?.click(); });

  // i18n değişirse başlıkları güncelle (varsa)
 try{
    const I = window.I18N || {};
    const getLang = () => $('#langSelect')?.value || 'tr';
    const paint = () => {
      const L = getLang(), T = (k)=> (I[L]?.[k] ?? I.tr?.[k] ?? k);
      btnTheme.title = 'Tema'; $('#lblTheme').textContent = 'Tema';
      btnLang.title  = T('labelLang'); $('#lblLang').textContent = T('labelLang');
      btnFr.title    = T('frNewFriend'); $('#lblFriends').textContent = 'Arkadaşlar';
      btnWn.title    = T('wnTitle'); $('#lblWell').textContent = 'Wellness';
      btnPip.title   = T('docpip'); $('#lblPip').textContent = T('docpip');

      popTheme.querySelector('.tb-pop-head').textContent = 'Tema';
      popLang.querySelector('.tb-pop-head').textContent  = T('labelLang');
    };
    paint();
    $('#langSelect')?.addEventListener('change', paint);
  }catch(e){}
})();


// tiny helpers
const $  = (s,r=document)=>r.querySelector(s);

// DOM hazır + elementler hazır olana kadar bekle
function ready(cb){
  if (document.readyState === 'loading')
    document.addEventListener('DOMContentLoaded', cb, {once:true});
  else cb();
}
function waitFor(selectors, cb, timeout=5000){
  const missing = new Set(selectors);
  const iv = setInterval(()=>{
    for (const s of [...missing]) if ($(s)) missing.delete(s);
    if (missing.size === 0){ clearInterval(iv); cb(); }
  }, 100);
  setTimeout(()=>{
    if (missing.size){
      clearInterval(iv);
      console.warn('[topbar] bulunamadı:', [...missing]);
      cb(); // yine de dener; bulunanlarla bağlar
    }
  }, timeout);
}

function cycleSelect(sel, dir=+1){
  if (!sel || !sel.options?.length) return;
  const i = sel.selectedIndex < 0 ? 0 : sel.selectedIndex;
  sel.selectedIndex = (i + dir + sel.options.length) % sel.options.length;
  sel.dispatchEvent(new Event('change', {bubbles:true}));
}

function bindTopbar(){
  const btnTheme = $('#btnTheme');
  const btnLang  = $('#btnLang');
  const selTheme = $('#themeSelect') || document.querySelector('[data-role="theme"]');
  const selLang  = $('#langSelect')  || document.querySelector('[data-role="lang"]');

  // Debug izleri
  console.log('[topbar] bağla:', {btnTheme:!!btnTheme, btnLang:!!btnLang, selTheme:!!selTheme, selLang:!!selLang});

  // tema
  btnTheme?.addEventListener('click',    ()=> cycleSelect(selTheme, +1));
  btnTheme?.addEventListener('contextmenu', e=>{ e.preventDefault(); cycleSelect(selTheme, -1); });

  // dil
  btnLang?.addEventListener('click',     ()=> cycleSelect(selLang, +1));
  btnLang?.addEventListener('contextmenu',  e=>{ e.preventDefault(); cycleSelect(selLang, -1); });

  // dil değişince üstbar yazıları güncelle (i18n tarafın S.lang kullanıyorsa senkronla)
  selLang?.addEventListener('change', ()=>{
    try{ if (window.S) window.S.lang = selLang.value; }catch{}
    if (window.paintIconbarLabels) window.paintIconbarLabels();
  });
}

// çalıştır
ready(()=>{
  // buton ve selectlerin gerçek ID’lerini buraya yaz
  waitFor(['#btnTheme','#btnLang','#themeSelect','#langSelect'], bindTopbar);
});
