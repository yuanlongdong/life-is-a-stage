/**
 * 人生因果引擎 v1.0
 *
 * 目标：把“选择 -> 数值变化”升级为
 * “选择 -> 行为 -> 状态 -> 持续影响 -> 后续机会 -> 延迟结果”。
 *
 * 本模块先以旁路方式接入旧系统，避免一次重写 GameState。
 */
class CausalEngine {
  constructor(player) {
    this.player = player;
    this.activeConsequences = [];
    this.causalLog = [];
    this.sequence = 0;
  }

  setPlayer(player) {
    this.player = player;
  }

  recordDecision(decision) {
    if (!decision) return null;
    const record = {
      id: `decision_${++this.sequence}`,
      type: 'decision',
      age: this.player ? this.player.age : null,
      month: this.player && this.player.monthlyHistory ? this.player.monthlyHistory.length : 0,
      decisionId: decision.id || null,
      text: decision.text || decision.name || '',
      category: decision.category || 'life',
      timestamp: Date.now()
    };
    this.causalLog.push(record);
    return record;
  }

  recordEffects(source, effects) {
    if (!effects || typeof effects !== 'object') return null;
    const changes = Object.entries(effects).map(([key, value]) => ({ key, value }));
    const record = {
      id: `effect_${++this.sequence}`,
      type: 'effect',
      age: this.player ? this.player.age : null,
      source: source || 'unknown',
      changes,
      timestamp: Date.now()
    };
    this.causalLog.push(record);
    return record;
  }

  addConsequence(consequence) {
    if (!consequence || !consequence.id) return false;
    this.activeConsequences.push({
      id: consequence.id,
      sourceDecisionId: consequence.sourceDecisionId || null,
      startAge: consequence.startAge ?? (this.player ? this.player.age : 0),
      durationMonths: consequence.durationMonths ?? null,
      mode: consequence.mode || 'periodic',
      tags: Array.isArray(consequence.tags) ? [...consequence.tags] : [],
      condition: consequence.condition || null,
      effect: consequence.effect || null,
      metadata: consequence.metadata || {},
      appliedCount: 0
    });
    return true;
  }

  tick() {
    if (!this.player) return [];
    const applied = [];

    this.activeConsequences = this.activeConsequences.filter(consequence => {
      // durationMonths 表示剩余可生效月数；0 表示本月不再生效。
      if (consequence.durationMonths !== null && consequence.durationMonths <= 0) {
        return false;
      }

      if (typeof consequence.condition === 'function' && !consequence.condition(this.player)) {
        return true;
      }

      if (typeof consequence.effect === 'function') {
        const result = consequence.effect(this.player, this);
        consequence.appliedCount += 1;
        if (result) {
          applied.push({ id: consequence.id, result, appliedCount: consequence.appliedCount });
        }
      }

      // once：满足条件并执行一次后立即移除。
      if (consequence.mode === 'once') {
        return false;
      }

      if (consequence.durationMonths !== null) {
        consequence.durationMonths -= 1;
      }

      return consequence.durationMonths === null || consequence.durationMonths > 0;
    });

    if (applied.length > 0) {
      applied.forEach(item => {
        this.causalLog.push({
          id: `consequence_${++this.sequence}`,
          type: 'consequence_applied',
          consequenceId: item.id,
          age: this.player ? this.player.age : null,
          appliedCount: item.appliedCount,
          timestamp: Date.now()
        });
      });
    }

    return applied;
  }

  getActiveConsequences() {
    return this.activeConsequences.map(item => ({
      ...item,
      tags: [...item.tags]
    }));
  }

  getLog() {
    return [...this.causalLog];
  }

  snapshot() {
    return {
      activeConsequences: this.getActiveConsequences(),
      causalLog: this.getLog()
    };
  }
}

window.CausalEngine = CausalEngine;
