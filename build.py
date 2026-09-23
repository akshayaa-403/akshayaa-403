"""Draws the profile README's panels as SVG from data.json.

GitHub strips scripts and stylesheets from a README but renders SVG images,
and an SVG may carry its own <style> -- so each panel themes itself with
prefers-color-scheme and animates with CSS, with no JavaScript anywhere.

    python build.py        # writes assets/*.svg, assets/repo/*.svg, almanac/data.js
                           # and the per-repo <details> in README.md
"""
import json, math, re, datetime as dt
from collections import Counter
from html import escape
from pathlib import Path

HERE = Path(__file__).parent
D = json.loads((HERE / 'data.json').read_text(encoding='utf8'))
OUT = HERE / 'assets'
OUT.mkdir(exist_ok=True)

MON = 'Jan Feb Mar Apr May Jun Jul Aug Sep Oct Nov Dec'.split()
WD = 'Mon Tue Wed Thu Fri Sat Sun'.split()
LANG = {'Python': 'py', 'JavaScript': 'js', 'CSS': 'css', 'HTML': 'html', 'Java': 'java'}
date = dt.date.fromisoformat
short = lambda s: f"{date(s).day} {MON[date(s).month - 1]} ’{s[2:4]}"

# ---------------------------------------------------------------- data
start = date(D['start'])
CAL = [(start + dt.timedelta(i), n) for i, n in enumerate(D['cal'])]
COMMITS = [dict(repo=r, t=t, date=t[:10], hour=int(t[11:13]), msg=m) for r, t, m, _ in D['commits']]
REPOS = D['repos']
total = sum(n for _, n in CAL)
peak_i = max(range(len(CAL)), key=lambda i: CAL[i][1])
longest = run = 0
for _, n in CAL:
    run = run + 1 if n else 0
    longest = max(longest, run)
late = round(100 * sum(c['hour'] >= 20 or c['hour'] < 4 for c in COMMITS) / len(COMMITS))
hours = Counter(c['hour'] for c in COMMITS)
counts = Counter(c['repo'] for c in COMMITS)
primary = lambda r: max(r['langs'], key=r['langs'].get) if r['langs'] else None

# ---------------------------------------------------------------- drawing
STYLE = """<style>
svg{--panel:#f8fafc;--line:#d3dee9;--line-soft:#e3eaf2;--ink:#16283d;--ink-soft:#3c5a7a;--muted:#4e6880;
--accent:#094e94;--deep:#00317a;--tint:rgba(9,78,148,.07);--night:rgba(9,78,148,.09);--hot:#c2412d;
--l0:#dde6f0;--l1:#b2d5e7;--l2:#80b1d7;--l3:#3d7fbe;--l4:#094e94;--l5:#00245c;
--py:#094e94;--js:#946b00;--css:#9a4a86;--html:#2e7254;--java:#5d4fa0;--other:#7a8896}
@media (prefers-color-scheme:dark){svg{--panel:#0f1b27;--line:#22364a;--line-soft:#182a3b;--ink:#eaf1f8;--ink-soft:#b3c6d8;--muted:#93a9bd;
--accent:#9ccbf2;--deep:#cfe6f5;--tint:rgba(125,184,232,.08);--night:rgba(125,184,232,.08);--hot:#ff8a70;
--l0:#172a3c;--l1:#1d4466;--l2:#2d6a9c;--l3:#4f95d0;--l4:#86c0ee;--l5:#d4ebfb;
--py:#7db8e8;--js:#e0b54a;--css:#e08cc8;--html:#6fc39c;--java:#ab9cf0;--other:#8fa0b0}}
text{font-family:'IBM Plex Mono',ui-monospace,SFMono-Regular,Menlo,Consolas,monospace;fill:var(--ink);font-size:11px}
.panel{fill:var(--panel);stroke:var(--line)}
.h{font-size:10px;letter-spacing:.12em;fill:var(--muted)}
.m{fill:var(--muted)}.s{fill:var(--ink-soft)}.a{fill:var(--accent)}.hot{fill:var(--hot)}
.note{fill:var(--accent);font-style:italic}
.l0{fill:var(--l0)}.l1{fill:var(--l1)}.l2{fill:var(--l2)}.l3{fill:var(--l3)}.l4{fill:var(--l4)}.l5{fill:var(--l5)}
.py{fill:var(--py)}.js{fill:var(--js)}.css{fill:var(--css)}.html{fill:var(--html)}.java{fill:var(--java)}.other{fill:var(--other)}
.rule{stroke:var(--line);fill:none}.soft{stroke:var(--line-soft)}
.win{fill:var(--tint)}.nightband{fill:var(--night)}.bar{fill:var(--accent)}.bar.n{fill:var(--deep)}
@keyframes pulse{50%{opacity:.25}}
.pulse{animation:pulse 2.4s ease-in-out infinite}
@media (prefers-reduced-motion:reduce){.pulse{animation:none}}
</style>"""


