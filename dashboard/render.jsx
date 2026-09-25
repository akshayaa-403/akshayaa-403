/* Draws the profile README's dashboard.
 *
 * React components laid out by Satori into SVG, one file per theme. Every number
 * is read at build time: the contribution calendar from the GraphQL API, each
 * repo's language and last push from the REST API, and whether each demo is up
 * from a request to the demo itself. The Action runs this every six hours, so "live"
 * means "as of the last run", and the footer says when that was.
 *
 *   GITHUB_TOKEN=... npm run build      -> ../dist/dashboard-{light,dark}.svg
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import React from 'react';
import satori from 'satori';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const OUT = path.join(HERE, '..', 'dist');
const USER = 'akshayaa-403';
const TOKEN = process.env.GITHUB_TOKEN;

/* What each project is and how to tell whether its demo is up. `expect` is a
   string the page must contain, because a GitHub Pages site that has fallen back
   to rendering the README still answers 200. */
const PROJECTS = [
  { group: 'Research', name: 'Phase-contrast clean-up', repo: 'phase-contrast-denoising',
    url: 'https://akshayaa-403.github.io/phase-contrast-denoising/', expect: 'interactive halo suppression', kind: 'demo' },
  { group: 'Research', name: 'Quantamental Screener', repo: 'quantamental-screener',
    // The app itself answers a script with a sign-in redirect loop; its health endpoint does not.
    url: 'https://quantamental-screener.streamlit.app/~/+/_stcore/health', expect: 'ok', kind: 'app' },
  { group: 'Research', name: 'Wikipedia Summarizer', repo: 'Wikipedia-Summarizer',
    url: 'https://akshayaa-403.github.io/Wikipedia-Summarizer/', expect: 'Four algorithms', kind: 'demo' },
  { group: 'Products', name: 'Habita', repo: 'Habita', note: 'no published build' },
  { group: 'Products', name: 'Arteza', url: 'https://arteza.site/', expect: 'Arteza', kind: 'site', note: 'client work' },
  { group: 'Products', name: 'notes', repo: 'notes', note: 'offline web app, not deployed' },
  { group: 'Experiments', name: 'anttodo', repo: 'anttodo',
    url: 'https://akshayaa-403.github.io/anttodo/', expect: 'Ant Colony', kind: 'demo' },
  { group: 'Experiments', name: 'agent_project', repo: 'agent_project', note: 'runs locally' },
  { group: 'Experiments', name: 'yosemite-image-translation-gan', repo: 'yosemite-image-translation-gan', note: 'weights not published' },
];

const THEMES = {
  light: { bg: '#ffffff', panel: '#f6f8fa', ink: '#1f2328', muted: '#59636e', rule: '#d1d9e0',
           accent: '#094e94', up: '#1a7f37', down: '#cf222e', idle: '#8c959f',
           heat: ['#ebeff4', '#b9cde3', '#7aa3cf', '#3a73b0', '#094e94'] },
  dark:  { bg: '#0d1117', panel: '#151b23', ink: '#e6edf3', muted: '#9198a1', rule: '#3d444d',
           accent: '#8bbcf0', up: '#3fb950', down: '#f85149', idle: '#6e7681',
           heat: ['#161b22', '#1d3452', '#2c5a8c', '#4f87c4', '#8bbcf0'] },
};

/* ------------------------------------------------------------------ data */
const gh = (url, init = {}) => fetch(url, {
  ...init,
  headers: { Accept: 'application/vnd.github+json', 'User-Agent': USER,
             ...(TOKEN ? { Authorization: `Bearer ${TOKEN}` } : {}), ...init.headers },
});

async function calendar() {
  if (TOKEN) {
    const query = `query($login:String!){ user(login:$login){ contributionsCollection{ contributionCalendar{
      totalContributions weeks{ contributionDays{ date contributionCount } } } } } }`;
    const r = await gh('https://api.github.com/graphql', { method: 'POST', body: JSON.stringify({ query, variables: { login: USER } }) });
    const j = await r.json();
    const c = j.data.user.contributionsCollection.contributionCalendar;
    return { total: c.totalContributions, weeks: c.weeks.map(w => w.contributionDays.map(d => ({ date: d.date, n: d.contributionCount }))) };
  }
  // No token (a local run): the same calendar GitHub draws on the profile page.
  const html = await (await fetch(`https://github.com/users/${USER}/contributions`)).text();
  const days = [...html.matchAll(/data-date="([\d-]+)"[^>]*id="(contribution-day-component-[\d-]+)"/g)].map(m => {
    const tip = html.match(new RegExp(`for="${m[2]}"[^>]*>([^<]*)<`));
    const n = tip && /^(\d+)/.test(tip[1]) ? +tip[1].match(/^(\d+)/)[1] : 0;
    return { date: m[1], n };
  }).sort((a, b) => a.date.localeCompare(b.date));
  const weeks = [];
  for (const d of days) {
    const dow = new Date(d.date + 'T00:00:00Z').getUTCDay();
    if (!weeks.length || dow === 0) weeks.push([]);
    weeks[weeks.length - 1].push(d);
  }
  return { total: days.reduce((s, d) => s + d.n, 0), weeks };
}

