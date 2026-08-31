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
  GAME_OVER: 'game_over',
  YEAR_REVIEW: 'year_review'
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

  // 开始新游戏
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

    // 【修复】检查初始年龄是否有人生岔路，有则立即触发
    const initialLifeChoice = LIFE_CHOICES[this.player.age];
    if (initialLifeChoice && !this.player.lifeChoices[this.player.age]) {
      this.pendingEvent = initialLifeChoice;
      this.phase = GamePhase.EVENT;
    }

    return this.player;
  }

  // 推进一个月
  advanceMonth() {
    if (!this.player || this.phase !== GamePhase.PLAYING) return null;

    const month = this.currentMonth;
    const year = this.currentYear;

    // 1. 结算收入支出
    const income = this.player.getMonthlyIncome();
    const expense = this.player.getMonthlyExpense();
    const balance = income.total - expense.total;

    // 2. 更新储蓄和债务
    this.player.savings += balance;
    if (this.player.debt > 0) {
      const principalPayment = expense.debtPrincipal;
      this.player.debt = Math.max(0, this.player.debt - principalPayment);
    }

    // 3. 投资收益再投入
    const investGain = Math.round(this.player.investments * (0.006 + this.player.modifiers.investmentReturnBonus / 12));
    this.player.investments += investGain;

    // 4. 处理学习队列
    this.processLearningQueue();

    // 5. 属性自然变化
    this.applyNaturalDecay();

    // 6. 记录月度数据
    this.player.recordMonthlyData(month, year);

    // 7. 推进时间
    this.currentMonth++;
    this.totalMonthsPlayed++;
    if (this.currentMonth > 12) {
      this.currentMonth = 1;
      this.currentYear++;
      this.player.age++;
      this.applyYearlyChanges();
      this.phase = GamePhase.YEAR_REVIEW;
    }

    // 8. 检查游戏结束条件
    const gameOver = this.checkGameOver();
    if (gameOver) {
      this.phase = GamePhase.GAME_OVER;
      return { gameOver, income, expense, balance };
    }

    // 9. 检查是否触发事件
    const event = this.checkForEvent();
    if (event) {
      this.pendingEvent = event;
      this.phase = GamePhase.EVENT;
    }

    return { income, expense, balance, event, gameOver: null };
  }

  // 处理学习队列
  processLearningQueue() {
    const completed = [];
    this.player.learningQueue = this.player.learningQueue.filter(item => {
      item.remainingMonths--;
      if (item.remainingMonths <= 0) {
        completed.push(item);
        return false;
      }
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
          // 应用每级效果
          if (skill.effectsPerLevel) {
            const applied = this.player.applyEffects(skill.effectsPerLevel);
            this.player.addEventLog(`⬆️ 【${skill.name}】升级到 Lv.${newLevel}：${applied.join('，')}`);
          }
          this.addNotification(`⭐ 技能升级：${skill.name} Lv.${newLevel}`);
        }
      }
    });
  }

  // 属性自然衰减
  applyNaturalDecay() {
    // 健康每月自然衰减1点（如果没有健身）
    if (!this.player.learnedSkills['life_fitness']) {
      this.player.health = Math.max(0, this.player.health - 1);
    }
    // 长期不社交，人脉缓慢衰减
    if (Math.random() < 0.1) {
      this.player.network = Math.max(0, this.player.network - 1);
    }
    // 负债压力影响幸福
    if (this.player.debt > this.player.savings * 2) {
      this.player.happiness = Math.max(0, this.player.happiness - 1);
    }
  }

  // 年度变化
  applyYearlyChanges() {
    // 工资年度增长5%
    if (!this.player.isRetired) {
      this.player.salary = Math.round(this.player.salary * 1.05);
    }
    // 生活成本年度增长3%
    this.player.baseExpense = Math.round(this.player.baseExpense * 1.03);
    // 年龄增长带来的健康上限变化
    if (this.player.age > 40) {
      this.player.maxHealth = Math.max(60, 100 - (this.player.age - 40));
    }
    this.player.addEventLog(`🎂 ${this.player.age}岁了！新的一年开始。`);
  }

  // 检查游戏结束
  checkGameOver() {
    if (this.player.health <= 0) {
      return { reason: 'death', message: '你的健康耗尽了，人生谢幕。' };
    }
    if (this.player.age >= 80) {
      return { reason: 'age', message: '你活到了80岁，人生圆满。' };
    }
    // 连续3个月负结余且无储蓄
    if (this.player.monthlyHistory.length >= 3) {
      const recent = this.player.monthlyHistory.slice(-3);
      const allNegative = recent.every(h => h.balance < 0);
      if (allNegative && this.player.savings < 0) {
        return { reason: 'bankruptcy', message: '你破产了，资不抵债。' };
      }
    }
    return null;
  }

  // 检查是否触发事件
  checkForEvent() {
    // 【P0核心机制】检查关键年龄人生岔路（优先级最高，不可逆选择）
    const lifeChoice = LIFE_CHOICES[this.player.age];
    if (lifeChoice && this.currentMonth === 1) {
      if (!this.player.lifeChoices[this.player.age]) {
        return lifeChoice;
      }
    }

    // 检查里程碑事件
    const milestone = MILESTONE_EVENTS[this.player.age];
    if (milestone && this.currentMonth === 1) {
      // 检查是否已经触发过
      const triggered = this.player.eventLog.some(log => log.text.includes(milestone[0].name));
      if (!triggered) {
        return milestone[0];
      }
    }

    // 随机事件（30%概率）
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
        // 按概率加权选择
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

  // 处理事件选择
  resolveEventChoice(choiceIndex) {
    if (!this.pendingEvent) return null;
    const choice = this.pendingEvent.choices[choiceIndex];
    if (!choice) return null;

    // 检查需求
    if (choice.requirement) {
      const req = choice.requirement;
      if (req.minNetwork && this.player.network < req.minNetwork) {
        return { success: false, message: '人脉不足，无法选择此项。' };
      }
      if (req.minSavings && this.player.savings < req.minSavings) {
        return { success: false, message: '储蓄不足，无法选择此项。' };
      }
    }

    // 【P0核心机制】如果是人生岔路事件，记录选择并解锁人生路线
    if (this.pendingEvent.isLifeChoice) {
      const age = this.pendingEvent.age;
      this.player.lifeChoices[age] = choice.id;
      this.player.lifeChoiceHistory.push({
        age: age,
        choiceId: choice.id,
        choiceName: choice.shortName || choice.text,
        month: this.currentMonth,
        year: this.currentYear
      });
      // 解锁人生路线
      if (choice.unlocks) {
        choice.unlocks.forEach(route => {
          if (this.player.lifeRoutes.hasOwnProperty(route)) {
            this.player.lifeRoutes[route] = true;
          }
        });
      }
      // 应用岔路的长期效果（修改玩家modifiers等）
      if (choice.longTermEffects) {
        this.applyLongTermEffects(choice.longTermEffects);
      }
      this.player.addEventLog(`🚦 【人生岔路·${age}岁】你选择了「${choice.shortName || choice.text}」。这个选择将改变你接下来的人生轨迹。`);
    }

    // 应用效果
    const applied = this.player.applyEffects(choice.effects || choice.immediateEffects || {});
    this.player.addEventLog(`${this.pendingEvent.icon} ${this.pendingEvent.name}：${choice.resultText || choice.text}`);

    const result = {
      success: true,
      event: this.pendingEvent,
      choice,
      applied,
      resultText: choice.resultText
    };

    this.pendingEvent = null;
    this.phase = GamePhase.PLAYING;
    return result;
  }

  // 【P0核心机制】应用人生岔路的长期效果
  applyLongTermEffects(effects) {
    if (!effects) return;
    const p = this.player;
    // 职业路线
    if (effects.careerLine) {
      p.careerLine = effects.careerLine;
    }
    // 工资增长倍率
    if (effects.salaryGrowthMultiplier) {
      p.modifiers.salaryGrowthMultiplier = (p.modifiers.salaryGrowthMultiplier || 1) * effects.salaryGrowthMultiplier;
    }
    // 工资上限倍率
    if (effects.salaryCapMultiplier) {
      p.modifiers.salaryCapMultiplier = (p.modifiers.salaryCapMultiplier || 1) * effects.salaryCapMultiplier;
    }
    // 投资回报倍率
    if (effects.investmentReturnMultiplier) {
      p.modifiers.investmentReturnBonus = (p.modifiers.investmentReturnBonus || 0) + (effects.investmentReturnMultiplier - 1);
    }
    // 副业收入增长
    if (effects.sideIncomeGrowthMultiplier) {
      p.modifiers.sideIncomeGrowthMultiplier = (p.modifiers.sideIncomeGrowthMultiplier || 1) * effects.sideIncomeGrowthMultiplier;
    }
    // 幸福度上限加成
    if (effects.happinessCapBonus) {
      p.modifiers.happinessCapBonus = (p.modifiers.happinessCapBonus || 0) + effects.happinessCapBonus;
    }
    // 标记有房产
    if (effects.hasHouse) {
      p.hasHouse = true;
    }
    // 标记创业者路线
    if (effects.startupEndingPossible) {
      p.canGetStartupEnding = true;
    }
    // 标记家庭路线
    if (effects.familyEndingPossible) {
      p.canGetFamilyEnding = true;
    }
    // 延迟职业开始（考研等）
    if (effects.delayedCareer) {
      p.careerStartDelay = effects.delayedCareer;
    }
  }

  // 学习技能
  learnSkill(skillId) {
    const skill = LEARNABLE_SKILLS[skillId];
    if (!skill) return { success: false, message: '技能不存在' };
    if (this.player.learnedSkills[skillId]) return { success: false, message: '已经学会了' };
    if (!this.player.checkPrerequisite(skill)) return { success: false, message: '前置技能未满足' };
    if (!this.player.checkPrerequisiteCondition(skill)) return { success: false, message: '条件未满足' };
    if (this.player.savings < skill.cost) return { success: false, message: '金钱不足' };

    // 检查是否已经在学习中
    if (this.player.learningQueue.some(q => q.skillId === skillId)) {
      return { success: false, message: '正在学习中' };
    }

    // 扣除费用，加入学习队列
    this.player.savings -= skill.cost;
    const duration = Math.max(1, Math.round(skill.duration / this.player.modifiers.learningSpeedMultiplier));
    this.player.learningQueue.push({
      skillId,
      type: 'learn',
      remainingMonths: duration,
      totalMonths: duration
    });
    this.player.addEventLog(`📚 开始学习【${skill.name}】，预计${duration}个月完成。`);
    return { success: true, message: `开始学习${skill.name}`, duration };
  }

  // 发展技能
  developSkill(skillId) {
    const skill = DEVELOPABLE_SKILLS[skillId];
    if (!skill) return { success: false, message: '技能不存在' };
    const currentLevel = this.player.developedSkills[skillId] || 0;
    if (currentLevel >= skill.maxLevel) return { success: false, message: '已满级' };
    if (this.player.savings < skill.costPerLevel) return { success: false, message: '金钱不足' };

    // 检查是否已经在发展中
    if (this.player.learningQueue.some(q => q.skillId === skillId)) {
      return { success: false, message: '正在升级中' };
    }

    this.player.savings -= skill.costPerLevel;
    const duration = Math.max(1, Math.round(skill.durationPerLevel / this.player.modifiers.learningSpeedMultiplier));
    this.player.learningQueue.push({
      skillId,
      type: 'develop',
      remainingMonths: duration,
      totalMonths: duration
    });
    this.player.addEventLog(`⬆️ 开始升级【${skill.name}】到 Lv.${currentLevel + 1}，预计${duration}个月。`);
    return { success: true, message: `开始升级${skill.name}`, duration };
  }

  // 投资
  invest(amount, type) {
    if (this.player.savings < amount) return { success: false, message: '储蓄不足' };
    if (type === 'fund' && !this.player.unlocks.fund) return { success: false, message: '未解锁基金投资' };
    if (type === 'stock' && !this.player.unlocks.stock) return { success: false, message: '未解锁股票投资' };

    this.player.savings -= amount;
    this.player.investments += amount;
    this.player.addEventLog(`💹 投资${type === 'fund' ? '基金' : '股票'} ¥${amount}`);
    return { success: true };
  }

  // 取出投资
  withdrawInvestment(amount) {
    if (this.player.investments < amount) return { success: false, message: '投资不足' };
    this.player.investments -= amount;
    this.player.savings += amount;
    this.player.addEventLog(`💰 取出投资 ¥${amount}`);
    return { success: true };
  }

  // 提前还债
  repayDebt(amount) {
    if (this.player.savings < amount) return { success: false, message: '储蓄不足' };
    const actualPayment = Math.min(amount, this.player.debt);
    this.player.savings -= actualPayment;
    this.player.debt -= actualPayment;
    this.player.addEventLog(`💳 提前还债 ¥${actualPayment}，剩余负债 ¥${this.player.debt}`);
    return { success: true, actualPayment };
  }

  // 添加通知
  addNotification(message) {
    this.notifications.unshift({ message, time: Date.now() });
    if (this.notifications.length > 10) {
      this.notifications = this.notifications.slice(0, 10);
    }
  }

  // 获取财务阶段
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

  // 计算结局
  calculateEnding() {
    const netWorth = this.player.getNetWorth();
    const passive = this.player.passiveIncome + Math.round(this.player.investments * 0.006);
    const monthlyExpense = this.player.getMonthlyExpense().total;

    let ending;
    if (passive >= monthlyExpense && netWorth > 5000000) {
      ending = { id: 'financial_freedom', name: '🏆 财务自由型', description: '你实现了财务自由，被动收入覆盖所有支出，净资产超过500万。' };
    } else if (this.player.careerLevel >= 5) {
      ending = { id: 'career_success', name: '🎖️ 事业成功型', description: '你在事业上达到了顶峰，成为行业内有影响力的人物。' };
    } else if (this.player.isMarried && this.player.childrenCount > 0 && this.player.happiness > 80) {
      ending = { id: 'family_happiness', name: '👨‍👩‍👧 家庭幸福型', description: '你拥有幸福的家庭，婚姻美满，子女成才，人生无憾。' };
    } else if (netWorth < 0 || this.player.health <= 0) {
      ending = { id: 'bankruptcy', name: '💔 破产人生型', description: '你的人生以破产告终，资不抵债，健康崩溃。' };
    } else {
      ending = { id: 'peaceful', name: '🏠 平凡安稳型', description: '你过着平凡但安稳的一生，有房有车，家庭和睦，虽无大富大贵但也无憾。' };
    }

    // 【P0核心机制】生成平行人生钩子（激发重开欲望）
    ending.parallelHooks = this.calculateParallelHooks();
    return ending;
  }

  // 【P0核心机制】计算平行人生钩子
  // 根据玩家本局的选择和未选择的岔路，生成"如果当时"的遗憾片段
  calculateParallelHooks() {
    const hooks = [];
    const p = this.player;
    const chosenAges = Object.keys(p.lifeChoices).map(Number).sort((a, b) => a - b);

    // 1. 基于未选择的岔路生成钩子（每个已触发的岔路，看玩家选了什么，然后给"如果选了另一个"的钩子）
    for (const age of chosenAges) {
      const choiceId = p.lifeChoices[age];
      const lifeChoice = LIFE_CHOICES[age];
      if (!lifeChoice) continue;

      // 找到玩家选择的那个选项
      const chosenOption = lifeChoice.choices.find(c => c.id === choiceId);
      if (chosenOption && chosenOption.parallelHook) {
        hooks.push({
          type: 'not_chosen',
          age: age,
          text: chosenOption.parallelHook
        });
      }

      // 也可以从PARALLEL_HOOKS.notChosen中取
      if (PARALLEL_HOOKS.notChosen[age] && PARALLEL_HOOKS.notChosen[age][choiceId]) {
        // 避免重复
        const exists = hooks.some(h => h.text === PARALLEL_HOOKS.notChosen[age][choiceId]);
        if (!exists) {
          hooks.push({
            type: 'not_chosen',
            age: age,
            text: PARALLEL_HOOKS.notChosen[age][choiceId]
          });
        }
      }
    }

    // 2. 基于玩家状态生成通用钩子
    // 没有副业收入
    if (p.sideIncome <= 0 && p.age >= 30) {
      hooks.push({ type: 'generic', text: PARALLEL_HOOKS.generic.noSideIncome });
    }
    // 没有投资
    if (p.investments <= 10000 && p.age >= 35) {
      hooks.push({ type: 'generic', text: PARALLEL_HOOKS.generic.noInvestment });
    }
    // 健康差
    if (p.health < 40) {
      hooks.push({ type: 'generic', text: PARALLEL_HOOKS.generic.poorHealth });
    }
    // 没结婚
    if (!p.isMarried && p.age >= 35) {
      hooks.push({ type: 'generic', text: PARALLEL_HOOKS.generic.noMarriage });
    }
    // 高负债
    if (p.debt > 100000) {
      hooks.push({ type: 'generic', text: PARALLEL_HOOKS.generic.highDebt });
    }

    // 3. 打乱顺序，取前2-3个（太多会麻木，太少不够痒）
    // 优先保留岔路相关的钩子（更有针对性）
    const choiceHooks = hooks.filter(h => h.type === 'not_chosen');
    const genericHooks = hooks.filter(h => h.type === 'generic');

    // 打乱通用钩子
    for (let i = genericHooks.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [genericHooks[i], genericHooks[j]] = [genericHooks[j], genericHooks[i]];
    }

    // 组合：岔路钩子优先，然后通用钩子，总共2-3个
    const finalHooks = [];
    const maxHooks = 3;
    for (const h of choiceHooks) {
      if (finalHooks.length >= maxHooks) break;
      finalHooks.push(h);
    }
    for (const h of genericHooks) {
      if (finalHooks.length >= maxHooks) break;
      finalHooks.push(h);
    }

    // 如果一个钩子都没有，给一个默认的
    if (finalHooks.length === 0) {
      finalHooks.push({
        type: 'default',
        text: '人生没有如果，但如果有呢？再开一局，试试不同的选择。'
      });
    }

    return finalHooks.map(h => h.text);
  }

  // 存档
  save() {
    const saveData = {
      phase: this.phase,
      currentMonth: this.currentMonth,
      currentYear: this.currentYear,
      totalMonthsPlayed: this.totalMonthsPlayed,
      skillPoints: this.skillPoints,
      player: this.player ? this.player.serialize() : null,
      savedAt: Date.now()
    };
    localStorage.setItem('life_is_a_stage_save', JSON.stringify(saveData));
    return true;
  }

  // 读档
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
      if (data.player) {
        this.player = Player.deserialize(data.player);
      }
      return true;
    } catch (e) {
      console.error('Load failed:', e);
      return false;
    }
  }

  // 清除存档
  clearSave() {
    localStorage.removeItem('life_is_a_stage_save');
  }
}