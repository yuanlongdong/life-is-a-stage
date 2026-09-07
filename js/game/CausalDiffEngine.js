/**
 * A/B 因果差异引擎 v1.0
 * 不只比较最终数字，而是回答：哪个选择先改变了什么，随后又导致了什么。
 */
(function () {
  function clone(value) {
    if (value === undefined || value === null) return value;
    try { return JSON.parse(JSON.stringify(value)); } catch (_) { return null; }
  }

  function number(value) {
    const n = Number(value);
    return Number.isFinite(n) ? n : 0;
  }

  function metricDelta(original, parallel) {
    const keys = ['netWorth', 'monthlyIncome', 'salary', 'savings', 'investments', 'debt', 'happiness', 'health'];
    const labels = {
      netWorth: '净资产', monthlyIncome: '月收入', salary: '工资', savings: '储蓄',
      investments: '投资', debt: '负债', happiness: '幸福度', health: '健康'
    };
    return keys.map(key => ({
      key,
      label: labels[key],
      delta: number(parallel && parallel[key]) - number(original && original[key])
    })).filter(item => item.delta !== 0);
  }

  function timelineEntries(snapshot) {
    return snapshot && Array.isArray(snapshot.entries) ? snapshot.entries : [];
  }

  function meaningfulEntries(snapshot) {
    return timelineEntries(snapshot).filter(item => item && (item.type === 'decision' || item.type === 'ending' || item.importance === 'major'));
  }

  function firstDivergence(originalTimeline, parallelTimeline, decisionAge) {
    const a = meaningfulEntries(originalTimeline);
    const b = meaningfulEntries(parallelTimeline);
    const max = Math.max(a.length, b.length);
    for (let i = 0; i < max; i++) {
      const left = a[i];
      const right = b[i];
      const leftTitle = left && left.title ? String(left.title) : '';
      const rightTitle = right && right.title ? String(right.title) : '';
      if (leftTitle !== rightTitle || (left && right && left.type !== right.type)) {
        return {
          age: (right && right.age != null ? right.age : left && left.age) ?? decisionAge,
          original: leftTitle || '无记录',
          parallel: rightTitle || '无记录'
        };
      }
    }
    return null;
  }

  function routeChanges(original, parallel) {
    const a = new Set((original && original.routes) || []);
    const b = new Set((parallel && parallel.routes) || []);
    return {
      added: [...b].filter(x => !a.has(x)),
      removed: [...a].filter(x => !b.has(x))
    };
  }

  function buildChain(comparison, originalTimeline, parallelTimeline) {
    const changes = metricDelta(comparison.original, comparison.parallel);
    const first = firstDivergence(originalTimeline, parallelTimeline, comparison.decisionAge);
    const routes = routeChanges(comparison.original, comparison.parallel);
    const chain = [];

    chain.push(`${comparison.decisionAge}岁选择「${comparison.originalChoice}」→ 改为「${comparison.newChoice}」`);

    if (first && first.age !== comparison.decisionAge) {
      chain.push(`${first.age}岁开始出现明显人生轨迹分叉：${first.parallel}`);
    }

    const top = changes
      .slice()
      .sort((a, b) => Math.abs(b.delta) - Math.abs(a.delta))
      .slice(0, 3);
    top.forEach(item => {
      const direction = item.delta > 0 ? '上升' : '下降';
      chain.push(`${item.label}${direction} ${Math.abs(Math.round(item.delta)).toLocaleString()}`);
    });

    if (routes.added.length) chain.push(`新形成路线：${routes.added.join('、')}`);
    if (routes.removed.length) chain.push(`原路线减弱或消失：${routes.removed.join('、')}`);

    return chain;
  }

  function analyze(comparison, originalTimeline, parallelTimeline) {
    if (!comparison) return null;
    const metrics = metricDelta(comparison.original, comparison.parallel);
    const first = firstDivergence(originalTimeline, parallelTimeline, comparison.decisionAge);
    const routes = routeChanges(comparison.original, comparison.parallel);
    return {
      version: '1.0.0',
      decision: {
        age: comparison.decisionAge,
        original: comparison.originalChoice,
        alternative: comparison.newChoice
      },
      firstDivergence: first,
      metricChanges: metrics,
      routeChanges: routes,
      causalChain: buildChain(comparison, originalTimeline, parallelTimeline),
      headline: first
        ? `真正的分叉点出现在${first.age}岁，而不是选择发生的当天。`
        : '两条人生的主要差异尚未形成明显的时间线分叉。'
    };
  }

  window.CausalDiffEngine = { analyze, version: '1.0.0' };
})();
