/**
 * 游戏状态管理
 */
const GamePhase = {
  MENU: 'menu', SCENARIO_SELECT: 'scenario_select', PLAYING: 'playing',
  EVENT: 'event', SKILL_TREE: 'skill_tree', INVEST: 'invest',
  GAME_OVER: 'game_over', YEAR_REVIEW: 'year_review'
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
    this.player.addEventLog(`🎬 人生大幕拉开！你以【${scenario.name}】的身份开始了新的人生。`);
    this.player.addEventLog(`💡 ${scenario.tips}`);
    return this.player;
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
    this.applyNaturalDecay();
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
          this.addNotification(`🎉 学会了新技能：${skill.name}`);
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
          this.addNotification(`⭐ 技能升级：${skill.name} Lv.${newLevel}`);
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
    if (!this.player.isRetired) {
      this.player.salary = Math.round(this.player.salary * 1.05);
    }
    this.player.baseExpense = Math.round(this.player.baseExpense * 1.03);
    if (this.player.age > 40) {
      this.player.maxHealth = Math.max(60, 100 - (this.player.age - 40));
    }
    this.player.addEventLog(`🎂 ${this.player.age}岁了！新的一年开始。`);
  }
  checkGameOver() {
    if (this.player.health <= 0) {
      return { reason: 'death', message: '你的健康耗尽了，人生谢幕。' };
    }
    if (this.player.age >= 80) {
      return { reason: 'age', message: '你活到了80岁，人生圆满。' };
    }
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
    const milestone = MILESTONE_EVENTS[this.player.age];
    if (milestone && this.currentMonth === 1) {
      const triggered = this.player.eventLog.some(log => log.text.includes(milestone[0].name));
      if (!triggered) { return milestone[0]; }
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
      if (req.minNetwork && this.player.network < req.minNetwork) {
        return { success: false, message: '人脉不足，无法选择此项。' };
      }
      if (req.minSavings && this.player.savings < req.minSavings) {
        return { success: false, message: '储蓄不足，无法选择此项。' };
      }
    }
    const applied = this.player.applyEffects(choice.effects || {});
    this.player.addEventLog(`${this.pendingEvent.icon} ${this.pendingEvent.name}：${choice.resultText || choice.text}`);
    const result = { success: true, event: this.pendingEvent, choice, applied, resultText: choice.resultText };
    this.pendingEvent = null;
    this.phase = GamePhase.PLAYING;
    return result;
  }
  learnSkill(skillId) {
    const skill = LEARNABLE_SKILLS[skillId];
    if (!skill) return { success: false, message: '技能不存在' };
    if (this.player.learnedSkills[skillId]) return { success: false, message: '已经学会了' };
    if (!this.player.checkPrerequisite(skill)) return { success: false, message: '前置技能未满足' };
    if (!this.player.checkPrerequisiteCondition(skill)) return { success: false, message: '条件未满足' };
    if (this.player.savings < skill.cost) return { success: false, message: '金钱不足' };
    if (this.player.learningQueue.some(q => q.skillId === skillId)) {
      return { success: false, message: '正在学习中' };
    }
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
    if (this.player.learningQueue.some(q => q.skillId === skillId)) {
      return { success: false, message: '正在升级中' };
    }
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
    if (this.notifications.length > 10) { this.notifications = this.notifications.slice(0, 10); }
  }
  getFinancialStage() {
    const monthlyExpense = this.player.getMonthlyExpense().total;
    const emergencyFund = this.player.savings;
    const passive = this.player.passiveIncome + Math.round(this.player.investments * 0.006);
    if (emergencyFund >= monthlyExpense * 6 && passive >= monthlyExpense) {
      return { stage: 'financial_freedom', name: '财务自由', color: '#52C41A' };
    } else if (emergencyFund >= monthlyExpense * 6 && passive >= monthlyExpense * 0.5) {
      return { stage: 'financial_stability', name: '财务稳定', color: '#8BC8EA' };
    } else if (emergencyFund >= monthlyExpense * 6) {
      return { stage: 'financial_security', name: '财务安全', color: '#A2DDAA' };
    } else {
      const progress = Math.min(100, Math.round(emergencyFund / (monthlyExpense * 6) * 100));
      return { stage: 'financial_survival', name: '财务求生', color: '#EA6668', progress };
    }
  }
  calculateEnding() {
    const netWorth = this.player.getNetWorth();
    const passive = this.player.passiveIncome + Math.round(this.player.investments * 0.006);
    const monthlyExpense = this.player.getMonthlyExpense().total;
    if (passive >= monthlyExpense && netWorth > 5000000) {
      return { id: 'financial_freedom', name: '🏆 财务自由型', description: '你实现了财务自由，被动收入覆盖所有支出，净资产超过500万。' };
    }
    if (this.player.careerLevel >= 5) {
      return { id: 'career_success', name: '🎖️ 事业成功型', description: '你在事业上达到了顶峰，成为行业内有影响力的人物。' };
    }
    if (this.player.isMarried && this.player.childrenCount > 0 && this.player.happiness > 80) {
      return { id: 'family_happiness', name: '👨‍👩‍👧 家庭幸福型', description: '你拥有幸福的家庭，婚姻美满，子女成才，人生无憾。' };
    }
    if (netWorth < 0 || this.player.health <= 0) {
      return { id: 'bankruptcy', name: '💔 破产人生型', description: '你的人生以破产告终，资不抵债，健康崩溃。' };
    }
    return { id: 'peaceful', name: '🏠 平凡安稳型', description: '你过着平凡但安稳的一生，有房有车，家庭和睦，虽无大富大贵但也无憾。' };
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
      if (data.player) { this.player = Player.deserialize(data.player); }
      return true;
    } catch (e) { console.error('Load failed:', e); return false; }
  }
  clearSave() { localStorage.removeItem('life_is_a_stage_save'); }
}
