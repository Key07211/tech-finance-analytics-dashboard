from __future__ import annotations

import csv
import json
from collections import defaultdict
from datetime import datetime, timezone
from pathlib import Path


PROJECT = Path(__file__).resolve().parent
SOURCE = PROJECT.parent / "analysis"
CHARTS = SOURCE / "charts"
DATA = SOURCE / "data"

APP_ID = "96a5d418-dfd1-4dcc-8170-fbccf2b86a08"


FILES = {
    "performance": CHARTS / "Part1_EDA/Step2_LineCharts/performance_summary.csv",
    "monthly": CHARTS / "Part1_EDA/Step3_Returns/monthly_return_detail.csv",
    "ranking": CHARTS / "Part1_EDA/Step3_Returns/yearly_return_ranking.csv",
    "volatility": CHARTS / "Part2_Volatility/Step4_AnnualizedVol/annualized_volatility.csv",
    "spikes": CHARTS / "Part2_Volatility/Step5_RollingVol/volatility_spikes.csv",
    "correlations": CHARTS / "Part3_Correlation/Step6_AIChipCorrelation/correlation_pairs.csv",
    "beta": CHARTS / "Part3_Correlation/Step7_Beta/beta_analysis.csv",
    "lagged": CHARTS / "Part4_LeadLag/Step8_LaggedCorrelation/lagged_correlations.csv",
    "leaders": CHARTS / "Part4_LeadLag/Step9_Leadership/leadership_scores.csv",
    "drawdown": CHARTS / "Part5_Risk/Step10_Drawdown/drawdown_analysis.csv",
    "risk": CHARTS / "Part5_Risk/Step11_RiskMetrics/risk_metrics.csv",
    "weights": CHARTS / "Part6_Portfolio/Step12_EfficientFrontier/optimal_weights.csv",
    "portfolios": CHARTS / "Part6_Portfolio/Step13_Backtest/portfolio_performance.csv",
}


def read_csv(path: Path):
    with path.open("r", encoding="utf-8-sig", newline="") as handle:
        return list(csv.DictReader(handle))


def number(value):
    if value in (None, "", "N/A", "Not recovered"):
        return None
    try:
        return float(value)
    except (TypeError, ValueError):
        return value


def normalize(rows, mapping):
    return [
        {output: number(row.get(source)) for output, source in mapping.items()}
        for row in rows
    ]


def relative(path: Path):
    return str(path.relative_to(SOURCE)).replace("\\", "/")


def provenance(label, paths, definitions, assumptions=None):
    source = {
        "label": label,
        "files": [relative(path) for path in paths],
        "filters": ["Historical snapshot: 2025-05-12 through 2026-05-11"],
        "metricDefinitions": definitions,
    }
    if assumptions:
        source["assumptions"] = assumptions
    return source


summary_rows = read_csv(DATA / "_summary.csv")
stocks = [row for row in summary_rows if row["Sector"] != "Index"]
indices = [row for row in summary_rows if row["Sector"] == "Index"]

performance = normalize(read_csv(FILES["performance"]), {
    "ticker": "Ticker", "name": "Name", "sector": "Sector",
    "startPrice": "Start_Price", "endPrice": "End_Price", "totalReturnPct": "Return%",
    "dailyVolPct": "Daily_Vol%", "annualVolPct": "Annual_Vol%",
    "maxDrawdownPct": "Max_Drawdown%", "sharpe": "Sharpe",
})
performance = [row for row in performance if row["sector"] != "Index"]
risk_by_ticker = {row["Ticker"]: row for row in read_csv(FILES["risk"])}
beta_by_ticker = {row["Ticker"]: row for row in read_csv(FILES["beta"])}

for row in performance:
    risk = risk_by_ticker[row["ticker"]]
    beta = beta_by_ticker.get(row["ticker"], {})
    row.update({
        "annualReturnPct": number(risk["Ann_Return%"]),
        "var95Pct": number(risk["VaR_95_Hist%"]),
        "var99Pct": number(risk["VaR_99_Hist%"]),
        "sortino": number(risk["Sortino"]),
        "calmar": number(risk["Calmar"]),
        "beta": number(beta.get("Beta")),
        "alphaPct": number(beta.get("Alpha%")),
        "corrSP500": number(beta.get("Corr_SP500")),
    })


def read_prices(ticker_row):
    rows = read_csv(DATA / ticker_row["File"])
    return [(row["Date"], float(row["Close"])) for row in rows]


