'use strict';
/* Market Yearbook 2025–26 — Tableau-style story dashboard. Dependency-free; everything is
   computed from the embedded daily Close series so the page and the data cannot drift apart.
   All visible text lives in STR (English and Chinese); the language toggle re-renders the page. */

/* ---------------------------------------------------------------- data */
const RAW = JSON.parse(document.getElementById('market-data').textContent);
const DATES = RAW.dates;
const LAST = DATES.length - 1;
const RDATES = DATES.slice(1); // dates of the daily returns

const META = {NVDA:['NVIDIA','Accelerated computing and AI chips'],MSFT:['Microsoft','Software and cloud services'],GOOGL:['Alphabet','Search, advertising and cloud'],META:['Meta','Social platforms and AI'],AMZN:['Amazon','E-commerce and cloud services'],CRM:['Salesforce','Customer relationship software'],PLTR:['Palantir','Data analytics software'],AI:['C3.ai','Enterprise AI software'],SNOW:['Snowflake','Cloud data platform'],IBM:['IBM','Enterprise technology and consulting'],SMCI:['Super Micro Computer','Servers and computing systems'],ORCL:['Oracle','Databases and cloud services'],AMD:['AMD','Processors and computing chips'],INTC:['Intel','Processors and chip manufacturing'],TSM:['TSMC','Semiconductor foundry'],AVGO:['Broadcom','Semiconductors and infrastructure software'],QCOM:['Qualcomm','Wireless communications chips'],TXN:['Texas Instruments','Analog and embedded chips'],MU:['Micron','Memory chips'],MRVL:['Marvell','Data infrastructure chips'],ARM:['Arm','Processor architecture and licensing'],ASML:['ASML','Chipmaking equipment'],TSLA:['Tesla','EVs and energy storage'],ENPH:['Enphase Energy','Solar inverters and storage'],SEDG:['SolarEdge','Solar power electronics'],FSLR:['First Solar','Solar modules'],RUN:['Sunrun','Residential solar and storage'],PLUG:['Plug Power','Hydrogen and fuel cells'],BE:['Bloom Energy','Fuel-cell power systems'],NEE:['NextEra Energy','Electricity and renewable energy'],RIVN:['Rivian','Electric vehicles'],LCID:['Lucid','Electric vehicles'],NIO:['NIO','Electric vehicles'],LI:['Li Auto','Electric vehicles'],XPEV:['XPeng','Electric vehicles'],GSPC:['S&P 500','Market price index']};
const META_ZH = {NVDA:['英伟达','加速计算与 AI 芯片'],MSFT:['微软','软件与云服务'],GOOGL:['Alphabet（谷歌）','搜索、广告与云'],META:['Meta','社交平台与 AI'],AMZN:['亚马逊','电商与云服务'],CRM:['Salesforce','客户关系管理软件'],PLTR:['Palantir','数据分析软件'],AI:['C3.ai','企业 AI 软件'],SNOW:['Snowflake','云数据平台'],IBM:['IBM','企业技术与咨询'],SMCI:['超微电脑','服务器与计算系统'],ORCL:['甲骨文','数据库与云服务'],AMD:['AMD','处理器与计算芯片'],INTC:['英特尔','处理器与芯片制造'],TSM:['台积电','半导体代工'],AVGO:['博通','半导体与基础设施软件'],QCOM:['高通','无线通信芯片'],TXN:['德州仪器','模拟与嵌入式芯片'],MU:['美光','存储芯片'],MRVL:['Marvell','数据基础设施芯片'],ARM:['Arm','处理器架构与授权'],ASML:['阿斯麦','芯片制造设备'],TSLA:['特斯拉','电动车与储能'],ENPH:['Enphase Energy','光伏逆变器与储能'],SEDG:['SolarEdge','光伏电力电子'],FSLR:['First Solar','光伏组件'],RUN:['Sunrun','户用光伏与储能'],PLUG:['Plug Power','氢能与燃料电池'],BE:['Bloom Energy','燃料电池发电系统'],NEE:['NextEra Energy','电力与可再生能源'],RIVN:['Rivian','电动车'],LCID:['Lucid','电动车'],NIO:['蔚来','电动车'],LI:['理想汽车','电动车'],XPEV:['小鹏汽车','电动车'],GSPC:['标普 500','市场价格指数']};

const THEMES = [
  {id: 'AI', color: '#2b6cb0', tickers: 'NVDA MSFT GOOGL META AMZN CRM PLTR AI SNOW IBM SMCI ORCL'.split(' ')},
  {id: 'Chip', color: '#e67e22', tickers: 'AMD INTC TSM AVGO QCOM TXN MU MRVL ARM ASML'.split(' ')},
  {id: 'NewEnergy', color: '#16a085', tickers: 'TSLA ENPH SEDG FSLR RUN PLUG BE NEE RIVN LCID NIO LI XPEV'.split(' ')}
];
const [AI, CHIP, NE] = THEMES;
const SPX_COLOR = '#7f7f7f', INK = '#1f2a37', NEUTRAL = '#5b6b7c';
const MILESTONE_DATES = ['2025-10-29', '2026-03-30', '2026-05-11'];
const CASE_TICKERS = ['BE', 'SMCI', 'LCID'];

