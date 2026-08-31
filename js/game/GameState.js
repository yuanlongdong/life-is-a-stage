/**
 * 游戏状态管理
 */

const GamePhase = {
  MENU: 'menu',
  SCENARIO_SELECT: 'scenario_select',
  PLAYING: 'playing',
  EVENT: 'event',
  SKILL_TREE: 'skill_tree',
  INVEST: 'invest',
  RELATIONSHIPS: 'relationships',
  GAME_OVER: 'game_over',
  YEAR_REVIEW: 'year_review',
  COLLECTION: 'collection',
  LAST_GAME_REVIEW: 'last_game_review'
};

class GameState {
  constructor() {
    this.phase = GamePhase.MENU;
    this.player = null;
    this.currentMonth = 1;
    this.currentYear = 1;
    this.gameStartTime = null;
    this.isPaused = false;
    this.pendingEvent = null;
    this.skillPoints = 0;
    this.totalMonthsPlayed = 0;
    this.notifications = [];
    this.relationshipManager = new RelationshipManager();
  }

  startNewGame(scenario) {
    this.player = new Player(scenario);
    this.phase = GamePhase.PLAYING;
    this.currentMonth = 1;
    this.currentYear = 1;
    this.gameStartTime = Date.now();
    this.totalMonthsPlayed = 0;
    this.skillPoints = 0;
    this.notifications = [];
    this.scenarioStartAge = this.player.age;
    this.memoryInherited = false;
    this.endingRecorded = false;
    this.relationshipManager = new RelationshipManager();

    if (typeof CollectionManager !== 'undefined') {
      CollectionManager.recordScenarioStart(scenario);
    }

    this.player.addEventLog(`🎬 人生大幕拉开！你以【${scenario.name}】的身份开始了新的人生。`);
    this.player.addEventLog(`💡 ${scenario.tips}`);

    if (typeof CollectionManager !== 'undefined' &&
        CollectionManager.hasLastGame() &&
        CollectionManager.getMemoryLevel() >= 1) {
      this.lastGameSummary = CollectionManager.getLastGameSummary();
      this.memoryLevel = CollectionManager.getMemoryLevel();
      this.phase = GamePhase.LAST_GAME_REVIEW;
      return this.player;
    }

    const initialLifeChoice = LIFE_CHOICES[this.player.age];
    if (initialLifeChoice && !this.player.lifeChoices[this.player.age]) {
      this.pendingEvent = initialLifeChoice;
      this.phase = GamePhase.EVENT;
    }

    return this.player;
  }

  continueAfterLastGameReview() {
    this.phase = GamePhase.PLAYING;
    const initialLifeChoice = LIFE_CHOICES[this.player.age];
    if (initialLifeChoice && !this.player.lifeChoices[this.player.age]) {
      this.pendingEvent = initialLifeChoice;
      this.phase = GamePhase.EVENT;
    }
  }

  advanceMonth() {
    if (!this.player || this.phase !== GamePhase.PLAYING) return null;
    const month = this.currentMonth;
    const year = this.currentYear;
    const income = this.player.getMonthlyIncome();
    const expense = this.player.getMonthlyExpense();
    const balance = income.total - expense.total;

    this.player.savings += balance;
    if (this.player.debt > 0) {
      const principalPayment = expense.debtPrincipal;
      this.player.debt = Math.max(0, this.player.debt - principalPayment);
    }

    const investGain = Math.round(this.player.investments * (0.006 + this.player.modifiers.investmentReturnBonus / 12));
    this.player.investments += investGain;
    this.processLearningQueue();

    if (this.player.careerDelayMonths > 0) {
      this.player.careerDelayMonths--;
      if (this.player.careerDelayMonths === 0 && !this.player.careerDelayApplied) {
        const baseSalary = this.player.salary;
        this.player.salary = Math.round(baseSalary * this.player.salaryStartMultiplier);
        this.player.careerDelayApplied = true;
        this.player.addEventLog(`🎓 职业延迟结束！工资起点调整为 ¥${this.player.salary}（倍率${this.player.salaryStartMultiplier}x）。`);
      }
    }

    this.applyNaturalDecay();
    this.updateRelationships();
    this.player.recordMonthlyData(month, year);

    this.currentMonth++;
    this.totalMonthsPlayed++;
    if (this.currentMonth > 12) {
      this.currentMonth = 1;
      this.currentYear++;
      this.player.age++;
      this.applyYearlyChanges();
      this.phase = GamePhase.YEAR_REVIEW;
    }

    const gameOver = this.checkGameOver();
    if (gameOver) {
      this.phase = GamePhase.GAME_OVER;
      return { gameOver, income, expense, balance };
    }

    const event = this.checkForEvent();
    if (event) {
      this.pendingEvent = event;
      this.phase = GamePhase.EVENT;
    }

    return { income, expense, balance, event, gameOver: null };
  }

