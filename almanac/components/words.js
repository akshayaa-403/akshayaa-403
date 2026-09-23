/* data-component="words": the first verbs of commit messages, the drift
   toward conventional commits, and the latest ten. Follows the selection. */
Almanac.component('words', root => {
  const { esc, fmtShort } = Almanac;
  root.innerHTML = `
    <div class="hd"><h2 id="h-words">How the commits are written</h2><span class="filter" data-filter hidden></span></div>
    <div class="words">
      <div class="spec" aria-label="Most common first verbs in commit messages"></div>
      <div><div class="style-strip" aria-hidden="true"></div><div class="strip-cap"></div></div>
      <ol class="log" aria-label="Latest commits"></ol>
    </div>`;
  root.setAttribute('aria-labelledby', 'h-words');
  const spec = root.querySelector('.spec'), strip = root.querySelector('.style-strip'), cap = root.querySelector('.strip-cap'), log = root.querySelector('.log');

  const CONV = /^(feat|fix|refactor|chore|docs|test|style|perf|ci|build)(\([^)]*\))?!?:\s*/i;
  const NORM = { updated:'update', added:'add', created:'create', removed:'remove', deleted:'delete', revised:'revise', fixed:'fix', enhanced:'enhance', refactored:'refactor', implemented:'implement', improved:'improve', adds:'add', updates:'update' };

  return ({ list }) => {
    const f = {};
    for (const c of list) {
      const w = (c.msg.replace(CONV, '').match(/[A-Za-z]+/) || [''])[0].toLowerCase();
      if (w) { const k = NORM[w] || w; f[k] = (f[k] || 0) + 1; }
    }
    const top = Object.entries(f).sort((a, b) => b[1] - a[1]).slice(0, 9), max = top[0]?.[1] || 1;
    spec.innerHTML = top.map(([w, n]) => `<span style="font-size:${(11 + 19 * Math.sqrt(n / max)).toFixed(1)}px;opacity:${(.55 + .45 * n / max).toFixed(2)}">${esc(w)}<sup>${n}</sup></span>`).join('') || '<span>—</span>';
    const conv = list.filter(c => CONV.test(c.msg)).length, firstConv = list.find(c => CONV.test(c.msg));
    strip.innerHTML = list.map(c => `<i class="${CONV.test(c.msg) ? 'cv' : ''}"></i>`).join('');
    cap.innerHTML = `<span>${list.length ? fmtShort(list[0].date) : ''}</span><span><b style="color:var(--hot);font-weight:500">${Math.round(100 * conv / (list.length || 1))}%</b> conventional (<code>feat:</code> <code>fix:</code> …)${firstConv ? ' since ' + fmtShort(firstConv.date) : ''}</span><span>${list.length ? fmtShort(list.at(-1).date) : ''}</span>`;
    log.innerHTML = list.slice(-10).reverse().map(c => `<li><time datetime="${c.t}">${fmtShort(c.date)} ${c.t.slice(11)}</time><span><b>${esc(c.repo)}</b> ${esc(c.msg)}</span></li>`).join('');
  };
});
