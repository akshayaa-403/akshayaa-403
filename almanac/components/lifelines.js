/* data-component="lifelines": every repo on one timeline, one tick per
   commit. Clicking a row selects that repo for the whole page. */
Almanac.component('lifelines', root => {
  const A = Almanac, { MON, esc, utc, fmtDay, fmtShort, REPOS, COMMITS, CAL, byName, counts, langColor, langBar, primary, showTip, hideTip } = A;
  root.innerHTML = `
    <div class="hd"><h2 id="h-life">Repositories, lifelines</h2><span class="meta">each tick is a commit · click a repo to filter</span></div>
    <div class="life"></div>
    <div class="foot"></div>`;
  root.setAttribute('aria-labelledby', 'h-life');
  const life = root.querySelector('.life'), foot = root.querySelector('.foot');

  const T0 = utc('2025-01-01').getTime(), T1 = utc('2026-10-01').getTime();
  const xp = s => ((utc(s).getTime() - T0) / (T1 - T0) * 100).toFixed(2) + '%';
  const ticks = ['2025-01-01','2025-04-01','2025-07-01','2025-10-01','2026-01-01','2026-04-01','2026-07-01']
    .map(s => `<span style="left:${xp(s)}">${s.slice(5,7) === '01' ? '’' + s.slice(2,4) : MON[+s.slice(5,7) - 1]}</span>`).join('');
  let html = `<div class="axis" aria-hidden="true"><span>repo</span><div class="ticks">${ticks}</div><span>languages</span><span style="text-align:right">n</span></div>`;
  for (const r of REPOS) {
    const colour = langColor(primary(r));
    const tickHtml = COMMITS.map((c, k) => c.repo === r.name ? `<i class="tick" data-c="${k}" style="left:${xp(c.date)};background:${colour}"></i>` : '').join('');
    html += `<button class="row" type="button" data-repo="${esc(r.name)}" aria-pressed="false">
      <span class="nm"><i style="background:${colour}"></i>${esc(r.name)}</span>
      <span class="track"><span class="win" style="left:${xp(CAL[0].date)};right:calc(100% - ${xp(CAL.at(-1).date)})"></span><span class="span" style="left:${xp(r.created)};right:calc(100% - ${xp(r.pushed)})"></span><span class="born" style="left:${xp(r.created)}"></span>${tickHtml}</span>
      <span class="langbar">${langBar(r.langs)}</span>
      <span class="n">${counts[r.name] || 0}</span></button>`;
  }
  life.innerHTML = html;
  life.addEventListener('pointerover', e => {
    const k = e.target.dataset?.c;
    if (k != null) { const c = COMMITS[+k]; showTip(`<b>${esc(c.repo)}</b> · ${fmtDay(c.date)} ${c.t.slice(11)}<br>${esc(c.msg)}`, e); }
    else if (e.target.classList?.contains('born')) showTip('repository created', e);
    else if (e.target.classList?.contains('win')) showTip('the twelve months the ring covers', e);
    else hideTip();
  });
  life.addEventListener('pointerleave', hideTip);
  life.addEventListener('click', e => { const b = e.target.closest('.row'); if (b) A.select(b.dataset.repo); });

  const totals = {}; REPOS.forEach(r => Object.entries(r.langs).forEach(([l, b]) => totals[l] = (totals[l] || 0) + b));
  return state => {
    life.querySelectorAll('.row').forEach(b => b.setAttribute('aria-pressed', b.dataset.repo === state.repo));
    if (state.repo) {
      const r = byName[state.repo], tot = Object.values(r.langs).reduce((a, b) => a + b, 0) || 1;
      const langs = Object.entries(r.langs).sort((a, b) => b[1] - a[1]).map(([l, b]) => `${esc(l)} ${(b / tot * 100).toFixed(b / tot < .1 ? 1 : 0)}%`).join(' · ') || 'no code — Markdown only';
      foot.innerHTML = `<p><b>${esc(r.name)}</b> — ${esc(r.desc)}</p><p>created ${fmtShort(r.created)} · last push ${fmtShort(r.pushed)} · ${counts[r.name] || 0} commits · ${langs} · <a href="https://github.com/akshayaa-403/${encodeURIComponent(r.name)}" target="_blank" rel="noreferrer">open on GitHub</a></p>`;
    } else {
      const g = { ...totals }, other = ['Dockerfile', 'Jupyter Notebook'].reduce((s, k) => s + (g[k] || 0), 0);
      delete g.Dockerfile; delete g['Jupyter Notebook']; g.Other = other;
      const tot = Object.values(g).reduce((a, b) => a + b, 0);
      foot.innerHTML = `<div class="langbar">${langBar(g)}</div><div class="keys">${Object.entries(g).sort((a, b) => b[1] - a[1]).map(([l, b]) => `<span><i style="background:${langColor(l)}"></i>${esc(l)} ${(b / tot * 100).toFixed(1)}%</span>`).join('')}<span style="color:var(--muted)">by bytes, all ten repos</span></div>`;
    }
  };
});
