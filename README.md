# Tech Finance Analytics — Market Yearbook

**[Open the interactive research story](https://key07211.github.io/tech-finance-analytics-dashboard/)**

## Future expectations. Market realities.

I am curious about AI, semiconductors and new energy. These fields caught my attention through the investment and optimism surrounding their future. How would those expectations show up in the share prices of listed companies?

This project explores **35 selected listed companies** across **251 trading days, May 12, 2025–May 11, 2026**. The GitHub Pages homepage is a seven-chapter English interactive story designed for readers without a finance background.

1. **The watchlist:** research motivation, theme groups and company selection.
2. **The big picture:** historical paths, a date slider and market reference.
3. **Beneath the average:** distributions, medians and winner exclusion.
4. **Correlation:** test the expected AI/chip link using all 120 cross-theme pairs, selected-pair scatters and rolling 30/60-day correlations.
5. **Turning points:** three data-backed checkpoints in the year.
6. **The path matters:** returns, drawdowns and recovery, with full-path/endpoints comparison.
7. **Looking back:** theme observations and a company recap.

## What the selected sample shows

- Mean daily-return Pearson correlation across the **120 AI–semiconductor pairs** is **0.2073**, compared with **0.2634 within AI** and **0.3820 within semiconductors**. The two groups' average daily returns correlate at **0.5554**: uneven stock-level links do not mean no aggregate co-movement.
- All **10 semiconductor sample stocks** ended the period higher.
- **5 of 12 AI sample stocks** rose; the median return was approximately **−3.0%**.
- **8 of 13 new-energy sample stocks** rose. Mean return was approximately **142.9%**, versus a median of **39.8%**; excluding Bloom Energy reduces the mean to approximately **38.0%**.
- Bloom Energy ended approximately **1,401.4%** higher, but experienced a maximum drawdown of approximately **45.9%**. A final return alone does not describe the path.

These are observations about the selected sample, not entire industries or future returns. Groups follow the original project taxonomy (for example, NVIDIA belongs to AI).

## Coverage

| Group | Companies |
|---|---|
| AI (12) | NVDA, MSFT, GOOGL, META, AMZN, CRM, PLTR, AI, SNOW, IBM, SMCI, ORCL |
| Semiconductors (10) | AMD, INTC, TSM, AVGO, QCOM, TXN, MU, MRVL, ARM, ASML |
| New Energy (13) | TSLA, ENPH, SEDG, FSLR, RUN, PLUG, BE, NEE, RIVN, LCID, NIO, LI, XPEV |

The original analysis also includes six market reference series. The story uses the S&P 500 as its market comparison.

## Rebuild the homepage

```sh
python dashboard/story/build_story.py
```

Python 3.9+ with the standard library is sufficient. This generates a self-contained `docs/index.html` from the committed market data. It works on GitHub Pages without npm, API keys, external chart libraries, or runtime data fetching. See [source and methodology](dashboard/story/README.md).

## Repository

```text
analysis/                 Original Python research, notebook, market CSVs and outputs
dashboard/story/          Current narrative homepage source and build script
dashboard/src/            Earlier dashboard source, retained for reference
docs/index.html           Current self-contained GitHub Pages homepage
```

## Method and interpretation

The story rebases each saved Close series to 100. Theme paths average these rebased series, equivalent to **equal allocations at the start, then holding without rebalancing**. This keeps the theme endpoint equal to its members' mean return. It differs from the earlier daily-rebalanced portfolios in `analysis/portfolio.py`.

The source downloader used yfinance without explicitly fixing `auto_adjust`. The story uses saved Close values as supplied and does not claim a separately verified dividend convention. Cash examples are proportional illustrations without fees or taxes. The selected universe and single historical period limit generalization; price co-movement does not establish event causality.

Original quantitative research remains available: returns, volatility, correlations, beta, lead–lag, risk ratios and portfolio optimization. Maximum Sharpe and Minimum Variance portfolios were fitted and evaluated on the same sample; their results are in-sample, not forecasts. Original portfolio assumptions include long-only weights, a 15% position cap, a 5% annual risk-free rate and daily target-weight rebalancing before costs.

## Run the original analysis

```sh
cd analysis
python -m pip install -r requirements.txt
python EDA.py
python candlestick.py
python returns.py
python volatility.py
python correlation.py
python leadlag.py
python risk.py
python portfolio.py
```

`download_data.py` retrieves a rolling year relative to the day it runs. Running it changes the historical snapshot; the authored story must be reviewed before changing its date coverage.

This project is for education and portfolio demonstration. Historical results do not predict future performance.

## Correlation validation

Run `node dashboard/story/test-correlation.cjs` after building. It reconciles every one of the original 231 pair coefficients within their four-decimal rounding tolerance and checks zero-variance handling, rolling-window boundaries and English-only page output. Pair coefficients use 250 aligned daily returns, not price levels; group averages of coefficients are distinct from correlations of equal-weight average daily returns.

