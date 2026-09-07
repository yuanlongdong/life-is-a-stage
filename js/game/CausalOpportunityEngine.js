/**
 * 人生机会引擎 v1.0
 *
 * 目标：把“过去的选择”从静态记录升级为未来机会池的动态权重。
 * 规则层只负责计算机会倾向；具体事件仍由原 EventEngine 决定。
 * 不直接生成事件、不覆盖旧事件系统。
 */
(function () {
  const DEFAULTS = {
    career: 1,
    startup: 1,
    sideHustle: 1,
    academic: 1,
    family: 1,
    health: 1,
    investment: 1,
    relocation: 1
  };

  function number(value, fallback) {
    const n = Number(value);
    return Number.isFinite(n) ? n : (fallback || 0);
  }

  function clamp(value, min, max) {
    return Math.max(min, Math.min(max, value));
  }

  function ensure(player) {
    if (!player._v1Opportunity) {
      player._v1Opportunity = {
        weights: Object.assign({}, DEFAULTS),
        history: [],
        months: 0
      };
    }
    return player._v1Opportunity;
  }

  function hasRoute(player, key) {
    return !!(player.lifeRoutes && player.lifeRoutes[key]);
  }

  function calculate(player) {
    const state = ensure(player);
    const p = player._v1Progression || {};
    const pressure = clamp(number(p.financialPressure), 0, 1);
    const mobility = clamp(number(p.careerMobility, 1), 0.45, 1.15);
    const skills = player.skillLevels || {};
    const skillScore = Object.values(skills).reduce((sum, value) => sum + number(value), 0);
    const knowledge = number(player.knowledge);

    const w = Object.assign({}, DEFAULTS);

    // 财务压力改变的是“机会结构”，而不是直接扣钱。
    w.career *= mobility;
    w.startup *= clamp(1 - pressure * 0.65, 0.25, 1.2);
    w.relocation *= clamp(1 - pressure * 0.55, 0.3, 1.15);
    w.investment *= clamp(1 - pressure * 0.45, 0.4, 1.2);

    // 已经投入的路线会形成路径依赖，但保留重新选择的空间。
    if (hasRoute(player, 'startup_path')) w.startup *= 1.45;
    if (hasRoute(player, 'side_hustle_path')) w.sideHustle *= 1.35;
    if (hasRoute(player, 'academic_career')) w.academic *= 1.35;
    if (hasRoute(player, 'family_path')) w.family *= 1.3;
    if (hasRoute(player, 'health_first')) w.health *= 1.35;

    w.academic *= clamp(1 + skillScore * 0.015 + Math.max(0, knowledge - 50) * 0.003, 1, 1.6);
    w.career *= clamp(1 + skillScore * 0.01, 1, 1.5);
    w.health *= clamp(1 + number(player.health) < 50 ? 0.15 : 0, 1, 1.15);
    w.family *= clamp(1 + number(player.happiness) < 45 ? 0.1 : 0, 1, 1.1);

    Object.keys(w).forEach(key => {
      w[key] = Number(clamp(w[key], 0.1, 3).toFixed(3));
    });

    state.weights = w;
    return w;
  }

  function tick(player) {
    if (!player) return null;
    const state = ensure(player);
    state.months = number(state.months) + 1;
    const weights = calculate(player);
    state.history.push({
      month: state.months,
      weights: Object.assign({}, weights)
    });
    if (state.history.length > 24) state.history.shift();
    return weights;
  }

  function get(player, type) {
    const weights = calculate(player);
    return type ? number(weights[type], 1) : Object.assign({}, weights);
  }

  window.CausalOpportunityEngine = {
    ensure,
    calculate,
    tick,
    get,
    version: '1.0.0'
  };
})();