/* ---------------------------------------------------------------- text, in two languages */
const STR = {
  en: {
    docTitle: 'Future Expectations, Market Realities · Market Yearbook 2025–26',
    title: 'Future Expectations, Market Realities',
    subtitle: '35 AI, semiconductor and new-energy stocks · May 12, 2025 – May 11, 2026 · 251 trading days · Saved daily Close prices (Yahoo Finance via yfinance)',
    following: 'Following', dataCode: 'Data & code ↗', skip: 'Skip to the dashboard', navLabel: 'Story points', prev: 'Previous story point', next: 'Next story point', langLabel: 'Language', shelfLabel: 'Filters and legend',
    dataBtn: '⊞ Data', na: 'n/a', pointN: n => 'POINT ' + n,
    methodSummary: 'Data & definitions',
    methodItems: [
      '<b>Snapshot.</b> May 12, 2025 – May 11, 2026, 251 trading days, 35 stocks plus the S&amp;P 500. The page uses the Close series saved in this repository (downloaded with yfinance; the download did not pin the adjustment convention, so dividends are not separately accounted for).',
      '<b>Return.</b> Last Close ÷ first Close − 1. Rebased value = 100 × Close<sub>t</sub> ÷ Close<sub>0</sub>.',
      '<b>Theme path.</b> Mean of the members’ rebased values: equal money in each company at the start, then held with no rebalancing. The S&amp;P 500 is a price index, not an investable product.',
      '<b>Drawdown.</b> Close ÷ running high − 1; the maximum drawdown is its lowest point. Recovery is the first later day that regains the prior high; “not recovered” means through May 11, 2026 only. Days are calendar days.',
      '<b>Correlation.</b> Pearson r on 250 aligned daily returns (Close<sub>t</sub> ÷ Close<sub>t−1</sub> − 1). Pair averages weight every pair equally; the group figure correlates the equal-weight average daily returns of the 12 AI and 10 semiconductor stocks. Rolling values use the preceding 30 or 60 daily returns. Same-direction days count days when both returns have the same sign.',
      '<b>Boundaries.</b> A personal watchlist, not an industry index. Historical description only: no forecasts, no causal claims, no trading signal.'
    ],
    dailyData: 'Daily data ↗', fullAnalysis: 'Full analysis ↗',
    colophon: 'Personal research · Use ← → to move between story points',
    themes: {AI: {name: 'AI', short: 'AI', desc: 'Computing infrastructure, cloud services and enterprise software.'},
      Chip: {name: 'Semiconductors', short: 'Semis', desc: 'Chip designers, manufacturers and equipment suppliers.'},
      NewEnergy: {name: 'New Energy', short: 'New Energy', desc: 'Solar, fuel cells and electric vehicles.'}},
    spx: 'S&P 500', spxRef: 'S&P 500 (reference)', followedLegend: 'Followed company (when overlaid)',
    caps: ['Overview: the year in one page', 'The watchlist: 35 stocks, 3 themes', 'Same start, very different destinations', 'The average hides the members', 'AI and chips: loosely linked stocks', 'Three turning points', 'The path behind the return', 'What the year showed'],
    company: 'Company', ticker: 'Ticker', theme: 'Theme', business: 'Business', date: 'Date', fullRet: 'Full-period return', maxDD: 'Max drawdown', regained: 'Regained that high', notRecovered: 'Not recovered',
    companies: 'Companies', gainers: 'Gainers', meanRet: 'Mean return', medianRet: 'Median return', mean: 'Mean', median: 'Median',
    companyToFollow: 'Company to follow', colorTheme: 'Color · theme', endedHigher: n => ` / ${n} ended higher`, tileLine: (m, md) => `Mean ${m} · Median ${md}`,
    days: n => `${n} days`, index: 'Index ', money: v => `$1,000 at the start → $${v}`, moneyShort: v => `$1,000 → $${v}`, through: 'through May 11, 2026', afterTrough: n => `${n} days after the trough`,
    ov: {
      head: 'Future expectations, market realities: the year in one page.',
      note: 'I follow AI, semiconductors and new energy because of the optimism about their future, and I wanted to see how those expectations showed up in share prices. This story tracks 35 listed companies over one year, May 12, 2025 to May 11, 2026, using saved daily closing prices only: no forecasts, no trading advice, just what the market did.',
      kCompanies: 'Companies', kCompaniesSub: 'AI 12 · Semiconductors 10 · New Energy 13', kDays: 'Trading days', kDaysSub: 'May 12, 2025 – May 11, 2026', kUp: 'Ended the year higher', kUpSub: n => `${n} had not regained their high by the end`, kSpx: 'S&P 500, same period', kSpxSub: 'price index, for reference',
      paths: 'Three themes, one year · rebased to 100', pathsSub: 'Equal money in each theme’s companies, held all year. Numbered lines: the three turning points (point 6).',
      find: 'What I want to show', findSub: 'Four findings, one per block of the story. Click one to open it.',
      db: 'Mean vs. median return by theme', dbSub: 'A mean far above the median means a few big winners carry the average.',
      dd: 'Return vs. deepest drawdown · 35 companies', ddSub: 'Filled dot: regained its high within the year. Hollow: not recovered by May 11, 2026. Click a dot to follow that company.',
      chapters: 'The story, point by point', read: 'Read the story', start: 'Start with the watchlist →',
      findings: (f) => [
        {go: 3, head: 'Same start, very different destinations.', text: `${f.ranked.map(g => g.name + ' ' + pct(g.mean)).join(', ')}; the S&P 500 ${pct(f.spx)}.`},
        {go: 4, head: 'A theme’s average hides its members.', text: `New Energy: mean ${pct(NE.mean)} but median ${pct(NE.median)}. AI: ${AI.gainers} of ${AI.stocks.length} rose, median ${pct(AI.median)}.`},
        {go: 5, head: 'Connected businesses, loosely linked stocks.', text: `Average AI × semiconductor pair correlation ${coef(C.cross)}; the two groups’ average daily returns correlate at ${coef(C.group)}.`},
        {go: 7, head: 'The final return leaves out the path.', text: `Bloom Energy ended ${pct(f.be.ret)} after a ${pct(f.be.dd)} fall from its high; ${f.notRec} of 35 companies had not regained their high by the end.`}
      ],
      chapterList: [['The watchlist', '35 companies in three themes. Pick one to follow.'], ['Same start, very different destinations', 'Theme paths from a common 100, against the S&P 500.'], ['The average hides the members', 'Every company’s return, with the mean and the median.'], ['AI and chips: loosely linked stocks', '120 pair correlations, one pair at a time.'], ['Three turning points', 'Oct 29, Mar 30, May 11: the year in three checkpoints.'], ['The path behind the return', 'Drawdown, recovery and what the final number hides.'], ['What the year showed', 'Three verdicts and your company’s recap.']],
      ddX: 'Deepest fall from a high (max drawdown)', ddY: 'Full-period return (log scale)'
    },
    p1: {head: '35 companies. Three themes. One year.', text: (up, s) => `${up} of 35 ended the year above where they started. Select a company to follow it through the story; you are following ${s.name} (${s.ticker}).`,
      watch: 'Watchlist', watchSub: 'Full-period return next to each company. Click a company to follow it.', themeFilter: 'Theme', all: 'All themes'},
    p2: {head: 'One starting line, very different destinations.',
      text: (d, list, spx) => `Equal money in each theme’s companies on May 12, 2025, then held. Through ${d}: ${list.join(', ')}; the S&P 500 ${spx}.`,
      paths: 'Theme paths, rebased to 100', pathsSub: 'Mean of the members’ rebased Close: equal initial money, no rebalancing. S&P 500 = price-index reference.',
      since: 'Change since start · ', throughDate: 'Through date', options: 'Options', overlay: 'Overlay the company I follow (dashed line)'},
    p3: {head: 'A theme’s average hides its members.',
      text: (g, lead, lag) => `${g.name}: mean ${pct(g.mean)}, median ${pct(g.median)}. ${lead.name} leads at ${pct(lead.stats.ret)}; ${lag.name} finishes last at ${pct(lag.stats.ret)}.`,
      without: (lead, m, md) => ` Without ${lead.name}, the mean becomes ${pct(m)} and the median ${pct(md)}.`,
      bars: g => `Full-period return by company · ${g}`, barsSub: 'Sorted high to low. Reference lines: mean and median of the companies shown. Click a bar to follow that company.',
      summary: g => `Summary · ${g}`, removed: 'biggest winner removed', endedHigherLabel: 'Ended higher', allN: (n, v) => `all ${n}: ${v}`,
      rankNote: (f, r, n, g, above) => `<b>${esc(f.name)}</b> (${f.ticker}): ${pct(f.stats.ret)}, rank ${r} of ${n} in ${esc(g.name)}, ${above ? 'at or above' : 'below'} the median.`,
      otherNote: f => `${esc(f.name)} belongs to ${esc(f.theme.name)}. Switch the theme filter to place it in this chart.`,
      exclude: 'Remove this theme’s biggest winner (sensitivity check)', showMean: 'Show mean line', showMedian: 'Show median line'},
    p4: {head: 'Connected businesses, loosely linked stocks.',
      text: () => `The 120 AI × semiconductor pairs average a daily-return correlation of ${coef(C.cross)} (within semiconductors ${coef(C.chip)}, within AI ${coef(C.ai)}). The two groups’ average daily returns correlate at ${coef(C.group)}: connected as groups, loosely linked stock by stock.`,
      k1: 'AI × semis · mean pair r', k1s: '120 pairs', k2: 'Within AI · mean pair r', k2s: '66 pairs', k3: 'Within semis · mean pair r', k3s: '45 pairs', k4: 'Group-average daily returns · r', k4s: 'equal-weight averages of each group',
      hm: 'Correlation of daily returns · AI (rows) × semiconductors (columns)', hmSub: 'Pearson r over 250 trading days. Click a cell to inspect the pair.', hmCorner: 'AI \\ Semis',
      pairSub: 'One dot per trading day. Upper right: both rose; lower left: both fell.', roll: (w, a, b) => `Rolling ${w}-day correlation · ${a} × ${b}`, rollSub: 'Each point uses only the preceding window of daily returns. Dashed line: full-period correlation.',
      corr: 'Correlation', dailyCorr: 'Daily-return correlation', sameDir: 'Same-direction days', fullPeriod: t => `${t} · full period`, fullRetOf: t => `${t} full-period return`,
      scaleNote: 'Scale set to the largest |r| in the matrix', bothUp: 'both up', bothDown: 'both down', dailyRet: t => `${t} daily return`, rollSeries: w => `${w}-day correlation`, fullRef: 'Full period ',
      aiCompany: 'AI company', chipCompany: 'Semiconductor company', presets: 'Pairs worth a look', presetObvious: 'NVIDIA × AMD · the obvious pair', presetMax: 'Strongest pair', presetMin: 'Most negative pair', window: 'Rolling window', tradingDays: n => `${n} trading days`},
    p5: {milestones: [
        {title: 'Autumn: all three themes ahead', text: 'The AI basket reaches its high for the year. Every theme is above its starting line.'},
        {title: 'Spring: a shared trough', text: 'The AI and semiconductor baskets both bottom out on the same day. AI is now below its start.'},
        {title: 'The finish: the rebound widens the gap', text: 'From March 30 the semiconductor basket rises sharply. AI and New Energy recover too, but the themes end far apart.'}],
      turns: d => `Theme paths through ${d}`, turnsSub: 'Rebased to 100. The faded part of the chart is the rest of the year, not yet revealed.', cps: 'Three checkpoints', cpsSub: 'Change since start at each date', checkpoint: 'Checkpoint'},
    p6: {head: 'The final return leaves out the path.',
      text: (s, m, rec) => `${s.name}: ${pct(m.ret)} for the year. From ${fdate(DATES[m.peak])} to ${fdate(DATES[m.trough])} it fell ${pct(m.dd)} from its high${rec ? `, then regained that high on ${fdate(DATES[m.recovery])}, ${m.recDays} days after the trough.` : ', and had not regained that high by May 11, 2026.'}`,
      journey: s => `${s.name} (${s.ticker}) · rebased to 100`, fullSub: 'Shading marks the deepest peak-to-trough decline.', endsSub: 'Endpoints only: the dashed line connects start and finish; it is not the actual path.',
      four: 'The year in four numbers', uw: 'Drawdown from running high', uwSub: '0% = at a new high. The depth of the fall from the most recent peak, every day.',
      peak: 'Peak · ', trough: 'Trough ', recovered: 'Recovered · ', deepest: 'Deepest drawdown', largestFall: 'Largest fall from a high', peakToTrough: 'Peak to trough', calendarDays: 'calendar days', drawdown: 'Drawdown',
      cases: 'Three paths worth comparing', caseLabels: ['A big gain, a deep setback', 'Same endpoints, an uneven path', 'Still below its former high'], view: 'View', fullPath: 'Show the full-year path'},
    p7: {head: 'Back to the question: what did the market show?', text: 'Three themes tied to expectations about the future left three different marks on the year.',
      msgs: {AI: ['A divided year', () => `${AI.gainers} of ${AI.stocks.length} rose. The median return was ${pct(AI.median)}.`],
        Chip: ['Gains across the sample', () => `All ${CHIP.stocks.length} rose, with different gains and drawdowns along the way.`],
        NewEnergy: ['Big winners, and losers', () => `Mean ${pct(NE.mean)} vs median ${pct(NE.median)}: a few outsized winners lift the average.`]},
      db: 'Mean vs. median full-period return by theme', dbSub: 'When the mean sits far above the median, a few big winners carry the average.',
      corr: 'Did AI and semiconductor stocks move together?', corrSub: 'Daily-return correlation', cAvg: 'Average AI × semis pair', cAvgSub: '120 pairs, stock by stock', cGroup: 'Group averages', cGroupSub: 'equal-weight daily returns of each group',
      corrNote: (lo, hi) => `A shared business story did not mean uniform stock behaviour: pairs ranged from ${lo} to ${hi}, while the two groups moved together as averages.`,
      recap: s => `Your company’s year · ${s.name} (${s.ticker})`, maxDD: 'Maximum drawdown', rank: 'Return rank in theme', regainedIts: 'Regained its high',
      quote: 'The final return tells the destination. The full path tells what the year felt like.', another: 'Read another story', back: 'Back to the overview'}
  },
  zh: {
    docTitle: '未来的预期，市场的现实 · 市场年鉴 2025–26',
    title: '未来的预期，市场的现实',
    subtitle: '35 只 AI、半导体与新能源股票 · 2025 年 5 月 12 日 – 2026 年 5 月 11 日 · 251 个交易日 · 保存下来的日收盘价（Yahoo Finance，经 yfinance 下载）',
    following: '跟随中', dataCode: '数据与代码 ↗', skip: '跳到看板', navLabel: '故事点', prev: '上一个故事点', next: '下一个故事点', langLabel: '语言', shelfLabel: '筛选与图例',
    dataBtn: '⊞ 数据', na: '无', pointN: n => `第 ${n} 点`,
    methodSummary: '数据与定义',
    methodItems: [
      '<b>快照。</b>2025 年 5 月 12 日 – 2026 年 5 月 11 日，251 个交易日，35 只股票加标普 500。页面使用本仓库保存的收盘价序列（经 yfinance 下载；下载时未固定复权方式，因此未单独计入股息）。',
      '<b>收益。</b>期末收盘价 ÷ 期初收盘价 − 1。基准化数值 = 100 × Close<sub>t</sub> ÷ Close<sub>0</sub>。',
      '<b>主题路径。</b>成员基准化数值的均值：期初在每家公司等额投入，之后持有、不再平衡。标普 500 是价格指数，不是可投资产品。',
      '<b>回撤。</b>收盘价 ÷ 历史最高 − 1，最大回撤是其最低点。收复指此后第一个重新达到前高的交易日；“未收复”仅指截至 2026 年 5 月 11 日。天数为日历日。',
      '<b>相关性。</b>对 250 个对齐的日收益（Close<sub>t</sub> ÷ Close<sub>t−1</sub> − 1）计算 Pearson r。配对平均对每个配对等权；两组的数字是 12 只 AI 与 10 只半导体股票等权平均日收益之间的相关系数。滚动值使用之前 30 或 60 个日收益。同向天数指两者收益符号相同的天数。',
      '<b>边界。</b>这是个人观察名单，不是行业指数。只做历史描述：不预测、不归因、不构成交易信号。'
    ],
    dailyData: '每日数据 ↗', fullAnalysis: '完整分析 ↗',
    colophon: '个人研究 · 用 ← → 切换故事点',
    themes: {AI: {name: 'AI', short: 'AI', desc: '算力基础设施、云服务与企业软件。'},
      Chip: {name: '半导体', short: '半导体', desc: '芯片设计、制造与设备供应商。'},
      NewEnergy: {name: '新能源', short: '新能源', desc: '光伏、燃料电池与电动车。'}},
    spx: '标普 500', spxRef: '标普 500（参照）', followedLegend: '所跟随的公司（叠加时）',
    caps: ['总览：一页看完这一年', '观察名单：35 只股票，3 个主题', '同一起点，不同终点', '平均数掩盖了成员', 'AI 与芯片：业务相连，股价松散', '三个转折点', '收益背后的路径', '这一年市场给出的答案'],
    company: '公司', ticker: '代码', theme: '主题', business: '业务', date: '日期', fullRet: '全年收益', maxDD: '最大回撤', regained: '收复前高', notRecovered: '未收复',
    companies: '公司数', gainers: '上涨家数', meanRet: '平均收益', medianRet: '中位数收益', mean: '均值', median: '中位数',
    companyToFollow: '要跟随的公司', colorTheme: '颜色 · 主题', endedHigher: n => ` / ${n} 家上涨`, tileLine: (m, md) => `均值 ${m} · 中位数 ${md}`,
    days: n => `${n} 天`, index: '指数 ', money: v => `期初 1,000 美元 → ${v} 美元`, moneyShort: v => `1,000 美元 → ${v} 美元`, through: '截至 2026 年 5 月 11 日', afterTrough: n => `谷底后 ${n} 天`,
    ov: {
      head: '未来的预期，市场的现实：一页看完这一年。',
      note: '我关注 AI、半导体和新能源，是因为围绕它们未来的乐观情绪；我想看看这些预期在股价里是怎么体现的。这个故事跟踪 35 家上市公司从 2025 年 5 月 12 日到 2026 年 5 月 11 日的一年，只用保存下来的日收盘价：不做预测，不给交易建议，只看市场实际发生了什么。',
      kCompanies: '公司数', kCompaniesSub: 'AI 12 · 半导体 10 · 新能源 13', kDays: '交易日', kDaysSub: '2025 年 5 月 12 日 – 2026 年 5 月 11 日', kUp: '年末高于年初', kUpSub: n => `${n} 家到年末仍未收复前高`, kSpx: '同期标普 500', kSpxSub: '价格指数，仅作参照',
      paths: '三个主题的一年 · 以 100 为基准', pathsSub: '每个主题内各公司等额投入并持有全年。编号竖线：三个转折点（第 6 点）。',
      find: '我想说明的四件事', findSub: '四条结论，对应故事的四个部分。点击打开对应章节。',
      db: '各主题收益的均值与中位数', dbSub: '均值远高于中位数，说明少数大赢家抬高了平均。',
      dd: '全年收益与最深回撤 · 35 家公司', ddSub: '实心点：年内收复前高；空心点：到 2026 年 5 月 11 日仍未收复。点击某个点即可跟随该公司。',
      chapters: '故事的每一点', read: '阅读故事', start: '从观察名单开始 →',
      findings: (f) => [
        {go: 3, head: '同一起点，不同终点。', text: `${f.ranked.map(g => g.name + ' ' + pct(g.mean)).join('、')}；标普 500 ${pct(f.spx)}。`},
        {go: 4, head: '主题的平均数掩盖了成员。', text: `新能源：均值 ${pct(NE.mean)}，中位数却只有 ${pct(NE.median)}。AI：${AI.stocks.length} 家里 ${AI.gainers} 家上涨，中位数 ${pct(AI.median)}。`},
        {go: 5, head: '业务相连，股价松散。', text: `AI × 半导体配对的日收益相关系数平均 ${coef(C.cross)}；两组平均日收益的相关系数为 ${coef(C.group)}。`},
        {go: 7, head: '最终收益说不出路径。', text: `Bloom Energy 全年 ${pct(f.be.ret)}，途中从高点下跌 ${pct(f.be.dd)}；35 家公司里有 ${f.notRec} 家到年末仍未收复前高。`}
      ],
      chapterList: [['观察名单', '三个主题、35 家公司。选一家来跟随。'], ['同一起点，不同终点', '主题路径从同一个 100 出发，对比标普 500。'], ['平均数掩盖了成员', '每家公司的收益，以及均值和中位数。'], ['AI 与芯片：业务相连，股价松散', '120 个配对的相关性，一次看一对。'], ['三个转折点', '10 月 29 日、3 月 30 日、5 月 11 日：三个检查点看这一年。'], ['收益背后的路径', '回撤、修复，以及最终数字没说的事。'], ['这一年市场给出的答案', '三个主题的结论，以及你所跟随公司的回顾。']],
      ddX: '从高点的最大跌幅（最大回撤）', ddY: '全年收益（对数坐标）'
    },
    p1: {head: '35 家公司，三个主题，一年。', text: (up, s) => `35 家公司里有 ${up} 家年末高于年初。选择一家公司，在整个故事里跟随它；当前跟随的是 ${s.name}（${s.ticker}）。`,
      watch: '观察名单', watchSub: '每家公司旁边是全年收益。点击即可跟随。', themeFilter: '主题', all: '全部主题'},
    p2: {head: '同一条起跑线，很不一样的终点。',
      text: (d, list, spx) => `2025 年 5 月 12 日在每个主题的公司上等额投入并持有。截至 ${d}：${list.join('、')}；标普 500 ${spx}。`,
      paths: '主题路径，以 100 为基准', pathsSub: '成员基准化收盘价的均值：期初等额投入，不再平衡。标普 500 为价格指数参照。',
      since: '自期初以来的变化 · ', throughDate: '截至日期', options: '选项', overlay: '叠加我跟随的公司（虚线）'},
    p3: {head: '主题的平均数掩盖了它的成员。',
      text: (g, lead, lag) => `${g.name}：均值 ${pct(g.mean)}，中位数 ${pct(g.median)}。${lead.name} 领先，${pct(lead.stats.ret)}；${lag.name} 垫底，${pct(lag.stats.ret)}。`,
      without: (lead, m, md) => ` 去掉 ${lead.name} 后，均值变为 ${pct(m)}，中位数变为 ${pct(md)}。`,
      bars: g => `各公司全年收益 · ${g}`, barsSub: '从高到低排序。参考线：所示公司的均值与中位数。点击柱子即可跟随该公司。',
      summary: g => `小结 · ${g}`, removed: '已去掉最大赢家', endedHigherLabel: '上涨家数', allN: (n, v) => `全部 ${n} 家：${v}`,
      rankNote: (f, r, n, g, above) => `<b>${esc(f.name)}</b>（${f.ticker}）：${pct(f.stats.ret)}，在${esc(g.name)}里排第 ${r}/${n}，${above ? '不低于' : '低于'}中位数。`,
      otherNote: f => `${esc(f.name)} 属于${esc(f.theme.name)}。切换主题筛选即可在图中看到它。`,
      exclude: '去掉该主题的最大赢家（敏感性检验）', showMean: '显示均值线', showMedian: '显示中位数线'},
    p4: {head: '业务相连，股价松散。',
      text: () => `120 个 AI × 半导体配对的日收益相关系数平均为 ${coef(C.cross)}（半导体内部 ${coef(C.chip)}，AI 内部 ${coef(C.ai)}）。两组的平均日收益相关系数为 ${coef(C.group)}：作为整体彼此相连，逐只股票看却联系松散。`,
      k1: 'AI × 半导体 · 配对相关均值', k1s: '120 个配对', k2: 'AI 内部 · 配对相关均值', k2s: '66 个配对', k3: '半导体内部 · 配对相关均值', k3s: '45 个配对', k4: '两组平均日收益 · 相关系数', k4s: '各组等权平均',
      hm: '日收益相关系数 · AI（行）× 半导体（列）', hmSub: '250 个交易日的 Pearson r。点击格子查看该配对。', hmCorner: 'AI \\ 半导体',
      pairSub: '每个点是一个交易日。右上：同涨；左下：同跌。', roll: (w, a, b) => `滚动 ${w} 日相关系数 · ${a} × ${b}`, rollSub: '每个点只用之前一个窗口内的日收益。虚线：全期相关系数。',
      corr: '相关系数', dailyCorr: '日收益相关系数', sameDir: '同向天数', fullPeriod: t => `${t} · 全年收益`, fullRetOf: t => `${t} 全年收益`,
      scaleNote: '色阶上限取矩阵中最大的 |r|', bothUp: '同涨', bothDown: '同跌', dailyRet: t => `${t} 日收益`, rollSeries: w => `${w} 日相关系数`, fullRef: '全期 ',
      aiCompany: 'AI 公司', chipCompany: '半导体公司', presets: '值得一看的配对', presetObvious: '英伟达 × AMD · 最直观的一对', presetMax: '相关最强', presetMin: '相关最负', window: '滚动窗口', tradingDays: n => `${n} 个交易日`},
    p5: {milestones: [
        {title: '秋天：三个主题全部领先', text: 'AI 篮子触及全年高点。每个主题都高于起点。'},
        {title: '春天：同一天触底', text: 'AI 和半导体篮子在同一天触及最深回撤的谷底。AI 已低于起点。'},
        {title: '终点：反弹拉大差距', text: '从 3 月 30 日起半导体篮子大幅上涨。AI 和新能源也有所修复，但三个主题的终点相距很远。'}],
      turns: d => `截至 ${d} 的主题路径`, turnsSub: '以 100 为基准。淡出的部分是这一年尚未揭示的后半段。', cps: '三个检查点', cpsSub: '各日期相对期初的变化', checkpoint: '检查点'},
    p6: {head: '最终收益说不出路径。',
      text: (s, m, rec) => `${s.name}：全年 ${pct(m.ret)}。从 ${fdate(DATES[m.peak])} 到 ${fdate(DATES[m.trough])}，它从高点下跌 ${pct(m.dd)}${rec ? `，之后在 ${fdate(DATES[m.recovery])} 收复前高，距谷底 ${m.recDays} 天。` : '，到 2026 年 5 月 11 日仍未收复前高。'}`,
      journey: s => `${s.name}（${s.ticker}）· 以 100 为基准`, fullSub: '阴影标出最深的一次从峰到谷的下跌。', endsSub: '只看两端：虚线连接起点与终点，并不是真实路径。',
      four: '四个数字看这一年', uw: '相对历史高点的回撤', uwSub: '0% = 创新高。每一天相对最近高点的跌幅。',
      peak: '峰值 · ', trough: '谷底 ', recovered: '收复 · ', deepest: '最深回撤', largestFall: '从高点的最大跌幅', peakToTrough: '峰到谷', calendarDays: '日历日', drawdown: '回撤',
      cases: '三条值得对比的路径', caseLabels: ['大涨之后的深度回撤', '两端相同，路径起伏', '仍低于此前高点'], view: '视图', fullPath: '显示全年路径'},
    p7: {head: '回到最初的问题：市场给出了什么答案？', text: '三个与未来预期相关的主题，在这一年留下了三种不同的痕迹。',
      msgs: {AI: ['分化的一年', () => `${AI.stocks.length} 家里 ${AI.gainers} 家上涨，中位数收益 ${pct(AI.median)}。`],
        Chip: ['全线上涨', () => `全部 ${CHIP.stocks.length} 家都上涨，但涨幅和回撤各不相同。`],
        NewEnergy: ['大赢家与大输家', () => `均值 ${pct(NE.mean)} 对中位数 ${pct(NE.median)}：少数大赢家抬高了平均。`]},
      db: '各主题全年收益的均值与中位数', dbSub: '均值远高于中位数时，是少数大赢家抬高了平均。',
      corr: 'AI 与半导体股票是同步的吗？', corrSub: '日收益相关系数', cAvg: 'AI × 半导体配对平均', cAvgSub: '120 个配对，逐只股票', cGroup: '两组平均', cGroupSub: '各组等权平均日收益',
      corrNote: (lo, hi) => `共同的业务故事并不意味着一致的股价表现：配对相关系数从 ${lo} 到 ${hi} 不等，而两组作为整体却是同步的。`,
      recap: s => `你所跟随公司的一年 · ${s.name}（${s.ticker}）`, maxDD: '最大回撤', rank: '主题内收益排名', regainedIts: '收复前高',
      quote: '最终收益告诉你终点在哪里；完整路径告诉你这一年是什么感觉。', another: '再读一个故事', back: '回到总览'}
  }
};
let LANG = 'en', L = STR.en;