stock_prices = {row["Ticker"]: read_prices(row) for row in stocks}
index_prices = {row["Ticker"]: read_prices(row) for row in indices}
dates = [date for date, _ in next(iter(stock_prices.values()))]


def cumulative_series(price_map, members, label):
    output = []
    bases = {ticker: price_map[ticker][0][1] for ticker in members}
    for i, date in enumerate(dates):
        return_pct = sum((price_map[ticker][i][1] / bases[ticker] - 1) * 100 for ticker in members) / len(members)
        output.append({"date": date, "series": label, "cumulativeReturnPct": round(return_pct, 4)})
    return output


market_history = []
for sector in ("AI", "Chip", "NewEnergy"):
    members = [row["Ticker"] for row in stocks if row["Sector"] == sector]
    label = "New Energy" if sector == "NewEnergy" else sector
    market_history.extend(cumulative_series(stock_prices, members, label))

benchmark_labels = {"^GSPC": "S&P 500", "^IXIC": "NASDAQ", "^SOX": "PHLX Semiconductor"}
for ticker, label in benchmark_labels.items():
    base = index_prices[ticker][0][1]
    market_history.extend({
        "date": date,
        "series": label,
        "cumulativeReturnPct": round((close / base - 1) * 100, 4),
    } for date, close in index_prices[ticker])

market_history.sort(key=lambda row: (row["date"], row["series"]))


monthly = normalize(read_csv(FILES["monthly"]), {
    "ticker": "Ticker", "name": "Name", "sector": "Sector", "month": "Month", "returnPct": "Return%",
})

spikes = normalize(read_csv(FILES["spikes"]), {
    "ticker": "Ticker", "name": "Name", "sector": "Sector", "start": "Spike_Start", "end": "Spike_End",
    "durationDays": "Duration_Days", "peakDate": "Peak_Date", "peakVolPct": "Peak_Vol%",
    "medianVolPct": "Median_Vol%", "periodReturnPct": "Period_Return%",
})

correlations = normalize(read_csv(FILES["correlations"]), {
    "stock1": "Stock_1", "stock2": "Stock_2", "sector1": "Sector_1", "sector2": "Sector_2",
    "pairType": "Pair_Type", "correlation": "Correlation",
})

beta = normalize(read_csv(FILES["beta"]), {
    "ticker": "Ticker", "name": "Name", "sector": "Sector", "beta": "Beta",
    "corrSP500": "Corr_SP500", "alphaPct": "Alpha%", "annualReturnPct": "Annual_Return%",
})

lagged = normalize(read_csv(FILES["lagged"]), {
    "leader": "Leader", "follower": "Follower", "lagDays": "Lag", "laggedCorrelation": "Lagged_Corr",
})

leaders = normalize(read_csv(FILES["leaders"]), {
    "ticker": "Ticker", "name": "Name", "sector": "Sector", "averageLeadCorrelation": "Avg_Lead_Corr",
    "averageFollowCorrelation": "Avg_Follow_Corr", "leadRatio": "Lead_Ratio",
    "strongestLead": "Strongest_Leads", "leadCorrelation": "Lead_Corr",
    "strongestFollower": "Strongest_Follows", "followCorrelation": "Follow_Corr",
})

drawdowns = normalize(read_csv(FILES["drawdown"]), {
    "ticker": "Ticker", "name": "Name", "sector": "Sector", "maxDrawdownPct": "Max_Drawdown%",
    "peakDate": "Peak_Date", "troughDate": "Trough_Date", "drawdownDays": "Drawdown_Days",
    "recoveryDate": "Recovery_Date", "recoveryDays": "Recovery_Days",
})

weights = normalize(read_csv(FILES["weights"]), {
    "ticker": "Ticker", "name": "Name", "sector": "Sector", "maxSharpeWeightPct": "MaxSharpe_Weight%",
    "minVarianceWeightPct": "MinVar_Weight%", "equalWeightPct": "EqualWeight%",
})

portfolios = normalize(read_csv(FILES["portfolios"]), {
    "portfolio": "Portfolio", "totalReturnPct": "Total_Return%", "annualReturnPct": "Ann_Return%",
    "annualVolPct": "Ann_Vol%", "sharpe": "Sharpe", "sortino": "Sortino",
    "maxDrawdownPct": "Max_DD%", "calmar": "Calmar", "winRatePct": "Win_Rate%",
})


