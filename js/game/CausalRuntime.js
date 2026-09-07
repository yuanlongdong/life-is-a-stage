/**
 * 因果运行时 v1.1
 * 运行时只负责观测、记录和推进因果日志。
 * 职业/财务/住房的数值计算由 CausalProgression 统一负责，避免重复结算。
 */
(function () {
  function number(value) {
    const n = Number(value);
    return Number.isFinite(n) ? n : 0;
  }

  function ensureProgression(player) {
    if (!player._v1Progression) {
      player._v1Progression = {
        careerMomentum: 0,
        careerMobility: 1,
        financialPressure: 0,
        housingStability: 0,
        months: 0,
        salaryGrowthTotal: 0,
        causalMonths: 0
      };
    }
    return player._v1Progression;
  }

  function capture(state, result) {
    if (!state || !state.player) return null;
    const player = state.player;
    const progression = ensureProgression(player);
    progression.causalMonths = number(progression.causalMonths) + 1;

    const snapshot = {
      age: number(player.age),
      month: number(state.currentMonth),
      year: number(state.currentYear),
      netWorth: typeof player.getNetWorth === 'function' ? number(player.getNetWorth()) : 0,
      salary: number(player.salary),
      debt: number(player.debt),
      savings: number(player.savings),
      financialPressure: Number(number(progression.financialPressure).toFixed(3)),
      careerMobility: Number(number(progression.careerMobility).toFixed(3)),
      housingStability: Number(number(progression.housingStability).toFixed(3))
    };

    progression.lastCausalSnapshot = snapshot;

    let applied = [];
    if (state.causalEngine && typeof state.causalEngine.tick === 'function') {
      applied = state.causalEngine.tick();
    }

    if (state.lifeTimeline && typeof state.lifeTimeline.add === 'function') {
      state.lifeTimeline.add({
        age: snapshot.age,
        year: snapshot.year,
        month: snapshot.month,
        type: 'state_change',
        title: '人生状态发生变化',
        text: `财务压力${Math.round(snapshot.financialPressure * 100)}%，职业流动性${Math.round(snapshot.careerMobility * 100)}%`,
        importance: 'minor',
        tags: ['causal', 'monthly'],
        metadata: { causalApplied: applied.length }
      });
    }

    return { progression, snapshot, applied, result: result || null };
  }

  function install() {
    if (typeof GameState === 'undefined' || GameState.prototype.__causalRuntimeInstalled) return;
    const originalAdvance = GameState.prototype.advanceMonth;
    GameState.prototype.advanceMonth = function () {
      const result = originalAdvance.call(this);
      if (result && this.player && this.phase !== GamePhase.MENU) capture(this, result);
      return result;
    };
    GameState.prototype.__causalRuntimeInstalled = true;
  }

  window.CausalRuntime = { capture, ensureProgression, version: '1.1.0' };
  install();
})();