def svg(name, w, h, title, body):
    (OUT / f'{name}.svg').write_text(
        f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {w} {h}" width="{w}" height="{h}" role="img">'
        f'<title>{escape(title)}</title>{STYLE}'
        f'<rect class="panel" x=".5" y=".5" width="{w - 1}" height="{h - 1}" rx="6"/>{"".join(body)}</svg>',
        encoding='utf8')


def text(x, y, s, cls='', size=None, anchor=None, extra=''):
    a = f' class="{cls}"' if cls else ''
    a += f' style="font-size:{size}px"' if size else ''
    a += f' text-anchor="{anchor}"' if anchor else ''
    return f'<text x="{x:.1f}" y="{y:.1f}"{a}{extra}>{escape(str(s))}</text>'


def pol(cx, cy, r, a):  # degrees, 0 = up, clockwise
    t = math.radians(a - 90)
    return cx + r * math.cos(t), cy + r * math.sin(t)


def sector(cx, cy, r1, r2, a0, a1):
    (x1, y1), (x2, y2) = pol(cx, cy, r2, a0), pol(cx, cy, r2, a1)
    (x3, y3), (x4, y4) = pol(cx, cy, r1, a1), pol(cx, cy, r1, a0)
    L = int(a1 - a0 > 180)
    return (f'M{x1:.2f} {y1:.2f}A{r2} {r2} 0 {L} 1 {x2:.2f} {y2:.2f}'
            f'L{x3:.2f} {y3:.2f}A{r1} {r1} 0 {L} 0 {x4:.2f} {y4:.2f}Z')


def fit(s, width, size):  # monospace: a glyph is ~0.6em wide
    n = int(width / (size * 0.6))
    return s if len(s) <= n else s[:n - 1] + '…'


# ---------------------------------------------------------------- header
def header():
    W, H = 880, 158
    b = [text(20, 38, 'Akshayaa Kashyap', size=24, extra=' font-weight="600"'),
         text(20 + 17 * 14.4, 38, '@akshayaa-403', 'a', 24),
         text(20, 60, 'AI Engineer · AI & data · India · on GitHub since 13 Jun 2023', 'm', 12),
         text(20, 82, 'I build data pipelines, LLM workflows and dashboards that turn messy data into clear decisions.', 's', 12),
         f'<line class="rule" x1="20" x2="{W - 20}" y1="100" y2="100"/>']
    figs = [('CONTRIBUTIONS', total, 'last 12 mo'), ('ACTIVE DAYS', sum(1 for _, n in CAL if n), f'of {len(CAL)}'),
            ('LONGEST STREAK', longest, 'days'), ('COMMITS', len(COMMITS), 'public'), ('AFTER 8 PM', f'{late}%', 'of commits')]
    cw = (W - 40) / len(figs)
    for k, (lbl, v, sub) in enumerate(figs):
        x = 20 + k * cw
        if k:
            b.append(f'<line class="rule" x1="{x - 14:.1f}" x2="{x - 14:.1f}" y1="114" y2="146"/>')
        b += [text(x, 122, lbl, 'h'), text(x, 144, v, size=22, extra=' font-weight="500"'),
              text(x + len(str(v)) * 13.2 + 6, 144, sub, 'm', 11)]
    svg('header', W, H, f'Akshayaa Kashyap (@akshayaa-403): {total} contributions in the last 12 months, '
        f'{len(COMMITS)} public commits, {late}% of them after 8 pm IST.', b)


