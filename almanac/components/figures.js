/* <dl data-component="figures">: the five headline numbers. */
Almanac.component('figures', root => {
  const A = Almanac;
  root.innerHTML = [
    ['Contributions', A.total, `in ${A.YEAR}`],
    ['Active days', A.activeDays, `of ${A.CAL.length}`],
    ['Longest streak', A.longest, A.longest === 1 ? 'day' : 'days'],
    ['Commits', A.COMMITS.length, `in ${A.YEAR}`],
    ['After 8 pm', A.lateShare(A.COMMITS) + '%', 'of commits'],
  ].map(([k, v, s]) => `<div><dt>${k}</dt><dd>${v}<small>${s}</small></dd></div>`).join('');
});
