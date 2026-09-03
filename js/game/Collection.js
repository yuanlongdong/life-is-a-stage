/**
 * 人生图鉴系统
 * 收集玩家体验过的剧本、结局、岔路选择，激发重开欲望
 */
// 成就配置
const ACHIEVEMENTS = {
  first_game: {
    id: 'first_game', name: '初入江湖', icon: '🎬',
    description: '完成第一局人生', category: '首次',
    check: (c) => c.stats.totalGames >= 1
  },
  financial_freedom: {
    id: 'financial_freedom', name: '财务自由', icon: '🏆',
    description: '首次达成财务自由结局', category: '首次',
    check: (c, p, e) => e.id === 'financial_freedom'
  },
  bankruptcy: {
    id: 'bankruptcy', name: '破产人生', icon: '💔',
    description: '首次达成破产结局', category: '首次',
    check: (c, p, e) => e.id === 'bankruptcy'
  },
  all_scenarios: {
    id: 'all_scenarios', name: '体验人生', icon: '🎭',
    description: '体验所有6种人生剧本', category: '首次',
    check: (c) => Object.keys(c.scenarios).length >= 6
  },
  all_endings: {
    id: 'all_endings', name: '结局收藏家', icon: '📚',
    description: '达成所有人生结局', category: '收集',
    check: (c) => {
      const totalEndings = typeof ENDINGS !== 'undefined' ? Object.keys(ENDINGS).length : 14;
      return Object.keys(c.endings).length >= totalEndings;
    }
  },
  all_choices: {
    id: 'all_choices', name: '选择收藏家', icon: '🔀',
    description: '体验所有人生岔路选择', category: '收集',
    check: (c) => {
      const s = CollectionManager.getUnexperiencedChoicesCount();
      return s.unexperienced === 0;
    }
  },
  young_rich: {
    id: 'young_rich', name: '年轻有为', icon: '💰',
    description: '30岁前净资产达到100万', category: '挑战',
    check: (c, p) => p.age <= 30 && p.getNetWorth() >= 1000000
  },
  debt_free: {
    id: 'debt_free', name: '无债一身轻', icon: '✨',
    description: '游戏结束时无任何负债', category: '挑战',
    check: (c, p) => p.debt <= 0
  },
  skill_master: {
    id: 'skill_master', name: '技能大师', icon: '🎯',
    description: '单局学会10个以上技能', category: '挑战',
    check: (c, p) => Object.keys(p.learnedSkills || {}).length >= 10
  },
  restart_5: {
    id: 'restart_5', name: '人生重来', icon: '🔄',
    description: '累计完成5局人生', category: '重开',
    check: (c) => c.stats.totalGames >= 5
  },
  restart_10: {
    id: 'restart_10', name: '百炼成钢', icon: '🔥',
    description: '累计完成10局人生', category: '重开',
    check: (c) => c.stats.totalGames >= 10
  },
  restart_20: {
    id: 'restart_20', name: '轮回者', icon: '♾️',
    description: '累计完成20局人生', category: '重开',
    check: (c) => c.stats.totalGames >= 20
  }
};
const CollectionManager = {
  STORAGE_KEY: 'life_is_a_stage_collection',
  // 获取图鉴数据
  getCollection() {
    try {
      const data = localStorage.getItem(this.STORAGE_KEY);
      if (data) {
        return JSON.parse(data);
      }
    } catch (e) {
      console.error('Failed to load collection:', e);
    }
    return this.getEmptyCollection();
  },
  // 空图鉴结构
  getEmptyCollection() {
    return {
      scenarios: {},      // { scenarioId: { name, playCount, firstTime, lastTime } }
      endings: {},        // { endingId: { name, description, count, firstTime } }
      lifeChoices: {},    // { age: { choiceId: { name, count } } }
      stats: {
        totalGames: 0,
        totalYears: 0,
        totalMonths: 0,
        bestNetWorth: 0,
        bestAge: 0,
        mostPlayedScenario: null
      },
      lastGame: null,     // 上一局完整总结，用于记忆继承
      achievements: {},    // 已解锁成就 { achievementId: { name, unlockTime, count } }
      unlockedAchievements: []
    };
  },
  // 保存图鉴数据
  saveCollection(collection) {
    try {
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(collection));
      return true;
    } catch (e) {
      console.error('Failed to save collection:', e);
      return false;
    }
  },
  // 记录游戏开始（剧本）
  recordScenarioStart(scenario) {
    const collection = this.getCollection();
    const now = Date.now();
    if (!collection.scenarios[scenario.id]) {
      collection.scenarios[scenario.id] = {
        name: scenario.name,
        playCount: 0,
        firstTime: now,
        lastTime: now
      };
    }
    collection.scenarios[scenario.id].playCount++;
    collection.scenarios[scenario.id].lastTime = now;
    collection.stats.totalGames++;
    this.saveCollection(collection);
    return collection;
  },
  // 记录游戏结束（结局+统计）
  recordGameEnd(player, ending, gameState) {
    const collection = this.getCollection();
    const now = Date.now();
    // 记录结局
    if (!collection.endings[ending.id]) {
      collection.endings[ending.id] = {
        name: ending.name,
        description: ending.description,
        count: 0,
        firstTime: now
      };
    }
    collection.endings[ending.id].count++;
    // 记录岔路选择
    if (player.lifeChoiceHistory) {
      player.lifeChoiceHistory.forEach(choice => {
        if (!collection.lifeChoices[choice.age]) {
          collection.lifeChoices[choice.age] = {};
        }
        if (!collection.lifeChoices[choice.age][choice.choiceId]) {
          collection.lifeChoices[choice.age][choice.choiceId] = {
            name: choice.choiceName,
            count: 0
          };
        }
        collection.lifeChoices[choice.age][choice.choiceId].count++;
      });
    }
    // 更新统计
    collection.stats.totalYears += (player.age - (gameState.scenarioStartAge || player.age));
    collection.stats.totalMonths += gameState.totalMonthsPlayed || 0;
    const netWorth = player.getNetWorth ? player.getNetWorth() : 0;
    if (netWorth > collection.stats.bestNetWorth) {
      collection.stats.bestNetWorth = netWorth;
      collection.stats.bestAge = player.age;
    }
    // 最常玩的剧本
    let maxCount = 0;
    let mostPlayed = null;
    Object.keys(collection.scenarios).forEach(id => {
      if (collection.scenarios[id].playCount > maxCount) {
        maxCount = collection.scenarios[id].playCount;
        mostPlayed = id;
      }
    });
    collection.stats.mostPlayedScenario = mostPlayed;
    // 记录上一局完整总结（用于记忆继承重开）
    collection.lastGame = {
      scenarioId: player.scenarioId,
      scenarioName: player.scenarioName,
      endingId: ending.id,
      endingName: ending.name,
      finalAge: player.age,
      finalNetWorth: player.getNetWorth ? player.getNetWorth() : 0,
      finalSavings: player.savings,
      finalDebt: player.debt,
      learnedSkills: Object.keys(player.learnedSkills || {}).length,
      lifeChoiceHistory: player.lifeChoiceHistory ? player.lifeChoiceHistory.map(c => ({
        age: c.age,
        choiceId: c.choiceId,
        choiceName: c.choiceName
      })) : [],
      playTime: Date.now()
    };
    // 【P1成就系统】检查并解锁成就
    const newlyUnlocked = this.checkAndUnlockAchievements(collection, player, ending, gameState);
    collection.newlyUnlockedAchievements = newlyUnlocked;
    this.saveCollection(collection);
    return collection;
  },
  // 【P1成就系统】检查并解锁成就，返回新解锁的成就列表
  checkAndUnlockAchievements(collection, player, ending, gameState) {
    const newlyUnlocked = [];
    if (!collection.achievements) collection.achievements = {};
    Object.keys(ACHIEVEMENTS).forEach(achievementId => {
      const achievement = ACHIEVEMENTS[achievementId];
      // 跳过已解锁的成就
      if (collection.achievements[achievementId]) return;
      // 检查成就条件
      try {
        if (achievement.check(collection, player, ending, gameState)) {
          collection.achievements[achievementId] = {
            name: achievement.name,
            icon: achievement.icon,
            description: achievement.description,
            category: achievement.category,
            unlockTime: Date.now()
          };
          newlyUnlocked.push(achievement);
        }
      } catch (e) {
        console.error('Achievement check error:', achievementId, e);
      }
    });
    return newlyUnlocked;
  },
  // 获取所有成就（含未解锁状态）
  getAchievements() {
    const collection = this.getCollection();
    const result = [];
    Object.keys(ACHIEVEMENTS).forEach(id => {
      const achievement = ACHIEVEMENTS[id];
      const unlocked = collection.achievements && collection.achievements[id];
      result.push({
        id: id,
        name: achievement.name,
        icon: achievement.icon,
        description: achievement.description,
        category: achievement.category,
        unlocked: !!unlocked,
        unlockTime: unlocked ? unlocked.unlockTime : null
      });
    });
    return result;
  },
  // 获取成就收集进度
  getAchievementProgress() {
    const achievements = this.getAchievements();
    const unlocked = achievements.filter(a => a.unlocked).length;
    return {
      total: achievements.length,
      unlocked: unlocked,
      percentage: Math.round((unlocked / achievements.length) * 100)
    };
  },
  // 检查玩家是否体验过某个岔路选择（用于"似曾相识"提示）
  hasExperiencedChoice(age, choiceId) {
    const collection = this.getCollection();
    return collection.lifeChoices[age] &&
           collection.lifeChoices[age][choiceId] &&
           collection.lifeChoices[age][choiceId].count > 0;
  },
  // 检查玩家是否达成过某个结局
  hasExperiencedEnding(endingId) {
    const collection = this.getCollection();
    return collection.endings[endingId] && collection.endings[endingId].count > 0;
  },
  // 获取收集进度
  getProgress() {
    const collection = this.getCollection();
    const totalScenarios = SCENARIOS ? SCENARIOS.length : 6;
    const totalEndings = typeof ENDINGS !== 'undefined' ? Object.keys(ENDINGS).length : 14;
    const totalLifeChoices = Object.keys(LIFE_CHOICES).reduce((sum, age) => {
      return sum + LIFE_CHOICES[age].choices.length;
    }, 0);
    const collectedScenarios = Object.keys(collection.scenarios).length;
    const collectedEndings = Object.keys(collection.endings).length;
    const collectedChoices = Object.keys(collection.lifeChoices).reduce((sum, age) => {
      return sum + Object.keys(collection.lifeChoices[age]).length;
    }, 0);
    return {
      scenarios: { collected: collectedScenarios, total: totalScenarios },
      endings: { collected: collectedEndings, total: totalEndings },
      lifeChoices: { collected: collectedChoices, total: totalLifeChoices },
      overall: Math.round(((collectedScenarios + collectedEndings + collectedChoices) /
                           (totalScenarios + totalEndings + totalLifeChoices)) * 100)
    };
  },
  // 是否有上一局数据（用于判断是否显示记忆继承回顾）
  hasLastGame() {
    const collection = this.getCollection();
    return collection.lastGame !== null && collection.lastGame !== undefined;
  },
  // 获取上一局完整总结（用于重开时回顾）
  getLastGameSummary() {
    const collection = this.getCollection();
    return collection.lastGame;
  },
  // 获取记忆等级（根据总局数决定记忆继承程度）
  // level 0: 无记忆（第1局）
  // level 1: 似曾相识（第2-3局）- 岔路选项显示标记
  // level 2: 模糊预感（第4-5局）- 岔路事件前显示预告
  // level 3: 清晰记忆（第6局+）- 详细预告+上一局选择回顾
  getMemoryLevel() {
    const collection = this.getCollection();
    const totalGames = collection.stats.totalGames || 0;
    if (totalGames <= 0) return 0;
    if (totalGames <= 2) return 1;
    if (totalGames <= 4) return 2;
    return 3;
  },
  // 获取某个年龄体验过的所有岔路选择（用于事件预告）
  getExperiencedChoicesByAge(age) {
    const collection = this.getCollection();
    if (!collection.lifeChoices[age]) return [];
    return Object.keys(collection.lifeChoices[age]).map(choiceId => ({
      choiceId: choiceId,
      name: collection.lifeChoices[age][choiceId].name,
      count: collection.lifeChoices[age][choiceId].count
    }));
  },
  // 获取未体验过的岔路选择数量（用于"还有多少选择没试过"的提示）
  getUnexperiencedChoicesCount() {
    if (typeof LIFE_CHOICES === 'undefined') return 0;
    const collection = this.getCollection();
    let total = 0;
    let experienced = 0;
    Object.keys(LIFE_CHOICES).forEach(age => {
      LIFE_CHOICES[age].choices.forEach(choice => {
        total++;
        if (collection.lifeChoices[age] && collection.lifeChoices[age][choice.id]) {
          experienced++;
        }
      });
    });
    return { total, experienced, unexperienced: total - experienced };
  },
  // 重置图鉴
  resetCollection() {
    localStorage.removeItem(this.STORAGE_KEY);
    return true;
  }
};