/* ---------------------------------------------------------------- math */
const sum = a => a.reduce((x, y) => x + y, 0);
const mean = a => sum(a) / a.length;
function median(a) { const b = [...a].sort((x, y) => x - y), m = b.length >> 1; return b.length % 2 ? b[m] : (b[m - 1] + b[m]) / 2; }
function pearson(a, b) {
  if (a.length !== b.length || a.length < 2) return null;
  const ma = mean(a), mb = mean(b);
  let num = 0, va = 0, vb = 0;
  for (let i = 0; i < a.length; i++) { const da = a[i] - ma, db = b[i] - mb; num += da * db; va += da * da; vb += db * db; }
  if (!va || !vb) return null;
  return Math.max(-1, Math.min(1, num / Math.sqrt(va * vb)));
}
function rolling(a, b, w) { return a.map((_, i) => i < w - 1 ? null : pearson(a.slice(i - w + 1, i + 1), b.slice(i - w + 1, i + 1))); }
const dayDiff = (d1, d2) => Math.round((Date.parse(d2) - Date.parse(d1)) / 86400000);
function ddStats(close) {
  let high = close[0], hi = 0, dd = 0, peak = 0, trough = 0;
  close.forEach((v, i) => { if (v > high) { high = v; hi = i; } const d = v / high - 1; if (d < dd) { dd = d; peak = hi; trough = i; } });
  let recovery = -1;
  if (dd < 0) for (let i = trough + 1; i < close.length; i++) if (close[i] >= close[peak]) { recovery = i; break; }
  return {ret: (close[close.length - 1] / close[0] - 1) * 100, dd: dd * 100, peak, trough, recovery,
    ddDays: dayDiff(DATES[peak], DATES[trough]), recDays: recovery < 0 ? null : dayDiff(DATES[trough], DATES[recovery])};
}
function underwater(close) { let hi = -Infinity; return close.map(v => { hi = Math.max(hi, v); return (v / hi - 1) * 100; }); }

/* ---------------------------------------------------------------- formatting */
const MON = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
const fmtN = (n, d = 0) => n.toLocaleString('en-US', {minimumFractionDigits: d, maximumFractionDigits: d}).replace('-', '−');
const pct = (n, d = 1) => (n > 0 ? '+' : '') + fmtN(n, d) + '%';
const coef = v => v == null ? L.na : (v < 0 ? '−' : '') + Math.abs(v).toFixed(2);
function fdate(iso, year = true) {
  const [y, m, d] = iso.split('-');
  if (LANG === 'zh') return (year ? y + ' 年 ' : '') + (+m) + ' 月 ' + (+d) + ' 日';
  return MON[+m - 1] + ' ' + (+d) + (year ? ', ' + y : '');
}
function monthLabel(iso) {
  const [y, m] = iso.split('-');
  if (LANG === 'zh') return m === '01' ? y + '年1月' : (+m) + '月';
  return m === '01' ? "Jan '" + y.slice(2) : MON[+m - 1];
}
const esc = s => String(s).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));

/* ---------------------------------------------------------------- derived series */
const STOCKS = {};
Object.keys(RAW.close).forEach(t => {
  const close = RAW.close[t];
  STOCKS[t] = {ticker: t, name: META[t][0], business: META[t][1], close,
    normal: close.map(v => v / close[0] * 100), daily: close.slice(1).map((v, i) => v / close[i] - 1), stats: ddStats(close),
    theme: THEMES.find(g => g.tickers.includes(t)) || null};
});
THEMES.forEach(g => {
  g.stocks = g.tickers.map(t => STOCKS[t]);
  g.values = DATES.map((_, i) => mean(g.stocks.map(s => s.normal[i])));
  g.daily = RDATES.map((_, i) => mean(g.stocks.map(s => s.daily[i])));
  g.rets = g.stocks.map(s => s.stats.ret);
  g.mean = mean(g.rets); g.median = median(g.rets); g.gainers = g.rets.filter(r => r > 0).length;
});
const ALL = THEMES.flatMap(g => g.stocks);
const SPX = STOCKS.GSPC;

const CORR = {};
function corr(a, b) { const k = a + '|' + b; if (!(k in CORR)) CORR[k] = pearson(STOCKS[a].daily, STOCKS[b].daily); return CORR[k]; }
function sameDir(a, b) { const A = STOCKS[a].daily, B = STOCKS[b].daily; return A.filter((v, i) => v * B[i] > 0).length / A.length * 100; }
const CROSS = AI.tickers.flatMap(a => CHIP.tickers.map(b => ({a, b, r: corr(a, b)})));
function withinMean(g) { const rs = []; for (let i = 0; i < g.tickers.length; i++) for (let j = i + 1; j < g.tickers.length; j++) rs.push(corr(g.tickers[i], g.tickers[j])); return mean(rs); }
const C = {cross: mean(CROSS.map(p => p.r)), ai: withinMean(AI), chip: withinMean(CHIP), group: pearson(AI.daily, CHIP.daily),
  max: CROSS.reduce((m, p) => p.r > m.r ? p : m), min: CROSS.reduce((m, p) => p.r < m.r ? p : m)};