# ---------------------------------------------------------------- ring
def ring():
    W, H, cx, cy = 436, 476, 218, 244
    R0, RW, GAP = 84, 13.2, 12
    weeks = math.ceil(len(CAL) / 7)
    step = (360 - GAP) / weeks
    A0 = GAP / 2
    lvl = lambda n: 0 if n == 0 else 1 if n <= 2 else 2 if n <= 5 else 3 if n <= 10 else 4 if n <= 20 else 5

    def geom(i):
        w, dow = divmod(i, 7)
        return R0 + dow * RW + .6, R0 + (dow + 1) * RW - .6, A0 + w * step + .35, A0 + (w + 1) * step - .35

    b = [text(16, 24, 'THE YEAR, AS A RING', 'h')]
    for i, (d, n) in enumerate(CAL):
        r1, r2, a0, a1 = geom(i)
        b.append(f'<path class="l{lvl(n)}" d="{sector(cx, cy, r1, r2, a0, a1)}">'
                 f'<title>{d:%a %d %b %Y}: {n}</title></path>')
    r1, r2, a0, a1 = geom(peak_i)
    b.append(f'<path d="{sector(cx, cy, r1 - .8, r2 + .8, a0 - .4, a1 + .4)}" style="fill:none;stroke:var(--hot);stroke-width:1.6"/>')
    r1, r2, a0, a1 = geom(len(CAL) - 1)  # today
    x, y = pol(cx, cy, (r1 + r2) / 2, (a0 + a1) / 2)
    b.append(f'<circle class="hot pulse" cx="{x:.1f}" cy="{y:.1f}" r="3"/>')
    outer, last = R0 + 7 * RW, None
    for w in range(weeks):
        d = CAL[min(w * 7, len(CAL) - 1)][0]
        if d.month == last:
            continue
        if last is not None or d.day <= 7:
            x, y = pol(cx, cy, outer + 12, A0 + (w + .5) * step)
            jan = d.month == 1
            b.append(text(x, y + 3, f'’{d:%y}' if jan else MON[d.month - 1], '' if jan else 'm', 9, 'middle',
                          ' font-weight="600"' if jan else ''))
        last = d.month
    for k, ch in enumerate('SMTWTFS'):
        b.append(text(cx, cy - (R0 + (k + .5) * RW) + 2.6, ch, 'm', 7.5, 'middle'))
    pd, pn = CAL[peak_i]
    b += [text(cx, cy - 6, total, size=30, anchor='middle', extra=' font-weight="500"'),
          text(cx, cy + 12, 'contributions', 'm', 10.5, 'middle'),
          text(cx, cy + 26, f'{MON[CAL[0][0].month - 1]} ’{CAL[0][0]:%y} – {MON[CAL[-1][0].month - 1]} ’{CAL[-1][0]:%y}', 'm', 10.5, 'middle'),
          text(cx, cy + 46, f'loudest: {pn} on {pd.day} {MON[pd.month - 1]}', 'note', 11, 'middle')]
    lx = 16
    b.append(text(lx, H - 14, 'less', 'm', 10))
    for k in range(6):
        b.append(f'<rect class="l{k}" x="{lx + 32 + k * 14}" y="{H - 24}" width="10" height="10" rx="2"/>')
    b.append(text(lx + 32 + 6 * 14 + 4, H - 14, 'more', 'm', 10))
    b.append(text(W - 16, H - 14, 'red dot: today', 'm', 10, 'end'))
    svg('ring', W, H, f'Contribution calendar drawn as a ring, {total} contributions over the last 12 months; busiest day {pn} on {pd:%d %b %Y}.', b)