weight_rows = read_csv(FILES["weights"])
weight_sets = {
    "Equal Weight": {row["Ticker"]: float(row["EqualWeight%"] or 0) / 100 for row in weight_rows},
    "Max Sharpe": {row["Ticker"]: float(row["MaxSharpe_Weight%"] or 0) / 100 for row in weight_rows},
    "Min Variance": {row["Ticker"]: float(row["MinVar_Weight%"] or 0) / 100 for row in weight_rows},
}
sector_members = defaultdict(list)
for row in stocks:
    sector_members[row["Sector"]].append(row["Ticker"])
weight_sets["Sector Equal"] = {
    ticker: 1 / 3 / len(sector_members[sector])
    for sector, members in sector_members.items() for ticker in members
}

daily_returns = {}
for ticker, values in stock_prices.items():
    daily_returns[ticker] = [0.0] + [values[i][1] / values[i - 1][1] - 1 for i in range(1, len(values))]

portfolio_history = []
for name, weight_map in weight_sets.items():
    wealth = 1.0
    weight_total = sum(weight_map.values()) or 1.0
    for i, date in enumerate(dates):
        if i:
            daily = sum((weight / weight_total) * daily_returns[ticker][i] for ticker, weight in weight_map.items())
            wealth *= 1 + daily
        portfolio_history.append({"date": date, "portfolio": name, "cumulativeReturnPct": round((wealth - 1) * 100, 4)})

sp500_base = index_prices["^GSPC"][0][1]
portfolio_history.extend({
    "date": date, "portfolio": "S&P 500", "cumulativeReturnPct": round((close / sp500_base - 1) * 100, 4)
} for date, close in index_prices["^GSPC"])
portfolio_history.sort(key=lambda row: (row["date"], row["portfolio"]))

sector_counts = defaultdict(int)
for row in stocks:
    sector_counts[row["Sector"]] += 1
overview = [{
    "stockCount": len(stocks),
    "benchmarkCount": len(indices),
    "tradingDays": int(summary_rows[0]["Records"]),
    "startDate": summary_rows[0]["Start"],
    "endDate": summary_rows[0]["End"],
    "aiCount": sector_counts["AI"],
    "chipCount": sector_counts["Chip"],
    "newEnergyCount": sector_counts["NewEnergy"],
}]

quality = [{
    "sourceRows": len(summary_rows) * int(summary_rows[0]["Records"]),
    "securities": len(summary_rows),
    "stocks": len(stocks),
    "benchmarks": len(indices),
    "tradingDays": int(summary_rows[0]["Records"]),
    "startDate": summary_rows[0]["Start"],
    "endDate": summary_rows[0]["End"],
    "missingCloseValues": 0,
    "currency": "USD for US-listed price series",
}]


def q(rows, source):
    return {"rows": rows, "source": source}