const HM_SCALE = Math.ceil(Math.max(...CROSS.map(p => Math.abs(p.r))) * 10) / 10;

/* ---------------------------------------------------------------- language */
function applyLang(lang) {
  LANG = STR[lang] ? lang : 'en'; L = STR[LANG];
  document.documentElement.lang = LANG === 'zh' ? 'zh-CN' : 'en';
  document.title = L.docTitle;
  const names = LANG === 'zh' ? META_ZH : META;
  Object.values(STOCKS).forEach(s => { s.name = names[s.ticker][0]; s.business = names[s.ticker][1]; });
  THEMES.forEach(g => { const t = L.themes[g.id]; g.name = t.name; g.short = t.short; g.desc = t.desc; });
  try { localStorage.setItem('yearbook-lang', LANG); } catch (e) { /* storage unavailable */ }
  const url = new URL(location.href);
  if (LANG === 'zh') url.searchParams.set('lang', 'zh'); else url.searchParams.delete('lang');
  history.replaceState(null, '', url.pathname + url.search + url.hash);
  renderChrome();
}
function initialLang() {
  const q = new URLSearchParams(location.search).get('lang');
  if (q === 'zh' || q === 'en') return q;
  try { const v = localStorage.getItem('yearbook-lang'); if (v === 'zh' || v === 'en') return v; } catch (e) { /* ignore */ }
  return /^zh/i.test(navigator.language || '') ? 'zh' : 'en';
}
function renderChrome() {
  const el = id => document.getElementById(id);
  el('title').textContent = L.title; el('subtitle').textContent = L.subtitle; el('follow-label').textContent = L.following;
  el('src').textContent = L.dataCode; el('skip').textContent = L.skip;
  el('prev').setAttribute('aria-label', L.prev); el('next').setAttribute('aria-label', L.next);
  document.querySelector('.story-nav').setAttribute('aria-label', L.navLabel); el('shelf').setAttribute('aria-label', L.shelfLabel);
  el('lang').setAttribute('aria-label', L.langLabel);
  el('lang').querySelectorAll('button').forEach(b => b.setAttribute('aria-pressed', b.dataset.lang === LANG));
  el('method-summary').textContent = L.methodSummary;
  el('method-body').innerHTML = `<ul>${L.methodItems.map(i => `<li>${i}</li>`).join('')}</ul><p><a href="https://github.com/Key07211/tech-finance-analytics-dashboard/tree/main/analysis/data">${esc(L.dailyData)}</a> · <a href="https://github.com/Key07211/tech-finance-analytics-dashboard/tree/main/analysis">${esc(L.fullAnalysis)}</a></p>`;
  el('colophon').innerHTML = `<b>Key07211 · Market Yearbook 2025–26</b> · ${esc(L.colophon)}`;
}

/* ---------------------------------------------------------------- state */
const S = {point: 1, company: 'NVDA', themeFilter: 'All', distTheme: 'NewEnergy', exclude: false, showMean: true, showMedian: true,
  dateIdx: LAST, overlay: false, pairA: 'NVDA', pairB: 'AMD', win: 30, checkpoint: 0, fullPath: true, tables: new Set()};
const TABLES = {};
const $ = id => document.getElementById(id);
{ const p = parseInt(location.hash.slice(1), 10); if (p >= 1 && p <= 8) S.point = p; }

/* ---------------------------------------------------------------- tooltip */
const tipEl = $('tip');
function moveTip(x, y) {
  const pad = 14, w = tipEl.offsetWidth, h = tipEl.offsetHeight;
  let left = x + pad, top = y + pad;
  if (left + w > window.innerWidth - 8) left = x - w - pad;
  if (top + h > window.innerHeight - 8) top = y - h - pad;
  tipEl.style.left = Math.max(4, left) + 'px'; tipEl.style.top = Math.max(4, top) + 'px';
}
function showTip(html, ev) { tipEl.innerHTML = html; tipEl.style.display = 'block'; moveTip(ev.clientX, ev.clientY); }
function showTipAt(html, el) { const r = el.getBoundingClientRect(); tipEl.innerHTML = html; tipEl.style.display = 'block'; moveTip(r.left + r.width / 2, r.top + r.height / 2); }
function hideTip() { tipEl.style.display = 'none'; }
function tipHTML(head, rows) {
  return `<div class="t-head">${esc(head)}</div>` + rows.map(([label, val, color]) =>
    `<div class="t-row"><span>${color ? `<i style="background:${color}"></i>` : ''}${esc(label)}</span><b>${esc(val)}</b></div>`).join('');
}
function hoverable(el, html, onActivate) {
  el.addEventListener('pointermove', ev => showTip(typeof html === 'function' ? html() : html, ev));
  el.addEventListener('pointerleave', hideTip);
  el.addEventListener('focus', () => showTipAt(typeof html === 'function' ? html() : html, el));
  el.addEventListener('blur', hideTip);
  if (onActivate) {
    el.addEventListener('click', onActivate);
    el.addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onActivate(); } });
  }
}

/* ---------------------------------------------------------------- scales */
function niceTicks(lo, hi, n = 5) {
  const raw = (hi - lo) / n, p = Math.pow(10, Math.floor(Math.log10(raw)));
  let step = 10 * p;
  for (const s of [1, 2, 2.5, 5, 10]) if (raw <= s * p) { step = s * p; break; }
  const out = [];
  for (let v = Math.ceil(lo / step) * step; v <= hi + 1e-9; v += step) out.push(+v.toFixed(10));
  return out;
}
function monthStarts(dates) { const t = []; for (let i = 1; i < dates.length; i++) if (dates[i].slice(0, 7) !== dates[i - 1].slice(0, 7)) t.push(i); return t; }
function monthEnds(dates) { const t = []; for (let i = 0; i < dates.length - 1; i++) if (dates[i].slice(0, 7) !== dates[i + 1].slice(0, 7)) t.push(i); t.push(dates.length - 1); return t; }
const width = el => Math.max(300, el.clientWidth || el.parentElement.clientWidth || 600);

/* ---------------------------------------------------------------- line chart */
function lineChart(el, o) {
  const W = width(el), H = o.height || 300, dates = o.dates || DATES, n = dates.length;
  const end = o.end == null ? n - 1 : o.end, hoverEnd = o.hoverEnd == null ? end : o.hoverEnd;
  const L0 = o.left || 46, R = o.endLabels ? 118 : 16, T = 16, B = 26, PW = W - L0 - R, PH = H - T - B;
  const fmt = o.tipFmt || (v => fmtN(v, 1));
  const vals = [];
  o.series.forEach(s => { const upto = o.scaleAll ? n : end + 1; for (let i = 0; i < upto; i++) { const v = s.values[i]; if (v != null && isFinite(v)) vals.push(v); } });
  let lo, hi;
  if (o.yDomain) { [lo, hi] = o.yDomain; }
  else {
    lo = Math.min(...vals); hi = Math.max(...vals);
    if (o.baseline != null) { lo = Math.min(lo, o.baseline); hi = Math.max(hi, o.baseline); }
    const pad = (hi - lo) * 0.08 || 1; lo -= pad; hi += pad;
  }
  const x = i => L0 + (n === 1 ? 0 : i / (n - 1)) * PW, y = v => T + (hi - v) / (hi - lo) * PH;
  let g = '';
  const ticks = niceTicks(lo, hi, 5);
  ticks.forEach(v => {
    const yy = y(v), base = o.baseline != null && Math.abs(v - o.baseline) < 1e-9;
    g += `<line x1="${L0}" x2="${W - R}" y1="${yy}" y2="${yy}" stroke="${base ? '#9aa0a6' : '#e6e8eb'}"/><text x="${L0 - 6}" y="${yy + 3.5}" text-anchor="end">${esc((o.yFmt || (v => fmtN(v)))(v))}</text>`;
  });
  if (o.baseline != null && !ticks.some(v => Math.abs(v - o.baseline) < 1e-9) && o.baseline >= lo && o.baseline <= hi)
    g += `<line x1="${L0}" x2="${W - R}" y1="${y(o.baseline)}" y2="${y(o.baseline)}" stroke="#9aa0a6"/>`;
  const ms = monthStarts(dates), every = PW < 520 ? 2 : 1;
  ms.forEach((i, k) => { if (k % every) return; g += `<line x1="${x(i)}" x2="${x(i)}" y1="${T + PH}" y2="${T + PH + 4}" stroke="#c0c4c9"/><text x="${x(i)}" y="${H - 7}" text-anchor="middle">${esc(monthLabel(dates[i]))}</text>`; });
  g += `<line x1="${L0}" x2="${W - R}" y1="${T + PH}" y2="${T + PH}" stroke="#c0c4c9"/>`;
  if (o.shade) {
    const x1 = x(o.shade.from), x2 = x(o.shade.to);
    g += `<rect x="${x1}" y="${T}" width="${Math.max(1, x2 - x1)}" height="${PH}" fill="${o.shade.color}" fill-opacity=".12"/>`;
    if (o.shade.label) g += `<text x="${(x1 + x2) / 2}" y="${T + PH - 6}" text-anchor="middle" fill="#555" font-size="10.5">${esc(o.shade.label)}</text>`;
  }
  const pathOf = (values, upto) => { let d = '', pen = false; for (let i = 0; i <= upto; i++) { const v = values[i]; if (v == null || !isFinite(v)) { pen = false; continue; } d += (pen ? 'L' : 'M') + x(i).toFixed(1) + ',' + y(v).toFixed(1) + ' '; pen = true; } return d; };
  o.series.forEach(s => {
    const upto = o.fadeFrom != null ? n - 1 : end;
    const d = s.straight ? `M${x(0).toFixed(1)},${y(s.values[0]).toFixed(1)} L${x(end).toFixed(1)},${y(s.values[end]).toFixed(1)}` : pathOf(s.values, upto);
    if (o.area) { const b = y(o.baseline == null ? 0 : o.baseline); g += `<path d="${d}L${x(upto).toFixed(1)},${b} L${x(0).toFixed(1)},${b} Z" fill="${s.color}" fill-opacity=".12"/>`; }
    g += `<path d="${d}" fill="none" stroke="${s.color}" stroke-width="${s.width || 2}" stroke-linejoin="round" stroke-linecap="round"${s.dash ? ' stroke-dasharray="6 4"' : ''}/>`;
  });
  if (o.fadeFrom != null && o.fadeFrom < n - 1) g += `<rect x="${x(o.fadeFrom)}" y="${T}" width="${W - R - x(o.fadeFrom)}" height="${PH}" fill="#fff" fill-opacity=".78"/>`;
  (o.refX || []).forEach(r => {
    const xx = x(r.at);
    g += `<line x1="${xx}" x2="${xx}" y1="${T}" y2="${T + PH}" stroke="${r.strong ? INK : '#b8bdc4'}" stroke-width="${r.strong ? 1.5 : 1}"${r.dash ? ' stroke-dasharray="4 3"' : ''}/>`;
    if (r.label) g += `<circle cx="${xx}" cy="${T + 2}" r="8" fill="${r.strong ? INK : '#b8bdc4'}"/><text x="${xx}" y="${T + 5.5}" text-anchor="middle" fill="#fff" font-size="10" font-weight="700">${esc(r.label)}</text>`;
  });
  (o.refY || []).forEach(r => {
    const yy = y(r.value);
    g += `<line x1="${L0}" x2="${W - R}" y1="${yy}" y2="${yy}" stroke="#555"${r.dash ? ' stroke-dasharray="5 4"' : ''}/>`;
    if (r.label) g += `<text x="${W - R - 4}" y="${yy - 4}" text-anchor="end" fill="#444" font-size="10.5">${esc(r.label)}</text>`;
  });
  (o.markers || []).forEach(m => {
    g += `<circle cx="${x(m.at)}" cy="${y(m.value)}" r="4.5" fill="${m.color}" stroke="#fff" stroke-width="2"/>`;
    if (m.label) g += `<text x="${x(m.at) + (m.anchor === 'end' ? -7 : 7)}" y="${y(m.value) + (m.dy == null ? -8 : m.dy)}" text-anchor="${m.anchor || 'start'}" fill="#333" font-size="10.5" font-weight="600">${esc(m.label)}</text>`;
  });
  if (o.endLabels) {
    const items = o.series.filter(s => !s.noLabel).map(s => ({s, v: s.values[end]})).filter(it => it.v != null && isFinite(it.v)).map(it => ({...it, y0: y(it.v), y: y(it.v)})).sort((a, b) => a.y - b.y);
    for (let i = 1; i < items.length; i++) if (items[i].y - items[i - 1].y < 14) items[i].y = items[i - 1].y + 14;
    const over = items.length ? items[items.length - 1].y - (T + PH) : 0;
    if (over > 0) items.forEach(it => it.y -= over);
    items.forEach(it => {
      const xx = x(end);
      g += `<circle cx="${xx}" cy="${it.y0}" r="4" fill="${it.s.color}" stroke="#fff" stroke-width="2"/>`;
      if (Math.abs(it.y - it.y0) > 1) g += `<line x1="${xx + 5}" x2="${xx + 12}" y1="${it.y0}" y2="${it.y}" stroke="#b8bdc4"/>`;
      g += `<text x="${xx + 14}" y="${it.y + 3.5}" fill="#333" font-size="11"><tspan font-weight="600">${esc((o.labelFmt || (v => fmtN(v, 1)))(it.v))}</tspan> <tspan fill="#777">${esc(it.s.short || it.s.name)}</tspan></text>`;
    });
  }
  g += `<g class="xh" style="display:none"><line y1="${T}" y2="${T + PH}" stroke="#555" stroke-dasharray="3 3"/>${o.series.map(s => `<circle r="4" fill="${s.color}" stroke="#fff" stroke-width="2"/>`).join('')}</g>`;
  g += `<rect class="hit" x="${L0}" y="${T}" width="${PW}" height="${PH}" fill="transparent"/>`;
  el.innerHTML = `<svg width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" role="img" aria-label="${esc(o.aria || '')}">${g}</svg>`;
  const svg = el.firstElementChild, xh = svg.querySelector('.xh'), xl = xh.querySelector('line'), dots = [...xh.querySelectorAll('circle')], hit = svg.querySelector('.hit');
  hit.addEventListener('pointermove', ev => {
    const r = svg.getBoundingClientRect(), px = (ev.clientX - r.left) * (W / r.width);
    const i = Math.max(0, Math.min(hoverEnd, Math.round((px - L0) / PW * (n - 1))));
    xh.style.display = ''; xl.setAttribute('x1', x(i)); xl.setAttribute('x2', x(i));
    const rows = [];
    o.series.forEach((s, k) => {
      const v = s.straight ? null : s.values[i];
      if (v == null || !isFinite(v)) { dots[k].style.display = 'none'; return; }
      dots[k].style.display = ''; dots[k].setAttribute('cx', x(i)); dots[k].setAttribute('cy', y(v));
      rows.push([s.name, fmt(v), s.color]);
    });
    showTip(tipHTML(fdate(dates[i]), rows), ev);
  });
  hit.addEventListener('pointerleave', () => { xh.style.display = 'none'; hideTip(); });
  const rowsIdx = monthEnds(dates).filter(i => i <= end);
  return {table: {columns: [L.date, ...o.series.map(s => s.name)], rows: rowsIdx.map(i => [dates[i], ...o.series.map(s => s.values[i] == null ? '' : fmt(s.values[i]))])}};
}