  // 人际关系每月更新
  updateRelationships() {
    if (!this.relationshipManager) return;
    this.relationshipManager.updateFriendships();
    this.relationshipManager.updatePartner();
    this.relationshipManager.updateChildren(this.player);
    if (Math.random() < 0.1) {
      this.triggerRandomRelationshipEvent();
    }
  }

  // 触发随机关联事件
  triggerRandomRelationshipEvent() {
    const rm = this.relationshipManager;
    const eventTypes = [];
    if (rm.friends.length > 0) eventTypes.push('friend_help', 'friend_opportunity');
    if (rm.friends.length < 10 && this.player.network > 20) eventTypes.push('make_friend');
    if (rm.partner && rm.partner.status === 'dating') eventTypes.push('date_reminder');
    if (rm.partner && rm.partner.status === 'married' && rm.children.length < 3 && this.player.age >= 25 && this.player.age <= 40) eventTypes.push('have_child_opportunity');
    if (eventTypes.length === 0) return;

    const eventType = eventTypes[Math.floor(Math.random() * eventTypes.length)];
    if (eventType === 'make_friend') {
      const contexts = ['work', 'social', 'hobby', 'online'];
      const context = contexts[Math.floor(Math.random() * contexts.length)];
      const friend = rm.makeFriend(this.player, context);
      this.addNotification(`🤝 认识了新朋友：${friend.name}`);
      this.player.network = Math.min(100, this.player.network + 2);
    } else if (eventType === 'friend_help') {
      const friend = rm.friends[Math.floor(Math.random() * rm.friends.length)];
      const helpEvent = rm.friendAsksForHelp(friend.id, this.player);
      if (helpEvent) {
        this.pendingEvent = {
          id: 'rel_friend_help', category: 'relationship', name: `${friend.name}求助`, icon: '🆘',
          description: helpEvent.description,
          choices: helpEvent.choices.map(c => ({ text: c.text, resultText: '', effects: {}, customEffect: c.effect }))
        };
        this.phase = GamePhase.EVENT;
      }
    } else if (eventType === 'friend_opportunity') {
      const friend = rm.friends[Math.floor(Math.random() * rm.friends.length)];
      const opportunity = rm.friendBringsOpportunity(friend.id, this.player);
      if (opportunity) {
        this.pendingEvent = {
          id: 'rel_friend_opportunity', category: 'relationship', name: opportunity.title, icon: '✨',
          description: opportunity.description,
          choices: [
            { text: '接受机会', resultText: '', effects: {}, customEffect: (p) => { const result = opportunity.effect(p); return result.message; } },
            { text: '婉拒', resultText: '你婉拒了这个机会。', effects: {} }
          ]
        };
        this.phase = GamePhase.EVENT;
      }
    } else if (eventType === 'date_reminder') {
      this.addNotification(`💕 记得和${rm.partner.name}约会，增进感情`);
    } else if (eventType === 'have_child_opportunity') {
      this.pendingEvent = {
        id: 'rel_have_child', category: 'relationship', name: '想要个孩子？', icon: '👶',
        description: `你和${rm.partner.name}讨论着要不要个孩子。`,
        choices: [
          { text: '生孩子', resultText: '', effects: {}, customEffect: (p) => { const result = rm.haveChild(p); return result.success ? result.message : '这次没有成功怀孕。'; } },
          { text: '再等等', resultText: '你们决定再等等。', effects: {} }
        ]
      };
      this.phase = GamePhase.EVENT;
    }
  }

