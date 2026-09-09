# Market Yearbook — narrative GitHub Pages source

A six-chapter Chinese interactive research story for readers without finance experience. The author's curiosity motivates the opening; the ending summarizes the observed year in the selected AI, semiconductor and new-energy stocks.

## Rebuild

From the repository root, using Python 3.9+ (standard library only):

```sh
python dashboard/story/build_story.py
```

This reads the committed `analysis/data/*.csv` snapshot and embeds the data, CSS and JavaScript into `docs/index.html`. No npm install, CDN, API key, external font or runtime network request is required. Serve `docs` locally with `python -m http.server --directory docs` or open the HTML directly.

GitHub Pages continues to serve the existing `docs` directory. Source edits belong in `index.template.html`, `style.css`, and `app.js`; rebuild and commit the generated HTML together with source changes.

## Story and interactions

1. Personal research motivation, three theme groups, and 35 company cards.
2. Rebased historical theme paths, S&P 500 reference, date slider, selected-company overlay.
3. Within-theme return distributions; winner-exclusion experiment; median toggle.
4. Three reviewed historical checkpoints (October 29, March 30, and May 11).
5. Selected company's full path versus endpoints, maximum drawdown and recovery.
6. Three theme-level historical observations and a personalized recap card.

Native controls, keyboard-accessible company selectors, reduced-motion styles, mobile breakpoints, and source/method disclosures are included. The earlier React dashboard files remain in the repository for historical reference but do not generate this homepage.

## Data definitions

- Period: May 12, 2025–May 11, 2026; 251 observations per series. The build rejects changed coverage because the authored narrative is tied to this snapshot.
- Dates normalize both ISO and slash-separated source formats (the Tesla CSV uses the latter), then must align exactly. Prices must be positive finite numbers.
- Rebased value: `100 * Close[t] / Close[0]`.
- Theme path: mean of component rebased values, equivalent to equal initial allocations held without rebalancing. This differs from the older daily-rebalanced portfolio experiments.
- Return: `(Close[-1] / Close[0] - 1) * 100`.
- Drawdown: minimum of `(Close[t] / running_max(Close)[t] - 1) * 100`, with its preceding peak, trough and first subsequent recovery.
- The saved Close values are used as supplied. The source downloader did not explicitly pin auto-adjust behavior; the page therefore does not claim an independently verified price-only or dividend-inclusive return convention.
- No event-causality, industry-wide representativeness or forecast claims are inferred from the historical paths.

## Validation

The build checks stock coverage, date consistency and positive finite observations. Source JavaScript can be checked with `node --check dashboard/story/app.js`. Check the winner-exclusion experiment, time slider, company selection, path toggle and recap synchronization after interaction changes.