/* ---------------------------------------------------------------- horizontal bars */
function barChartH(el, o) {
  const W = width(el), items = o.items, rowH = o.rowH || 24;
  const T = o.refs && o.refs.length ? 24 : 8, B = 26, L0 = W < 520 ? 96 : 150, R = 64, H = T + items.length * rowH + B, PW = W - L0 - R;
  const vals = items.map(d => d.value).concat((o.refs || []).map(r => r.value), o.domainValues || []);
  let lo = Math.min(0, ...vals), hi = Math.max(0, ...vals);
  const pad = (hi - lo) * 0.14 || 1; hi += pad;
  if (lo < 0) lo -= Math.max(pad, 50 / PW * (hi - lo));
  const x = v => L0 + (v - lo) / (hi - lo) * PW;
  let g = '';
  niceTicks(lo, hi, PW < 420 ? 4 : 6).forEach(v => {
    g += `<line x1="${x(v)}" x2="${x(v)}" y1="${T}" y2="${T + items.length * rowH}" stroke="${v === 0 ? '#9aa0a6' : '#e6e8eb'}"/><text x="${x(v)}" y="${H - 8}" text-anchor="middle">${esc((o.tickFmt || (v => pct(v, 0)))(v))}</text>`;
  });
  items.forEach((d, i) => {
    const yTop = T + i * rowH + (rowH - 16) / 2, x0 = x(0), x1 = x(d.value), sel = d.id === o.selectedId;
    g += `<g class="bar" tabindex="0" role="button" data-id="${esc(d.id)}" aria-label="${esc(d.label + ', ' + pct(d.value))}" aria-pressed="${sel}">
<rect x="0" y="${T + i * rowH}" width="${W}" height="${rowH}" fill="transparent"/>
<rect class="mark" x="${Math.min(x0, x1)}" y="${yTop}" width="${Math.max(1, Math.abs(x1 - x0))}" height="16" fill="${d.color}"${sel ? ` stroke="${INK}" stroke-width="2"` : ''}/>
<text x="${L0 - 8}" y="${yTop + 12}" text-anchor="end" fill="${sel ? INK : '#444'}"${sel ? ' font-weight="700"' : ''}>${esc(d.label)}</text>
<text x="${d.value >= 0 ? x1 + 5 : x1 - 5}" y="${yTop + 12}" text-anchor="${d.value >= 0 ? 'start' : 'end'}" fill="#333">${esc(pct(d.value))}</text></g>`;
  });
  const refs = [...(o.refs || [])].sort((a, b) => a.value - b.value);
  refs.forEach((r, k) => {
    const xx = x(r.value), left = refs.length > 1 && k === 0;
    g += `<line x1="${xx}" x2="${xx}" y1="${T - 4}" y2="${T + items.length * rowH}" stroke="#444"${r.dash ? ' stroke-dasharray="5 4"' : ''}/><text x="${xx + (left ? -4 : 4)}" y="${T - 9}" text-anchor="${left ? 'end' : 'start'}" fill="#333" font-size="10.5" font-weight="600">${esc(r.label)}</text>`;
  });
  el.innerHTML = `<svg width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" role="img" aria-label="${esc(o.aria || '')}">${g}</svg>`;
  el.querySelectorAll('g.bar').forEach(gEl => {
    const d = items.find(it => it.id === gEl.dataset.id);
    hoverable(gEl, () => tipHTML(d.label + (d.sub ? ' (' + d.sub + ')' : ''), [[o.valueLabel || L.fullRet, pct(d.value), d.color], ...(d.extra || [])]), () => o.onSelect && o.onSelect(d.id));
  });
  return {table: {columns: [L.company, L.ticker, o.valueLabel || L.fullRet, L.maxDD], rows: items.map(d => [d.label, d.sub || '', pct(d.value), d.extra ? d.extra[0][1] : ''])}};
}

/* ---------------------------------------------------------------- heatmap */
function mix(a, b, t) { return 'rgb(' + a.map((v, i) => Math.round(v + (b[i] - v) * t)).join(',') + ')'; }
const NEUT = [247, 247, 247], POS = [33, 102, 172], NEG = [214, 96, 77];
function divColor(v, scale) { const t = Math.min(1, Math.abs(v) / scale); return mix(NEUT, v >= 0 ? POS : NEG, t); }
function heatmap(el, o) {
  let html = `<div class="hm" style="grid-template-columns:52px repeat(${o.cols.length},minmax(0,1fr))"><div></div>`;
  o.cols.forEach(c => html += `<div class="hd">${c}</div>`);
  o.rows.forEach(r => {
    html += `<div class="rh">${r}</div>`;
    o.cols.forEach(c => {
      const v = corr(r, c), bg = divColor(v, o.scale), t = Math.abs(v) / o.scale, sel = r === o.selA && c === o.selB;
      html += `<button data-a="${r}" data-b="${c}" aria-pressed="${sel}" style="background:${bg};color:${t > 0.55 ? '#fff' : INK}" aria-label="${esc(STOCKS[r].name + ' × ' + STOCKS[c].name + ', ' + L.p4.corr + ' ' + coef(v))}">${coef(v)}</button>`;
    });
  });
  html += `</div><div class="color-key"><span>−${o.scale.toFixed(1)}</span><i style="background:linear-gradient(90deg,${divColor(-o.scale, o.scale)},#f7f7f7,${divColor(o.scale, o.scale)})"></i><span>+${o.scale.toFixed(1)}</span><span style="margin-left:auto">${esc(L.p4.scaleNote)}</span></div>`;
  el.innerHTML = html;
  el.querySelectorAll('button').forEach(b => {
    const a = b.dataset.a, c = b.dataset.b;
    hoverable(b, () => tipHTML(STOCKS[a].name + ' × ' + STOCKS[c].name, [[L.p4.dailyCorr, coef(corr(a, c))], [L.p4.sameDir, fmtN(sameDir(a, c), 1) + '%'], [L.p4.fullRetOf(a), pct(STOCKS[a].stats.ret), AI.color], [L.p4.fullRetOf(c), pct(STOCKS[c].stats.ret), CHIP.color]]));
    b.addEventListener('click', () => { S.pairA = a; S.pairB = c; render(); });
  });
}

/* ---------------------------------------------------------------- scatter (pair of daily returns) */
function scatter(el, o) {
  const W = width(el), H = o.height || 250, L0 = 50, R = 12, T = 12, B = 34, PW = W - L0 - R, PH = H - T - B, a = o.a, b = o.b;
  const bound = Math.ceil(Math.max(...a.daily.map(Math.abs), ...b.daily.map(Math.abs)) * 100) + 1;
  const x = v => L0 + (v + bound) / (2 * bound) * PW, y = v => T + (bound - v) / (2 * bound) * PH;
  let g = '';
  [-bound, -bound / 2, 0, bound / 2, bound].forEach(v => {
    const col = v === 0 ? '#9aa0a6' : '#e6e8eb';
    g += `<line x1="${x(v)}" x2="${x(v)}" y1="${T}" y2="${T + PH}" stroke="${col}"/><line x1="${L0}" x2="${W - R}" y1="${y(v)}" y2="${y(v)}" stroke="${col}"/><text x="${x(v)}" y="${T + PH + 14}" text-anchor="middle">${fmtN(v, 0)}%</text><text x="${L0 - 6}" y="${y(v) + 3.5}" text-anchor="end">${fmtN(v, 0)}%</text>`;
  });
  g += `<text x="${W - R - 4}" y="${T + 11}" text-anchor="end" fill="#999" font-size="10">${esc(L.p4.bothUp)}</text><text x="${L0 + 4}" y="${T + PH - 5}" fill="#999" font-size="10">${esc(L.p4.bothDown)}</text>`;
  const pts = a.daily.map((v, i) => ({i, px: x(v * 100), py: y(b.daily[i] * 100)}));
  pts.forEach(p => g += `<circle cx="${p.px.toFixed(1)}" cy="${p.py.toFixed(1)}" r="3" fill="${o.color}" fill-opacity=".55"/>`);
  g += `<circle class="hl" r="5.5" fill="none" stroke="${INK}" stroke-width="2" style="display:none"/>`;
  g += `<text x="${L0 + PW / 2}" y="${H - 4}" text-anchor="middle">${esc(L.p4.dailyRet(a.ticker))}</text><text transform="translate(12 ${T + PH / 2}) rotate(-90)" text-anchor="middle">${esc(L.p4.dailyRet(b.ticker))}</text>`;
  g += `<rect class="hit" x="${L0}" y="${T}" width="${PW}" height="${PH}" fill="transparent"/>`;
  el.innerHTML = `<svg width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" role="img" aria-label="${esc(a.name + ' × ' + b.name)}">${g}</svg>`;
  const svg = el.firstElementChild, hl = svg.querySelector('.hl'), hit = svg.querySelector('.hit');
  hit.addEventListener('pointermove', ev => {
    const r = svg.getBoundingClientRect(), mx = (ev.clientX - r.left) * (W / r.width), my = (ev.clientY - r.top) * (H / r.height);
    let best = null, bd = Infinity;
    pts.forEach(p => { const d = (p.px - mx) ** 2 + (p.py - my) ** 2; if (d < bd) { bd = d; best = p; } });
    if (best && bd <= 22 * 22) {
      hl.style.display = ''; hl.setAttribute('cx', best.px); hl.setAttribute('cy', best.py);
      showTip(tipHTML(fdate(RDATES[best.i]), [[a.ticker, pct(a.daily[best.i] * 100, 2), o.colorA], [b.ticker, pct(b.daily[best.i] * 100, 2), o.colorB]]), ev);
    } else { hl.style.display = 'none'; hideTip(); }
  });
  hit.addEventListener('pointerleave', () => { hl.style.display = 'none'; hideTip(); });
}

