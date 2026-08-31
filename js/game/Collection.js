/**
 * 人生图鉴系统
 * 收集玩家体验过的剧本、结局、岔路选择，激发重开欲望
 */

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
    this.saveCollection(collection);
    return collection;
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

  resetCollection() {
    localStorage.removeItem(this.STORAGE_KEY);
    return true;
  }
};