  processLearningQueue() {
    const completed = [];
    this.player.learningQueue = this.player.learningQueue.filter(item => {
      item.remainingMonths--;
      if (item.remainingMonths <= 0) { completed.push(item); return false; }
      return true;
    });
    completed.forEach(item => {
      if (item.type === 'learn') {
        const skill = LEARNABLE_SKILLS[item.skillId];
        if (skill) {
          this.player.learnedSkills[item.skillId] = true;
          this.player.skillLevels[skill.category] = (this.player.skillLevels[skill.category] || 0) + 1;
          const applied = this.player.applyEffects(skill.effects);
          this.player.addEventLog(`📖 学习完成【${skill.name}】：${applied.join('，')}`);
        }
      } else if (item.type === 'develop') {
        const skill = DEVELOPABLE_SKILLS[item.skillId];
        if (skill) {
          const currentLevel = this.player.developedSkills[item.skillId] || 0;
          const newLevel = Math.min(skill.maxLevel, currentLevel + 1);
          this.player.developedSkills[item.skillId] = newLevel;
          this.player.skillLevels[skill.category] = (this.player.skillLevels[skill.category] || 0) + 1;
          if (skill.effectsPerLevel) {
            const applied = this.player.applyEffects(skill.effectsPerLevel);
            this.player.addEventLog(`⬆️ 【${skill.name}】升级到 Lv.${newLevel}：${applied.join('，')}`);
          }
        }
      }
    });
  }

  applyNaturalDecay() {
    if (!this.player.learnedSkills['life_fitness']) {
      this.player.health = Math.max(0, this.player.health - 1);
    }
    if (Math.random() < 0.1) {
      this.player.network = Math.max(0, this.player.network - 1);
    }
    if (this.player.debt > this.player.savings * 2) {
      this.player.happiness = Math.max(0, this.player.happiness - 1);
    }
  }

  applyYearlyChanges() {
    if (!this.player.isRetired && this.player.careerDelayMonths === 0) {
      const growthRate = 1.05 * (this.player.modifiers.salaryGrowthMultiplier || 1);
      this.player.salary = Math.round(this.player.salary * growthRate);
    }
    this.player.baseExpense = Math.round(this.player.baseExpense * 1.03);
    if (this.player.age > 40) {
      this.player.maxHealth = Math.max(60, 100 - (this.player.age - 40));
    }
    this.player.addEventLog(`🎂 ${this.player.age}岁了！新的一年开始。`);
  }

  checkGameOver() {
    if (this.player.health <= 0) return { reason: 'death', message: '你的健康耗尽了，人生谢幕。' };
    if (this.player.age >= 80) return { reason: 'age', message: '你活到了80岁，人生圆满。' };
    if (this.player.monthlyHistory.length >= 3) {
      const recent = this.player.monthlyHistory.slice(-3);
      const allNegative = recent.every(h => h.balance < 0);
      if (allNegative && this.player.savings < 0) {
        return { reason: 'bankruptcy', message: '你破产了，资不抵债。' };
      }
    }
    return null;
  }

  checkForEvent() {
    const lifeChoice = LIFE_CHOICES[this.player.age];
    if (lifeChoice && this.currentMonth === 1 && !this.player.lifeChoices[this.player.age]) {
      return lifeChoice;
    }
    const milestone = MILESTONE_EVENTS[this.player.age];
    if (milestone && this.currentMonth === 1) {
      const triggered = this.player.eventLog.some(log => log.text.includes(milestone[0].name));
      if (!triggered) return milestone[0];
    }
    if (Math.random() < 0.30) {
      const eligibleEvents = EVENTS.filter(event => {
        if (!event.triggerCondition) return true;
        const cond = event.triggerCondition;
        if (cond.minAge && this.player.age < cond.minAge) return false;
        if (cond.maxAge && this.player.age > cond.maxAge) return false;
        if (cond.minCareerLevel && this.player.careerLevel < cond.minCareerLevel) return false;
        if (cond.minNetwork && this.player.network < cond.minNetwork) return false;
        if (cond.minSavings && this.player.savings < cond.minSavings) return false;
        if (cond.minInvestment && this.player.investments < cond.minInvestment) return false;
        if (cond.minSalary && this.player.salary < cond.minSalary) return false;
        if (cond.maxHealth && this.player.health > cond.maxHealth) return false;
        if (cond.isMarried !== undefined && cond.isMarried !== this.player.isMarried) return false;
        return true;
      });
      if (eligibleEvents.length > 0) {
        const totalProb = eligibleEvents.reduce((sum, e) => sum + (e.probability || 0.1), 0);
        let rand = Math.random() * totalProb;
        for (const event of eligibleEvents) {
          rand -= (event.probability || 0.1);
          if (rand <= 0) return event;
        }
        return eligibleEvents[0];
      }
    }
    return null;
  }