/* ---------------------------------------------------------------- dumbbell */
function dumbbell(el, o) {
  const W = width(el), rowH = 44, L0 = W < 520 ? 92 : 130, R = 96, T = 30, B = 26, H = T + o.rows.length * rowH + B, PW = W - L0 - R;
  const vals = o.rows.flatMap(r => [r.mean, r.median]);
  const minV = Math.min(0, ...vals), maxV = Math.max(...vals), frac = 86 / PW;
  let hi = maxV + (maxV - minV) * 0.2, lo = minV - frac * (hi - minV) / (1 - frac);
  const x = v => L0 + (v - lo) / (hi - lo) * PW;
  let g = '';
  niceTicks(lo, hi, 6).forEach(v => g += `<line x1="${x(v)}" x2="${x(v)}" y1="${T}" y2="${T + o.rows.length * rowH}" stroke="${v === 0 ? '#9aa0a6' : '#e6e8eb'}"/><text x="${x(v)}" y="${H - 8}" text-anchor="middle">${pct(v, 0)}</text>`);
  g += `<circle cx="${L0 + 6}" cy="12" r="5" fill="#555"/><text x="${L0 + 16}" y="16" fill="#555">${esc(L.mean)}</text><circle cx="${L0 + 68}" cy="12" r="5" fill="#fff" stroke="#555" stroke-width="2"/><text x="${L0 + 78}" y="16" fill="#555">${esc(L.median)}</text>`;
  o.rows.forEach((r, i) => {
    const cy = T + i * rowH + rowH / 2, right = r.mean >= r.median;
    g += `<g class="bar" tabindex="0" data-i="${i}" aria-label="${esc(r.name + ': ' + L.mean + ' ' + pct(r.mean) + ', ' + L.median + ' ' + pct(r.median))}"><rect x="0" y="${T + i * rowH}" width="${W}" height="${rowH}" fill="transparent"/>
<text x="${L0 - 10}" y="${cy + 4}" text-anchor="end" fill="#333" font-weight="600">${esc(r.name)}</text>
<line x1="${x(r.median)}" x2="${x(r.mean)}" y1="${cy}" y2="${cy}" stroke="${r.color}" stroke-width="3" stroke-opacity=".45"/>
<circle cx="${x(r.mean)}" cy="${cy}" r="7" fill="${r.color}" stroke="#fff" stroke-width="2"/><circle cx="${x(r.median)}" cy="${cy}" r="7" fill="#fff" stroke="${r.color}" stroke-width="2.5"/>
<text x="${x(r.mean) + (right ? 12 : -12)}" y="${cy + 4}" text-anchor="${right ? 'start' : 'end'}" fill="#333">${esc(L.mean + ' ' + pct(r.mean))}</text>
<text x="${x(r.median) + (right ? -12 : 12)}" y="${cy + 4}" text-anchor="${right ? 'end' : 'start'}" fill="#333">${esc(L.median + ' ' + pct(r.median))}</text></g>`;
  });
  el.innerHTML = `<svg width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" role="img" aria-label="${esc(L.p7.db)}">${g}</svg>`;
  el.querySelectorAll('g.bar').forEach(gEl => { const r = o.rows[+gEl.dataset.i]; hoverable(gEl, () => tipHTML(r.name, [[L.companies, r.n], [L.gainers, r.gainers + ' / ' + r.n], [L.meanRet, pct(r.mean), r.color], [L.medianRet, pct(r.median), r.color]])); });
  return {table: {columns: [L.theme, L.companies, L.gainers, L.meanRet, L.medianRet], rows: o.rows.map(r => [r.name, r.n, r.gainers, pct(r.mean), pct(r.median)])}};
}

/* ---------------------------------------------------------------- overview chart · return vs deepest drawdown */
function ddScatter(el, o) {
  const W = width(el), H = o.height || 280, L0 = 62, R = 18, T = 14, B = 42, PW = W - L0 - R, PH = H - T - B;
  const pts = ALL.map(s => ({s, mult: s.normal[LAST] / 100, dd: s.stats.dd}));
  const xlo = Math.floor(Math.min(...pts.map(p => p.dd)) / 10) * 10 - 2, xhi = 0;
  const ly = Math.log, ylo = ly(Math.min(...pts.map(p => p.mult))) - 0.28, yhi = ly(Math.max(...pts.map(p => p.mult))) + 0.28;
  const x = v => L0 + (v - xlo) / (xhi - xlo) * PW, y = m => T + (yhi - ly(m)) / (yhi - ylo) * PH;
  let g = '';
  for (let v = Math.ceil(xlo / 20) * 20; v <= 0; v += 20) g += `<line x1="${x(v)}" x2="${x(v)}" y1="${T}" y2="${T + PH}" stroke="${v === 0 ? '#9aa0a6' : '#e6e8eb'}"/><text x="${x(v)}" y="${T + PH + 14}" text-anchor="middle">${fmtN(v, 0)}%</text>`;
  [0.25, 0.5, 1, 2, 4, 8, 16].filter(m => ly(m) >= ylo && ly(m) <= yhi).forEach(m => g += `<line x1="${L0}" x2="${W - R}" y1="${y(m)}" y2="${y(m)}" stroke="${m === 1 ? '#9aa0a6' : '#e6e8eb'}"/><text x="${L0 - 6}" y="${y(m) + 3.5}" text-anchor="end">${pct((m - 1) * 100, 0)}</text>`);
  g += `<text x="${L0 + PW / 2}" y="${H - 4}" text-anchor="middle">${esc(L.ov.ddX)}</text><text transform="translate(12 ${T + PH / 2}) rotate(-90)" text-anchor="middle">${esc(L.ov.ddY)}</text>`;
  const LABELS = new Set(['BE', 'LCID', 'SMCI', 'MU', S.company]);
  pts.forEach(p => {
    const rec = p.s.stats.recovery >= 0, c = p.s.theme.color, sel = p.s.ticker === S.company, px = x(p.dd), py = y(p.mult);
    g += `<circle cx="${px.toFixed(1)}" cy="${py.toFixed(1)}" r="${sel ? 6.5 : 5}" fill="${rec ? c : '#fff'}" stroke="${sel ? INK : c}" stroke-width="${sel ? 2.5 : 2}"/>`;
    if (LABELS.has(p.s.ticker)) g += `<text x="${px + 9}" y="${py + 3.5}" fill="#333" font-size="10.5"${sel ? ' font-weight="700"' : ''}>${esc(p.s.ticker)}</text>`;
  });
  g += `<circle class="hl" r="8" fill="none" stroke="${INK}" stroke-width="1.5" style="display:none"/><rect class="hit" x="${L0}" y="${T}" width="${PW}" height="${PH}" fill="transparent"/>`;
  el.innerHTML = `<svg width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" role="img" aria-label="${esc(L.ov.dd)}">${g}</svg>`;
  const svg = el.firstElementChild, hl = svg.querySelector('.hl'), hit = svg.querySelector('.hit');
  const px = pts.map(p => ({p, px: x(p.dd), py: y(p.mult)}));
  let near = null;
  const locate = ev => { const r = svg.getBoundingClientRect(), mx = (ev.clientX - r.left) * (W / r.width), my = (ev.clientY - r.top) * (H / r.height); let best = null, bd = Infinity; px.forEach(q => { const d = (q.px - mx) ** 2 + (q.py - my) ** 2; if (d < bd) { bd = d; best = q; } }); return bd <= 20 * 20 ? best : null; };
  hit.addEventListener('pointermove', ev => {
    near = locate(ev);
    if (near) { hl.style.display = ''; hl.setAttribute('cx', near.px); hl.setAttribute('cy', near.py); hit.style.cursor = 'pointer'; const s = near.p.s, st = s.stats; showTip(tipHTML(s.name + ' (' + s.ticker + ')', [[L.fullRet, pct(st.ret), s.theme.color], [L.maxDD, pct(st.dd)], [L.regained, st.recovery >= 0 ? fdate(DATES[st.recovery]) : L.notRecovered]]), ev); }
    else { hl.style.display = 'none'; hit.style.cursor = 'crosshair'; hideTip(); }
  });
  hit.addEventListener('pointerleave', () => { hl.style.display = 'none'; hideTip(); near = null; });
  hit.addEventListener('click', () => { if (near && o.onSelect) o.onSelect(near.p.s.ticker); });
  return {table: {columns: [L.company, L.ticker, L.theme, L.fullRet, L.maxDD, L.regained], rows: [...pts].sort((a, b) => b.mult - a.mult).map(p => [p.s.name, p.s.ticker, p.s.theme.name, pct(p.s.stats.ret), pct(p.s.stats.dd), p.s.stats.recovery >= 0 ? DATES[p.s.stats.recovery] : L.notRecovered])}};
}

/* ---------------------------------------------------------------- building blocks */
function sheet(o) {
  return `<section class="sheet${o.cls ? ' ' + o.cls : ''}" style="grid-column:span ${o.span || 12}"><header class="sheet-head"><div><h3>${esc(o.title)}</h3>${o.sub ? `<p>${esc(o.sub)}</p>` : ''}</div>${o.noTable ? '' : `<button class="tbl-btn" data-table="${o.id}" aria-pressed="${S.tables.has(o.id)}" aria-controls="${o.id}-table">${esc(L.dataBtn)}</button>`}</header><div class="sheet-body" id="${o.id}"></div>${o.noTable ? '' : `<div class="sheet-table" id="${o.id}-table" hidden></div>`}</section>`;
}
function textObj(head, body) { return `<div class="text-obj"><strong>${esc(head)}</strong>${esc(body)}</div>`; }
function ban(label, value, sub, color) { return `<div class="ban" style="--c:${color || '#c7ccd3'}"><div class="ban-label">${esc(label)}</div><div class="ban-value">${esc(value)}</div>${sub ? `<div class="ban-sub">${esc(sub)}</div>` : ''}</div>`; }
function themeTile(g, headline, line, desc) {
  return `<section class="sheet tile" style="grid-column:span 4"><div class="tile-body"><div class="tile-kicker"><i class="sw" style="--c:${g.color}"></i>${esc(g.name)}</div><div class="tile-hero">${g.gainers}<small>${esc(L.endedHigher(g.stocks.length))}</small></div>${headline ? `<div class="tile-head">${esc(headline)}</div>` : ''}<div class="tile-line">${esc(line)}</div>${desc ? `<p class="tile-desc">${esc(desc)}</p>` : ''}</div></section>`;
}
function card(title, inner) { return `<div class="fcard"><h4>${esc(title)}</h4>${inner}</div>`; }
function radioHTML(name, options, value) { return `<div class="rlist" role="radiogroup">${options.map(([v, l]) => `<label><input type="radio" name="${name}" value="${esc(v)}"${v === value ? ' checked' : ''}><span>${esc(l)}</span></label>`).join('')}</div>`; }
function bindRadio(root, name, fn) { root.querySelectorAll(`input[name="${name}"]`).forEach(r => r.addEventListener('change', () => fn(r.value))); }
function chk(id, label, checked) { return `<label class="chk"><input type="checkbox" id="${id}"${checked ? ' checked' : ''}><span>${esc(label)}</span></label>`; }
function bindChk(root, id, fn) { root.querySelector('#' + id).addEventListener('change', e => fn(e.target.checked)); }
function selectHTML(id, stocks, value) { return `<select id="${id}">${stocks.map(s => `<option value="${s.ticker}"${s.ticker === value ? ' selected' : ''}>${esc(s.name)} (${s.ticker})</option>`).join('')}</select>`; }
function companySelect() { return `<select id="company" aria-label="${esc(L.companyToFollow)}">${THEMES.map(g => `<optgroup label="${esc(g.name)}">${g.stocks.map(s => `<option value="${s.ticker}"${s.ticker === S.company ? ' selected' : ''}>${esc(s.name)} (${s.ticker})</option>`).join('')}</optgroup>`).join('')}</select>`; }
function bindCompany(root, extra) { const el = root.querySelector('#company'); el.addEventListener('change', () => { S.company = el.value; if (extra) extra(el.value); render(); }); }
function btnList(name, options, value) { return `<div class="btn-list" data-name="${name}">${options.map(([v, l]) => `<button data-v="${esc(v)}" aria-pressed="${v === value}">${esc(l)}</button>`).join('')}</div>`; }
function bindBtnList(root, name, fn) { root.querySelectorAll(`.btn-list[data-name="${name}"] button`).forEach(b => b.addEventListener('click', () => fn(b.dataset.v))); }
function legendCard(extra) { return card(L.colorTheme, `<div class="legend">${THEMES.map(g => `<span><i class="sw" style="--c:${g.color}"></i>${esc(g.name)}</span>`).join('')}${extra || ''}</div>`); }
function companyCard() { return card(L.companyToFollow, companySelect()); }
const spxLegend = () => `<span><i class="sw" style="--c:${SPX_COLOR}"></i>${esc(L.spxRef)}</span>`;
const themeSeries = () => THEMES.map(g => ({id: g.id, name: g.name, short: g.short, color: g.color, values: g.values}));
const spxSeries = () => ({id: 'SPX', name: L.spx, short: L.spx, color: SPX_COLOR, values: SPX.normal});

