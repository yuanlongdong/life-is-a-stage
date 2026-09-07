/**
 * 人生时间线 UI v1.2
 * 新增：平行人生因果解释，让A/B对比回答“为什么会变成这样”。
 */
(function () {
  function esc(value) {
    return String(value ?? '').replace(/[&<>"']/g, c => ({ '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;' }[c]));
  }

  function formatMoney(n) { return '¥' + Number(n || 0).toLocaleString(); }

  function renderTimeline(gameState) {
    const timeline = gameState && gameState.lifeTimeline;
    const player = gameState && gameState.player;
    if (!timeline || !player) return '<div class="timeline-empty">还没有记录的人生轨迹。</div>';
    const entries = timeline.getMajorMoments().slice().reverse();
    const progression = player._v1Progression || {};
    const routeNames = Object.keys(player.lifeRoutes || {}).filter(k => player.lifeRoutes[k]);
    const routeLabel = routeNames.length ? routeNames.map(esc).join(' · ') : '尚未形成明显路线';
    const items = entries.length ? entries.map((item, idx) => {
      const isDecision = item.type === 'decision';
      const hasSnapshot = item.metadata && item.metadata.stateSnapshot;
      const canParallel = isDecision && hasSnapshot;
      return `<div class="timeline-item timeline-${esc(item.importance)}"><div class="timeline-age">${item.age != null ? `${item.age}岁` : '人生'}</div><div class="timeline-dot"></div><div class="timeline-card"><div class="timeline-type">${item.type === 'decision' ? '关键选择' : item.type === 'ending' ? '人生终章' : item.type === 'event' ? '人生事件' : '人生变化'}</div><div class="timeline-title">${esc(item.title)}</div><div class="timeline-text">${esc(item.text)}</div>${canParallel ? `<button class="timeline-parallel-btn" onclick="game.showParallelChoices(${idx})">如果当时……</button>` : ''}</div></div>`;
    }).join('') : '<div class="timeline-empty">暂时还没有重大人生节点。继续生活，选择会留下痕迹。</div>';
    return `<div class="timeline-overlay" onclick="if(event.target===this) game.closeTimeline()"><div class="timeline-modal"><div class="timeline-header"><div><div class="timeline-kicker">MY LIFE</div><h2>我的这一生</h2><p>你做过的选择，以及它们留下的轨迹。点击“如果当时……”可以推演另一种人生。</p></div><button class="timeline-close" onclick="game.closeTimeline()">×</button></div><div class="timeline-summary"><div><span>职业流动性</span><strong>${Math.round((progression.careerMobility ?? 1) * 100)}%</strong></div><div><span>财务压力</span><strong>${Math.round((progression.financialPressure ?? 0) * 100)}%</strong></div><div><span>累计工资变化</span><strong>${formatMoney(progression.salaryGrowthTotal)}</strong></div></div><div class="timeline-route"><span>当前人生路线</span><strong>${routeLabel}</strong></div><div class="timeline-list" id="timeline-list">${items}</div></div></div>`;
  }

  function renderParallelChoices(gameState, timelineEntry) {
    const age = timelineEntry.age;
    const lifeChoice = typeof LIFE_CHOICES !== 'undefined' ? LIFE_CHOICES[age] : null;
    if (!lifeChoice) return '<div class="parallel-empty">找不到这个岔路的其他选项。</div>';
    const currentChoiceId = gameState.player.lifeChoices[age];
    const otherChoices = lifeChoice.choices.filter(c => c.id !== currentChoiceId);
    const choicesHtml = otherChoices.map(c => `<button class="parallel-choice-btn" onclick="game.startParallelLife('${timelineEntry.id || age}', '${c.id}')"><div class="parallel-choice-title">${esc(c.shortName || c.text)}</div><div class="parallel-choice-desc">${esc(c.description || c.resultText || '')}</div></button>`).join('');
    return `<div class="timeline-overlay" onclick="if(event.target===this) game.closeParallelChoices()"><div class="parallel-modal"><div class="parallel-header"><div><div class="timeline-kicker">WHAT IF</div><h2>如果当时……</h2><p>${age}岁那年，你选择了「${esc(timelineEntry.title)}」。如果换一个选择呢？</p></div><button class="timeline-close" onclick="game.closeParallelChoices()">×</button></div><div class="parallel-choices">${choicesHtml || '<div class="parallel-empty">没有其他可选方案。</div>'}</div><div class="parallel-hint">选择后将从${age}岁开始快速模拟，看看另一种人生会怎样。</div></div></div>`;
  }

  function renderComparison(comparison) {
    const o = comparison.original;
    const p = comparison.parallel;
    const d = comparison.differences;
    const causal = comparison.causalDiff || {};
    function diffClass(val) { return val > 0 ? 'diff-positive' : val < 0 ? 'diff-negative' : 'diff-neutral'; }
    function diffText(val, prefix = '') { return val > 0 ? `+${prefix}${Math.abs(val).toLocaleString()}` : val < 0 ? `-${prefix}${Math.abs(val).toLocaleString()}` : '持平'; }
    const chain = Array.isArray(causal.causalChain) ? causal.causalChain : [];
    const chainHtml = chain.length ? `<div class="comparison-causal"><div class="comparison-causal-label">为什么人生会变成这样</div><div class="comparison-causal-headline">${esc(causal.headline || '')}</div><div class="comparison-causal-chain">${chain.map((step, i) => `<div class="comparison-causal-step"><span>${i + 1}</span><div>${esc(step)}</div></div>`).join('')}</div></div>` : '';
    const divergence = causal.firstDivergence;
    const divergenceHtml = divergence ? `<div class="comparison-divergence">第一处明显分叉：<strong>${esc(divergence.age)}岁</strong> · B人生出现「${esc(divergence.parallel)}」</div>` : '';

    return `<div class="timeline-overlay" onclick="if(event.target===this) game.closeComparison()"><div class="comparison-modal"><div class="comparison-header"><div><div class="timeline-kicker">PARALLEL LIFE</div><h2>A人生 vs B人生</h2><p>${comparison.decisionAge}岁的那个选择，改变了什么？</p></div><button class="timeline-close" onclick="game.closeComparison()">×</button></div><div class="comparison-vs"><div class="comparison-side comparison-a"><div class="comparison-label">A · 你的人生</div><div class="comparison-choice">选择了「${esc(comparison.originalChoice)}」</div></div><div class="comparison-vs-text">VS</div><div class="comparison-side comparison-b"><div class="comparison-label">B · 平行人生</div><div class="comparison-choice">选择了「${esc(comparison.newChoice)}」</div></div></div>${divergenceHtml}${chainHtml}<div class="comparison-table">
      <div class="comparison-row"><div class="comparison-label-col">净资产</div><div class="comparison-val">${formatMoney(o.netWorth)}</div><div class="comparison-diff ${diffClass(d.netWorth)}">${diffText(d.netWorth, '¥')}</div><div class="comparison-val">${formatMoney(p.netWorth)}</div></div>
      <div class="comparison-row"><div class="comparison-label-col">月收入</div><div class="comparison-val">${formatMoney(o.monthlyIncome)}</div><div class="comparison-diff ${diffClass(d.monthlyIncome)}">${diffText(d.monthlyIncome, '¥')}</div><div class="comparison-val">${formatMoney(p.monthlyIncome)}</div></div>
      <div class="comparison-row"><div class="comparison-label-col">工资</div><div class="comparison-val">${formatMoney(o.salary)}</div><div class="comparison-diff ${diffClass(d.salary)}">${diffText(d.salary, '¥')}</div><div class="comparison-val">${formatMoney(p.salary)}</div></div>
      <div class="comparison-row"><div class="comparison-label-col">储蓄</div><div class="comparison-val">${formatMoney(o.savings)}</div><div class="comparison-diff ${diffClass(d.savings)}">${diffText(d.savings, '¥')}</div><div class="comparison-val">${formatMoney(p.savings)}</div></div>
      <div class="comparison-row"><div class="comparison-label-col">投资</div><div class="comparison-val">${formatMoney(o.investments)}</div><div class="comparison-diff ${diffClass(d.investments)}">${diffText(d.investments, '¥')}</div><div class="comparison-val">${formatMoney(p.investments)}</div></div>
      <div class="comparison-row"><div class="comparison-label-col">负债</div><div class="comparison-val">${formatMoney(o.debt)}</div><div class="comparison-diff ${diffClass(d.debt)}">${d.debt > 0 ? '少欠' + formatMoney(d.debt) : d.debt < 0 ? '多欠' + formatMoney(Math.abs(d.debt)) : '持平'}</div><div class="comparison-val">${formatMoney(p.debt)}</div></div>
      <div class="comparison-row"><div class="comparison-label-col">幸福度</div><div class="comparison-val">${Math.round(o.happiness)}</div><div class="comparison-diff ${diffClass(d.happiness)}">${diffText(d.happiness)}</div><div class="comparison-val">${Math.round(p.happiness)}</div></div>
      <div class="comparison-row"><div class="comparison-label-col">健康</div><div class="comparison-val">${Math.round(o.health)}</div><div class="comparison-diff ${diffClass(d.health)}">${diffText(d.health)}</div><div class="comparison-val">${Math.round(p.health)}</div></div>
      <div class="comparison-row"><div class="comparison-label-col">人生路线</div><div class="comparison-val comparison-routes">${o.routes.map(esc).join(' · ') || '无'}</div><div class="comparison-diff"></div><div class="comparison-val comparison-routes">${p.routes.map(esc).join(' · ') || '无'}</div></div>
    </div>${p.ending ? `<div class="comparison-ending"><div class="comparison-ending-label">B人生结局</div><div class="comparison-ending-name">${esc(p.ending.name || '')}</div><div class="comparison-ending-desc">${esc(p.ending.description || '')}</div></div>` : ''}<div class="comparison-actions"><button class="comparison-btn comparison-btn-secondary" onclick="game.closeComparison()">回到我的人生</button><button class="comparison-btn comparison-btn-primary" onclick="game.continueFromParallel()">以B人生继续</button></div><div class="comparison-footer">模拟了${p.monthsSimulated}个月，从${comparison.decisionAge}岁到${p.age}岁</div></div></div>`;
  }

  function renderSimulating() {
    return `<div class="timeline-overlay"><div class="simulating-modal"><div class="simulating-icon">🔀</div><div class="simulating-text">正在推演另一种人生……</div><div class="simulating-sub">从那个关键节点开始，快速模拟到现在</div><div class="simulating-spinner"></div></div></div>`;
  }

  window.LifeTimelineUI = { render: renderTimeline, renderParallelChoices, renderComparison, renderSimulating };
})();
