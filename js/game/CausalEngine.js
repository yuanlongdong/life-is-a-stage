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
      tags: Array.isArray(consequence.tags) ? [...consequence.tags] : [],
      condition: consequence.condition || null,
      effect: consequence.effect || null,
      metadata: consequence.metadata || {}
    });
    return true;
  }

  tick() {
    if (!this.player) return [];
    const applied = [];
    this.activeConsequences = this.activeConsequences.filter(consequence => {
      if (consequence.durationMonths !== null) {
        consequence.durationMonths -= 1;
        if (consequence.durationMonths < 0) return false;
      }

      if (typeof consequence.condition === 'function' && !consequence.condition(this.player)) {
        return true;
      }

      if (typeof consequence.effect === 'function') {
        const result = consequence.effect(this.player, this);
        if (result) applied.push({ id: consequence.id, result });
      }
      return true;
    });
    return applied;
  }

  getActiveConsequences() {
    return this.activeConsequences.map(item => ({ ...item, tags: [...item.tags] }));
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