/* ---------------------------------------------------------------- story point 1 · overview */
function p0c(canvas) {
  const up = ALL.filter(s => s.stats.ret > 0).length, notRec = ALL.filter(s => s.stats.recovery < 0).length, o = L.ov;
  canvas.innerHTML = textObj(o.head, o.note)
    + `<div class="kpis">${ban(o.kCompanies, '35', o.kCompaniesSub)}${ban(o.kDays, '251', o.kDaysSub)}${ban(o.kUp, up + ' / 35', o.kUpSub(notRec))}${ban(o.kSpx, pct(SPX.normal[LAST] - 100), o.kSpxSub, SPX_COLOR)}</div>`
    + sheet({id: 'ov-paths', title: o.paths, sub: o.pathsSub, span: 7})
    + sheet({id: 'ov-find', title: o.find, sub: o.findSub, span: 5, noTable: true})
    + sheet({id: 'ov-db', title: o.db, sub: o.dbSub, span: 6})
    + sheet({id: 'ov-dd', title: o.dd, sub: o.ddSub, span: 6})
    + sheet({id: 'ov-ch', title: o.chapters, span: 12, noTable: true});
  TABLES['ov-paths'] = lineChart($('ov-paths'), {series: [...themeSeries(), spxSeries()], scaleAll: true, baseline: 100, height: 300, endLabels: true, labelFmt: v => pct(v - 100), tipFmt: v => fmtN(v, 1) + ' (' + pct(v - 100) + ')',
    refX: MILESTONE_DATES.map((d, k) => ({at: DATES.indexOf(d), label: String(k + 1), dash: true})), aria: o.paths}).table;
  const f = {ranked: [...THEMES].sort((a, b) => b.mean - a.mean), spx: SPX.normal[LAST] - 100, be: STOCKS.BE.stats, notRec};
  $('ov-find').innerHTML = `<ol class="findings">${o.findings(f).map((it, k) => `<li><button data-go="${it.go}"><span class="fn">${k + 1}</span><span><b>${esc(it.head)}</b><span>${esc(it.text)}</span></span></button></li>`).join('')}</ol>`;
  TABLES['ov-db'] = dumbbell($('ov-db'), {rows: THEMES.map(t => ({name: t.name, color: t.color, mean: t.mean, median: t.median, n: t.stocks.length, gainers: t.gainers}))}).table;
  TABLES['ov-dd'] = ddScatter($('ov-dd'), {height: 290, onSelect: t => { S.company = t; render(); }}).table;
  $('ov-ch').innerHTML = `<div class="chapters">${o.chapterList.map((c, k) => `<button class="chap" data-go="${k + 2}"><span class="chap-n">${esc(L.pointN(k + 2))}</span><b>${esc(c[0])}</b><span>${esc(c[1])}</span></button>`).join('')}</div>`;
  canvas.querySelectorAll('[data-go]').forEach(b => b.addEventListener('click', () => go(+b.dataset.go)));
}
function p0s(shelf) {
  shelf.innerHTML = card(L.ov.read, `<div class="btn-list"><button id="start">${esc(L.ov.start)}</button></div>`) + companyCard() + legendCard(spxLegend());
  shelf.querySelector('#start').addEventListener('click', () => go(2)); bindCompany(shelf);
}

/* ---------------------------------------------------------------- story point 2 · watchlist */
function p1c(canvas) {
  const s = STOCKS[S.company], up = ALL.filter(x => x.stats.ret > 0).length, p = L.p1;
  const shown = S.themeFilter === 'All' ? THEMES : THEMES.filter(g => g.id === S.themeFilter);
  canvas.innerHTML = textObj(p.head, p.text(up, s))
    + THEMES.map(g => themeTile(g, '', L.tileLine(pct(g.mean), pct(g.median)), g.desc)).join('')
    + sheet({id: 'watch', title: p.watch, sub: p.watchSub, span: 12});
  const body = $('watch');
  body.innerHTML = shown.map(g => `<div class="chip-group"><div class="chip-group-head"><i class="sw" style="--c:${g.color}"></i>${esc(g.name)}</div><div class="chips">${[...g.stocks].sort((a, b) => b.stats.ret - a.stats.ret).map(st => `<button class="chip${st.ticker === S.company ? ' selected' : ''}" data-t="${st.ticker}" style="--c:${g.color}" aria-pressed="${st.ticker === S.company}"><span class="tk">${st.ticker}</span><span class="rt">${pct(st.stats.ret)}</span><span class="nm">${esc(st.name)}</span></button>`).join('')}</div></div>`).join('');
  body.querySelectorAll('.chip').forEach(b => { const st = STOCKS[b.dataset.t]; hoverable(b, () => tipHTML(st.name + ' (' + st.ticker + ')', [[L.business, st.business], [L.fullRet, pct(st.stats.ret), st.theme.color], [L.maxDD, pct(st.stats.dd)]])); b.addEventListener('click', () => { S.company = st.ticker; render(); }); });
  TABLES.watch = {columns: [L.company, L.ticker, L.theme, L.business, L.fullRet, L.maxDD], rows: ALL.map(st => [st.name, st.ticker, st.theme.name, st.business, pct(st.stats.ret), pct(st.stats.dd)])};
}
function p1s(shelf) {
  shelf.innerHTML = card(L.p1.themeFilter, radioHTML('themeFilter', [['All', L.p1.all], ...THEMES.map(g => [g.id, g.name])], S.themeFilter)) + companyCard() + legendCard();
  bindRadio(shelf, 'themeFilter', v => { S.themeFilter = v; renderCanvas(); }); bindCompany(shelf);
}

/* ---------------------------------------------------------------- story point 3 · big picture */
function p2series() {
  const s = STOCKS[S.company], series = [...themeSeries(), spxSeries()];
  if (S.overlay) series.push({id: s.ticker, name: s.name, short: s.ticker, color: INK, values: s.normal, dash: true});
  return series;
}
function p2c(canvas) {
  const i = S.dateIdx, series = p2series(), p = L.p2;
  const ranked = THEMES.map(g => ({name: g.name, v: g.values[i] - 100})).sort((a, b) => b.v - a.v);
  canvas.innerHTML = textObj(p.head, p.text(fdate(DATES[i]), ranked.map(r => r.name + ' ' + pct(r.v)), pct(SPX.normal[i] - 100)))
    + sheet({id: 'paths', title: p.paths, sub: p.pathsSub, span: 9})
    + sheet({id: 'p2bans', title: p.since + fdate(DATES[i]), span: 3, noTable: true});
  TABLES.paths = lineChart($('paths'), {series, end: i, scaleAll: true, baseline: 100, height: 340, endLabels: true, labelFmt: v => pct(v - 100), tipFmt: v => fmtN(v, 1) + ' (' + pct(v - 100) + ')', aria: p.paths}).table;
  $('p2bans').innerHTML = `<div class="bans">${series.map(x => ban(x.name, pct(x.values[i] - 100), L.index + fmtN(x.values[i], 1), x.color)).join('')}</div>`;
}
function p2s(shelf) {
  shelf.innerHTML = card(L.p2.throughDate, `<input type="range" id="date" min="0" max="${LAST}" value="${S.dateIdx}" aria-label="${esc(L.p2.throughDate)}"><output id="dateOut" for="date">${esc(fdate(DATES[S.dateIdx]))}</output>`)
    + card(L.p2.options, chk('overlay', L.p2.overlay, S.overlay)) + companyCard() + legendCard(spxLegend() + `<span><i class="sw dash"></i>${esc(L.followedLegend)}</span>`);
  shelf.querySelector('#date').addEventListener('input', e => { S.dateIdx = +e.target.value; shelf.querySelector('#dateOut').textContent = fdate(DATES[S.dateIdx]); renderCanvas(); });
  bindChk(shelf, 'overlay', v => { S.overlay = v; renderCanvas(); }); bindCompany(shelf);
}

/* ---------------------------------------------------------------- story point 4 · beneath the average */
function p3c(canvas) {
  const g = THEMES.find(t => t.id === S.distTheme), sorted = [...g.stocks].sort((a, b) => b.stats.ret - a.stats.ret), p = L.p3;
  const shown = S.exclude ? sorted.slice(1) : sorted, rets = shown.map(s => s.stats.ret), m = mean(rets), md = median(rets);
  const lead = sorted[0], lag = sorted[sorted.length - 1], f = STOCKS[S.company], rank = sorted.indexOf(f) + 1;
  let sentence = p.text(g, lead, lag);
  if (S.exclude) sentence += p.without(lead, m, md);
  canvas.innerHTML = textObj(p.head, sentence)
    + sheet({id: 'bars', title: p.bars(g.name), sub: p.barsSub, span: 8})
    + sheet({id: 'p3side', title: p.summary(g.name), span: 4, noTable: true});
  const refs = [];
  if (S.showMean) refs.push({value: m, label: L.mean + ' ' + pct(m)});
  if (S.showMedian) refs.push({value: md, label: L.median + ' ' + pct(md), dash: true});
  TABLES.bars = barChartH($('bars'), {items: shown.map(s => ({id: s.ticker, label: s.name, sub: s.ticker, value: s.stats.ret, color: g.color, extra: [[L.maxDD, pct(s.stats.dd)]]})), refs, domainValues: [lead.stats.ret], selectedId: S.company, onSelect: id => { S.company = id; render(); }, aria: p.bars(g.name)}).table;
  $('p3side').innerHTML = `<div class="bans two">${ban(L.companies, shown.length, S.exclude ? p.removed : '')}${ban(p.endedHigherLabel, rets.filter(v => v > 0).length + ' / ' + shown.length)}${ban(L.meanRet, pct(m), S.exclude ? p.allN(sorted.length, pct(g.mean)) : '', g.color)}${ban(L.medianRet, pct(md), S.exclude ? p.allN(sorted.length, pct(g.median)) : '', g.color)}</div>`
    + `<div class="note">${rank ? p.rankNote(f, rank, sorted.length, g, f.stats.ret >= g.median) : p.otherNote(f)}</div>`;
}
function p3s(shelf) {
  shelf.innerHTML = card(L.p1.themeFilter, radioHTML('distTheme', THEMES.map(g => [g.id, g.name]), S.distTheme))
    + card(L.p2.options, chk('exclude', L.p3.exclude, S.exclude) + chk('showMean', L.p3.showMean, S.showMean) + chk('showMedian', L.p3.showMedian, S.showMedian)) + companyCard();
  bindRadio(shelf, 'distTheme', v => { S.distTheme = v; renderCanvas(); });
  bindChk(shelf, 'exclude', v => { S.exclude = v; renderCanvas(); }); bindChk(shelf, 'showMean', v => { S.showMean = v; renderCanvas(); }); bindChk(shelf, 'showMedian', v => { S.showMedian = v; renderCanvas(); });
  bindCompany(shelf, t => { S.distTheme = STOCKS[t].theme.id; });
}

/* ---------------------------------------------------------------- story point 5 · correlation */
function p4c(canvas) {
  const a = STOCKS[S.pairA], b = STOCKS[S.pairB], r = corr(a.ticker, b.ticker), same = sameDir(a.ticker, b.ticker), p = L.p4;
  canvas.innerHTML = textObj(p.head, p.text())
    + `<div class="kpis">${ban(p.k1, coef(C.cross), p.k1s)}${ban(p.k2, coef(C.ai), p.k2s, AI.color)}${ban(p.k3, coef(C.chip), p.k3s, CHIP.color)}${ban(p.k4, coef(C.group), p.k4s)}</div>`
    + sheet({id: 'hm', title: p.hm, sub: p.hmSub, span: 7})
    + sheet({id: 'pair', title: `${a.name} × ${b.name}`, sub: p.pairSub, span: 5})
    + sheet({id: 'roll', title: p.roll(S.win, a.ticker, b.ticker), sub: p.rollSub, span: 12});
  heatmap($('hm'), {rows: AI.tickers, cols: CHIP.tickers, selA: a.ticker, selB: b.ticker, scale: HM_SCALE});
  TABLES.hm = {columns: [p.hmCorner, ...CHIP.tickers], rows: AI.tickers.map(x => [x, ...CHIP.tickers.map(y => coef(corr(x, y)))])};
  $('pair').innerHTML = `<div class="bans two small">${ban(p.corr, coef(r))}${ban(p.sameDir, fmtN(same, 1) + '%')}${ban(p.fullPeriod(a.ticker), pct(a.stats.ret), '', AI.color)}${ban(p.fullPeriod(b.ticker), pct(b.stats.ret), '', CHIP.color)}</div><div id="sc" style="margin-top:8px"></div>`;
  scatter($('sc'), {a, b, color: NEUTRAL, colorA: AI.color, colorB: CHIP.color, height: 250});
  TABLES.pair = {columns: [L.date, p.dailyRet(a.ticker), p.dailyRet(b.ticker)], rows: RDATES.map((d, i) => [d, pct(a.daily[i] * 100, 2), pct(b.daily[i] * 100, 2)])};
  const roll = rolling(a.daily, b.daily, S.win);
  TABLES.roll = lineChart($('roll'), {dates: RDATES, series: [{id: 'r', name: p.rollSeries(S.win), color: NEUTRAL, values: roll}], yDomain: [-1, 1], baseline: 0, height: 200, refY: [{value: r, label: p.fullRef + coef(r), dash: true}], yFmt: v => v.toFixed(1), tipFmt: v => coef(v), aria: p.roll(S.win, a.ticker, b.ticker)}).table;
}
function p4s(shelf) {
  const p = L.p4, presets = [['NVDA|AMD', p.presetObvious], [C.max.a + '|' + C.max.b, `${p.presetMax} · ${STOCKS[C.max.a].name} × ${STOCKS[C.max.b].name}`], [C.min.a + '|' + C.min.b, `${p.presetMin} · ${STOCKS[C.min.a].name} × ${STOCKS[C.min.b].name}`]];
  shelf.innerHTML = card(p.aiCompany, selectHTML('pairA', AI.stocks, S.pairA)) + card(p.chipCompany, selectHTML('pairB', CHIP.stocks, S.pairB))
    + card(p.presets, btnList('preset', presets, S.pairA + '|' + S.pairB))
    + card(p.window, radioHTML('win', [['30', p.tradingDays(30)], ['60', p.tradingDays(60)]], String(S.win)));
  shelf.querySelector('#pairA').addEventListener('change', e => { S.pairA = e.target.value; render(); });
  shelf.querySelector('#pairB').addEventListener('change', e => { S.pairB = e.target.value; render(); });
  bindBtnList(shelf, 'preset', v => { [S.pairA, S.pairB] = v.split('|'); render(); });
  bindRadio(shelf, 'win', v => { S.win = +v; renderCanvas(); });
}

