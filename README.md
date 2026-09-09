# Tech Finance Analytics — Market Yearbook

**[Open the interactive research story](https://key07211.github.io/tech-finance-analytics-dashboard/)**

## 未来的想象，市场的回答

我对 AI、半导体与新能源充满好奇。在我的观察中，这些方向吸引了大量投资，也承载着对未来的期待。那么，这份期待在上市公司的股价里，会呈现怎样的模样？

This project explores **35 selected listed companies** across **251 trading days, May 12, 2025–May 11, 2026**. The GitHub Pages homepage is a six-chapter Chinese interactive story designed for readers without a finance background.

1. **选择 / The watchlist:** author motivation, theme groups and company selection.
2. **全景 / The big picture:** comparable historical paths with a date slider and market reference.
3. **分化 / Beneath the average:** company-level distributions, medians and a largest-winner exclusion experiment.
4. **转折 / Turning points:** three data-backed checkpoints in the year.
5. **路径 / The path matters:** final returns, drawdowns and recovery, with full-path/endpoints comparison.
6. **回望 / What the year left us:** theme observations and a selected-company recap.

## What the selected sample shows

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

