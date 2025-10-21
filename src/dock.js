// ===== KZ Dock temel davranış =====
(function () {
  const $ = (sel, root = document) => root.querySelector(sel);
  const on = (el, ev, fn) => el && el.addEventListener(ev, fn);

  const dock = $('#kzDock');
  const trigger = $('#kzDockTrigger');
  const panel = $('#kzDockPanel');

  if (!dock || !trigger || !panel) return;

  const openPanel = () => {
    panel.hidden = false;
    trigger.setAttribute('aria-expanded', 'true');
    // ilk odak
    const firstItem = panel.querySelector('.kzDock-item');
    firstItem && firstItem.focus && firstItem.focus();
    // dışa tıkla → kapat
    setTimeout(() => {
      document.addEventListener('click', outsideClose, { capture: true, once: true });
    }, 0);
  };
  const closePanel = () => {
    panel.hidden = true;
    trigger.setAttribute('aria-expanded', 'false');
  };
  const outsideClose = (e) => {
    if (!panel.contains(e.target) && e.target !== trigger) closePanel();
  };

  on(trigger, 'click', () => (panel.hidden ? openPanel() : closePanel()));
  on(document, 'keydown', (e) => {
    if (e.key === 'Escape') {
      if (!panel.hidden) closePanel();
      // açık modal varsa kapat
      const openModal = document.querySelector('.kzModal:not([hidden])');
      if (openModal) hideModal(openModal.id);
    }
  });

  // ===== Modal kontrol =====
  const showModal = (id) => {
    const m = document.getElementById(id);
    if (!m) return;
    m.hidden = false;
    document.documentElement.style.overflow = 'hidden';
  };
  const hideModal = (id) => {
    const m = document.getElementById(id);
    if (!m) return;
    m.hidden = true;
    document.documentElement.style.overflow = '';
  };

  // kapatma butonları + overlay
  document.addEventListener('click', (e) => {
    const closeFor = e.target.getAttribute && e.target.getAttribute('data-close');
    if (closeFor) hideModal(closeFor);
  });

  // Dock öğeleri
  on($('#openFriends'), 'click', () => { closePanel(); showModal('friendsModal'); });
  on($('#openWellness'), 'click', () => { closePanel(); showModal('wellnessBookModal'); });

})();