  resolveEventChoice(choiceIndex) {
    if (!this.pendingEvent) return null;
    const choice = this.pendingEvent.choices[choiceIndex];
    if (!choice) return null;
    if (choice.requirement) {
      const req = choice.requirement;
      if (req.minNetwork && this.player.network < req.minNetwork) return { success: false, message: '人脉不足，无法选择此项。' };
      if (req.minSavings && this.player.savings < req.minSavings) return { success: false, message: '储蓄不足，无法选择此项。' };
    }
    if (this.pendingEvent.isLifeChoice) {
      const age = this.pendingEvent.age;
      this.player.lifeChoices[age] = choice.id;
      this.player.lifeChoiceHistory.push({ age: age, choiceId: choice.id, choiceName: choice.shortName || choice.text, month: this.currentMonth, year: this.currentYear });
      if (choice.unlocks) {
        choice.unlocks.forEach(route => { if (this.player.lifeRoutes.hasOwnProperty(route)) this.player.lifeRoutes[route] = true; });
      }
      if (choice.longTermEffects) this.applyLongTermEffects(choice.longTermEffects);
      if (choice.midTermEffects) this.applyLongTermEffects(choice.midTermEffects);
      this.player.addEventLog(`🚦 【人生岔路·${age}岁】你选择了「${choice.shortName || choice.text}」。这个选择将改变你接下来的人生轨迹。`);
    }
    if (choice.customEffect) {
      const customResult = choice.customEffect(this.player);
      if (customResult) this.player.addEventLog(`${this.pendingEvent.icon} ${this.pendingEvent.name}：${customResult}`);
    } else {
      const applied = this.player.applyEffects(choice.effects || choice.immediateEffects || {});
      this.player.addEventLog(`${this.pendingEvent.icon} ${this.pendingEvent.name}：${choice.resultText || choice.text}`);
    }
    const result = { success: true, event: this.pendingEvent, choice, resultText: choice.resultText };
    this.pendingEvent = null;
    this.phase = GamePhase.PLAYING;
    return result;
  }

  applyLongTermEffects(effects) {
    if (!effects) return;
    const p = this.player;
    if (effects.careerLine) p.careerLine = effects.careerLine;
    if (effects.salaryGrowthMultiplier) p.modifiers.salaryGrowthMultiplier = (p.modifiers.salaryGrowthMultiplier || 1) * effects.salaryGrowthMultiplier;
    if (effects.salaryCapMultiplier) p.modifiers.salaryCapMultiplier = (p.modifiers.salaryCapMultiplier || 1) * effects.salaryCapMultiplier;
    if (effects.investmentReturnMultiplier) p.modifiers.investmentReturnBonus = (p.modifiers.investmentReturnBonus || 0) + (effects.investmentReturnMultiplier - 1);
    if (effects.sideIncomeGrowthMultiplier) p.modifiers.sideIncomeGrowthMultiplier = (p.modifiers.sideIncomeGrowthMultiplier || 1) * effects.sideIncomeGrowthMultiplier;
    if (effects.happinessCapBonus) p.modifiers.happinessCapBonus = (p.modifiers.happinessCapBonus || 0) + effects.happinessCapBonus;
    if (effects.hasHouse) p.hasHouse = true;
    if (effects.startupEndingPossible) p.canGetStartupEnding = true;
    if (effects.familyEndingPossible) p.canGetFamilyEnding = true;
    if (effects.delayedCareer) {
      p.careerDelayMonths = effects.delayedCareer;
      p.careerDelayApplied = false;
      p.addEventLog(`📚 职业开始延迟${effects.delayedCareer}个月，期间无工资收入。`);
    }
    if (effects.salaryStartMultiplier) p.salaryStartMultiplier = effects.salaryStartMultiplier;
  }

  learnSkill(skillId) {
    const skill = LEARNABLE_SKILLS[skillId];
    if (!skill) return { success: false, message: '技能不存在' };
    if (this.player.learnedSkills[skillId]) return { success: false, message: '已经学会了' };
    if (!this.player.checkPrerequisite(skill)) return { success: false, message: '前置技能未满足' };
    if (!this.player.checkPrerequisiteCondition(skill)) return { success: false, message: '条件未满足' };
    if (this.player.savings < skill.cost) return { success: false, message: '金钱不足' };
    if (this.player.learningQueue.some(q => q.skillId === skillId)) return { success: false, message: '正在学习中' };
    this.player.savings -= skill.cost;
    const duration = Math.max(1, Math.round(skill.duration / this.player.modifiers.learningSpeedMultiplier));
    this.player.learningQueue.push({ skillId, type: 'learn', remainingMonths: duration, totalMonths: duration });
    this.player.addEventLog(`📚 开始学习【${skill.name}】，预计${duration}个月完成。`);
    return { success: true, message: `开始学习${skill.name}`, duration };
  }

