// Daily-return correlation, independent of the page renderer.
function dailyReturns(prices) {
  return prices.slice(1).map((value, i) => value / prices[i] - 1);
}
function pearson(a, b) {
  if (a.length !== b.length || a.length < 2 || !a.every(Number.isFinite) || !b.every(Number.isFinite)) return null;
  const ma = a.reduce((s, v) => s + v, 0) / a.length;
  const mb = b.reduce((s, v) => s + v, 0) / b.length;
  let numerator = 0, va = 0, vb = 0;
  for (let i = 0; i < a.length; i++) {
    const da = a[i] - ma, db = b[i] - mb;
    numerator += da * db; va += da * da; vb += db * db;
  }
  if (va === 0 || vb === 0) return null;
  return Math.max(-1, Math.min(1, numerator / Math.sqrt(va * vb)));
}
function rollingCorrelation(a, b, windowSize) {
  if (!Number.isInteger(windowSize) || windowSize < 2 || a.length !== b.length) return [];
  return a.map((_, i) => i < windowSize - 1 ? null : pearson(a.slice(i-windowSize+1, i+1), b.slice(i-windowSize+1, i+1)));
}