function streaks(weeks) {
  const days = weeks.flat();
  let longest = 0, run = 0;
  for (const d of days) { run = d.n ? run + 1 : 0; longest = Math.max(longest, run); }
  let i = days.length - 1, current = 0;
  if (i >= 0 && !days[i].n) i--;            // today may simply not have started yet
  for (; i >= 0 && days[i].n; i--) current++;
  const active = days.filter(d => d.n).length;
  return { current, longest, active };
}

async function repos() {
  const r = await gh(`https://api.github.com/users/${USER}/repos?per_page=100&type=owner`);
  return Object.fromEntries((await r.json()).map(x => [x.name, x]));
}

async function up(p) {
  if (!p.url) return null;
  try {
    const r = await fetch(p.url, { redirect: 'follow', signal: AbortSignal.timeout(20000),
                                   headers: { 'User-Agent': 'Mozilla/5.0 (profile dashboard uptime check)' } });
    if (!r.ok) return false;
    return p.expect ? (await r.text()).includes(p.expect) : true;
  } catch { return false; }
}

const ago = iso => {
  const d = Math.floor((Date.now() - Date.parse(iso)) / 864e5);
  if (d < 1) return 'today';
  if (d === 1) return 'yesterday';
  if (d < 14) return `${d} days ago`;
  if (d < 60) return `${Math.round(d / 7)} weeks ago`;
  return `${Math.round(d / 30)} months ago`;
};

/* ------------------------------------------------------------ components */
const W = 880, PAD = 28, CELL = 11, GAP = 3;

function Stat({ t, value, label }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', flex: 1, padding: '12px 14px', background: t.panel, borderRadius: 6 }}>
      <div style={{ display: 'flex', fontFamily: 'Plex Mono', fontSize: 26, fontWeight: 600, color: t.ink, lineHeight: 1.1 }}>{value}</div>
      <div style={{ display: 'flex', fontSize: 12, color: t.muted, marginTop: 4 }}>{label}</div>
    </div>
  );
}

function Heatmap({ t, weeks }) {
  // Quartiles of the active days, as GitHub does, so one busy day doesn't wash out the rest.
  const active = weeks.flat().map(d => d.n).filter(Boolean).sort((a, b) => a - b);
  const q = f => active[Math.min(active.length - 1, Math.floor(active.length * f))] || 1;
  const cuts = [q(0.25), q(0.5), q(0.75)];
  const level = n => (n === 0 ? 0 : 1 + cuts.filter(c => n > c).length);
  const months = [];
  weeks.forEach((w, i) => {
    const first = w.find(d => d.date.endsWith('-01') || d.date.slice(8) <= '07');
    const m = new Date(w[0].date + 'T00:00:00Z').toLocaleString('en-US', { month: 'short', timeZone: 'UTC' });
    if (i === 0 || (first && m !== months[months.length - 1]?.m && w[0].date.slice(8) <= '07')) months.push({ i, m });
  });
  return (
    <div style={{ display: 'flex', flexDirection: 'column' }}>
      <div style={{ display: 'flex', position: 'relative', height: 14, fontSize: 10, color: t.muted }}>
        {months.filter((x, k) => k === 0 || x.i - months[k - 1].i >= 3).map(({ i, m }) => (
          <div key={i} style={{ position: 'absolute', left: i * (CELL + GAP) }}>{m}</div>
        ))}
      </div>
      <div style={{ display: 'flex', gap: GAP }}>
        {weeks.map((w, i) => (
          <div key={i} style={{ display: 'flex', flexDirection: 'column', gap: GAP, justifyContent: i === 0 ? 'flex-end' : 'flex-start' }}>
            {w.map(d => <div key={d.date} style={{ width: CELL, height: CELL, borderRadius: 2, background: t.heat[level(d.n)] }} />)}
          </div>
        ))}
      </div>
    </div>
  );
}

function Status({ t, p }) {
  if (p.live === null) return <div style={{ display: 'flex', color: t.muted, fontSize: 12 }}>{p.note}</div>;
  return (
    <div style={{ display: 'flex', alignItems: 'center', fontSize: 12, color: p.live ? t.up : t.down }}>
      <div style={{ display: 'flex', width: 7, height: 7, borderRadius: 4, background: p.live ? t.up : t.down, marginRight: 6 }} />
      {`${p.kind} ${p.live ? 'up' : 'down'}`}{p.note ? <span style={{ color: t.muted, marginLeft: 6 }}>{`· ${p.note}`}</span> : null}
    </div>
  );
}