# ---------------------------------------------------------------- clock
def clock(commits=COMMITS, name='clock', label=''):
    W, H, cx, cy = 436, 476, 218, 206
    R0, R1 = 60, 146
    hours = Counter(c['hour'] for c in commits)
    late = round(100 * sum(c['hour'] >= 20 or c['hour'] < 4 for c in commits) / len(commits))
    mx = max(hours.values())
    step = 2 if mx <= 6 else 5 if mx <= 15 else 10
    ln = lambda n: n / mx * (R1 - R0)
    top = max(hours, key=hours.get)
    b = [text(16, 24, 'COMMIT CLOCK', 'h'), text(W - 16, 24, f'{label} · IST' if label else 'IST · shaded 20:00–04:00', 'a' if label else 'm', 10, 'end'),
         f'<path class="nightband" d="{sector(cx, cy, R0, R1 + 4, 300, 420)}"/>']
    for v in range(step, mx + 1, step):
        b += [f'<circle class="rule" cx="{cx}" cy="{cy}" r="{R0 + ln(v):.1f}" stroke-dasharray="2 3" stroke-width=".7"/>',
              text(cx + 3, cy - R0 - ln(v) - 2, v, 'm', 8)]
    b.append(f'<circle class="rule" cx="{cx}" cy="{cy}" r="{R0}"/>')
    for h in range(24):
        n = hours.get(h, 0)
        if n:
            night = ' n' if h >= 20 or h < 4 else ''
            b.append(f'<path class="bar{night}" '
                     f'd="{sector(cx, cy, R0 + 1, R0 + 1 + ln(n), h * 15 + 1.4, h * 15 + 13.6)}"><title>{h:02}:00 – {n} commits</title></path>')
    for s, a in (('00', 0), ('06', 90), ('12', 180), ('18', 270)):
        x, y = pol(cx, cy, R1 + 13, a)
        b.append(text(x, y + 3.5, s, 'm', 9.5, 'middle'))
    b += [text(cx, cy + 4, f'{late}%', size=28, anchor='middle', extra=' font-weight="500"'),
          text(cx, cy + 22, 'after 8 pm', 'm', 10.5, 'middle'),
          text(16, 392, f'busiest hour: {top:02}:00', 'note', 12)]
    wd = Counter(date(c['date']).weekday() for c in commits)
    wmx, bw = max(wd.values()), (W - 32 - 6 * 6) / 7
    for k in range(7):
        x, hgt = 16 + k * (bw + 6), wd.get(k, 0) / wmx * 44
        b += [f'<rect class="{"l2" if k > 4 else "l3"}" x="{x:.1f}" y="{448 - hgt:.1f}" width="{bw:.1f}" height="{hgt:.1f}" rx="2"><title>{WD[k]}: {wd.get(k, 0)}</title></rect>',
              text(x + bw / 2, 462, WD[k][0], 'm', 9.5, 'middle')]
    svg(name, W, H, f'Commits{" to " + label if label else ""} by hour of day in IST: {late}% land after 8 pm, the busiest hour is {top:02}:00.', b)


# ---------------------------------------------------------------- lifelines
def lifelines():
    W, H = 880, 350
    X0, X1 = 216, 736
    T0, T1 = date('2025-01-01'), date('2026-10-01')
    xp = lambda s: X0 + (date(s) - T0).days / (T1 - T0).days * (X1 - X0)
    b = [text(16, 24, 'REPOSITORIES, LIFELINES', 'h'), text(W - 16, 24, 'each tick is a commit · shaded: the ring’s twelve months', 'm', 10, 'end'),
         f'<rect class="win" x="{xp(D["start"]):.1f}" y="36" width="{xp(str(CAL[-1][0])) - xp(D["start"]):.1f}" height="{10 * 22 + 14}"/>']
    for s in ('2025-01-01', '2025-04-01', '2025-07-01', '2025-10-01', '2026-01-01', '2026-04-01', '2026-07-01'):
        b.append(text(xp(s), 48, f'’{s[2:4]}' if s[5:7] == '01' else MON[int(s[5:7]) - 1], 'm', 9.5, 'middle'))
    b += [text(16, 48, 'repo', 'm', 9.5), text(752, 48, 'languages', 'm', 9.5), text(W - 16, 48, 'n', 'm', 9.5, 'end')]
    for k, r in enumerate(REPOS):
        y = 66 + k * 22
        lc = LANG.get(primary(r), 'other')
        b += [f'<circle class="{lc}" cx="20" cy="{y - 3.5}" r="3.5"/>', text(30, y, fit(r['name'], 180, 11), size=11),
              f'<line class="rule" x1="{xp(r["created"]):.1f}" x2="{xp(r["pushed"]):.1f}" y1="{y - 4}" y2="{y - 4}"/>',
              f'<circle cx="{xp(r["created"]):.1f}" cy="{y - 4}" r="2.5" style="fill:var(--panel);stroke:var(--muted)"/>']
        for c in (c for c in COMMITS if c['repo'] == r['name']):
            b.append(f'<rect class="{lc}" x="{xp(c["date"]) - 1:.1f}" y="{y - 10}" width="2" height="12" rx="1" opacity=".9"><title>{escape(c["t"][:10])}: {escape(c["msg"])}</title></rect>')
        tot, x = sum(r['langs'].values()) or 1, 752
        b.append(f'<rect class="l0" x="752" y="{y - 7}" width="68" height="6" rx="3"/>')
        for l, n in sorted(r['langs'].items(), key=lambda kv: -kv[1]):
            w = n / tot * 68
            b.append(f'<rect class="{LANG.get(l, "other")}" x="{x:.1f}" y="{y - 7}" width="{w:.1f}" height="6"/>')
            x += w
        b.append(text(W - 16, y, counts[r['name']], 's', 11, 'end'))
    totals = Counter()
    for r in REPOS:
        totals.update(r['langs'])
    tot, x, y = sum(totals.values()), 16, 300
    groups = Counter({LANG.get(l, 'other'): 0 for l in totals})
    names = {'py': 'Python', 'js': 'JavaScript', 'css': 'CSS', 'html': 'HTML', 'java': 'Java', 'other': 'Other'}
    for l, n in totals.items():
        groups[LANG.get(l, 'other')] += n
    b.append(f'<line class="rule soft" x1="16" x2="{W - 16}" y1="{y - 14}" y2="{y - 14}"/>')
    for g, n in groups.most_common():
        w = n / tot * (W - 32)
        b.append(f'<rect class="{g}" x="{x:.1f}" y="{y}" width="{w:.1f}" height="8"/>')
        x += w
    kx = 16
    for g, n in groups.most_common():
        label = f'{names[g]} {100 * n / tot:.1f}%'
        b += [f'<rect class="{g}" x="{kx}" y="{y + 20}" width="8" height="8" rx="2"/>', text(kx + 13, y + 28, label, 's', 10.5)]
        kx += 13 + len(label) * 6.3 + 16
    b.append(text(W - 16, y + 28, 'by bytes, all ten repos', 'm', 10.5, 'end'))
    svg('lifelines', W, H, 'Timeline of all ten public repositories with one tick per commit, and each repo’s language split.', b)


