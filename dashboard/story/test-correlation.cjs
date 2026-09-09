const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const path = require('node:path');
const core = vm.runInNewContext(fs.readFileSync(path.join(__dirname,'correlation.js'),'utf8')+';({dailyReturns,pearson,rollingCorrelation})');
const close = (a,b,t=1e-10)=>assert.ok(Math.abs(a-b)<t, `${a} differs from ${b}`);
close(core.pearson([1,2,3],[2,4,6]),1);
close(core.pearson([1,2,3],[6,4,2]),-1);
close(core.pearson([-1,0,1],[1,-2,1]),0);
assert.equal(core.pearson([1,1,1],[2,3,4]),null);
assert.equal(core.pearson([1,2],[1]),null);
assert.equal(core.pearson([1,NaN],[1,2]),null);
const ret = core.dailyReturns([100,110,99]); close(ret[0],0.1); close(ret[1],-0.1);
const a=[1,3,2,7,4], b=[9,6,5,1,3];
const roll=core.rollingCorrelation(a,b,3);
assert.equal(roll[0],null);assert.equal(roll[1],null);
close(roll[2],core.pearson(a.slice(0,3),b.slice(0,3)));
close(roll[4],core.pearson(a.slice(2,5),b.slice(2,5)));
const htmlPath=process.argv[2]||path.join(__dirname,'../../docs/index.html');
const html=fs.readFileSync(htmlPath,'utf8');
assert.equal(/[\u3400-\u9fff]/u.test(html),false,'Non-English CJK text remains in the page');
const data=JSON.parse(html.match(/<script id="market-data" type="application\/json">([\s\S]*?)<\/script>/)[1]);
const daily=Object.fromEntries(data.map(s=>[s.ticker,core.dailyReturns(s.close)]));
close(core.pearson(daily.NVDA,daily.AMD),0.4941513588623834);
close(core.pearson(daily.NVDA,daily.TSM),0.6226694946730694);
assert.equal(core.rollingCorrelation(daily.NVDA,daily.AMD,30).filter(v=>v!==null).length,221);
assert.equal(core.rollingCorrelation(daily.NVDA,daily.AMD,60).filter(v=>v!==null).length,191);
// Verify every pair against the project's independently generated, rounded CSV.
const pairPath=process.argv[3]||path.join(__dirname,'../../analysis/charts/Part3_Correlation/Step6_AIChipCorrelation/correlation_pairs.csv');
const rows=fs.readFileSync(pairPath,'utf8').trim().split(/\r?\n/).slice(1);
for(const row of rows){const [a,b,,,type,r]=row.split(',');close(core.pearson(daily[a],daily[b]),Number(r),0.000051);}
console.log(`Passed: mathematical edge cases, rolling-window boundaries, English-only output, ${rows.length} source-pair reconciliations.`);