  developSkill(skillId) {
    const skill = DEVELOPABLE_SKILLS[skillId];
    if (!skill) return { success: false, message: '技能不存在' };
    const currentLevel = this.player.developedSkills[skillId] || 0;
    if (currentLevel >= skill.maxLevel) return { success: false, message: '已满级' };
    if (this.player.savings < skill.costPerLevel) return { success: false, message: '金钱不足' };
    if (this.player.learningQueue.some(q => q.skillId === skillId)) return { success: false, message: '正在升级中' };
    this.player.savings -= skill.costPerLevel;
    const duration = Math.max(1, Math.round(skill.durationPerLevel / this.player.modifiers.learningSpeedMultiplier));
    this.player.learningQueue.push({ skillId, type: 'develop', remainingMonths: duration, totalMonths: duration });
    this.player.addEventLog(`⬆️ 开始升级【${skill.name}】到 Lv.${currentLevel + 1}，预计${duration}个月。`);
    return { success: true, message: `开始升级${skill.name}`, duration };
  }

  invest(amount, type) {
    if (this.player.savings < amount) return { success: false, message: '储蓄不足' };
    if (type === 'fund' && !this.player.unlocks.fund) return { success: false, message: '未解锁基金投资' };
    if (type === 'stock' && !this.player.unlocks.stock) return { success: false, message: '未解锁股票投资' };
    this.player.savings -= amount;
    this.player.investments += amount;
    this.player.addEventLog(`💹 投资${type === 'fund' ? '基金' : '股票'} ¥${amount}`);
    return { success: true };
  }

  withdrawInvestment(amount) {
    if (this.player.investments < amount) return { success: false, message: '投资不足' };
    this.player.investments -= amount;
    this.player.savings += amount;
    this.player.addEventLog(`💰 取出投资 ¥${amount}`);
    return { success: true };
  }

  repayDebt(amount) {
    if (this.player.savings < amount) return { success: false, message: '储蓄不足' };
    const actualPayment = Math.min(amount, this.player.debt);
    this.player.savings -= actualPayment;
    this.player.debt -= actualPayment;
    this.player.addEventLog(`💳 提前还债 ¥${actualPayment}，剩余负债 ¥${this.player.debt}`);
    return { success: true, actualPayment };
  }

  addNotification(message) {
    this.notifications.unshift({ message, time: Date.now() });
    if (this.notifications.length > 10) this.notifications = this.notifications.slice(0, 10);
  }

  getFinancialStage() {
    const monthlyExpense = this.player.getMonthlyExpense().total;
    const emergencyFund = this.player.savings;
    const passive = this.player.passiveIncome + Math.round(this.player.investments * 0.006);
    if (emergencyFund >= monthlyExpense * 6 && passive >= monthlyExpense) return { stage: 'financial_freedom', name: '财务自由', color: '#52C41A' };
    else if (emergencyFund >= monthlyExpense * 6 && passive >= monthlyExpense * 0.5) return { stage: 'financial_stability', name: '财务稳定', color: '#8BC8EA' };
    else if (emergencyFund >= monthlyExpense * 6) return { stage: 'financial_security', name: '财务安全', color: '#A2DDAA' };
    else {
      const progress = Math.min(100, Math.round(emergencyFund / (monthlyExpense * 6) * 100));
      return { stage: 'financial_survival', name: '财务求生', color: '#EA6668', progress };
    }
  }