/* ---------------------------------------------------------------- story point 6 · turning points */
function p5c(canvas) {
  const m = L.p5.milestones[S.checkpoint], date = MILESTONE_DATES[S.checkpoint], end = DATES.indexOf(date), p = L.p5;
  canvas.innerHTML = textObj(m.title + (LANG === 'zh' ? '。' : '.'), m.text)
    + sheet({id: 'turns', title: p.turns(fdate(date)), sub: p.turnsSub, span: 8})
    + sheet({id: 'cps', title: p.cps, sub: p.cpsSub, span: 4, noTable: true});
  TABLES.turns = lineChart($('turns'), {series: themeSeries(), end, hoverEnd: end, scaleAll: true, fadeFrom: end, baseline: 100, height: 340, endLabels: true, labelFmt: v => pct(v - 100),
    refX: MILESTONE_DATES.map((d, k) => ({at: DATES.indexOf(d), label: String(k + 1), strong: k === S.checkpoint, dash: k !== S.checkpoint})), aria: p.turns(fdate(date))}).table;
  $('cps').innerHTML = `<div class="cp-list">${MILESTONE_DATES.map((d, k) => { const idx = DATES.indexOf(d), mm = p.milestones[k]; return `<button class="cp${k === S.checkpoint ? ' selected' : ''}" data-k="${k}" aria-pressed="${k === S.checkpoint}"><span class="cp-n">${k + 1}</span><span class="cp-body"><b>${esc(fdate(d))}</b><span class="cp-title">${esc(mm.title)}</span><span class="cp-vals">${THEMES.map(g => `<span><i class="sw" style="--c:${g.color}"></i>${pct(g.values[idx] - 100)}</span>`).join('')}<span><i class="sw" style="--c:${SPX_COLOR}"></i>${pct(SPX.normal[idx] - 100)}</span></span></span></button>`; }).join('')}</div>`;
  canvas.querySelectorAll('.cp').forEach(b => b.addEventListener('click', () => { S.checkpoint = +b.dataset.k; render(); }));
}
function p5s(shelf) {
  shelf.innerHTML = card(L.p5.checkpoint, radioHTML('checkpoint', MILESTONE_DATES.map((d, k) => [String(k), (k + 1) + ' · ' + fdate(d)]), String(S.checkpoint))) + legendCard(spxLegend());
  bindRadio(shelf, 'checkpoint', v => { S.checkpoint = +v; renderCanvas(); });
}

/* ---------------------------------------------------------------- story point 7 · the path matters */
function p6c(canvas) {
  const s = STOCKS[S.company], m = s.stats, g = s.theme, rec = m.recovery >= 0, p = L.p6;
  canvas.innerHTML = textObj(p.head, p.text(s, m, rec))
    + sheet({id: 'journey', title: p.journey(s), sub: S.fullPath ? p.fullSub : p.endsSub, span: 8})
    + sheet({id: 'p6bans', title: p.four, span: 4, noTable: true})
    + sheet({id: 'uw', title: p.uw, sub: p.uwSub, span: 12});
  const markers = S.fullPath ? [{at: m.peak, value: s.normal[m.peak], color: g.color, label: p.peak + fdate(DATES[m.peak], false)}, {at: m.trough, value: s.normal[m.trough], color: g.color, label: p.trough + pct(m.dd), dy: 4}].concat(rec ? [{at: m.recovery, value: s.normal[m.recovery], color: INK, label: p.recovered + fdate(DATES[m.recovery], false), dy: 17, anchor: 'end'}] : []) : [];
  TABLES.journey = lineChart($('journey'), {series: [{id: s.ticker, name: s.name, short: s.ticker, color: g.color, values: s.normal, straight: !S.fullPath, dash: !S.fullPath}], scaleAll: true, baseline: 100, height: 320, endLabels: true, labelFmt: v => pct(v - 100), tipFmt: v => fmtN(v, 1) + ' (' + pct(v - 100) + ')',
    shade: S.fullPath ? {from: m.peak, to: m.trough, color: g.color, label: p.deepest} : null, markers, aria: p.journey(s)}).table;
  $('p6bans').innerHTML = `<div class="bans">${ban(L.fullRet, pct(m.ret), L.money(fmtN(1000 * s.normal[LAST] / 100)), g.color)}${ban(p.largestFall, pct(m.dd), fdate(DATES[m.peak], false) + ' → ' + fdate(DATES[m.trough], false))}${ban(p.peakToTrough, L.days(m.ddDays), p.calendarDays)}${ban(L.regained, rec ? fdate(DATES[m.recovery]) : L.notRecovered, rec ? L.afterTrough(m.recDays) : L.through)}</div>`;
  TABLES.uw = lineChart($('uw'), {series: [{id: 'uw', name: p.drawdown, color: g.color, values: underwater(s.close)}], scaleAll: true, baseline: 0, area: true, height: 170, left: 50, yFmt: v => fmtN(v, 0) + '%', tipFmt: v => pct(v, 1), aria: p.uw}).table;
}
function p6s(shelf) {
  shelf.innerHTML = companyCard() + card(L.p6.cases, btnList('case', CASE_TICKERS.map((t, k) => [t, STOCKS[t].name + ' · ' + L.p6.caseLabels[k]]), S.company)) + card(L.p6.view, chk('fullPath', L.p6.fullPath, S.fullPath));
  bindCompany(shelf); bindBtnList(shelf, 'case', v => { S.company = v; render(); }); bindChk(shelf, 'fullPath', v => { S.fullPath = v; renderCanvas(); });
}

/* ---------------------------------------------------------------- story point 8 · looking back */
function p7c(canvas) {
  const s = STOCKS[S.company], g = s.theme, sorted = [...g.stocks].sort((a, b) => b.stats.ret - a.stats.ret), p = L.p7;
  canvas.innerHTML = textObj(p.head, p.text)
    + THEMES.map(t => themeTile(t, p.msgs[t.id][0], p.msgs[t.id][1]())).join('')
    + sheet({id: 'db', title: p.db, sub: p.dbSub, span: 7})
    + sheet({id: 'corr7', title: p.corr, sub: p.corrSub, span: 5, noTable: true})
    + sheet({id: 'recap', title: p.recap(s), span: 12, noTable: true});
  TABLES.db = dumbbell($('db'), {rows: THEMES.map(t => ({name: t.name, color: t.color, mean: t.mean, median: t.median, n: t.stocks.length, gainers: t.gainers}))}).table;
  $('corr7').innerHTML = `<div class="bans two">${ban(p.cAvg, coef(C.cross), p.cAvgSub)}${ban(p.cGroup, coef(C.group), p.cGroupSub)}</div><p class="note">${esc(p.corrNote(coef(C.min.r), coef(C.max.r)))}</p>`;
  $('recap').innerHTML = `<div class="bans four">${ban(L.fullRet, pct(s.stats.ret), L.moneyShort(fmtN(1000 * s.normal[LAST] / 100)), g.color)}${ban(p.maxDD, pct(s.stats.dd), fdate(DATES[s.stats.peak], false) + ' → ' + fdate(DATES[s.stats.trough], false))}${ban(p.rank, (sorted.indexOf(s) + 1) + ' / ' + sorted.length, g.name)}${ban(p.regainedIts, s.stats.recovery >= 0 ? fdate(DATES[s.stats.recovery]) : L.notRecovered, s.stats.recovery >= 0 ? L.afterTrough(s.stats.recDays) : L.through)}</div><blockquote>${esc(p.quote)}</blockquote>`;
}
function p7s(shelf) {
  shelf.innerHTML = companyCard() + card(L.p7.another, `<div class="btn-list"><button id="restart">${esc(L.p7.back)}</button></div>`);
  bindCompany(shelf); shelf.querySelector('#restart').addEventListener('click', () => go(1));
}

/* ---------------------------------------------------------------- story navigator & rendering */
const POINTS = [
  {canvas: p0c, shelf: p0s}, {canvas: p1c, shelf: p1s}, {canvas: p2c, shelf: p2s}, {canvas: p3c, shelf: p3s},
  {canvas: p4c, shelf: p4s}, {canvas: p5c, shelf: p5s}, {canvas: p6c, shelf: p6s}, {canvas: p7c, shelf: p7s}
];
function renderNav() {
  const ol = $('points');
  ol.innerHTML = POINTS.map((p, k) => `<li><button class="sp${k + 1 === S.point ? ' active' : ''}" data-p="${k + 1}"${k + 1 === S.point ? ' aria-current="step"' : ''}><span class="n">${k + 1} / ${POINTS.length}</span><span class="cap">${esc(L.caps[k])}</span></button></li>`).join('');
  ol.querySelectorAll('.sp').forEach(b => b.addEventListener('click', () => go(+b.dataset.p)));
  $('prev').disabled = S.point === 1; $('next').disabled = S.point === POINTS.length;
}
function bindTables() {
  document.querySelectorAll('.tbl-btn').forEach(btn => {
    const id = btn.dataset.table;
    const draw = () => { const t = TABLES[id], box = $(id + '-table'); if (!t || !box) return; const open = S.tables.has(id); btn.setAttribute('aria-pressed', open); box.hidden = !open; box.innerHTML = open ? `<table class="dt"><thead><tr>${t.columns.map(c => `<th>${esc(c)}</th>`).join('')}</tr></thead><tbody>${t.rows.map(r => `<tr>${r.map(c => `<td>${esc(c)}</td>`).join('')}</tr>`).join('')}</tbody></table>` : ''; };
    btn.addEventListener('click', () => { if (S.tables.has(id)) S.tables.delete(id); else S.tables.add(id); draw(); });
    draw();
  });
}
function renderCanvas() { hideTip(); POINTS[S.point - 1].canvas($('canvas')); bindTables(); }
function render() {
  hideTip(); renderNav();
  POINTS[S.point - 1].shelf($('shelf'));
  renderCanvas();
  $('following').textContent = STOCKS[S.company].name + ' (' + S.company + ')';
}
function go(p) {
  S.point = Math.max(1, Math.min(POINTS.length, p));
  history.replaceState(null, '', location.search + '#' + S.point);
  render();
  const top = document.querySelector('.story-nav').getBoundingClientRect().top;
  if (top < 0) window.scrollTo({top: 0});
}
$('prev').addEventListener('click', () => go(S.point - 1));
$('next').addEventListener('click', () => go(S.point + 1));
$('lang').querySelectorAll('button').forEach(b => b.addEventListener('click', () => { if (b.dataset.lang !== LANG) { applyLang(b.dataset.lang); render(); } }));
document.addEventListener('keydown', e => {
  if (['INPUT', 'SELECT', 'TEXTAREA'].includes(e.target.tagName)) return;
  if (e.key === 'ArrowRight') go(S.point + 1); else if (e.key === 'ArrowLeft') go(S.point - 1);
});
window.addEventListener('hashchange', () => { const p = parseInt(location.hash.slice(1), 10); if (p >= 1 && p <= POINTS.length && p !== S.point) { S.point = p; render(); } });
let resizeTimer;
window.addEventListener('resize', () => { clearTimeout(resizeTimer); resizeTimer = setTimeout(renderCanvas, 150); });
applyLang(initialLang());
render();