snapshot = {
    "id": APP_ID,
    "surface": "dashboard",
    "title": "Tech Finance Analytics Dashboard",
    "generatedAt": datetime.now(timezone.utc).replace(microsecond=0).isoformat().replace("+00:00", "Z"),
    "status": "reviewed",
    "filters": [],
    "queries": {
        "overview": q(overview, provenance("Reviewed universe summary", [DATA / "_summary.csv"], [
            {"label": "Trading days", "definition": "Number of daily observations per security in the reviewed snapshot.", "componentIds": ["universe-stocks", "universe-days", "universe-period"]},
        ])),
        "security_metrics": q(performance, provenance("Reviewed stock performance and risk metrics", [FILES["performance"], FILES["risk"], FILES["beta"]], [
            {"label": "Total return", "definition": "Close-to-close price return across the reviewed period; dividends are not included.", "componentIds": ["best-stock", "performance-scatter", "security-table"]},
            {"label": "Annualized volatility", "definition": "Daily return standard deviation annualized with 252 trading days.", "componentIds": ["performance-scatter", "risk-scatter", "security-table"]},
            {"label": "Historical VaR 95%", "definition": "Fifth percentile of observed daily returns. It is a loss threshold, not a maximum possible loss.", "componentIds": ["risk-table"]},
        ], ["Price-return analysis excludes dividends and transaction costs."])),
        "market_history": q(market_history, provenance("Equal-weight sector and benchmark price-return history", [DATA / row["File"] for row in stocks + indices], [
            {"label": "Cumulative return", "definition": "Percentage change from the first close. Sector series are equal-weight averages of constituent cumulative price returns.", "componentIds": ["market-trend"]},
        ], ["Sector series are descriptive equal-weight indices, not investable portfolios."])),
        "monthly_returns": q(monthly, provenance("Reviewed monthly stock returns", [FILES["monthly"]], [
            {"label": "Monthly return", "definition": "Close-to-close price return for each calendar month.", "componentIds": ["monthly-heatmap"]},
        ])),
        "volatility_spikes": q(spikes, provenance("Reviewed rolling-volatility spike episodes", [FILES["spikes"]], [
            {"label": "Peak volatility", "definition": "Maximum annualized 30-day rolling volatility within the detected episode.", "componentIds": ["volatility-spikes"]},
        ])),
        "correlation_pairs": q(correlations, provenance("Reviewed pairwise daily-return correlations", [FILES["correlations"]], [
            {"label": "Correlation", "definition": "Pearson correlation of same-day daily returns during the reviewed period.", "componentIds": ["correlation-ranking", "correlation-table"]},
        ])),
        "beta_analysis": q(beta, provenance("Reviewed beta analysis versus S&P 500", [FILES["beta"]], [
            {"label": "Beta", "definition": "Covariance of stock and S&P 500 daily returns divided by S&P 500 return variance.", "componentIds": ["beta-scatter", "beta-table"]},
            {"label": "Alpha", "definition": "Annual return residual under the project beta model and 5% risk-free rate.", "componentIds": ["beta-table"]},
        ])),
        "leadership_scores": q(leaders, provenance("Exploratory lead-lag leadership scores", [FILES["leaders"]], [
            {"label": "Lead ratio", "definition": "Average absolute lead correlation divided by average absolute follow correlation; unstable when both are near zero.", "componentIds": ["leadership-ranking", "leadership-table"]},
        ], ["Lagged correlations are exploratory associations and do not establish causality or tradable predictability."])),
        "lagged_correlations": q(lagged, provenance("Reviewed lagged cross-correlations", [FILES["lagged"]], [
            {"label": "Lagged correlation", "definition": "Correlation between leader return and follower return one to five trading days later.", "componentIds": ["lagged-correlation"]},
        ], ["Multiple comparisons and weak observed magnitudes limit inference."])),
        "drawdowns": q(drawdowns, provenance("Reviewed drawdown episodes", [FILES["drawdown"]], [
            {"label": "Maximum drawdown", "definition": "Largest peak-to-trough decline in the close-price wealth index.", "componentIds": ["drawdown-ranking", "drawdown-table"]},
        ])),
        "portfolio_weights": q(weights, provenance("Reviewed optimized and reference portfolio weights", [FILES["weights"]], [
            {"label": "Portfolio weight", "definition": "Long-only historical sample weight; optimized portfolios cap each position at 15%.", "componentIds": ["portfolio-weights", "weights-table"]},
        ], ["Risk-free rate is 5%.", "Max Sharpe and Min Variance weights are fitted to the full historical sample and are not out-of-sample forecasts."])),
        "portfolio_performance": q(portfolios, provenance("Reviewed historical portfolio backtest summary", [FILES["portfolios"]], [
            {"label": "Sharpe ratio", "definition": "Annualized excess return divided by annualized volatility using a 5% risk-free rate.", "componentIds": ["portfolio-sharpe", "portfolio-table"]},
            {"label": "Maximum drawdown", "definition": "Largest peak-to-trough decline in the historical portfolio wealth index.", "componentIds": ["portfolio-drawdown", "portfolio-table"]},
        ], ["Static weights, no rebalancing, transaction costs, taxes, or slippage.", "Optimized results are in-sample and likely overstate out-of-sample performance."])),
        "portfolio_history": q(portfolio_history, provenance("Reconstructed static-weight historical portfolio paths", [FILES["weights"], DATA / "GSPC.csv"] + [DATA / row["File"] for row in stocks], [
            {"label": "Portfolio cumulative return", "definition": "Cumulative daily return using fixed normalized starting weights and no rebalancing.", "componentIds": ["portfolio-trend"]},
        ], ["Static weights; no fees, taxes, slippage, or interim rebalancing."])),
        "data_quality": q(quality, provenance("Reviewed data coverage", [DATA / "_summary.csv"], [
            {"label": "Source rows", "definition": "Security-date observations represented by the 41 reviewed files.", "componentIds": ["data-quality"]},
        ])),
    },
}

(PROJECT / "src" / "data.json").write_text(json.dumps(snapshot, indent=2, ensure_ascii=False), encoding="utf-8")
print(f"Wrote {PROJECT / 'src' / 'data.json'} with {len(snapshot['queries'])} reviewed queries")