  calculateEnding() {
    const netWorth = this.player.getNetWorth();
    const passive = this.player.passiveIncome + Math.round(this.player.investments * 0.006);
    const monthlyExpense = this.player.getMonthlyExpense().total;
    let ending;
    if (passive >= monthlyExpense && netWorth > 5000000) ending = { id: 'financial_freedom', name: '🏆 财务自由型', description: '你实现了财务自由，被动收入覆盖所有支出，净资产超过500万。' };
    else if (this.player.careerLevel >= 5) ending = { id: 'career_success', name: '🎖️ 事业成功型', description: '你在事业上达到了顶峰，成为行业内有影响力的人物。' };
    else if (this.player.isMarried && this.player.childrenCount > 0 && this.player.happiness > 80) ending = { id: 'family_happiness', name: '👨‍👩‍👧 家庭幸福型', description: '你拥有幸福的家庭，婚姻美满，子女成才，人生无憾。' };
    else if (netWorth < 0 || this.player.health <= 0) ending = { id: 'bankruptcy', name: '💔 破产人生型', description: '你的人生以破产告终，资不抵债，健康崩溃。' };
    else ending = { id: 'peaceful', name: '🏠 平凡安稳型', description: '你过着平凡但安稳的一生，有房有车，家庭和睦，虽无大富大贵但也无憾。' };
    ending.parallelHooks = this.calculateParallelHooks();
    if (!this.endingRecorded && typeof CollectionManager !== 'undefined') {
      this.endingRecorded = true;
      CollectionManager.recordGameEnd(this.player, ending, this);
    }
    return ending;
  }

  calculateParallelHooks() {
    const hooks = [];
    const p = this.player;
    const chosenAges = Object.keys(p.lifeChoices).map(Number).sort((a, b) => a - b);
    for (const age of chosenAges) {
      const choiceId = p.lifeChoices[age];
      const lifeChoice = LIFE_CHOICES[age];
      if (!lifeChoice) continue;
      const chosenOption = lifeChoice.choices.find(c => c.id === choiceId);
      if (chosenOption && chosenOption.parallelHook) hooks.push({ type: 'not_chosen', age: age, text: chosenOption.parallelHook });
      if (PARALLEL_HOOKS.notChosen[age] && PARALLEL_HOOKS.notChosen[age][choiceId]) {
        const exists = hooks.some(h => h.text === PARALLEL_HOOKS.notChosen[age][choiceId]);
        if (!exists) hooks.push({ type: 'not_chosen', age: age, text: PARALLEL_HOOKS.notChosen[age][choiceId] });
      }
    }
    if (p.sideIncome <= 0 && p.age >= 30) hooks.push({ type: 'generic', text: PARALLEL_HOOKS.generic.noSideIncome });
    if (p.investments <= 10000 && p.age >= 35) hooks.push({ type: 'generic', text: PARALLEL_HOOKS.generic.noInvestment });
    if (p.health < 40) hooks.push({ type: 'generic', text: PARALLEL_HOOKS.generic.poorHealth });
    if (!p.isMarried && p.age >= 35) hooks.push({ type: 'generic', text: PARALLEL_HOOKS.generic.noMarriage });
    if (p.debt > 100000) hooks.push({ type: 'generic', text: PARALLEL_HOOKS.generic.highDebt });
    const choiceHooks = hooks.filter(h => h.type === 'not_chosen');
    const genericHooks = hooks.filter(h => h.type === 'generic');
    for (let i = genericHooks.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [genericHooks[i], genericHooks[j]] = [genericHooks[j], genericHooks[i]];
    }
    const finalHooks = [];
    const maxHooks = 3;
    for (const h of choiceHooks) { if (finalHooks.length >= maxHooks) break; finalHooks.push(h); }
    for (const h of genericHooks) { if (finalHooks.length >= maxHooks) break; finalHooks.push(h); }
    if (finalHooks.length === 0) finalHooks.push({ type: 'default', text: '人生没有如果，但如果有呢？再开一局，试试不同的选择。' });
    return finalHooks.map(h => h.text);
  }

  save() {
    const saveData = {
      phase: this.phase, currentMonth: this.currentMonth, currentYear: this.currentYear,
      totalMonthsPlayed: this.totalMonthsPlayed, skillPoints: this.skillPoints,
      player: this.player ? this.player.serialize() : null, savedAt: Date.now()
    };
    localStorage.setItem('life_is_a_stage_save', JSON.stringify(saveData));
    return true;
  }

  load() {
    const saveData = localStorage.getItem('life_is_a_stage_save');
    if (!saveData) return false;
    try {
      const data = JSON.parse(saveData);
      this.phase = data.phase;
      this.currentMonth = data.currentMonth;
      this.currentYear = data.currentYear;
      this.totalMonthsPlayed = data.totalMonthsPlayed;
      this.skillPoints = data.skillPoints;
      if (data.player) this.player = Player.deserialize(data.player);
      return true;
    } catch (e) { console.error('Load failed:', e); return false; }
  }

  clearSave() {
    localStorage.removeItem('life_is_a_stage_save');
  }
}
