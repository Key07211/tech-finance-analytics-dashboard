"""Build the Tableau-style story dashboard (single dependency-free HTML file).

Usage, from the repository root:
    python dashboard/story-tableau/build.py
or from anywhere:
    python build.py --repo <path to the repository> [--out <path>/docs/index.html]

Reads analysis/data/<TICKER>.csv from the repository, normalizes dates, validates the
snapshot, embeds the Close series plus style.css and app.js into template.html and
writes the finished page. Standard library only.
"""
import argparse
import csv
import json
import math
import statistics
from datetime import datetime
from pathlib import Path

HERE = Path(__file__).resolve().parent
TICKERS = ('NVDA MSFT GOOGL META AMZN CRM PLTR AI SNOW IBM SMCI ORCL '
           'AMD INTC TSM AVGO QCOM TXN MU MRVL ARM ASML '
           'TSLA ENPH SEDG FSLR RUN PLUG BE NEE RIVN LCID NIO LI XPEV GSPC').split()
THEMES = {
    'AI': 'NVDA MSFT GOOGL META AMZN CRM PLTR AI SNOW IBM SMCI ORCL'.split(),
    'Chip': 'AMD INTC TSM AVGO QCOM TXN MU MRVL ARM ASML'.split(),
    'NewEnergy': 'TSLA ENPH SEDG FSLR RUN PLUG BE NEE RIVN LCID NIO LI XPEV'.split(),
}


def read_series(repo: Path):
    dates = None
    close = {}
    for t in TICKERS:
        path = repo / 'analysis' / 'data' / f'{t}.csv'
        with path.open(encoding='utf-8-sig', newline='') as f:
            rows = list(csv.DictReader(f))
        d = [datetime.strptime(r['Date'], '%Y/%m/%d' if '/' in r['Date'] else '%Y-%m-%d').strftime('%Y-%m-%d')
             for r in rows]
        c = [float(r['Close']) for r in rows]
        if dates is None:
            dates = d
        assert d == dates, f'{t}: dates not aligned'
        assert all(math.isfinite(v) and v > 0 for v in c), f'{t}: invalid Close'
        close[t] = c
    assert dates == sorted(set(dates)), 'dates must be unique and sorted'
    assert len(dates) == 251 and dates[0] == '2025-05-12' and dates[-1] == '2026-05-11', 'unexpected snapshot'
    return dates, close


def pearson(a, b):
    ma, mb = sum(a) / len(a), sum(b) / len(b)
    num = sum((x - ma) * (y - mb) for x, y in zip(a, b))
    va = sum((x - ma) ** 2 for x in a)
    vb = sum((y - mb) ** 2 for y in b)
    return num / math.sqrt(va * vb)


def facts(dates, close):
    """Print the numbers the page will show, for a manual cross-check against the analysis CSVs."""
    ret = {t: (c[-1] / c[0] - 1) * 100 for t, c in close.items()}
    daily = {t: [c[i] / c[i - 1] - 1 for i in range(1, len(c))] for t, c in close.items()}
    normal = {t: [v / c[0] * 100 for v in c] for t, c in close.items()}
    print('--- full-period returns (sample) ---')
    for t in ('NVDA', 'BE', 'SMCI', 'LCID', 'GSPC'):
        print(f'{t:5s} {ret[t]:9.2f}%')
    print('--- themes ---')
    paths = {}
    for g, ts in THEMES.items():
        rs = [ret[t] for t in ts]
        paths[g] = [sum(normal[t][i] for t in ts) / len(ts) for i in range(len(dates))]
        print(f'{g:10s} n={len(ts):2d} gainers={sum(r > 0 for r in rs):2d} mean={statistics.mean(rs):8.2f}% '
              f'median={statistics.median(rs):8.2f}% basket_end={paths[g][-1] - 100:8.2f}%')
    print(f'S&P 500 end {normal["GSPC"][-1] - 100:.2f}%')
    print('--- checkpoints ---')
    for d in ('2025-10-29', '2026-03-30', '2026-05-11'):
        i = dates.index(d)
        print(d, ' '.join(f'{g}={paths[g][i] - 100:+.1f}%' for g in THEMES), f'SPX={normal["GSPC"][i] - 100:+.1f}%')
    ai_peak = max(range(len(dates)), key=lambda i: paths['AI'][i])
    print('AI basket high on', dates[ai_peak])
    for g in ('AI', 'Chip'):
        hi, dd, trough = -1, 0, 0
        for i, v in enumerate(paths[g]):
            hi = max(hi, v)
            if v / hi - 1 < dd:
                dd, trough = v / hi - 1, i
        print(f'{g} basket deepest drawdown {dd * 100:.1f}% trough {dates[trough]}')
    print('--- correlations ---')
    cross = [pearson(daily[a], daily[b]) for a in THEMES['AI'] for b in THEMES['Chip']]
    within = {}
    for g in ('AI', 'Chip'):
        ts = THEMES[g]
        within[g] = [pearson(daily[ts[i]], daily[ts[j]]) for i in range(len(ts)) for j in range(i + 1, len(ts))]
    ai_avg = [sum(daily[t][i] for t in THEMES['AI']) / 12 for i in range(len(dates) - 1)]
    chip_avg = [sum(daily[t][i] for t in THEMES['Chip']) / 10 for i in range(len(dates) - 1)]
    print(f'cross mean r={statistics.mean(cross):.3f} (n={len(cross)}, max={max(cross):.3f}, min={min(cross):.3f})')
    print(f'within AI r={statistics.mean(within["AI"]):.3f} (n={len(within["AI"])}) '
          f'within Chip r={statistics.mean(within["Chip"]):.3f} (n={len(within["Chip"])})')
    print(f'group-average r={pearson(ai_avg, chip_avg):.3f}')
    r = pearson(daily['NVDA'], daily['AMD'])
    same = sum(1 for x, y in zip(daily['NVDA'], daily['AMD']) if x * y > 0) / len(daily['NVDA']) * 100
    print(f'NVDA x AMD r={r:.3f} same-direction={same:.1f}%')


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('--repo', type=Path, default=None, help='repository root (default: two levels above this script)')
    ap.add_argument('--out', type=Path, default=None, help='output HTML (default: <repo>/docs/index.html)')
    args = ap.parse_args()
    repo = args.repo or HERE.parents[1]
    if not (repo / 'analysis' / 'data').is_dir():
        ap.error(f'no analysis/data under {repo}; pass --repo <path to the repository>')
    out = args.out or repo / 'docs' / 'index.html'
    dates, close = read_series(repo)
    facts(dates, close)
    data = json.dumps({'dates': dates, 'close': close}, separators=(',', ':')).replace('<', '\\u003c')
    html = (HERE / 'template.html').read_text(encoding='utf-8')
    for marker, content in (('/* STYLES */', (HERE / 'style.css').read_text(encoding='utf-8')),
                            ('/* DATA */', data),
                            ('/* APP */', (HERE / 'app.js').read_text(encoding='utf-8'))):
        assert html.count(marker) == 1, marker
        html = html.replace(marker, content)
    out.parent.mkdir(parents=True, exist_ok=True)
    out.write_text(html, encoding='utf-8')
    print(f'Built {out} | {len(close)} series x {len(dates)} dates | {len(html.encode("utf-8")):,} bytes')


if __name__ == '__main__':
    main()
