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
    description: '达成所有5种人生结局', category: '收集',
    check: (c) => Object.keys(c.endings).length >= 5
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

  getCollection() {
    try {
      const data = localStorage.getItem(this.STORAGE_KEY);
      if (data) return JSON.parse(data);
    } catch (e) { console.error('Failed to load collection:', e); }
    return this.getEmptyCollection();
  },

  getEmptyCollection() {
    return {
      scenarios: {},
      endings: {},
      lifeChoices: {},
      stats: { totalGames: 0, totalYears: 0, totalMonths: 0, bestNetWorth: 0, bestAge: 0, mostPlayedScenario: null },
      lastGame: null,
      achievements: {},
      unlockedAchievements: []
    };
  },

  saveCollection(collection) {
    try { localStorage.setItem(this.STORAGE_KEY, JSON.stringify(collection)); return true; }
    catch (e) { console.error('Failed to save collection:', e); return false; }
  },

  recordScenarioStart(scenario) {
    const collection = this.getCollection();
    const now = Date.now();
    if (!collection.scenarios[scenario.id]) {
      collection.scenarios[scenario.id] = { name: scenario.name, playCount: 0, firstTime: now, lastTime: now };
    }
    collection.scenarios[scenario.id].playCount++;
    collection.scenarios[scenario.id].lastTime = now;
    collection.stats.totalGames++;
    this.saveCollection(collection);
    return collection;
  },

  recordGameEnd(player, ending, gameState) {
    const collection = this.getCollection();
    const now = Date.now();
    if (!collection.endings[ending.id]) {
      collection.endings[ending.id] = { name: ending.name, description: ending.description, count: 0, firstTime: now };
    }
    collection.endings[ending.id].count++;
    if (player.lifeChoiceHistory) {
      player.lifeChoiceHistory.forEach(choice => {
        if (!collection.lifeChoices[choice.age]) collection.lifeChoices[choice.age] = {};
        if (!collection.lifeChoices[choice.age][choice.choiceId]) {
          collection.lifeChoices[choice.age][choice.choiceId] = { name: choice.choiceName, count: 0 };
        }
        collection.lifeChoices[choice.age][choice.choiceId].count++;
      });
    }
    collection.stats.totalMonths += gameState.totalMonthsPlayed || 0;
    const netWorth = player.getNetWorth ? player.getNetWorth() : 0;
    if (netWorth > collection.stats.bestNetWorth) {
      collection.stats.bestNetWorth = netWorth;
      collection.stats.bestAge = player.age;
    }
    let maxCount = 0, mostPlayed = null;
    Object.keys(collection.scenarios).forEach(id => {
      if (collection.scenarios[id].playCount > maxCount) { maxCount = collection.scenarios[id].playCount; mostPlayed = id; }
    });
    collection.stats.mostPlayedScenario = mostPlayed;

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
        age: c.age, choiceId: c.choiceId, choiceName: c.choiceName
      })) : [],
      playTime: Date.now()
    };

    const newlyUnlocked = this.checkAndUnlockAchievements(collection, player, ending, gameState);
    collection.newlyUnlockedAchievements = newlyUnlocked;

    this.saveCollection(collection);
    return collection;
  },

  checkAndUnlockAchievements(collection, player, ending, gameState) {
    const newlyUnlocked = [];
    if (!collection.achievements) collection.achievements = {};
    Object.keys(ACHIEVEMENTS).forEach(achievementId => {
      const achievement = ACHIEVEMENTS[achievementId];
      if (collection.achievements[achievementId]) return;
      try {
        if (achievement.check(collection, player, ending, gameState)) {
          collection.achievements[achievementId] = {
            name: achievement.name, icon: achievement.icon,
            description: achievement.description, category: achievement.category,
            unlockTime: Date.now()
          };
          newlyUnlocked.push(achievement);
        }
      } catch (e) { console.error('Achievement check error:', achievementId, e); }
    });
    return newlyUnlocked;
  },

  getAchievements() {
    const collection = this.getCollection();
    const result = [];
    Object.keys(ACHIEVEMENTS).forEach(id => {
      const achievement = ACHIEVEMENTS[id];
      const unlocked = collection.achievements && collection.achievements[id];
      result.push({
        id: id, name: achievement.name, icon: achievement.icon,
        description: achievement.description, category: achievement.category,
        unlocked: !!unlocked, unlockTime: unlocked ? unlocked.unlockTime : null
      });
    });
    return result;
  },

  getAchievementProgress() {
    const achievements = this.getAchievements();
    const unlocked = achievements.filter(a => a.unlocked).length;
    return { total: achievements.length, unlocked: unlocked, percentage: Math.round((unlocked / achievements.length) * 100) };
  },

  hasExperiencedChoice(age, choiceId) {
    const collection = this.getCollection();
    return collection.lifeChoices[age] && collection.lifeChoices[age][choiceId] && collection.lifeChoices[age][choiceId].count > 0;
  },

  hasExperiencedEnding(endingId) {
    const collection = this.getCollection();
    return collection.endings[endingId] && collection.endings[endingId].count > 0;
  },

  getProgress() {
    const collection = this.getCollection();
    const totalScenarios = SCENARIOS ? SCENARIOS.length : 6;
    const totalEndings = 5;
    const totalLifeChoices = Object.keys(LIFE_CHOICES).reduce((sum, age) => sum + LIFE_CHOICES[age].choices.length, 0);
    const collectedScenarios = Object.keys(collection.scenarios).length;
    const collectedEndings = Object.keys(collection.endings).length;
    const collectedChoices = Object.keys(collection.lifeChoices).reduce((sum, age) => sum + Object.keys(collection.lifeChoices[age]).length, 0);
    return {
      scenarios: { collected: collectedScenarios, total: totalScenarios },
      endings: { collected: collectedEndings, total: totalEndings },
      lifeChoices: { collected: collectedChoices, total: totalLifeChoices },
      overall: Math.round(((collectedScenarios + collectedEndings + collectedChoices) / (totalScenarios + totalEndings + totalLifeChoices)) * 100)
    };
  },

  hasLastGame() {
    const collection = this.getCollection();
    return collection.lastGame !== null && collection.lastGame !== undefined;
  },

  getLastGameSummary() {
    const collection = this.getCollection();
    return collection.lastGame;
  },

  getMemoryLevel() {
    const collection = this.getCollection();
    const totalGames = collection.stats.totalGames || 0;
    if (totalGames <= 0) return 0;
    if (totalGames <= 2) return 1;
    if (totalGames <= 4) return 2;
    return 3;
  },

  getExperiencedChoicesByAge(age) {
    const collection = this.getCollection();
    if (!collection.lifeChoices[age]) return [];
    return Object.keys(collection.lifeChoices[age]).map(choiceId => ({
      choiceId: choiceId, name: collection.lifeChoices[age][choiceId].name, count: collection.lifeChoices[age][choiceId].count
    }));
  },

  getUnexperiencedChoicesCount() {
    if (typeof LIFE_CHOICES === 'undefined') return 0;
    const collection = this.getCollection();
    let total = 0, experienced = 0;
    Object.keys(LIFE_CHOICES).forEach(age => {
      LIFE_CHOICES[age].choices.forEach(choice => {
        total++;
        if (collection.lifeChoices[age] && collection.lifeChoices[age][choice.id]) experienced++;
      });
    });
    return { total, experienced, unexperienced: total - experienced };
  },

  resetCollection() {
    localStorage.removeItem(this.STORAGE_KEY);
    return true;
  }
};
