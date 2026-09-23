/* data-component="readme-vs-code": the profile README's badges against what
   the code actually imports. Static; it does not follow the selection. */
Almanac.component('readme-vs-code', root => {
  const { esc, D } = Almanac;
  const [both, readme, code] = D.venn;
  const col = (title, list, cls) => `<div><h3><span>${title}</span><span>${list.length}</span></h3><div class="chips">${list.map(x => `<span class="chip ${cls}">${esc(x)}</span>`).join('')}</div></div>`;
  root.innerHTML = `
    <div class="hd"><h2 id="h-readme">README vs. code</h2><span class="meta">${both.length} of ${both.length + readme.length} badges backed</span></div>
    <div class="venn">
      <div class="split" aria-hidden="true"><i class="sw-both" style="flex:${both.length}"></i><i class="sw-readme" style="flex:${readme.length}"></i><i class="sw-code" style="flex:${code.length}"></i></div>
      <p class="note" style="margin:0">public repos only — private work can’t show here</p>
      <div class="cols">${col('Both', both, 'both')}${col('README only', readme, 'readme')}${col('Code only', code, 'code')}</div>
    </div>`;
  root.setAttribute('aria-labelledby', 'h-readme');
});
