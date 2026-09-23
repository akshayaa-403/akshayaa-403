/* data-component="clock": commits by hour of day (IST) on a 24-hour dial,
   with the weekday split under it. Follows the selected repo. */
Almanac.component('clock', root => {
  const { el, sector, polar, utc, WD, lateShare, showTip, hideTip } = Almanac;
  root.innerHTML = `
    <div class="hd"><h2 id="h-clock">Commit clock</h2><span class="filter" data-filter hidden></span><span class="meta">IST · shaded 20:00–04:00</span></div>
    <div class="draw">
      <svg viewBox="0 0 300 300" role="img" aria-label="Commits by hour of day, India Standard Time."></svg>
      <div class="centre" style="width:min(30cqw,30cqh)"></div>
      <span class="note" style="position:absolute;left:0;bottom:0"></span>
    </div>
    <div class="week" aria-label="Commits by weekday"></div>`;
  root.setAttribute('aria-labelledby', 'h-clock');
  const clock = root.querySelector('svg'), centre = root.querySelector('.centre'), note = root.querySelector('.draw .note'), week = root.querySelector('.week');
  const CC = 150, CR0 = 58, CR1 = 130, pad = h => String(h).padStart(2, '0');

  function drawClock(list) {
    clock.replaceChildren();
    const hours = Array(24).fill(0); list.forEach(c => hours[c.hour]++);
    const max = Math.max(1, ...hours);
    const step = max <= 6 ? 2 : max <= 15 ? 5 : 10;
    const len = n => (n / max) * (CR1 - CR0);
    clock.append(el('path', { d: sector(CC, CC, CR0, CR1 + 4, 300, 420), fill: 'var(--night)' }));
    for (let v = step; v <= max; v += step) {
      clock.append(el('circle', { cx: CC, cy: CC, r: CR0 + len(v), fill: 'none', stroke: 'var(--line)', 'stroke-width': .7, 'stroke-dasharray': '2 3' }));
      const t = el('text', { x: CC + 3, y: CC - CR0 - len(v) - 2, class: 'axis-t', 'font-size': 8 }); t.textContent = v; clock.append(t);
    }
    clock.append(el('circle', { cx: CC, cy: CC, r: CR0, fill: 'none', stroke: 'var(--line)', 'stroke-width': .8 }));
    hours.forEach((n, h) => {
      if (!n) return;
      const p = el('path', { d: sector(CC, CC, CR0 + 1, CR0 + 1 + len(n), h * 15 + 1.4, h * 15 + 13.6), class: 'clock-bar' + (h >= 20 || h < 4 ? ' night' : '') });
      p.addEventListener('pointermove', e => showTip(`<b>${pad(h)}:00–${pad(h)}:59</b><br>${n} commit${n > 1 ? 's' : ''}`, e));
      p.addEventListener('pointerleave', hideTip);
      clock.append(p);
    });
    [['00', 0], ['06', 90], ['12', 180], ['18', 270]].forEach(([s, a]) => {
      const [x, y] = polar(CC, CC, CR1 + 13, a);
      const t = el('text', { x, y, class: 'axis-t', 'text-anchor': 'middle', 'dominant-baseline': 'central' }); t.textContent = s; clock.append(t);
    });
    centre.innerHTML = `<span class="big">${lateShare(list)}%</span><span class="lbl">after 8 pm</span>`;
    note.textContent = `busiest hour: ${pad(hours.indexOf(max))}:00`;
  }

  function drawWeek(list) {
    const c = Array(7).fill(0); list.forEach(x => c[utc(x.date).getUTCDay()]++);
    const max = Math.max(1, ...c);
    week.innerHTML = [1,2,3,4,5,6,0].map(d => `<div class="${d === 0 || d === 6 ? 'wk' : ''}" title="${WD[d]}: ${c[d]} commits"><b style="height:${(c[d] / max * 100).toFixed(1)}%"></b><span>${WD[d][0]}</span></div>`).join('');
  }

  return state => { drawClock(state.list); drawWeek(state.list); };
});
