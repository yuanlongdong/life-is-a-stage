/**
 * A/B 因果差异引擎 v2.0
 *
 * 目标不是只告诉玩家“最后差了多少钱”，而是尽可能回答：
 * 哪个选择改变了什么 → 哪个状态先发生变化 → 哪种机会结构随后变化 → 最终造成什么结果。
 *
 * 兼容旧版 comparison / timeline 数据；缺少历史数据时自动降级。
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

  function firstTimelineDivergence(originalTimeline, parallelTimeline, decisionAge) {
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

  function monthlyHistory(player) {
    return player && Array.isArray(player.monthlyHistory) ? player.monthlyHistory : [];
  }

  function firstNumericHistoryDivergence(originalPlayer, parallelPlayer, decisionAge) {
    const a = monthlyHistory(originalPlayer);
    const b = monthlyHistory(parallelPlayer);
    const max = Math.max(a.length, b.length);
    const keys = ['balance', 'income', 'expense', 'netWorth', 'savings', 'debt', 'health', 'happiness'];
    for (let i = 0; i < max; i++) {
      const left = a[i] || {};
      const right = b[i] || {};
      const different = keys.some(key => number(left[key]) !== number(right[key]));
      if (different) {
        return {
          index: i,
          age: number(right.age || left.age || decisionAge),
          month: number(right.month || left.month),
          original: clone(left),
          parallel: clone(right),
          changedMetrics: keys.filter(key => number(left[key]) !== number(right[key]))
        };
      }
    }
    return null;
  }

  function opportunityHistory(player) {
    return player && player._v1Opportunity && Array.isArray(player._v1Opportunity.history)
      ? player._v1Opportunity.history
      : [];
  }

  function firstOpportunityDivergence(originalPlayer, parallelPlayer) {
    const a = opportunityHistory(originalPlayer);
    const b = opportunityHistory(parallelPlayer);
    const max = Math.min(Math.max(a.length, b.length), 24);
    const keys = ['career', 'startup', 'sideHustle', 'academic', 'family', 'health', 'investment', 'relocation'];
    for (let i = 0; i < max; i++) {
      const left = a[i] || {};
      const right = b[i] || {};
      const lw = left.weights || {};
      const rw = right.weights || {};
      const changed = keys.filter(key => number(lw[key]) !== number(rw[key]));
      if (changed.length) {
        return {
          age: right.age != null ? right.age : left.age,
          month: right.calendarMonth != null ? right.calendarMonth : left.calendarMonth,
          changed,
          original: clone(lw),
          parallel: clone(rw)
        };
      }
    }
    return null;
  }

  function causalLogDivergence(originalSnapshot, parallelSnapshot) {
    const a = originalSnapshot && Array.isArray(originalSnapshot.causalLog) ? originalSnapshot.causalLog : [];
    const b = parallelSnapshot && Array.isArray(parallelSnapshot.causalLog) ? parallelSnapshot.causalLog : [];
    const max = Math.max(a.length, b.length);
    for (let i = 0; i < max; i++) {
      const left = a[i];
      const right = b[i];
      const leftText = left ? JSON.stringify({ source: left.source, type: left.type, metadata: left.metadata }) : '';
      const rightText = right ? JSON.stringify({ source: right.source, type: right.type, metadata: right.metadata }) : '';
      if (leftText !== rightText) {
        return { index: i, original: clone(left), parallel: clone(right) };
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

  function buildChain(comparison, details) {
    const changes = metricDelta(comparison.original, comparison.parallel);
    const chain = [];
    chain.push(`${comparison.decisionAge}岁选择「${comparison.originalChoice}」→ 改为「${comparison.newChoice}」`);

    if (details.firstNumeric) {
      const labels = details.firstNumeric.changedMetrics.join('、');
      chain.push(`${details.firstNumeric.age}岁左右首先出现状态差异：${labels}`);
    }

    if (details.firstOpportunity) {
      const changed = details.firstOpportunity.changed.join('、');
      chain.push(`随后机会结构发生变化：${changed}`);
    }

    if (details.firstTimeline && details.firstTimeline.age !== comparison.decisionAge) {
      chain.push(`${details.firstTimeline.age}岁开始出现明显人生轨迹分叉：${details.firstTimeline.parallel}`);
    }

    changes.slice().sort((a, b) => Math.abs(b.delta) - Math.abs(a.delta)).slice(0, 3).forEach(item => {
      const direction = item.delta > 0 ? '上升' : '下降';
      chain.push(`${item.label}${direction} ${Math.abs(Math.round(item.delta)).toLocaleString()}`);
    });

    const routes = routeChanges(comparison.original, comparison.parallel);
    if (routes.added.length) chain.push(`新形成路线：${routes.added.join('、')}`);
    if (routes.removed.length) chain.push(`原路线减弱或消失：${routes.removed.join('、')}`);
    return chain;
  }

  function analyze(comparison, originalTimeline, parallelTimeline, originalCausal, parallelCausal) {
    if (!comparison) return null;

    const originalPlayer = comparison.originalPlayer || (comparison.original && comparison.original.player) || null;
    const parallelPlayer = comparison.parallelPlayer || (comparison.parallel && comparison.parallel.player) || null;
    const firstTimeline = firstTimelineDivergence(originalTimeline, parallelTimeline, comparison.decisionAge);
    const firstNumeric = firstNumericHistoryDivergence(originalPlayer, parallelPlayer, comparison.decisionAge);
    const firstOpportunity = firstOpportunityDivergence(originalPlayer, parallelPlayer);
    const causalDivergence = causalLogDivergence(originalCausal, parallelCausal);
    const details = { firstTimeline, firstNumeric, firstOpportunity, causalDivergence };

    return {
      version: '2.0.0',
      decision: {
        age: comparison.decisionAge,
        original: comparison.originalChoice,
        alternative: comparison.newChoice
      },
      firstDivergence: firstNumeric || firstOpportunity || firstTimeline,
      firstStateDivergence: firstNumeric,
      firstOpportunityDivergence: firstOpportunity,
      firstTimelineDivergence: firstTimeline,
      causalLogDivergence: causalDivergence,
      metricChanges: metricDelta(comparison.original, comparison.parallel),
      routeChanges: routeChanges(comparison.original, comparison.parallel),
      causalChain: buildChain(comparison, details),
      headline: firstNumeric
        ? `两条人生最早的可观测状态分叉出现在${firstNumeric.age}岁左右。`
        : firstOpportunity
          ? `两条人生首先在机会结构上产生了差异。`
          : firstTimeline
            ? `两条人生的时间线开始出现明显分叉。`
            : '两条人生的主要差异尚未形成明显分叉。'
    };
  }

  window.CausalDiffEngine = { analyze, version: '2.0.0' };
})();
