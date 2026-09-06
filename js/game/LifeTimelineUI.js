/**
 * 人生时间线 UI
 * 独立于旧 UIManager，作为 v1 渐进式接入层。
 */
(function () {
  function esc(value) {
    return String(value ?? '').replace(/[&<>"']/g, c => ({ '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;' }[c]));
  }

  function renderTimeline(gameState) {
    const timeline = gameState && gameState.lifeTimeline;
    const player = gameState && gameState.player;
    if (!timeline || !player) return '<div class="timeline-empty">还没有记录的人生轨迹。</div>';

    const entries = timeline.getMajorMoments().slice().reverse();
    const progression = player._v1Progression || {};
    const routeNames = Object.keys(player.lifeRoutes || {}).filter(k => player.lifeRoutes[k]);
    const routeLabel = routeNames.length ? routeNames.map(esc).join(' · ') : '尚未形成明显路线';

    const items = entries.length ? entries.map(item => `
      <div class="timeline-item timeline-${esc(item.importance)}">
        <div class="timeline-age">${item.age != null ? `${item.age}岁` : '人生'}</div>
        <div class="timeline-dot"></div>
        <div class="timeline-card">
          <div class="timeline-type">${item.type === 'decision' ? '关键选择' : item.type === 'ending' ? '人生终章' : item.type === 'event' ? '人生事件' : '人生变化'}</div>
          <div class="timeline-title">${esc(item.title)}</div>
          <div class="timeline-text">${esc(item.text)}</div>
        </div>
      </div>
    `).join('') : '<div class="timeline-empty">暂时还没有重大人生节点。继续生活，选择会留下痕迹。</div>';

    return `
      <div class="timeline-overlay" onclick="if(event.target===this) game.closeTimeline()">
        <div class="timeline-modal">
          <div class="timeline-header">
            <div><div class="timeline-kicker">MY LIFE</div><h2>我的这一生</h2><p>你做过的选择，以及它们留下的轨迹。</p></div>
            <button class="timeline-close" onclick="game.closeTimeline()">×</button>
          </div>
          <div class="timeline-summary">
            <div><span>职业流动性</span><strong>${Math.round((progression.careerMobility ?? 1) * 100)}%</strong></div>
            <div><span>财务压力</span><strong>${Math.round((progression.financialPressure ?? 0) * 100)}%</strong></div>
            <div><span>累计工资变化</span><strong>¥${Number(progression.salaryGrowthTotal || 0).toLocaleString()}</strong></div>
          </div>
          <div class="timeline-route"><span>当前人生路线</span><strong>${routeLabel}</strong></div>
          <div class="timeline-list">${items}</div>
        </div>
      </div>
    `;
  }

  window.LifeTimelineUI = { render: renderTimeline };
})();