# ---------------------------------------------------------------- stack
def stack():
    W, H = 436, 420
    cols = [r for r in REPOS if r['code'] != 'RM']
    cx0, cw, rh = 180, 27, 15
    b = [text(16, 24, 'STACK, BY EVIDENCE', 'h'), text(W - 16, 24, '● imported · ○ optional', 'm', 10, 'end')]
    for k, r in enumerate(cols):
        b.append(text(cx0 + k * cw + cw / 2, 50, r['code'], 'm', 9.5, 'middle'))
    y = 60
    for fam, libs in D['stack']:
        b += [f'<line class="rule soft" x1="16" x2="{W - 16}" y1="{y}" y2="{y}"/>', text(16, y + 11, fam.upper(), 'm', 9)]
        for lib, where in libs:
            b.append(text(74, y + 11, lib, 's', 10.5))
            for k, r in enumerate(cols):
                x = cx0 + k * cw + cw / 2
                hit = next((w for w in where if w.rstrip('*') == r['code']), None)
                if hit is None:
                    b.append(f'<circle cx="{x}" cy="{y + 7.5}" r="1.5" style="fill:var(--line)"/>')
                elif hit.endswith('*'):
                    b.append(f'<circle cx="{x}" cy="{y + 7.5}" r="3.4" style="fill:none;stroke:var(--accent);stroke-width:1.4"/>')
                else:
                    b.append(f'<circle class="a" cx="{x}" cy="{y + 7.5}" r="4"/>')
            y += rh
    b.append(text(16, H - 12, 'from each repo’s imports and requirements files', 'm', 10))
    key = ' · '.join(f'{r["code"]} {r["name"]}' for r in cols)
    svg('stack', W, H, f'Libraries found in each repository’s code. Columns: {key}.', b)


# ---------------------------------------------------------------- words
CONV = re.compile(r'^(feat|fix|refactor|chore|docs|test|style|perf|ci|build)(\([^)]*\))?!?:\s*', re.I)
NORM = dict(updated='update', added='add', created='create', removed='remove', deleted='delete', revised='revise',
            fixed='fix', enhanced='enhance', refactored='refactor', implemented='implement', updates='update')


