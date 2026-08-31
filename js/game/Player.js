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
    this.learnedSkills = {};
    this.developedSkills = {};
    this.learningQueue = [];

    // 人生状态
    this.isMarried = false;
    this.childrenCount = 0;
    this.hasHouse = false;
    this.isRetired = false;
    this.careerLevel = 1;
    this.careerDelayMonths = 0;
    this.salaryStartMultiplier = 1.0;
    this.careerDelayApplied = false;

    // 成就和称号
    this.achievements = [];
    this.titles = [];
    this.lifeChoices = {};
    this.lifeChoiceHistory = [];
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
    this.monthlyHistory = [];
    this.eventLog = [];

    // 修饰器
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
    this.activeSideJobs = [];
  }

  getNetWorth() {
    return this.savings + this.investments + this.propertyValue - this.debt;
  }

  getMonthlyIncome() {
    let salaryIncome = 0;
    if (this.isRetired) {
      salaryIncome = this.pension;
    } else if (this.careerDelayMonths > 0) {
      salaryIncome = 0;
    } else {
      salaryIncome = Math.round(this.salary * this.modifiers.salaryMultiplier);
    }
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

  getMonthlyBalance() {
    return this.getMonthlyIncome().total - this.getMonthlyExpense().total;
  }

  getHealthCoefficient() {
    return 0.7 + (this.health / 100) * 0.3;
  }

  checkPrerequisite(skill) {
    if (!skill.prerequisite) return true;
    return !!this.learnedSkills[skill.prerequisite];
  }

  checkPrerequisiteCondition(skill) {
    if (!skill.prerequisiteCondition) return true;
    const cond = skill.prerequisiteCondition;
    if (cond.minAssets && this.getNetWorth() < cond.minAssets) return false;
    if (cond.minFans && (this.network * 10) < cond.minFans) return false;
    return true;
  }

  addAchievement(achievement) {
    if (!this.achievements.includes(achievement)) {
      this.achievements.push(achievement);
      return true;
    }
    return false;
  }

  addTitle(title) {
    if (!this.titles.includes(title)) {
      this.titles.push(title);
      return true;
    }
    return false;
  }

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
    if (effects.debt !== undefined) {
      this.debt += effects.debt;
      applied.push(`负债${effects.debt > 0 ? '+' : ''}${effects.debt}`);
    }
    if (effects.salary !== undefined) {
      this.salary = effects.salary;
      applied.push(`工资调整为¥${effects.salary}`);
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

  serialize() {
    return JSON.stringify(this);
  }

  static deserialize(json) {
    const data = JSON.parse(json);
    const player = new Player({ id: data.scenarioId, name: data.scenarioName, age: data.age, initialStats: {}, initialFinance: {}, initialSkills: {} });
    Object.assign(player, data);
    return player;
  }
}
