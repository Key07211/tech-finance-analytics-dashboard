"""Build the dependency-free GitHub Pages story from committed market CSVs.

From repository root: python dashboard/story/build_story.py
An optional --data-json path is intended for validation against a retrieved snapshot.
"""
import argparse
import csv
import json
from datetime import datetime
from pathlib import Path

SOURCE = Path(__file__).resolve().parent
TICKERS = 'NVDA MSFT GOOGL META AMZN CRM PLTR AI SNOW IBM SMCI ORCL AMD INTC TSM AVGO QCOM TXN MU MRVL ARM ASML TSLA ENPH SEDG FSLR RUN PLUG BE NEE RIVN LCID NIO LI XPEV GSPC'.split()

def validate(data):
    assert {s['ticker'] for s in data} == set(TICKERS), 'Unexpected universe'
    assert len(data) == len(TICKERS), 'Duplicate ticker'
    dates = data[0]['dates']
    assert dates == sorted(set(dates)), 'Dates must be unique and sorted'
    assert len(dates) == 251 and dates[0] == '2025-05-12' and dates[-1] == '2026-05-11', 'Story requires the reviewed 2025–26 snapshot'
    for stock in data:
        assert stock['dates'] == dates, 'Unaligned dates'
        assert len(stock['close']) == len(dates), 'Missing observations'
        assert all(isinstance(v, (int, float)) and 0 < v < float('inf') for v in stock['close']), 'Invalid Close'

def main():
    parser = argparse.ArgumentParser()
    parser.add_argument('--data-json', type=Path)
    parser.add_argument('--output', type=Path, default=SOURCE.parents[1] / 'docs' / 'index.html')
    args = parser.parse_args()
    if args.data_json:
        data = json.loads(args.data_json.read_text(encoding='utf-8'))
    else:
        data = []
        for ticker in TICKERS:
            path = SOURCE.parents[1] / 'analysis' / 'data' / f'{ticker}.csv'
            with path.open(encoding='utf-8-sig', newline='') as f:
                rows = list(csv.DictReader(f))
            data.append(dict(ticker=ticker, dates=[r['Date'] for r in rows], close=[float(r['Close']) for r in rows]))
    for stock in data:
        stock['dates'] = [datetime.strptime(d, '%Y/%m/%d' if '/' in d else '%Y-%m-%d').strftime('%Y-%m-%d') for d in stock['dates']]
    validate(data)
    html = (SOURCE / 'index.template.html').read_text(encoding='utf-8')
    for marker, content in [('/* STYLES */', (SOURCE/'style.css').read_text(encoding='utf-8')), ('/* DATA */', json.dumps(data, ensure_ascii=False, separators=(',', ':')).replace('<', '\\u003c')), ('/* APP */', (SOURCE/'app.js').read_text(encoding='utf-8'))]:
        assert html.count(marker) == 1
        html = html.replace(marker, content)
    args.output.parent.mkdir(parents=True, exist_ok=True)
    args.output.write_text(html, encoding='utf-8')
    print(f'Built {args.output} | {len(data)} series, {len(data[0]["dates"])} dates, {len(html.encode("utf-8")):,} bytes')

if __name__ == '__main__':
    main()

