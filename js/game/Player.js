/**
 * 玩家数据模型
 */
class Player {
  constructor(scenario) {
    // 基础信息
    this.scenarioId = scenario.id;
    this.scenarioName = scenario.name;
    this.age = scenario.age;
    this.city = scenario.city;
    // 四大属性
    this.health = scenario.initialStats.health;
    this.maxHealth = 100;
    this.happiness = scenario.initialStats.happiness;
    this.network = scenario.initialStats.network;
    this.knowledge = scenario.initialStats.knowledge;
    // 财务
    this.salary = scenario.initialFinance.salary;
    this.baseExpense = scenario.initialFinance.baseExpense;
    this.savings = scenario.initialFinance.savings;
    this.investments = scenario.initialFinance.investments;
    this.debt = scenario.initialFinance.debt;
    this.propertyValue = scenario.initialFinance.propertyValue;
    // 收入来源
    this.sideIncome = 0;
    this.passiveIncome = 0;
    this.pension = 0;
    // 技能
    this.skillLevels = { ...scenario.initialSkills };
    this.learnedSkills = {};      // 已学习的技能 { skillId: true }
    this.developedSkills = {};     // 已发展的技能等级 { skillId: level }
    this.learningQueue = [];       // 学习中的技能 [{ skillId, remainingMonths, type: 'learn'|'develop' }]
    // 人生状态
    this.isMarried = false;
    this.childrenCount = 0;
    this.hasHouse = false;
    this.isRetired = false;
    this.careerLevel = 1;
    // 成就和称号
    this.achievements = [];
    this.titles = [];
    // 人生岔路选择记录（关键年龄的不可逆选择）
    this.lifeChoices = {};  // { age: choiceId }
    this.lifeChoiceHistory = [];  // [{ age, choiceId, choiceName, timestamp }]
    // 人生路线标记（由岔路选择解锁）
    this.lifeRoutes = {
      standard_career: false,
      academic_career: false,
      startup_path: false,
      side_hustle_path: false,
      family_path: false,
      homeowner: false,
      aggressive_investor: false,
      health_first: false
    };
    // 历史记录
    this.monthlyHistory = [];       // 每月记录
    this.eventLog = [];             // 事件日志
    // 修饰器（事件/技能带来的临时或永久修饰）
    this.modifiers = {
      salaryMultiplier: 1.0,
      expenseMultiplier: 1.0,
      foodExpenseMultiplier: 1.0,
      medicalExpenseMultiplier: 1.0,
      investmentReturnBonus: 0,
      sideIncomeMultiplier: 1.0,
      learningSpeedMultiplier: 1.0,
      opportunityBonus: 0
    };
    // 解锁状态
    this.unlocks = {
      fund: false,
      stock: false,
      property: false,
      management: false,
      startup: false,
      riskTransfer: false
    };
    // 副业
    this.activeSideJobs = [];  // [{ type, incomeBase, level }]
  }
  // 计算净资产
  getNetWorth() {
    return this.savings + this.investments + this.propertyValue - this.debt;
  }
  // 计算月总收入
  getMonthlyIncome() {
    const salaryIncome = this.isRetired ? this.pension : Math.round(this.salary * this.modifiers.salaryMultiplier);
    const sideIncome = Math.round(this.sideIncome * this.modifiers.sideIncomeMultiplier);
    const passiveIncome = this.passiveIncome;
    const investmentIncome = Math.round(this.investments * (0.006 + this.modifiers.investmentReturnBonus / 12));
    return {
      salary: salaryIncome,
      side: sideIncome,
      passive: passiveIncome,
      investment: investmentIncome,
      total: salaryIncome + sideIncome + passiveIncome + investmentIncome
    };
  }
  // 计算月总支出
  getMonthlyExpense() {
    const baseExp = Math.round(this.baseExpense * this.modifiers.expenseMultiplier);
    const debtInterest = Math.round(this.debt * 0.012);
    const debtPrincipal = this.debt > 0 ? Math.min(Math.round(this.debt * 0.05), this.debt) : 0;
    const debtPayment = debtInterest + debtPrincipal;
    return {
      base: baseExp,
      debtInterest: debtInterest,
      debtPrincipal: debtPrincipal,
      debtPayment: debtPayment,
      total: baseExp + debtPayment
    };
  }
  // 计算月结余
  getMonthlyBalance() {
    return this.getMonthlyIncome().total - this.getMonthlyExpense().total;
  }
  // 健康系数
  getHealthCoefficient() {
    return 0.7 + (this.health / 100) * 0.3;
  }
  // 检查是否满足技能前置条件
  checkPrerequisite(skill) {
    if (!skill.prerequisite) return true;
    return !!this.learnedSkills[skill.prerequisite];
  }
  // 检查是否满足条件前置
  checkPrerequisiteCondition(skill) {
    if (!skill.prerequisiteCondition) return true;
    const cond = skill.prerequisiteCondition;
    if (cond.minAssets && this.getNetWorth() < cond.minAssets) return false;
    if (cond.minFans && (this.network * 10) < cond.minFans) return false;
    return true;
  }
  // 添加成就
  addAchievement(achievement) {
    if (!this.achievements.includes(achievement)) {
      this.achievements.push(achievement);
      return true;
    }
    return false;
  }
  // 添加称号
  addTitle(title) {
    if (!this.titles.includes(title)) {
      this.titles.push(title);
      return true;
    }
    return false;
  }
  // 记录月度数据
  recordMonthlyData(month, year) {
    const income = this.getMonthlyIncome();
    const expense = this.getMonthlyExpense();
    this.monthlyHistory.push({
      month,
      year,
      age: this.age,
      income: income.total,
      incomeBreakdown: { ...income },
      expense: expense.total,
      expenseBreakdown: { ...expense },
      balance: income.total - expense.total,
      netWorth: this.getNetWorth(),
      savings: this.savings,
      investments: this.investments,
      debt: this.debt,
      health: this.health,
      happiness: this.happiness
    });
  }
  // 添加事件日志
  addEventLog(text) {
    this.eventLog.unshift({
      month: this.age,
      text,
      timestamp: Date.now()
    });
    if (this.eventLog.length > 50) {
      this.eventLog = this.eventLog.slice(0, 50);
    }
  }
  // 应用效果
  applyEffects(effects) {
    const applied = [];
    if (effects.salaryMultiplier) {
      this.modifiers.salaryMultiplier *= effects.salaryMultiplier;
      applied.push(`工资×${effects.salaryMultiplier}`);
    }
    if (effects.expenseMultiplier) {
      this.modifiers.expenseMultiplier *= effects.expenseMultiplier;
      applied.push(`支出×${effects.expenseMultiplier}`);
    }
    if (effects.savings !== undefined) {
      this.savings += effects.savings;
      applied.push(`储蓄${effects.savings > 0 ? '+' : ''}${effects.savings}`);
    }
    if (effects.health !== undefined) {
      this.health = Math.max(0, Math.min(this.maxHealth, this.health + effects.health));
      applied.push(`健康${effects.health > 0 ? '+' : ''}${effects.health}`);
    }
    if (effects.happiness !== undefined) {
      this.happiness = Math.max(0, Math.min(100, this.happiness + effects.happiness));
      applied.push(`幸福${effects.happiness > 0 ? '+' : ''}${effects.happiness}`);
    }
    if (effects.network !== undefined) {
      this.network = Math.max(0, Math.min(100, this.network + effects.network));
      applied.push(`人脉${effects.network > 0 ? '+' : ''}${effects.network}`);
    }
    if (effects.knowledge !== undefined) {
      this.knowledge = Math.max(0, Math.min(100, this.knowledge + effects.knowledge));
      applied.push(`学识${effects.knowledge > 0 ? '+' : ''}${effects.knowledge}`);
    }
    if (effects.investmentMultiplier) {
      this.investments = Math.round(this.investments * effects.investmentMultiplier);
      applied.push(`投资×${effects.investmentMultiplier}`);
    }
    if (effects.unlockFund) this.unlocks.fund = true;
    if (effects.unlockStock) this.unlocks.stock = true;
    if (effects.unlockProperty) this.unlocks.property = true;
    if (effects.unlockManagement) this.unlocks.management = true;
    if (effects.unlockStartup) this.unlocks.startup = true;
    if (effects.riskTransfer) this.unlocks.riskTransfer = true;
    if (effects.careerLevel) {
      this.careerLevel += effects.careerLevel;
      applied.push(`职业等级+${effects.careerLevel}`);
    }
    return applied;
  }
  // 序列化（存档）
  serialize() {
    return JSON.stringify(this);
  }
  // 反序列化（读档）
  static deserialize(json) {
    const data = JSON.parse(json);
    const player = new Player({ id: data.scenarioId, name: data.scenarioName, age: data.age, initialStats: {}, initialFinance: {}, initialSkills: {} });
    Object.assign(player, data);
    return player;
  }
}
