/**
 * 平行人生模拟器 v1.0
 *
 * 关键决策前快照 → 换一个选择 → 从该节点继续真实月度模拟 → A/B 对比。
 * A 人生不会被修改，只有用户明确选择“以B人生继续”才替换当前状态。
 */
(function () {
  if (typeof GameState === 'undefined' || typeof Player === 'undefined') return;

  function clone(value) {
    if (value === undefined || value === null) return value;
    try {
      return JSON.parse(JSON.stringify(value));
    } catch (_) {
      return value;
    }
  }

  function restorePlayer(snapshot) {
    return Player.deserialize(JSON.stringify(snapshot));
  }

  function restoreManagers(state, snapshot) {
    state.relationshipManager = new RelationshipManager();
    state.propertyManager = new PropertyManager();
    if (snapshot.relationshipManager) Object.assign(state.relationshipManager, clone(snapshot.relationshipManager));
    if (snapshot.propertyManager) Object.assign(state.propertyManager, clone(snapshot.propertyManager));
  }

  function restoreCausal(state, snapshot) {
    if (typeof CausalEngine === 'undefined') return;
    state.causalEngine = new CausalEngine(state.player);
    const source = snapshot.causalSnapshot;
    if (!source) {
      state.player._v1CausalEngine = state.causalEngine;
      return;
    }
    state.causalEngine.causalLog = clone(source.causalLog || []);
    state.causalEngine.activeConsequences = (source.activeConsequences || []).map(item => ({
      ...clone(item),
      // 当前因果快照中的长期影响主要用于追踪；函数无法跨 JSON 存档持久化。
      effect: null,
      condition: null,
      tags: Array.isArray(item.tags) ? [...item.tags] : []
    }));
    state.causalEngine.sequence = state.causalEngine.causalLog.length;
    state.player._v1CausalEngine = state.causalEngine;
  }

  function restoreTimeline(state, snapshot) {
    if (typeof LifeTimeline === 'undefined') return;
    state.lifeTimeline = new LifeTimeline(state.player);
    const source = snapshot.timelineSnapshot;
    if (source) {
      state.lifeTimeline.entries = clone(source.entries || []);
      state.lifeTimeline.branches = clone(source.branches || []);
      state.lifeTimeline.sequence = state.lifeTimeline.entries.length + state.lifeTimeline.branches.length;
    }
    state.lifeTimeline.player = state.player;
  }

  function restoreState(originalState, snapshot) {
    const state = new GameState();
    state.player = restorePlayer(snapshot.player);
    state.currentMonth = snapshot.currentMonth || 1;
    state.currentYear = snapshot.currentYear || 1;
    state.totalMonthsPlayed = snapshot.totalMonthsPlayed || 0;
    state.scenarioStartAge = snapshot.scenarioStartAge || state.player.age;
    state.gameStartTime = originalState.gameStartTime;
    state.skillPoints = originalState.skillPoints || 0;
    state.notifications = [];
    state.pendingEvent = null;
    state.phase = GamePhase.PLAYING;
    state.isPaused = false;
    restoreManagers(state, snapshot);
    restoreCausal(state, snapshot);
    restoreTimeline(state, snapshot);
    return state;
  }

  function getMetrics(state) {
    const p = state.player;
    return {
      age: p.age,
      netWorth: p.getNetWorth(),
      monthlyIncome: p.getMonthlyIncome().total,
      salary: p.salary,
      savings: p.savings,
      investments: p.investments,
      debt: p.debt,
      happiness: p.happiness,
      health: p.health,
      routes: Object.keys(p.lifeRoutes || {}).filter(k => p.lifeRoutes[k])
    };
  }

  function getChoice(lifeChoice, choiceId) {
    if (!lifeChoice || !Array.isArray(lifeChoice.choices)) return null;
    return lifeChoice.choices.find(c => String(c.id) === String(choiceId)) || null;
  }

  function applyAlternativeChoice(state, lifeChoice, choiceId) {
    const index = lifeChoice.choices.findIndex(c => String(c.id) === String(choiceId));
    if (index < 0) return { success: false, message: '找不到这个人生选择。' };
    state.pendingEvent = lifeChoice;
    state.phase = GamePhase.EVENT;
    const result = state.resolveEventChoice(index);
    if (!result || !result.success) return result || { success: false, message: '替代选择无法执行。' };
    state.pendingEvent = null;
    state.phase = GamePhase.PLAYING;
    return result;
  }

  function simulateParallelLife(originalState, timelineEntry, newChoiceId) {
    if (!originalState || !originalState.player || !timelineEntry) {
      return { success: false, message: '缺少必要的人生数据。' };
    }

    const snapshot = timelineEntry.metadata && timelineEntry.metadata.stateSnapshot;
    if (!snapshot || !snapshot.player) {
      return { success: false, message: '该节点没有完整快照。只有新产生的关键选择才能进行平行人生推演。' };
    }

    const decisionAge = timelineEntry.age;
    const lifeChoice = typeof LIFE_CHOICES !== 'undefined' ? LIFE_CHOICES[decisionAge] : null;
    if (!lifeChoice) return { success: false, message: `找不到${decisionAge}岁的原始人生岔路。` };

    const newChoice = getChoice(lifeChoice, newChoiceId);
    if (!newChoice) return { success: false, message: '找不到替代方案。' };
    const originalChoiceId = snapshot.player.lifeChoices && snapshot.player.lifeChoices[decisionAge];
    if (String(originalChoiceId) === String(newChoiceId)) {
      return { success: false, message: '这是原来的选择，请选择另一条路。' };
    }

    // 1. 恢复“选择发生前”的完整状态。
    const branch = restoreState(originalState, snapshot);
    const choiceResult = applyAlternativeChoice(branch, lifeChoice, newChoiceId);
    if (!choiceResult.success) return choiceResult;

    // 2. 从分叉点开始，复用真实 GameState.advanceMonth()，而不是另写一套模拟规则。
    //    仅关闭随机事件，避免随机事件把“选择差异”淹没；年度结算、收入、债务、投资、技能、关系、房产、因果推进全部保留。
    const targetAge = originalState.player.age;
    const oldCheckForEvent = branch.checkForEvent;
    if (typeof oldCheckForEvent === 'function') branch.checkForEvent = () => null;

    let monthsSimulated = 0;
    let gameOver = null;
    const maxMonths = Math.max(12, (Math.max(0, targetAge - decisionAge) + 2) * 12);

    try {
      while (branch.player.age < targetAge && monthsSimulated < maxMonths) {
        branch.phase = GamePhase.PLAYING;
        const result = branch.advanceMonth();
        monthsSimulated++;

        if (result && result.gameOver) {
          gameOver = result.gameOver;
          break;
        }

        // 年度复盘是 UI 阶段，不应阻断后台推演。
        if (branch.phase === GamePhase.YEAR_REVIEW) branch.phase = GamePhase.PLAYING;
        // 未来的人生岔路自动走第一选项，保证模拟可以持续推进。
        if (branch.phase === GamePhase.EVENT) {
          const event = branch.pendingEvent;
          if (event && event.isLifeChoice && event.choices && event.choices.length) {
            const autoIndex = 0;
            const autoResult = branch.resolveEventChoice(autoIndex);
            if (!autoResult || !autoResult.success) {
              branch.pendingEvent = null;
              branch.phase = GamePhase.PLAYING;
            }
          } else {
            branch.pendingEvent = null;
            branch.phase = GamePhase.PLAYING;
          }
        }
      }
    } finally {
      branch.checkForEvent = oldCheckForEvent;
    }

    const original = getMetrics(originalState);
    const parallel = getMetrics(branch);
    const comparison = {
      decisionAge,
      originalChoice: timelineEntry.title,
      newChoice: newChoice.shortName || newChoice.text,
      original,
      parallel: {
        ...parallel,
        ending: null,
        monthsSimulated,
        gameOver
      },
      differences: {
        netWorth: parallel.netWorth - original.netWorth,
        monthlyIncome: parallel.monthlyIncome - original.monthlyIncome,
        salary: parallel.salary - original.salary,
        savings: parallel.savings - original.savings,
        investments: parallel.investments - original.investments,
        debt: original.debt - parallel.debt,
        happiness: parallel.happiness - original.happiness,
        health: parallel.health - original.health
      }
    };

    if (branch.lifeTimeline) {
      branch.lifeTimeline.addBranch({
        fromAge: decisionAge,
        label: `如果选择「${newChoice.shortName || newChoice.text}」`,
        sourceDecisionId: timelineEntry.metadata && timelineEntry.metadata.decisionId,
        status: 'simulated',
        description: `从${decisionAge}岁决策前状态分叉，真实模拟${monthsSimulated}个月。`
      });
    }

    return {
      success: true,
      comparison,
      parallelState: {
        player: branch.player,
        causalEngine: branch.causalEngine,
        lifeTimeline: branch.lifeTimeline,
        currentMonth: branch.currentMonth,
        currentYear: branch.currentYear,
        totalMonthsPlayed: branch.totalMonthsPlayed,
        relationshipManager: branch.relationshipManager,
        propertyManager: branch.propertyManager
      }
    };
  }

  window.ParallelLife = {
    simulate: simulateParallelLife,
    version: '1.0.0'
  };
})();