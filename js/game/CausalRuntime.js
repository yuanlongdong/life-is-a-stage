/**
 * 因果运行时 v1.0
 * 将“选择产生的长期状态”正式接入每月模拟，但保持对旧系统的兼容。
 */
(function () {
  function number(value, fallback) {
    const n = Number(value);
    return Number.isFinite(n) ? n : (fallback || 0);
  }

  function clamp(value, min, max) { return Math.max(min, Math.min(max, value)); }

  function ensureProgression(player) {
    if (!player._v1Progression) {
      player._v1Progression = {
        careerMobility: 1,
        financialPressure: 0,
        salaryGrowthTotal: 0,
        housingStability: 0,
        causalMonths: 0
      };
    }
    return player._v1Progression;
  }

  function applyPressure(player, progression) {
    const debt = number(player.debt);
    const savings = Math.max(0, number(player.savings));
    const monthlyIncome = player.getMonthlyIncome ? number(player.getMonthlyIncome().total) : 0;
    const debtRatio = monthlyIncome > 0 ? debt / Math.max(1, monthlyIncome * 12) : (debt > 0 ? 2 : 0);
    const cashBuffer = monthlyIncome > 0 ? savings / Math.max(1, monthlyIncome) : 0;

    // 财务压力不是一次性惩罚，而是持续影响未来选择空间。
    const pressure = clamp(debtRatio * 0.22 - Math.min(cashBuffer, 12) * 0.012, 0, 1);
    progression.financialPressure = pressure;

    const routePenalty = pressure * 0.18;
    const housePenalty = player.hasHouse ? 0.04 : 0;
    progression.careerMobility = clamp(1 - routePenalty - housePenalty, 0.55, 1.15);
  }

  function applyCareerCausality(player, progression) {
    const skills = player.skillLevels || {};
    const knowledge = number(player.knowledge);
    const skillScore = Object.keys(skills).reduce((sum, key) => sum + number(skills[key]), 0);
    const routeBonus = player.lifeRoutes && (player.lifeRoutes.academic_career || player.lifeRoutes.startup_path)
      ? 0.002
      : 0;
    const growthRate = clamp((skillScore * 0.00035) + (knowledge * 0.00004) + routeBonus, 0, 0.025);
    const mobility = progression.careerMobility;
    const effectiveGrowth = growthRate * mobility;

    if (player.salary > 0 && effectiveGrowth > 0) {
      const before = player.salary;
      player.salary = Math.round(player.salary * (1 + effectiveGrowth));
      const delta = player.salary - before;
      progression.salaryGrowthTotal += delta;
    }
  }

  function applyHousingCausality(player, progression) {
    if (player.hasHouse) {
      progression.housingStability = clamp(progression.housingStability + 0.01, 0, 1);
      player.happiness = clamp(number(player.happiness) + 0.05, 0, 100);
    } else {
      progression.housingStability = clamp(progression.housingStability - 0.003, 0, 1);
    }
  }

  function tick(state) {
    if (!state || !state.player || state.phase !== GamePhase.PLAYING) return null;
    const player = state.player;
    const progression = ensureProgression(player);
    progression.causalMonths = number(progression.causalMonths) + 1;

    applyPressure(player, progression);
    applyCareerCausality(player, progression);
    applyHousingCausality(player, progression);

    if (state.causalEngine && typeof state.causalEngine.tick === 'function') {
      state.causalEngine.tick();
    }

    return progression;
  }

  function install() {
    if (typeof GameState === 'undefined' || GameState.prototype.__causalRuntimeInstalled) return;
    const originalAdvance = GameState.prototype.advanceMonth;
    GameState.prototype.advanceMonth = function () {
      const result = originalAdvance.call(this);
      // 原系统完成现金流/房贷等基础结算后，再应用因果运行时的持续影响。
      if (result && this.player && this.phase !== GamePhase.MENU) tick(this);
      return result;
    };
    GameState.prototype.__causalRuntimeInstalled = true;
  }

  window.CausalRuntime = { tick, ensureProgression, version: '1.0.0' };
  install();
})();
