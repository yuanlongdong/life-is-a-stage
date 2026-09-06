/**
 * 平行人生模拟器 v1.0
 *
 * 核心流程：
 * 这一生 → 找到关键选择 → 如果当时…… → 改变一个决定
 * → 复制人生状态 → 重新模拟 → 得到另一种人生 → A人生 vs B人生
 */
(function () {
  if (typeof GameState === 'undefined' || typeof Player === 'undefined') return;

  /**
   * 从时间线的某个决策节点开始平行人生模拟
   * @param {GameState} originalState - 原始游戏状态
   * @param {Object} timelineEntry - 时间线中的决策节点
   * @param {string} newChoiceId - 新选择的ID
   * @returns {Object} 平行人生的结果
   */
  function simulateParallelLife(originalState, timelineEntry, newChoiceId) {
    if (!originalState || !originalState.player || !timelineEntry) {
      return { success: false, message: '缺少必要数据' };
    }

    const snapshot = timelineEntry.metadata && timelineEntry.metadata.playerSnapshot;
    if (!snapshot) {
      return { success: false, message: '该决策点没有保存状态快照，无法回溯' };
    }

    // 找到对应的人生岔路事件
    const decisionAge = timelineEntry.age;
    const lifeChoice = typeof LIFE_CHOICES !== 'undefined' ? LIFE_CHOICES[decisionAge] : null;
    if (!lifeChoice) {
      return { success: false, message: '找不到对应的人生岔路事件' };
    }

    const newChoice = lifeChoice.choices.find(c => c.id === newChoiceId);
    if (!newChoice) {
      return { success: false, message: '找不到新选择的配置' };
    }

    // 创建平行人生的GameState（不影响原游戏）
    const parallelState = new GameState();
    // 快照是对象格式，需要先stringify再deserialize
    parallelState.player = Player.deserialize(JSON.stringify(snapshot));
    parallelState.phase = GamePhase.PLAYING;
    parallelState.currentMonth = 1;
    parallelState.currentYear = 1;
    parallelState.totalMonthsPlayed = 0;
    parallelState.scenarioStartAge = decisionAge;
    parallelState.relationshipManager = new RelationshipManager();
    parallelState.propertyManager = new PropertyManager();

    // 恢复v1系统
    if (typeof CausalEngine !== 'undefined') {
      parallelState.causalEngine = new CausalEngine(parallelState.player);
      parallelState.player._v1CausalEngine = parallelState.causalEngine;
    }
    if (typeof LifeTimeline !== 'undefined') {
      parallelState.lifeTimeline = new LifeTimeline(parallelState.player);
      parallelState.lifeTimeline.add({
        type: 'parallel_start',
        importance: 'critical',
        title: '平行人生开启',
        text: `从${decisionAge}岁开始，选择了「${newChoice.shortName || newChoice.text}」`,
        tags: ['parallel', 'start']
      });
    }
    if (typeof LifeProgression !== 'undefined') {
      LifeProgression.get(parallelState.player);
    }

    // 应用新选择的效果
    parallelState.player.lifeChoices[decisionAge] = newChoice.id;
    parallelState.player.lifeChoiceHistory.push({
      age: decisionAge,
      choiceId: newChoice.id,
      choiceName: newChoice.shortName || newChoice.text,
      month: 1,
      year: 1
    });

    // 解锁人生路线
    if (newChoice.unlocks) {
      newChoice.unlocks.forEach(route => {
        if (parallelState.player.lifeRoutes.hasOwnProperty(route)) {
          parallelState.player.lifeRoutes[route] = true;
        }
      });
    }

    // 应用长期效果
    if (newChoice.longTermEffects) {
      applyLongTermEffectsToPlayer(parallelState.player, newChoice.longTermEffects);
    }
    if (newChoice.midTermEffects) {
      applyLongTermEffectsToPlayer(parallelState.player, newChoice.midTermEffects);
    }

    // 应用即时效果
    if (newChoice.effects || newChoice.immediateEffects) {
      parallelState.player.applyEffects(newChoice.effects || newChoice.immediateEffects);
    }

    parallelState.player.addEventLog(`🔀 【平行人生】从${decisionAge}岁开始，你选择了「${newChoice.shortName || newChoice.text}」`);

    // 快速模拟到目标年龄（原游戏当前年龄或60岁，取较小值）
    const targetAge = Math.min(originalState.player.age, 60);
    const maxMonths = (targetAge - decisionAge) * 12 + 12;
    let monthsSimulated = 0;
    let gameOverResult = null;

    for (let i = 0; i < maxMonths; i++) {
      // 跳过事件处理（快速模拟只跑月度结算）
      const result = fastAdvanceMonth(parallelState);
      monthsSimulated++;

      if (result && result.gameOver) {
        gameOverResult = result.gameOver;
        break;
      }

      if (parallelState.player.age >= targetAge) {
        break;
      }
    }

    // 计算平行人生的结局
    let parallelEnding = null;
    try {
      parallelEnding = parallelState.calculateEnding();
    } catch (e) {
      console.error('Parallel ending calc error:', e);
    }

    // 生成对比数据
    const originalPlayer = originalState.player;
    const parallelPlayer = parallelState.player;

    const comparison = {
      original: {
        age: originalPlayer.age,
        netWorth: originalPlayer.savings + originalPlayer.investments - originalPlayer.debt,
        salary: originalPlayer.salary,
        savings: originalPlayer.savings,
        investments: originalPlayer.investments,
        debt: originalPlayer.debt,
        happiness: originalPlayer.happiness,
        health: originalPlayer.health,
        knowledge: originalPlayer.knowledge,
        monthlyIncome: originalPlayer.getMonthlyIncome().total,
        monthlyExpense: originalPlayer.getMonthlyExpense().total,
        routes: Object.keys(originalPlayer.lifeRoutes || {}).filter(k => originalPlayer.lifeRoutes[k]),
        ending: originalState.endingRecorded ? null : null
      },
      parallel: {
        age: parallelPlayer.age,
        netWorth: parallelPlayer.savings + parallelPlayer.investments - parallelPlayer.debt,
        salary: parallelPlayer.salary,
        savings: parallelPlayer.savings,
        investments: parallelPlayer.investments,
        debt: parallelPlayer.debt,
        happiness: parallelPlayer.happiness,
        health: parallelPlayer.health,
        knowledge: parallelPlayer.knowledge,
        monthlyIncome: parallelPlayer.getMonthlyIncome().total,
        monthlyExpense: parallelPlayer.getMonthlyExpense().total,
        routes: Object.keys(parallelPlayer.lifeRoutes || {}).filter(k => parallelPlayer.lifeRoutes[k]),
        ending: parallelEnding,
        choiceName: newChoice.shortName || newChoice.text,
        monthsSimulated
      },
      decisionAge,
      originalChoice: timelineEntry.title,
      newChoice: newChoice.shortName || newChoice.text
    };

    // 计算差异
    comparison.differences = {
      netWorth: comparison.parallel.netWorth - comparison.original.netWorth,
      salary: comparison.parallel.salary - comparison.original.salary,
      happiness: comparison.parallel.happiness - comparison.original.happiness,
      health: comparison.parallel.health - comparison.original.health,
      monthlyIncome: comparison.parallel.monthlyIncome - comparison.original.monthlyIncome
    };

    return {
      success: true,
      comparison,
      parallelState,
      gameOver: gameOverResult
    };
  }

  /**
   * 快速推进一个月（跳过事件UI和随机事件）
   */
  function fastAdvanceMonth(state) {
    if (!state.player || state.phase !== GamePhase.PLAYING) return null;

    const player = state.player;
    const month = state.currentMonth;
    const year = state.currentYear;

    // 1. 结算收入支出
    const income = player.getMonthlyIncome();
    const expense = player.getMonthlyExpense();
    const balance = income.total - expense.total;

    // 2. 更新储蓄和债务
    player.savings += balance;
    if (player.debt > 0) {
      const principalPayment = expense.debtPrincipal;
      player.debt = Math.max(0, player.debt - principalPayment);
    }

    // 3. 投资收益
    const investGain = Math.round(player.investments * (0.006 + player.modifiers.investmentReturnBonus / 12));
    player.investments += investGain;

    // 4. 处理学习队列
    processLearningQueueFast(state);

    // 4.5 职业延迟
    if (player.careerDelayMonths > 0) {
      player.careerDelayMonths--;
      if (player.careerDelayMonths === 0 && !player.careerDelayApplied) {
        player.salary = Math.round(player.salary * player.salaryStartMultiplier);
        player.careerDelayApplied = true;
      }
    }

    // 5. 属性自然变化
    if (!player.learnedSkills['life_fitness']) {
      player.health = Math.max(0, player.health - 1);
    }
    if (player.debt > player.savings * 2) {
      player.happiness = Math.max(0, player.happiness - 1);
    }

    // 5.5 v1持续因果模型
    if (typeof LifeProgression !== 'undefined' && state.player && state.phase === GamePhase.PLAYING) {
      const p = LifeProgression.get(state.player);
      p.months++;
      const inc = Math.max(1, state.player.getMonthlyIncome().total);
      const mortgage = state.player.monthlyMortgage || 0;
      const debt = state.player.debt || 0;
      const debtBurden = Math.min(1, (mortgage + debt * 0.012) / inc);
      const hasHouse = !!(state.player.properties && state.player.properties.length);
      p.financialPressure = Math.max(0, Math.min(1, debtBurden));
      p.housingStability = hasHouse ? Math.min(1, 0.25 + (state.player.properties.length * 0.15)) : 0;
      p.careerMobility = Math.max(0.45, Math.min(1.15, 1 - p.financialPressure * 0.45 + p.housingStability * 0.05));
      if (!state.player.isRetired && state.player.careerDelayMonths <= 0 && state.player.salary > 0) {
        const routeMomentum = calculateRouteMomentumFast(state.player);
        const skillLevel = Object.values(state.player.skillLevels || {}).reduce((s, v) => s + (Number(v) || 0), 0);
        const skillMomentum = Math.min(0.22, skillLevel * 0.012);
        const knowledgeMomentum = Math.max(0, (state.player.knowledge - 50) / 1000);
        const baseGrowth = 0.0015 + routeMomentum + skillMomentum + knowledgeMomentum;
        const pressurePenalty = p.financialPressure * 0.0025;
        const growthRate = Math.max(-0.001, Math.min(0.012, baseGrowth * p.careerMobility * 0.01 - pressurePenalty));
        const before = state.player.salary;
        state.player.salary = Math.max(0, Math.round(state.player.salary * (1 + growthRate)));
        p.salaryGrowthTotal += state.player.salary - before;
        p.careerMomentum = growthRate;
      }
      if (p.financialPressure > 0.35) {
        state.player.happiness = Math.max(0, state.player.happiness - 1);
      } else if (hasHouse && p.financialPressure < 0.2) {
        state.player.happiness = Math.min(100, state.player.happiness + 0.2);
      }
    }

    // 6. 记录月度数据
    player.recordMonthlyData(month, year);

    // 7. 推进时间
    state.currentMonth++;
    state.totalMonthsPlayed++;
    if (state.currentMonth > 12) {
      state.currentMonth = 1;
      state.currentYear++;
      player.age++;
      // 年度变化
      if (!player.isRetired && player.careerDelayMonths === 0) {
        const growthRate = 1.05 * (player.modifiers.salaryGrowthMultiplier || 1);
        player.salary = Math.round(player.salary * growthRate);
      }
      player.baseExpense = Math.round(player.baseExpense * 1.03);
      if (player.age > 40) {
        player.maxHealth = Math.max(60, 100 - (player.age - 40));
      }
    }

    // 8. 检查游戏结束
    if (player.health <= 0) {
      return { gameOver: { reason: 'death', message: '健康耗尽' } };
    }
    if (player.age >= 80) {
      return { gameOver: { reason: 'age', message: '活到80岁' } };
    }

    // 9. 只处理人生岔路（跳过随机事件）
    const lifeChoice = typeof LIFE_CHOICES !== 'undefined' ? LIFE_CHOICES[player.age] : null;
    if (lifeChoice && state.currentMonth === 1 && !player.lifeChoices[player.age]) {
      // 平行人生中遇到新岔路，自动选择第一个选项
      const autoChoice = lifeChoice.choices[0];
      player.lifeChoices[player.age] = autoChoice.id;
      if (autoChoice.unlocks) {
        autoChoice.unlocks.forEach(route => {
          if (player.lifeRoutes.hasOwnProperty(route)) {
            player.lifeRoutes[route] = true;
          }
        });
      }
      if (autoChoice.longTermEffects) {
        applyLongTermEffectsToPlayer(player, autoChoice.longTermEffects);
      }
      if (autoChoice.effects) {
        player.applyEffects(autoChoice.effects);
      }
      player.addEventLog(`🔀 【平行人生·${player.age}岁】自动选择「${autoChoice.shortName || autoChoice.text}」`);
    }

    return { income, expense, balance, gameOver: null };
  }

  function processLearningQueueFast(state) {
    const completed = [];
    state.player.learningQueue = state.player.learningQueue.filter(item => {
      item.remainingMonths--;
      if (item.remainingMonths <= 0) {
        completed.push(item);
        return false;
      }
      return true;
    });
    completed.forEach(item => {
      if (item.type === 'learn' && typeof LEARNABLE_SKILLS !== 'undefined') {
        const skill = LEARNABLE_SKILLS[item.skillId];
        if (skill) {
          state.player.learnedSkills[item.skillId] = true;
          state.player.skillLevels[skill.category] = (state.player.skillLevels[skill.category] || 0) + 1;
          state.player.applyEffects(skill.effects);
        }
      } else if (item.type === 'develop' && typeof DEVELOPABLE_SKILLS !== 'undefined') {
        const skill = DEVELOPABLE_SKILLS[item.skillId];
        if (skill) {
          const currentLevel = state.player.developedSkills[item.skillId] || 0;
          const newLevel = Math.min(skill.maxLevel, currentLevel + 1);
          state.player.developedSkills[item.skillId] = newLevel;
          state.player.skillLevels[skill.category] = (state.player.skillLevels[skill.category] || 0) + 1;
          if (skill.effectsPerLevel) {
            state.player.applyEffects(skill.effectsPerLevel);
          }
        }
      }
    });
  }

  function calculateRouteMomentumFast(player) {
    const routes = player.lifeRoutes || {};
    let momentum = 0;
    if (routes.standard_career) momentum += 0.10;
    if (routes.academic_career) momentum += 0.18;
    if (routes.startup_path) momentum += 0.06;
    if (routes.side_hustle_path) momentum += 0.08;
    if (routes.health_first) momentum += 0.04;
    return momentum;
  }

  function applyLongTermEffectsToPlayer(player, effects) {
    if (!effects) return;
    if (effects.careerLine) player.careerLine = effects.careerLine;
    if (effects.salaryGrowthMultiplier) {
      player.modifiers.salaryGrowthMultiplier = (player.modifiers.salaryGrowthMultiplier || 1) * effects.salaryGrowthMultiplier;
    }
    if (effects.salaryCapMultiplier) {
      player.modifiers.salaryCapMultiplier = (player.modifiers.salaryCapMultiplier || 1) * effects.salaryCapMultiplier;
    }
    if (effects.investmentReturnMultiplier) {
      player.modifiers.investmentReturnBonus = (player.modifiers.investmentReturnBonus || 0) + (effects.investmentReturnMultiplier - 1);
    }
    if (effects.sideIncomeGrowthMultiplier) {
      player.modifiers.sideIncomeGrowthMultiplier = (player.modifiers.sideIncomeGrowthMultiplier || 1) * effects.sideIncomeGrowthMultiplier;
    }
    if (effects.happinessCapBonus) {
      player.modifiers.happinessCapBonus = (player.modifiers.happinessCapBonus || 0) + effects.happinessCapBonus;
    }
    if (effects.hasHouse) player.hasHouse = true;
    if (effects.startupEndingPossible) player.canGetStartupEnding = true;
    if (effects.familyEndingPossible) player.canGetFamilyEnding = true;
    if (effects.delayedCareer) {
      player.careerDelayMonths = effects.delayedCareer;
      player.careerDelayApplied = false;
    }
    if (effects.salaryStartMultiplier) {
      player.salaryStartMultiplier = effects.salaryStartMultiplier;
    }
  }

  window.ParallelLife = {
    simulate: simulateParallelLife,
    version: '1.0.0-alpha.1'
  };
})();
