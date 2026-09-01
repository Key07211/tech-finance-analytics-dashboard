# Tech Finance Analytics Dashboard

[![Live Dashboard](https://img.shields.io/badge/Live_Dashboard-Open-2563EB?style=for-the-badge)](https://key07211.github.io/tech-finance-analytics-dashboard/)

An end-to-end quantitative finance project analyzing **35 technology and clean-energy stocks**, **3 thematic sectors**, and **6 market benchmarks** across **251 trading days** from May 12, 2025 through May 11, 2026. The project combines reproducible Python analysis with a self-contained, interactive dashboard designed for portfolio presentation.

## Live dashboard

**[Open the interactive dashboard](https://key07211.github.io/tech-finance-analytics-dashboard/)**

The presentation-only dashboard includes seven views:

- **Overview** — market and sector performance, headline metrics, and portfolio comparison
- **Performance** — return/volatility positioning, monthly-return heatmap, and sortable security table
- **Risk** — drawdowns, historical VaR, volatility spikes, Sortino, and Calmar ratios
- **Relationships** — stock-pair correlations, beta, alpha, and S&P 500 sensitivity
- **Lead–lag** — exploratory lagged correlations and leadership scores
- **Portfolio lab** — optimized weights, cumulative return paths, Sharpe comparison, and portfolio scorecard
- **Method** — metric definitions, assumptions, data coverage, and limitations

Charts support hover tooltips, sector filtering, tab navigation, and sortable evidence tables. All financial units and number formats use English conventions.

## Project scope

| Group | Count | Coverage |
|---|---:|---|
| AI | 12 | NVDA, MSFT, GOOGL, META, AMZN, CRM, PLTR, AI, SNOW, IBM, SMCI, ORCL |
| Semiconductors | 10 | AMD, INTC, TSM, AVGO, QCOM, TXN, MU, MRVL, ARM, ASML |
| New Energy | 13 | TSLA, ENPH, SEDG, FSLR, RUN, PLUG, BE, NEE, RIVN, LCID, NIO, LI, XPEV |
| Benchmarks | 6 | S&P 500, NASDAQ, Dow Jones, Russell 2000, VIX, PHLX Semiconductor |

## Analytical workflow

1. Downloaded and validated daily OHLCV market data.
2. Calculated daily, monthly, annualized, and cumulative price returns.
3. Measured annualized volatility, rolling volatility spikes, drawdowns, and historical/parametric VaR.
4. Evaluated Sharpe, Sortino, Calmar, beta, alpha, and Treynor metrics.
5. Analyzed within-sector and cross-sector return correlations.
6. Tested one-to-five-day lead–lag relationships as exploratory evidence.
7. Constructed Equal Weight, Sector Equal, Maximum Sharpe, and Minimum Variance portfolios.
8. Converted reviewed CSV outputs into a portable interactive dashboard.

## Selected findings

- **Bloom Energy (BE)** produced the highest historical price return at **1,401.43%**, followed by **Micron (MU) at 763.83%** and **Intel (INTC) at 483.59%**. These extreme outcomes demonstrate both the upside and concentration risk in thematic portfolios.
- The **Equal Weight portfolio returned 75.59%**, while the **Sector Equal portfolio returned 80.90%**, compared with **26.84% for the S&P 500** over the same period.
- The in-sample **Maximum Sharpe portfolio returned 364.75%**, with **35.10% annualized volatility**, a **4.46 Sharpe ratio**, and a **−13.61% maximum drawdown**.
- The **Minimum Variance portfolio reduced annualized volatility to 14.18%**, compared with 27.42% for Equal Weight, but its total return was lower at 21.56%.
- The strongest reviewed same-day relationships included **TSM/ASML at 0.6506** and **NVDA/TSM at 0.6227**, highlighting meaningful semiconductor ecosystem co-movement.
- Lead–lag correlations were weak and exploratory. They should not be interpreted as causal relationships or production trading signals.

## Portfolio methodology

For stock \(i\) on day \(t\), daily return is:

```text
r(i,t) = Close(i,t) / Close(i,t-1) - 1
```

Portfolio daily return is the weighted sum of component returns:

```text
r(p,t) = Σ w(i) × r(i,t)
```

Cumulative portfolio return is compounded through time:

```text
R(p,T) = Π [1 + r(p,t)] - 1
```

Optimization constraints:

- Long-only weights
- Portfolio weights sum to 100%
- Maximum position size of 15%
- Annual risk-free rate of 5% for Sharpe calculations

The backtest applies constant target weights to daily returns, which is equivalent to daily rebalancing before transaction costs. Maximum Sharpe and Minimum Variance portfolios are fitted and evaluated on the same historical sample; their results are **in-sample**, not forecasts of future performance.

## Technology

- **Python:** pandas, NumPy, SciPy, yfinance
- **Analytics:** return attribution, volatility, VaR, drawdown, beta, correlation, mean–variance optimization
- **Visualization:** Matplotlib, Seaborn, React, Recharts
- **Delivery:** self-contained HTML and GitHub Pages

## Repository structure

```text
analysis/               Python scripts, notebook, market data, and chart outputs
dashboard/              Interactive dashboard source and reviewed data generator
docs/index.html         Self-contained GitHub Pages dashboard
README.md               Project narrative, methodology, and findings
```

## Run the analysis

```bash
cd analysis
python -m pip install -r requirements.txt
python download_data.py
python EDA.py
python candlestick.py
python returns.py
python volatility.py
python correlation.py
python leadlag.py
python risk.py
python portfolio.py
```

## Rebuild the dashboard

```bash
cd dashboard
python generate_dashboard_data.py
```

The repository includes the authored React/CSS layer and reviewed `data.json`. The compiled, self-contained presentation is committed as `docs/index.html` for GitHub Pages.

## Resume-ready summary

**Tech Finance Analytics Dashboard — Python, pandas, SciPy, React, Recharts**

- Built an end-to-end quantitative research pipeline covering 35 AI, semiconductor, and new-energy stocks plus six market benchmarks across 251 trading days.
- Developed an interactive seven-view dashboard for performance, volatility, drawdown, VaR, correlation, beta, lead–lag, and portfolio optimization analysis.
- Implemented long-only mean–variance portfolios with a 15% position cap, comparing Equal Weight, Sector Equal, Maximum Sharpe, and Minimum Variance strategies against the S&P 500 while documenting in-sample and rebalancing limitations.

## Disclaimer

This project is for educational and portfolio-demonstration purposes only. Historical results do not predict future performance and do not constitute investment advice.