def words(commits=COMMITS, name='words', label=''):
    W, H = 436, 420
    f = Counter()
    for c in commits:
        m = re.search(r'[A-Za-z]+', CONV.sub('', c['msg']))
        if m:
            f[NORM.get(m.group().lower(), m.group().lower())] += 1
    top = f.most_common(9)
    mx = top[0][1]
    b = [text(16, 24, 'HOW THE COMMITS ARE WRITTEN', 'h')] + ([text(W - 16, 24, label, 'a', 10, 'end')] if label else [])
    x, y, lh = 16, 62, 0
    for w, n in top:
        size = 11 + 19 * math.sqrt(n / mx)
        wd = len(w) * size * .6 + 6 + len(str(n)) * 6
        if x + wd > W - 16:
            x, y, lh = 16, y + lh + 6, 0
        lh = max(lh, size)
        b += [text(x, y, w, size=f'{size:.1f}', extra=f' font-weight="500" opacity="{.55 + .45 * n / mx:.2f}"'),
              text(x + len(w) * size * .6 + 2, y - size * .55, n, 'm', 9)]
        x += wd + 12
    y += 24
    bw = (W - 32) / len(commits)
    for k, c in enumerate(commits):
        b.append(f'<rect class="{"hot" if CONV.match(c["msg"]) else "l1"}" x="{16 + k * bw:.2f}" y="{y}" width="{max(bw - .6, .6):.2f}" height="16"/>')
    conv = [c for c in commits if CONV.match(c['msg'])]
    since = f' since {short(conv[0]["date"])}' if conv else ''
    b += [text(16, y + 30, short(commits[0]['date']), 'm', 10), text(W - 16, y + 30, short(commits[-1]['date']), 'm', 10, 'end'),
          text(W / 2, y + 30, f'{round(100 * len(conv) / len(commits))}% “feat:/fix:”{since}', 'hot', 10, 'middle')]
    y += 58
    b.append(text(16, y, 'LATEST', 'h'))
    for c in reversed(commits[-9:]):
        y += 19
        stamp = f'{short(c["date"])} {c["t"][11:]}'
        b += [text(16, y, stamp, 'm', 10.5), text(142, y, fit(c['msg'] if label else f'{c["repo"]}  {c["msg"]}', W - 158, 10.5), 's', 10.5)]
    svg(name, W, H, f'The most common first words of commit messages{" to " + label if label else ""}, and the latest commits.', b)


# ---------------------------------------------------------------- per repo
# A README can't run a script, but it can open a <details>. So the live page's
# "click a repo to filter" becomes one <details> per repo, each holding that
# repo's own clock and words, drawn here ahead of time.
LIVE = 'https://akshayaa-403.github.io/akshayaa-403/almanac/'
START, END = '<!-- almanac:repos -->', '<!-- /almanac:repos -->'


def per_repo():
    (OUT / 'repo').mkdir(exist_ok=True)
    rows = []
    for r in sorted(REPOS, key=lambda r: -counts[r['name']]):
        cs = [c for c in COMMITS if c['repo'] == r['name']]
        if not cs:
            continue
        name, slug = r['name'], r['name'].lower()
        clock(cs, f'repo/{slug}-clock', name)
        words(cs, f'repo/{slug}-words', name)
        tot = sum(r['langs'].values())
        langs = ' · '.join(f'{l} {100 * n / tot:.0f}%' for l, n in sorted(r['langs'].items(), key=lambda kv: -kv[1])) or 'Markdown only'
        late = round(100 * sum(c['hour'] >= 20 or c['hour'] < 4 for c in cs) / len(cs))
        live = f'{LIVE}?repo={name}'
        desc = r['desc'][0].upper() + r['desc'][1:]
        rows.append('\n'.join([
            '<details>',
            f'<summary><b>{escape(name)}</b> · {len(cs)} commits · {late}% after 8 pm</summary>',
            '',
            f'{escape(desc)} Created {short(r["created"])}, last push {short(r["pushed"])}. {langs}.',
            '',
            '<p align="center">',
            f'  <a href="{live}#clock"><img src="assets/repo/{slug}-clock.svg" width="49%" alt="Commits to {escape(name)} by hour of day, IST: {late}% after 8 pm."></a>',
            f'  <a href="{live}#words"><img src="assets/repo/{slug}-words.svg" width="49%" alt="How the commits to {escape(name)} are written, and the latest ones."></a>',
            '</p>',
            '',
            f'[Open {escape(name)} in the live almanac]({live}) · [Repository](https://github.com/akshayaa-403/{name})',
            '</details>',
        ]))
    readme = HERE / 'README.md'
    s = readme.read_text(encoding='utf8')
    if START in s and END in s:
        head, rest = s.split(START, 1)
        s = head + START + '\n' + '\n'.join(rows) + '\n' + END + rest.split(END, 1)[1]
        readme.write_text(s, encoding='utf8', newline='\n')


def data_js():  # the live almanac reads the same data.json
    (HERE / 'almanac' / 'data.js').write_text(
        '/* Generated by build.py from data.json. Do not edit. */\nwindow.ALMANAC_DATA = '
        + json.dumps(D, ensure_ascii=False, separators=(',', ':')) + ';\n', encoding='utf8', newline='\n')


for draw in (header, ring, clock, lifelines, stack, words, per_repo, data_js):
    draw()
print('wrote', ', '.join(sorted(p.relative_to(OUT).as_posix() for p in OUT.rglob('*.svg'))))
