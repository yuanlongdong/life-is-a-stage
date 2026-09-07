/**
 * 因果事件路由器 v1.0
 *
 * 不改变旧事件的需求条件与效果，只让“过去形成的机会结构”影响随机事件的
 * 触发概率。关键年龄人生岔路、里程碑事件仍由 GameState 原逻辑优先处理。
 *
 * 当前映射：
 * career      -> 职业
 * finance     -> investment
 * health      -> health
 * relationship-> family
 * growth      -> academic
 * accident    -> relocation（保守映射）
 */
(function () {
  const CATEGORY_MAP = {
    career: 'career',
    finance: 'investment',
    health: 'health',
    relationship: 'family',
    growth: 'academic',
    accident: 'relocation'
  };

  function number(value, fallback) {
    const n = Number(value);
    return Number.isFinite(n) ? n : (fallback || 0);
  }

  function clamp(value, min, max) {
    return Math.max(min, Math.min(max, value));
  }

  function getWeight(state, event) {
    if (!state || !state.player || !window.CausalOpportunityEngine) return 1;
    const type = CATEGORY_MAP[event && event.category];
    if (!type) return 1;
    return clamp(number(window.CausalOpportunityEngine.get(state.player, type), 1), 0.25, 2.5);
  }

  function mark(state, event, weight, triggered) {
    if (!state || !state.player) return;
    const opportunity = window.CausalOpportunityEngine && window.CausalOpportunityEngine.ensure
      ? window.CausalOpportunityEngine.ensure(state.player)
      : null;
    if (!opportunity) return;
    if (!Array.isArray(opportunity.eventLog)) opportunity.eventLog = [];
    opportunity.eventLog.push({
      age: number(state.player.age),
      month: number(state.currentMonth),
      year: number(state.currentYear),
      eventId: event && event.id,
      category: event && event.category,
      weight: Number(weight.toFixed(3)),
      triggered: !!triggered
    });
    if (opportunity.eventLog.length > 50) opportunity.eventLog.shift();
  }

  function install() {
    if (typeof GameState === 'undefined' || GameState.prototype.__causalEventRouterInstalled) return;
    const originalCheckForEvent = GameState.prototype.checkForEvent;

    GameState.prototype.checkForEvent = function () {
      const player = this.player;
      if (!player || !window.CausalOpportunityEngine) {
        return originalCheckForEvent.call(this);
      }

      // 记录本月机会结构；同一月不会重复写历史。
      const weights = window.CausalOpportunityEngine.tick(player, {
        age: player.age,
        month: this.currentMonth,
        year: this.currentYear
      });

      const event = originalCheckForEvent.call(this);
      if (!event || event.isLifeChoice || !event.category) return event;

      const weight = getWeight(this, event);

      // 原系统已经完成了基础30%抽样。这里在其结果之上施加因果权重，
      // 保持旧系统行为安全，同时让路线依赖逐渐改变事件密度。
      // weight < 1：部分事件机会被压低；weight > 1：保留原事件，不额外制造事件。
      if (weight < 1) {
        const keepProbability = clamp(weight, 0.25, 1);
        const keep = Math.random() < keepProbability;
        mark(this, event, weight, keep);
        return keep ? event : null;
      }

      mark(this, event, weight, true);
      return event;
    };

    GameState.prototype.__causalEventRouterInstalled = true;
  }

  window.CausalEventRouter = {
    install,
    getWeight,
    version: '1.0.0'
  };

  install();
})();
