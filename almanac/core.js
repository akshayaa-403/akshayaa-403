/* The Almanac's shared core: helpers, the figures every panel derives from
   data.js, one tooltip, and the selection every panel listens to.

   A panel is a component: an element carrying data-component="<name>". Each
   panel file calls Almanac.component(name, setup); setup(root) draws into
   root once and returns update(state), which runs on every selection. */
(() => {
  const D = window.ALMANAC_DATA;
  const NS = 'http://www.w3.org/2000/svg';
  const MON = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
  const WD = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];

  const esc = s => String(s).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const el = (tag, a = {}) => { const e = document.createElementNS(NS, tag); for (const k in a) e.setAttribute(k, a[k]); return e; };
  const utc = s => new Date(s.slice(0,10) + 'T00:00:00Z');
  const iso = d => d.toISOString().slice(0,10);
  const fmtDay = s => { const d = utc(s); return `${WD[d.getUTCDay()]} ${d.getUTCDate()} ${MON[d.getUTCMonth()]} ${d.getUTCFullYear()}`; };
  const fmtShort = s => { const d = utc(s); return `${d.getUTCDate()} ${MON[d.getUTCMonth()]} ’${String(d.getUTCFullYear()).slice(2)}`; };

  /* annular sector; angles in degrees, 0 = straight up, clockwise */
  const polar = (cx, cy, r, a) => { const t = (a - 90) * Math.PI / 180; return [cx + r * Math.cos(t), cy + r * Math.sin(t)]; };
  function sector(cx, cy, r1, r2, a0, a1) {
    const p = (r, a) => polar(cx, cy, r, a).map(v => v.toFixed(2));
    const L = a1 - a0 > 180 ? 1 : 0;
    const [x1,y1] = p(r2,a0), [x2,y2] = p(r2,a1), [x3,y3] = p(r1,a1), [x4,y4] = p(r1,a0);
    return `M${x1} ${y1}A${r2} ${r2} 0 ${L} 1 ${x2} ${y2}L${x3} ${y3}A${r1} ${r1} 0 ${L} 0 ${x4} ${y4}Z`;
  }

  /* ---------- derived data ---------- */
  const REPOS = D.repos;
  const byName = Object.fromEntries(REPOS.map(r => [r.name, r]));
  const LANG_VAR = { Python:'--py', JavaScript:'--js', CSS:'--css', HTML:'--html', Java:'--java' };
  const langColor = l => `var(${LANG_VAR[l] || '--other'})`;
  const primary = r => Object.entries(r.langs).sort((a, b) => b[1] - a[1])[0]?.[0];
  const COMMITS = D.commits.map(([repo, t, msg, sha]) => ({ repo, t, date: t.slice(0,10), hour: +t.slice(11,13), msg, sha }));
  // data.js is already cut to one calendar year by build.py; D.start is 1 Jan
  const YEAR = D.year, start = utc(D.start);
  const CAL = D.cal.map((n, i) => ({ date: iso(new Date(start.getTime() + i * 864e5)), n, i }));
  const total = CAL.reduce((s, d) => s + d.n, 0);
  const peak = CAL.reduce((a, b) => b.n > a.n ? b : a);
  let longest = 0, run = 0;
  for (const d of CAL) { run = d.n ? run + 1 : 0; longest = Math.max(longest, run); }
  const activeDays = CAL.filter(d => d.n).length;
  const counts = {}; COMMITS.forEach(c => counts[c.repo] = (counts[c.repo] || 0) + 1);
  const commitsByDay = {}; for (const c of COMMITS) (commitsByDay[c.date] ||= []).push(c);
  const lateShare = list => list.length ? Math.round(100 * list.filter(c => c.hour >= 20 || c.hour < 4).length / list.length) : 0;
  const langBar = langs => { const tot = Object.values(langs).reduce((a, b) => a + b, 0) || 1; return Object.entries(langs).sort((a, b) => b[1] - a[1]).map(([l, b]) => `<i style="width:${(b / tot * 100).toFixed(2)}%;background:${langColor(l)}" title="${esc(l)} ${(b / tot * 100).toFixed(1)}%"></i>`).join(''); };

  /* ---------- tooltip ---------- */
  const tip = document.createElement('div');
  tip.id = 'tip'; tip.setAttribute('role', 'tooltip');
  document.body.append(tip);
  function showTip(html, e) {
    tip.innerHTML = html; tip.classList.add('on');
    const w = tip.offsetWidth, h = tip.offsetHeight;
    let x = e.clientX + 14, y = e.clientY + 14;
    if (x + w > innerWidth - 8) x = e.clientX - w - 14;
    if (y + h > innerHeight - 8) y = e.clientY - h - 14;
    tip.style.left = x + 'px'; tip.style.top = y + 'px';
  }
  const hideTip = () => tip.classList.remove('on');

  /* ---------- components + selection ---------- */
  const registry = {}, mounted = [];
  const state = { repo: null, list: COMMITS };

  function select(name) {
    state.repo = name && name !== state.repo && byName[name] ? name : null;
    state.list = state.repo ? COMMITS.filter(c => c.repo === state.repo) : COMMITS;
    mounted.forEach(update => update(state));
    document.querySelectorAll('[data-filter]').forEach(f => {
      f.hidden = !state.repo;
      f.innerHTML = state.repo ? `${esc(state.repo)} <button type="button" aria-label="Clear filter">×</button>` : '';
    });
    // keep the address shareable: ?repo=Habita#clock opens filtered, at the clock
    const url = new URL(location.href);
    if (state.repo) url.searchParams.set('repo', state.repo); else url.searchParams.delete('repo');
    history.replaceState(null, '', url);
  }

  function component(name, setup) { registry[name] = setup; }

  function mount() {
    document.querySelectorAll('[data-component]').forEach(root => {
      const setup = registry[root.dataset.component];
      if (!setup) return;
      const update = setup(root);
      if (update) mounted.push(update);
    });
    document.addEventListener('click', e => { if (e.target.closest('[data-filter] button')) select(null); });
    document.addEventListener('keydown', e => { if (e.key === 'Escape' && state.repo) select(null); });
    select(new URLSearchParams(location.search).get('repo'));
  }

  window.Almanac = {
    D, YEAR, MON, WD, esc, el, utc, fmtDay, fmtShort, polar, sector,
    REPOS, byName, langColor, primary, COMMITS, CAL, total, peak, longest, activeDays,
    counts, commitsByDay, lateShare, langBar, showTip, hideTip,
    state, select, component, mount,
  };
})();
