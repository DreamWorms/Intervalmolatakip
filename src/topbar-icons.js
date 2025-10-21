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


// helpers
const $ = (s,r=document)=>r.querySelector(s);

function positionPopover(pop, anchor){
  const r = anchor.getBoundingClientRect();
  document.body.appendChild(pop);
  pop.style.left = Math.max(8, Math.min(window.innerWidth - pop.offsetWidth - 8, r.left + r.width/2 - pop.offsetWidth/2)) + 'px';
  pop.style.top  = (r.bottom + 10) + 'px';
  pop.classList.add('open');
}

function closePopovers(){ document.querySelectorAll('.tb-pop').forEach(p=>p.remove()); }

function openSelectPopover(btn, sel, titleText){
  if (!btn || !sel) return;
  closePopovers();

  const pop = document.createElement('div');
  pop.className = 'tb-pop'; pop.setAttribute('role','listbox'); pop.tabIndex = -1;

  const opts = Array.from(sel.options || []);
  pop.innerHTML =
    `<div class="tb-hd">${titleText||''}</div>` +
    opts.map(o => {
      const txt = (o.textContent||'').trim();
      const val = o.value;
      const selAttr = sel.value === val ? ' aria-selected="true"' : '';
      const tick = sel.value === val ? '<span class="tick">✓</span>' : '<span class="tick" style="opacity:.25">·</span>';
      return `<button class="tb-opt" role="option" data-val="${val}"${selAttr}><span>${txt}</span>${tick}</button>`;
    }).join('');

  pop.addEventListener('click', e=>{
    const b = e.target.closest('.tb-opt'); if(!b) return;
    sel.value = b.dataset.val;
    sel.dispatchEvent(new Event('change',{bubbles:true}));
    closePopovers();
  });

  positionPopover(pop, btn);

  // kapanışlar
  setTimeout(()=>{ // küçük gecikme: ilk tıklama popover içinde sayılmasın
    const onDocClick = (e)=>{ if(!e.target.closest('.tb-pop') && !e.target.closest('#btnTheme,#btnLang')){ 
      closePopovers(); document.removeEventListener('click', onDocClick, true);
    }};
    document.addEventListener('click', onDocClick, true);
  }, 0);
  document.addEventListener('keydown', (ev)=>{ if(ev.key==='Escape') closePopovers(); }, {once:true});
}

// i18n: mevcut t(S.lang, key) fonksiyonunu kullanıyoruz
function paintIconbarLabels(){
  const L = (window.S?.lang) || $('#langSelect')?.value || 'tr';
  const tFn = window.t || ((_,k)=>k);
  $('#lblTheme') && ($('#lblTheme').textContent = (tFn(L,'themeLabel') || 'Tema'));
  $('#lblLang')  && ($('#lblLang').textContent  = (tFn(L,'labelLang')  || 'Dil'));
  $('#lblFriends')&&($('#lblFriends').textContent= (tFn(L,'friends')    || 'Arkadaşlar'));
  $('#lblWell')  && ($('#lblWell').textContent  = (tFn(L,'wnTitle')     || 'Wellness'));
  $('#lblPip')   && ($('#lblPip').textContent   = 'PiP'); // sabit
}
window.paintIconbarLabels = paintIconbarLabels;

// bağlama
(function bindTopbarMenus(){
  const btnTheme = $('#btnTheme');
  const btnLang  = $('#btnLang');
  const selTheme = $('#themeSelect') || document.querySelector('[data-role="theme"]');
  const selLang  = $('#langSelect')  || document.querySelector('[data-role="lang"]');

  // butonlar: popover aç
  btnTheme?.addEventListener('click', ()=> openSelectPopover(btnTheme, selTheme, (window.t?.(window.S?.lang,'themeLabel')||'Tema')));
  btnLang ?.addEventListener('click', ()=> openSelectPopover(btnLang , selLang , (window.t?.(window.S?.lang,'labelLang')||'Dil')));

  // dil değişince yazıları güncelle + global state varsa senkronla
  selLang?.addEventListener('change', ()=>{
    if (window.S) window.S.lang = selLang.value;
    paintIconbarLabels();
  });

  // ilk boya
  paintIconbarLabels();
})();


// topbar.js (uygun bir yere, bir kere çalışsın)
import { openDocPiP } from './pip.js';

document.addEventListener('click', async (e) => {
  const btn = e.target.closest('#btnDocPip');
  if (!btn) return;

  try {
    await openDocPiP();                 // <- kullanıcı jesti içinde çağrılıyor
  } catch (err) {
    console.error('PiP açılamadı:', err);
    alert(err?.message || 'Doc PiP açılamadı.');
  }
});

// Klavye ile de açılabilsin
document.addEventListener('keydown', (e) => {
  const btn = document.activeElement?.closest?.('#btnDocPip');
  if (!btn) return;
  if (e.key === 'Enter' || e.key === ' ') {
    e.preventDefault();
    btn.click();
  }
});