function Row({ t, p, first }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', height: 30, borderTop: `1px solid ${t.rule}` }}>
      <div style={{ display: 'flex', width: 104, fontSize: 11, fontFamily: 'Plex Mono', color: first ? t.accent : 'transparent', letterSpacing: 1 }}>{p.group.toUpperCase()}</div>
      <div style={{ display: 'flex', width: 260, fontSize: 14, fontWeight: 600, color: t.ink }}>{p.name}</div>
      <div style={{ display: 'flex', width: 110, fontSize: 12, fontFamily: 'Plex Mono', color: t.muted }}>{p.lang || '—'}</div>
      <div style={{ display: 'flex', width: 150, fontSize: 12, color: t.muted }}>{p.pushed ? `pushed ${ago(p.pushed)}` : 'no public repo'}</div>
      <div style={{ display: 'flex', flex: 1 }}><Status t={t} p={p} /></div>
    </div>
  );
}

function Dashboard({ t, cal, s, projects, stamp }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', width: W, height: '100%', padding: PAD, background: t.bg,
                  border: `1px solid ${t.rule}`, borderRadius: 10, fontFamily: 'Plex Sans', color: t.ink }}>
      <div style={{ display: 'flex', alignItems: 'center', fontFamily: 'Plex Mono', fontSize: 12, color: t.muted }}>
        <div style={{ display: 'flex', width: 8, height: 8, marginRight: 8 }} />{/* the pulsing dot is drawn over this after layout */}
        <span style={{ color: t.up, fontWeight: 600, marginRight: 10 }}>LIVE</span>
        <span>{`${USER} · rebuilt ${stamp}`}</span>
      </div>

      <div style={{ display: 'flex', gap: 10, marginTop: 16 }}>
        <Stat t={t} value={cal.total} label="contributions, last 12 months" />
        <Stat t={t} value={s.active} label="days with a contribution" />
        <Stat t={t} value={s.current} label="day streak, current" />
        <Stat t={t} value={s.longest} label="day streak, longest this year" />
      </div>

      <div style={{ display: 'flex', marginTop: 18 }}><Heatmap t={t} weeks={cal.weeks} /></div>

      <div style={{ display: 'flex', flexDirection: 'column', marginTop: 20, borderBottom: `1px solid ${t.rule}` }}>
        {projects.map((p, i) => <Row key={p.name} t={t} p={p} first={i === 0 || projects[i - 1].group !== p.group} />)}
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ build */
const font = (pkg, file) => fs.readFileSync(path.join(HERE, 'node_modules', '@fontsource', pkg, 'files', file));
const FONTS = [
  { name: 'Plex Sans', data: font('ibm-plex-sans', 'ibm-plex-sans-latin-400-normal.woff'), weight: 400 },
  { name: 'Plex Sans', data: font('ibm-plex-sans', 'ibm-plex-sans-latin-600-normal.woff'), weight: 600 },
  { name: 'Plex Mono', data: font('ibm-plex-mono', 'ibm-plex-mono-latin-400-normal.woff'), weight: 400 },
  { name: 'Plex Mono', data: font('ibm-plex-mono', 'ibm-plex-mono-latin-600-normal.woff'), weight: 600 },
];

const [cal, rs] = await Promise.all([calendar(), repos()]);
const s = streaks(cal.weeks);
const projects = await Promise.all(PROJECTS.map(async p => {
  const r = p.repo && rs[p.repo];
  return { ...p, lang: r?.language, pushed: r?.pushed_at, live: await up(p) };
}));
const ist = Object.fromEntries(new Intl.DateTimeFormat('en-US', { timeZone: 'Asia/Kolkata', day: 'numeric', month: 'short', year: 'numeric',
  hour: '2-digit', minute: '2-digit', hourCycle: 'h23' }).formatToParts(new Date()).map(x => [x.type, x.value]));
const stamp = `${ist.day} ${ist.month} ${ist.year}, ${ist.hour}:${ist.minute} IST`;
const H = PAD * 2 + 16 + 16 + 66 + 18 + 14 + 7 * CELL + 6 * GAP + 20 + projects.length * 30 + 2;

fs.mkdirSync(OUT, { recursive: true });
for (const [name, t] of Object.entries(THEMES)) {
  let svg = await satori(<Dashboard t={t} cal={cal} s={s} projects={projects} stamp={stamp} />, { width: W, height: H, fonts: FONTS });
  // Satori draws static SVG; the one moving part is added here with SMIL, which GitHub's image proxy keeps.
  const dot = `<circle cx="${PAD + 4}" cy="${PAD + 8}" r="4" fill="${t.up}"><animate attributeName="opacity" values="1;0.2;1" dur="1.8s" repeatCount="indefinite"/></circle>`;
  svg = svg.replace(/<\/svg>\s*$/, `<title>Live dashboard for ${USER}: ${cal.total} contributions in the last year, a ${s.current}-day current streak, and the status of each project's demo, rebuilt ${stamp}.</title>${dot}</svg>`);
  fs.writeFileSync(path.join(OUT, `dashboard-${name}.svg`), svg);
}
console.log(JSON.stringify({ total: cal.total, ...s, stamp, projects: projects.map(p => [p.name, p.lang, p.pushed?.slice(0, 10), p.live]) }, null, 1));
