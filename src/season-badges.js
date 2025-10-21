// src/season-badges.js
function nextOccur(month, day) {
  const now = new Date();
  let y = now.getFullYear();
  let target = new Date(y, month - 1, day, 0, 0, 0);
  if (target < now) target = new Date(y + 1, month - 1, day, 0, 0, 0);
  return target;
}
function diffParts(target) {
  const now = new Date();
  const ms = target - now;
  const days = Math.floor(ms / 86400000);
  const hours = Math.floor((ms % 86400000) / 3600000);
  const mins = Math.floor((ms % 3600000) / 60000);
  return { days, hours, mins };
}
function fmtCount({days, hours}) {
  // "g" = gün, "s" = saat. 0 gün kaldıysa saate düş.
  if (days <= 0) return `${hours}s`;
  return `${days}g`;
}
function renderBadges() {
  const wrap = document.getElementById('seasonBadges');
  if (!wrap) return;

  const toXmas = diffParts(nextOccur(12, 25));      // 25 Aralık
  const toHallo = diffParts(nextOccur(10, 31));     // 31 Ekim

  wrap.innerHTML = `
    <div class="kchip" data-kind="halloween" title="Halloween">
      <span class="face">🎃</span>
      <span class="count">${fmtCount(toHallo)}</span>
      <span class="label">Halloween</span>
    </div>
    <div class="kchip" data-kind="xmas" title="XMAS">
      <span class="face">🎄</span>
      <span class="count">${fmtCount(toXmas)}</span>
      <span class="label">XMAS</span>
    </div>
  `;
}
// ilk çizim + her dakikada bir tazele
renderBadges();
setInterval(renderBadges, 60 * 1000);
