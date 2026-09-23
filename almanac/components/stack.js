/* data-component="stack": libraries found in each repo's own imports and
   manifests. A column heading selects that repo. */
Almanac.component('stack', root => {
  const A = Almanac, { esc, REPOS, byName, D } = A;
  root.innerHTML = `
    <div class="hd"><h2 id="h-stack">Stack, by evidence</h2><span class="meta">● imported · ○ optional extra</span></div>
    <div class="mx" role="table" aria-label="Libraries found in each repository's imports and manifests"></div>`;
  root.setAttribute('aria-labelledby', 'h-stack');
  const mx = root.querySelector('.mx');
  const COLS = REPOS.filter(r => r.code !== 'RM');
  let h = `<span></span><span></span>` + COLS.map(r => `<button type="button" class="ch" data-repo="${esc(r.name)}" title="${esc(r.name)}">${r.code}</button>`).join('');
  for (const [fam, libs] of D.stack) libs.forEach(([lib, where], k) => {
    h += k === 0 ? `<span class="fam" style="grid-row:span ${libs.length}">${esc(fam)}</span>` : '';
    h += `<span class="lib" role="rowheader">${esc(lib)}</span>` + COLS.map(r => {
      const hit = where.find(w => w.replace('*', '') === r.code);
      return `<span class="c" data-col="${r.code}" title="${esc(lib)} · ${esc(r.name)}${hit ? (hit.endsWith('*') ? ' (optional extra)' : '') : ': not used'}"><i class="${hit ? 'dot' + (hit.endsWith('*') ? ' opt' : '') : 'ghost'}"></i></span>`;
    }).join('');
  });
  mx.innerHTML = h;
  mx.addEventListener('click', e => { const b = e.target.closest('.ch'); if (b) A.select(b.dataset.repo); });

  return state => {
    const code = state.repo && byName[state.repo].code;
    mx.querySelectorAll('[data-col], .ch').forEach(x => x.classList.toggle('sel', !!code && (x.dataset.col === code || x.dataset.repo === state.repo)));
  };
});
