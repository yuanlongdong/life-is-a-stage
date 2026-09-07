/**
 * 因果事件路由器 v1.1
 *
 * 将机会权重真正接入“随机事件抽样”：
 * 基础触发率 × 类别机会权重 -> 本月是否发生随机事件；
 * 事件基础 probability × 类别机会权重 -> 事件池内部抽样权重。
 *
 * 关键年龄人生岔路、里程碑事件仍由 GameState 原逻辑优先处理。
 * 旧事件的 triggerCondition / effects / choices 不被修改。
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

  function eligible(event, player) {
    if (!event || !player) return false;
    const cond = event.triggerCondition;
    if (!cond) return true;
    if (cond.minAge && player.age < cond.minAge) return false;
    if (cond.maxAge && player.age > cond.maxAge) return false;
    if (cond.minCareerLevel && player.careerLevel < cond.minCareerLevel) return false;
    if (cond.minNetwork && player.network < cond.minNetwork) return false;
    if (cond.minSavings && player.savings < cond.minSavings) return false;
    if (cond.minInvestment && player.investments < cond.minInvestment) return false;
    if (cond.minSalary && player.salary < cond.minSalary) return false;
    if (cond.maxHealth && player.health > cond.maxHealth) return false;
    if (cond.isMarried !== undefined && cond.isMarried !== player.isMarried) return false;
    return true;
  }

  function weightedPick(state, events) {
    if (!events.length) return null;
    const weighted = events.map(event => ({
      event,
      weight: Math.max(0.001, number(event.probability, 0.1) * getWeight(state, event))
    }));
    const total = weighted.reduce((sum, item) => sum + item.weight, 0);
    let rand = Math.random() * total;
    for (const item of weighted) {
      rand -= item.weight;
      if (rand <= 0) return item.event;
    }
    return weighted[weighted.length - 1].event;
  }

  function randomEvent(state) {
    if (typeof EVENTS === 'undefined' || !Array.isArray(EVENTS)) return null;
    const player = state.player;
    const eligibleEvents = EVENTS.filter(event => eligible(event, player));
    if (!eligibleEvents.length) return null;

    // 基础30%不是固定概率：机会结构可以让它下降，也可以上升。
    // 上限75%，避免单一路线让随机事件失控。
    const averageWeight = eligibleEvents.reduce((sum, event) => sum + getWeight(state, event), 0) / eligibleEvents.length;
    const triggerProbability = clamp(0.30 * averageWeight, 0.08, 0.75);
    if (Math.random() >= triggerProbability) {
      mark(state, null, averageWeight, false);
      return null;
    }

    const event = weightedPick(state, eligibleEvents);
    if (event) mark(state, event, getWeight(state, event), true);
    return event;
  }

  function install() {
    if (typeof GameState === 'undefined' || GameState.prototype.__causalEventRouterInstalled) return;
    const originalCheckForEvent = GameState.prototype.checkForEvent;

    GameState.prototype.checkForEvent = function () {
      const player = this.player;
      if (!player || !window.CausalOpportunityEngine) {
        return originalCheckForEvent.call(this);
      }

      window.CausalOpportunityEngine.tick(player, {
        age: player.age,
        month: this.currentMonth,
        year: this.currentYear
      });

      // 先让旧系统处理关键年龄和里程碑，保持原有游戏节奏。
      const lifeChoice = typeof LIFE_CHOICES !== 'undefined' ? LIFE_CHOICES[player.age] : null;
      if (lifeChoice && this.currentMonth === 1 && !player.lifeChoices[player.age]) return lifeChoice;

      const milestone = typeof MILESTONE_EVENTS !== 'undefined' ? MILESTONE_EVENTS[player.age] : null;
      if (milestone && this.currentMonth === 1) {
        const triggered = player.eventLog.some(log => log.text && log.text.includes(milestone[0].name));
        if (!triggered) return milestone[0];
      }

      // 随机事件完全由因果机会层负责抽样；事件定义本身不变。
      return randomEvent(this);
    };

    GameState.prototype.__causalEventRouterInstalled = true;
  }

  window.CausalEventRouter = {
    install,
    getWeight,
    eligible,
    weightedPick,
    randomEvent,
    version: '1.1.0'
  };

  install();
})();
