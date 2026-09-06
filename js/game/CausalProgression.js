/**
 * v1 持续因果模型
 * 把已经记录的选择转化为下一阶段真正会影响模拟结果的变量。
 * 不替换旧规则，只在旧规则之上增加可追踪的长期漂移。
 */
(function () {
  if (typeof GameState === 'undefined' || typeof Player === 'undefined') return;

  const originalStart = GameState.prototype.startNewGame;
  const originalAdvance = GameState.prototype.advanceMonth;

  function ensureProgression(player) {
    if (!player._v1Progression) {
      player._v1Progression = {
        careerMomentum: 0,
        careerMobility: 1,
        financialPressure: 0,
        housingStability: 0,
        months: 0,
        salaryGrowthTotal: 0
      };
    }
    return player._v1Progression;
  }

  function calculateRouteMomentum(player) {
    const routes = player.lifeRoutes || {};
    let momentum = 0;
    if (routes.standard_career) momentum += 0.10;
    if (routes.academic_career) momentum += 0.18;
    if (routes.startup_path) momentum += 0.06;
    if (routes.side_hustle_path) momentum += 0.08;
    if (routes.health_first) momentum += 0.04;
    return momentum;
  }

  function beforeMonth(state) {
    const player = state.player;
    const p = ensureProgression(player);
    p.months++;

    const income = Math.max(1, player.getMonthlyIncome().total);
    const mortgage = player.monthlyMortgage || 0;
    const debt = player.debt || 0;
    const debtBurden = Math.min(1, (mortgage + debt * 0.012) / income);
    const hasHouse = !!(player.properties && player.properties.length);

    p.financialPressure = Math.max(0, Math.min(1, debtBurden));
    p.housingStability = hasHouse ? Math.min(1, 0.25 + (player.properties.length * 0.15)) : 0;

    // 房贷不是一个静态数字：它会降低职业流动性，尤其在现金流紧张时。
    p.careerMobility = Math.max(0.45, Math.min(1.15,
      1 - p.financialPressure * 0.45 + p.housingStability * 0.05));

    const routeMomentum = calculateRouteMomentum(player);
    const skillLevel = Object.values(player.skillLevels || {}).reduce((sum, value) => sum + (Number(value) || 0), 0);
    const skillMomentum = Math.min(0.22, skillLevel * 0.012);
    const knowledgeMomentum = Math.max(0, (player.knowledge - 50) / 1000);

    // 月工资增长：职业路线、技能、知识、流动性共同决定，而不是单纯随机涨薪。
    if (!player.isRetired && player.careerDelayMonths <= 0 && player.salary > 0) {
      const baseGrowth = 0.0015 + routeMomentum + skillMomentum + knowledgeMomentum;
      const pressurePenalty = p.financialPressure * 0.0025;
      const growthRate = Math.max(-0.001, Math.min(0.012, baseGrowth * p.careerMobility * 0.01 - pressurePenalty));
      const before = player.salary;
      player.salary = Math.max(0, Math.round(player.salary * (1 + growthRate)));
      p.salaryGrowthTotal += player.salary - before;
      p.careerMomentum = growthRate;
    } else {
      p.careerMomentum = 0;
    }

    // 高杠杆会形成持续的幸福压力；稳定住房提供少量稳定性。
    if (p.financialPressure > 0.35) {
      player.happiness = Math.max(0, player.happiness - 1);
    } else if (hasHouse && p.financialPressure < 0.2) {
      player.happiness = Math.min(100, player.happiness + 0.2);
    }

    if (state.causalEngine) {
      state.causalEngine.addConsequence({
        id: `progression:month:${p.months}`,
        mode: 'once',
        tags: ['career', 'housing', 'persistent'],
        metadata: {
          careerMobility: Number(p.careerMobility.toFixed(3)),
          financialPressure: Number(p.financialPressure.toFixed(3)),
          salaryGrowth: p.careerMomentum
        },
        effect: () => ({
          message: `职业流动性 ${(p.careerMobility * 100).toFixed(0)}%，财务压力 ${(p.financialPressure * 100).toFixed(0)}%，本月工资轨迹 ${(p.careerMomentum * 100).toFixed(2)}%`
        })
      });
    }
  }

  GameState.prototype.startNewGame = function (scenario) {
    const player = originalStart.call(this, scenario);
    ensureProgression(player);
    return player;
  };

  GameState.prototype.advanceMonth = function () {
    if (this.player && this.phase === GamePhase.PLAYING) beforeMonth(this);
    return originalAdvance.call(this);
  };

  window.LifeProgression = {
    version: '1.0.0-alpha.1',
    get(player) { return player ? ensureProgression(player) : null; }
  };
})();
