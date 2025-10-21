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

// Eski çekmeceyi DOM'dan sök
(function removeOldDock(){
  const sels = ['#dockBtn','#dockToggle','#openDock','.dockToggle','.kzDockToggle','.kzDock','.fabDock','.dock-menu','.dockBackdrop'];
  sels.forEach(s => document.querySelectorAll(s).forEach(n => n.remove()));
})();
