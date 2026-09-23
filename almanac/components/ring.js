/* data-component="ring": the contribution calendar bent into a ring, 53 weeks
   clockwise from the top, Sunday innermost. Hover a day to read it in the
   centre; a selected repo marks its commit days in red. */
Almanac.component('ring', root => {
  const { CAL, MON, esc, el, utc, fmtDay, polar, sector, peak, total, COMMITS, commitsByDay } = Almanac;
  root.innerHTML = `
    <div class="hd"><h2 id="h-ring">The year, as a ring</h2><span class="legend" aria-hidden="true">less <i style="background:var(--l0)"></i><i style="background:var(--l1)"></i><i style="background:var(--l2)"></i><i style="background:var(--l3)"></i><i style="background:var(--l4)"></i><i style="background:var(--l5)"></i> more</span></div>
    <div class="draw">
      <svg viewBox="0 0 400 400" role="img" aria-label="Contribution calendar drawn as a ring: 53 weeks clockwise from the top, Sunday innermost."></svg>
      <div class="centre" aria-live="polite"></div>
    </div>`;
  root.setAttribute('aria-labelledby', 'h-ring');
  const ring = root.querySelector('svg'), centre = root.querySelector('.centre');

  const RC = 200, R0 = 86, RW = 13.4, GAP = 12, WEEKS = Math.ceil(CAL.length / 7);
  const STEP = (360 - GAP) / WEEKS, A0 = GAP / 2;
  const level = n => n === 0 ? 0 : n <= 2 ? 1 : n <= 5 ? 2 : n <= 10 ? 3 : n <= 20 ? 4 : 5;
  const geom = i => { const w = Math.floor(i / 7), dow = i % 7; return { a0: A0 + w * STEP + .35, a1: A0 + (w + 1) * STEP - .35, r1: R0 + dow * RW + .6, r2: R0 + (dow + 1) * RW - .6 }; };

  const cells = el('g');
  for (const d of CAL) {
    const g = geom(d.i);
    const p = el('path', { d: sector(RC, RC, g.r1, g.r2, g.a0, g.a1), class: 'cell', fill: `var(--l${level(d.n)})` });
    p.dataset.i = d.i;
    cells.append(p);
  }
  ring.append(cells);
  const g = geom(peak.i);
  ring.append(el('path', { d: sector(RC, RC, g.r1 - .6, g.r2 + .6, g.a0 - .35, g.a1 + .35), fill: 'none', stroke: 'var(--hot)', 'stroke-width': 1.6, 'pointer-events': 'none' }));
  const outer = R0 + 7 * RW;
  let lastM = -1;
  for (let w = 0; w < WEEKS; w++) {
    const d = utc(CAL[Math.min(w * 7, CAL.length - 1)].date), m = d.getUTCMonth();
    if (m === lastM) continue;
    if (lastM !== -1 || d.getUTCDate() <= 7) {
      const [x, y] = polar(RC, RC, outer + 11, A0 + (w + .5) * STEP);
      const t = el('text', { x, y, class: m === 0 ? 'axis-y' : 'axis-t', 'text-anchor': 'middle', 'dominant-baseline': 'central' });
      t.textContent = m === 0 ? '’' + String(d.getUTCFullYear()).slice(2) : MON[m];
      ring.append(t);
      const [x1, y1] = polar(RC, RC, outer + 1, A0 + w * STEP), [x2, y2] = polar(RC, RC, outer + 4, A0 + w * STEP);
      ring.append(el('line', { x1, y1, x2, y2, stroke: 'var(--muted)', 'stroke-width': .8 }));
    }
    lastM = m;
  }
  'SMTWTFS'.split('').forEach((ch, k) => { const t = el('text', { x: RC, y: RC - (R0 + (k + .5) * RW), class: 'dow-t' }); t.textContent = ch; ring.append(t); });
  const overlay = el('g', { 'pointer-events': 'none' });
  ring.append(overlay);

  let repo = null;
  function rest() {
    if (repo) {
      const days = new Set(COMMITS.filter(c => c.repo === repo && c.date >= CAL[0].date).map(c => c.date)).size;
      centre.innerHTML = `<span class="big">${days}</span><span class="lbl">days with commits to<br>${esc(repo)}</span><span class="note">marked in red</span>`;
    } else {
      const m = s => `${MON[utc(s).getUTCMonth()]} ’${s.slice(2,4)}`;
      centre.innerHTML = `<span class="big">${total}</span><span class="lbl">contributions<br>${m(CAL[0].date)} – ${m(CAL.at(-1).date)}</span><span class="note">loudest: ${peak.n} on ${utc(peak.date).getUTCDate()} ${MON[utc(peak.date).getUTCMonth()]}</span>`;
    }
  }
  ring.addEventListener('pointerover', e => {
    const i = e.target.dataset?.i; if (i == null) return;
    const d = CAL[+i], cs = (commitsByDay[d.date] || []).filter(c => !repo || c.repo === repo), first = cs[0];
    centre.innerHTML = `<span class="big">${d.n}</span><span class="lbl">${d.n === 1 ? 'contribution' : 'contributions'}<br>${fmtDay(d.date)}</span>` +
      (first ? `<span class="msg">${esc(first.repo)}: ${esc(first.msg)}${cs.length > 1 ? ` <em>+${cs.length - 1} more</em>` : ''}</span>` : '');
  });
  ring.addEventListener('pointerleave', rest);

  const idx = Object.fromEntries(CAL.map(d => [d.date, d.i]));
  return state => {
    repo = state.repo;
    overlay.replaceChildren();
    ring.classList.toggle('ring-muted', !!repo);
    if (repo) for (const date of new Set(state.list.map(c => c.date))) {
      if (idx[date] == null) continue;
      const g = geom(idx[date]), [x, y] = polar(RC, RC, (g.r1 + g.r2) / 2, (g.a0 + g.a1) / 2);
      overlay.append(el('circle', { cx: x.toFixed(1), cy: y.toFixed(1), r: 3.4, fill: 'var(--hot)', stroke: 'var(--panel)', 'stroke-width': 1 }));
    }
    rest();
  };
});
