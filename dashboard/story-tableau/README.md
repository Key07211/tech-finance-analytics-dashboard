# Market Yearbook — Tableau-style story dashboard

Source of the GitHub Pages homepage (`docs/index.html`). The same story as the earlier
"Market Yearbook" narrative page, told as a Tableau-style story: a story-point navigator on
top, one dashboard per point (a one-line text object, BAN tiles, worksheets with a title and a
one-line subtitle) and a filter shelf on the right. Dependency-free: no npm, no CDN, no web
fonts, no runtime network requests.

## Files

| File | Purpose |
|---|---|
| `build.py` | Reads `analysis/data/*.csv`, validates the snapshot, embeds data + CSS + JS into the template and writes `docs/index.html`. Prints the headline numbers for a cross-check against `analysis/charts/`. |
| `template.html` | Page skeleton with the `/* STYLES */`, `/* DATA */` and `/* APP */` markers and the "Data & definitions" footer. |
| `style.css` | Tableau-like chrome: light canvas, white worksheets, thin borders, filter shelf, tooltips. |
| `app.js` | All computation (returns, theme paths, drawdowns, correlations) and all rendering. Every visible string lives in the `STR` dictionary (`en` and `zh`); the author's note on the overview page is `STR.<lang>.ov.note`, chapter blurbs are `STR.<lang>.ov.chapterList`. |

## Rebuild

From the repository root (Python 3.9+, standard library only):

```sh
python dashboard/story-tableau/build.py
```

Options: `--repo <path>` to point at another checkout, `--out <path>` to write elsewhere.
The build refuses any data snapshot other than the reviewed 2025-05-12 → 2026-05-11 one,
because the authored turning points are tied to it.

## Story points

1. **Overview** — motivation, four findings, theme paths with the three turning points, mean-vs-median dumbbell, return-vs-drawdown scatter for all 35 companies, chapter guide.
2. **The watchlist** — three theme tiles, 35 company chips; pick the company to follow.
3. **Same start, very different destinations** — theme paths rebased to 100 vs S&P 500; date slider; optional overlay of the followed company.
4. **The average hides the members** — sorted return bars per company with mean/median reference lines; remove-the-winner sensitivity check.
5. **AI and chips: loosely linked stocks** — 12×10 correlation matrix, pair scatter, rolling 30/60-day correlation, four summary BANs.
6. **Three turning points** — Oct 29, 2025 / Mar 30, 2026 / May 11, 2026 with progressive reveal.
7. **The path behind the return** — followed company's path with drawdown shading, four BANs, underwater chart.
8. **What the year showed** — theme verdict tiles, mean-vs-median dumbbell, correlation recap, personal recap card.

Every worksheet has a "⊞ Data" toggle (table view of the plotted values), hover tooltips
(crosshair on lines, per-mark on bars, cells and dots), keyboard navigation (← → between story
points, Tab/Enter on bars and cells) and a collapsible "Data & definitions" footer. The URL hash
(`#1` … `#8`) addresses a story point.

## Languages

The page is bilingual. The EN / 中文 toggle in the header switches every string, company name,
date format and axis label; the choice is kept in `localStorage` and mirrored in the URL
(`?lang=zh`), so a Chinese link can be shared. First visit: URL parameter, then stored choice,
then the browser language (Chinese browsers start in Chinese), otherwise English.

## Definitions

Rebased value = 100 × Close<sub>t</sub> / Close<sub>0</sub>. Theme path = mean of the members'
rebased values (equal initial money, held, no rebalancing). Return = last Close / first Close − 1.
Drawdown = Close / running high − 1; recovery = first later day that regains the prior high.
Correlation = Pearson r on 250 aligned daily returns; group figure = correlation of the two groups'
equal-weight average daily returns.

## Colors

Theme colours were checked with a colour-vision validator (adjacent and all-pairs, light
surface): AI `#2b6cb0`, Semiconductors `#e67e22`, New Energy `#16a085`; S&P 500 `#7f7f7f` as
a reference grey. The correlation matrix uses a red–white–blue diverging scale centred on zero
and bounded by the largest |r| in the matrix.
