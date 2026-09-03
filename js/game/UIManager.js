/**
 * UI管理器 - 负责所有界面渲染和交互
 */
class UIManager {
  constructor(gameState) {
    this.game = gameState;
    this.currentScreen = 'menu';
    this.selectedCategory = 'career';
  }
  // 渲染主菜单
  renderMenu() {
    return `
      <div class="screen menu-screen">
        <div class="game-title">
          <div class="title-icon">🎭</div>
          <h1>人生如戏</h1>
          <p class="subtitle">每个人都是自己人生的主角</p>
        </div>
        <div class="menu-buttons">
          <button class="btn btn-primary" onclick="game.startScenarioSelect()">🎬 开始新人生</button>
          <button class="btn btn-secondary" onclick="game.loadGame()">📂 继续游戏</button>
          <button class="btn btn-secondary" onclick="game.showCollection()">📚 人生图鉴</button>
          <button class="btn btn-tertiary" onclick="game.showAbout()">📖 关于游戏</button>
        </div>
        <div class="menu-footer">
          <p>你的每一个选择，都在书写剧本的下一幕</p>
        </div>
      </div>
    `;
  }
  // 渲染剧本选择
  renderScenarioSelect() {
    const scenariosHtml = SCENARIOS.map(s => `
      <div class="scenario-card" onclick="game.selectScenario('${s.id}')">
        <div class="scenario-icon">${s.icon}</div>
        <div class="scenario-info">
          <h3>${s.name} <span class="difficulty difficulty-${s.difficulty}">${s.difficulty}</span></h3>
          <p class="scenario-desc">${s.description}</p>
          <div class="scenario-stats">
            <span>年龄: ${s.age}岁</span>
            <span>月薪: ¥${s.initialFinance.salary}</span>
            <span>负债: ¥${s.initialFinance.debt}</span>
          </div>
        </div>
      </div>
    `).join('');
    return `
      <div class="screen scenario-screen">
        <div class="screen-header">
          <button class="btn-back" onclick="game.backToMenu()">← 返回</button>
          <h2>选择你的人生起点</h2>
        </div>
        <div class="scenario-list">
          ${scenariosHtml}
        </div>
      </div>
    `;
  }
  // 渲染主游戏界面
  renderGame() {
    const p = this.game.player;
    const income = p.getMonthlyIncome();
    const expense = p.getMonthlyExpense();
    const balance = income.total - expense.total;
    const stage = this.game.getFinancialStage();
    const netWorth = p.getNetWorth();
    const passive = p.passiveIncome + Math.round(p.investments * 0.006);
    // 收入条
    const incomeBars = this.renderIncomeBars(income);
    const expenseBars = this.renderExpenseBars(expense);
    // 学习队列
    const learningQueueHtml = p.learningQueue.length > 0 ? `
      <div class="learning-queue">
        <div class="queue-title">📚 学习中</div>
        ${p.learningQueue.map(item => {
          const skill = item.type === 'learn' ? LEARNABLE_SKILLS[item.skillId] : DEVELOPABLE_SKILLS[item.skillId];
          const progress = ((item.totalMonths - item.remainingMonths) / item.totalMonths * 100).toFixed(0);
          return `
            <div class="learning-item">
              <span>${skill ? skill.icon : ''} ${skill ? skill.name : item.skillId}</span>
              <div class="progress-bar"><div class="progress-fill" style="width:${progress}%"></div></div>
              <span class="progress-text">${item.remainingMonths}月</span>
            </div>
          `;
        }).join('')}
      </div>
    ` : '';
    return `
      <div class="screen game-screen">
        <!-- 顶部状态栏 -->
        <div class="top-bar">
          <div class="player-info">
            <div class="player-avatar">${this.getScenarioIcon(p.scenarioId)}</div>
            <div class="player-details">
              <div class="player-name">${p.scenarioName} · ${p.age}岁</div>
              <div class="player-time">第${this.game.currentYear}年 第${this.game.currentMonth}月</div>
            </div>
          </div>
          <div class="net-worth">
            <div class="nw-label">净资产</div>
            <div class="nw-value ${netWorth >= 0 ? 'positive' : 'negative'}">¥${this.formatNumber(netWorth)}</div>
          </div>
        </div>
        <!-- 属性条 -->
        <div class="stats-bar">
          <div class="stat-item" title="健康">
            <span class="stat-icon">❤️</span>
            <div class="stat-bar"><div class="stat-fill health" style="width:${p.health}%"></div></div>
            <span class="stat-value">${p.health}</span>
          </div>
          <div class="stat-item" title="幸福">
            <span class="stat-icon">😊</span>
            <div class="stat-bar"><div class="stat-fill happiness" style="width:${p.happiness}%"></div></div>
            <span class="stat-value">${p.happiness}</span>
          </div>
          <div class="stat-item" title="人脉">
            <span class="stat-icon">🤝</span>
            <div class="stat-bar"><div class="stat-fill network" style="width:${p.network}%"></div></div>
            <span class="stat-value">${p.network}</span>
          </div>
          <div class="stat-item" title="学识">
            <span class="stat-icon">📖</span>
            <div class="stat-bar"><div class="stat-fill knowledge" style="width:${p.knowledge}%"></div></div>
            <span class="stat-value">${p.knowledge}</span>
          </div>
        </div>
        <!-- 财务阶段 -->
        <div class="financial-stage" style="background:${stage.color}20;border-color:${stage.color}">
          <span style="color:${stage.color}">${stage.name}</span>
          ${stage.progress !== undefined ? `<span class="stage-progress">应急金进度 ${stage.progress}%</span>` : ''}
        </div>
        <!-- 现金流面板 -->
        <div class="cashflow-panel">
          <h3>📊 本月现金流</h3>
          <div class="cf-section">
            <div class="cf-section-title">收入</div>
            ${incomeBars}
            <div class="cf-total income-total">
              <span>总收入</span>
              <span class="amount">+¥${this.formatNumber(income.total)}</span>
            </div>
          </div>
          <div class="cf-section">
            <div class="cf-section-title">支出</div>
            ${expenseBars}
            <div class="cf-total expense-total">
              <span>总支出</span>
              <span class="amount">-¥${this.formatNumber(expense.total)}</span>
            </div>
          </div>
          <div class="cf-balance ${balance >= 0 ? 'positive' : 'negative'}">
            <span>本月结余</span>
            <span class="amount">${balance >= 0 ? '+' : ''}¥${this.formatNumber(balance)}</span>
          </div>
          ${learningQueueHtml}
        </div>
        <!-- 资产负债简表 -->
        <div class="assets-liabilities">
          <div class="al-item assets">
            <div class="al-label">资产</div>
            <div class="al-value">¥${this.formatNumber(p.savings + p.investments + p.propertyValue)}</div>
          </div>
          <div class="al-item liabilities">
            <div class="al-label">负债</div>
            <div class="al-value">¥${this.formatNumber(p.debt)}</div>
          </div>
          <div class="al-item passive">
            <div class="al-label">被动收入</div>
            <div class="al-value">¥${this.formatNumber(passive)}/月</div>
          </div>
        </div>
        <!-- 功能按钮 -->
        <div class="action-buttons">
          <button class="action-btn skill-btn" onclick="game.showSkillTree()">
            <span class="action-icon">🎯</span>
            <span>技能树</span>
          </button>
          <button class="action-btn invest-btn" onclick="game.showInvest()">
            <span class="action-icon">💹</span>
            <span>投资/还债</span>
          </button>
          <button class="action-btn relationship-btn" onclick="game.showRelationships()">
            <span class="action-icon">👥</span>
            <span>人际关系</span>
          </button>
          <button class="action-btn property-btn" onclick="game.showProperty()">
            <span class="action-icon">🏠</span>
            <span>房产</span>
          </button>
          <button class="action-btn next-btn" onclick="game.nextMonth()">
            <span class="action-icon">⏭️</span>
            <span>下一月</span>
          </button>
        </div>
        <!-- 事件日志 -->
        <div class="event-log">
          <div class="log-title">📝 人生日志</div>
          <div class="log-content">
            ${p.eventLog.slice(0, 8).map(log => `<div class="log-item">${log.text}</div>`).join('')}
          </div>
        </div>
      </div>
    `;
  }
  // 渲染收入条
  renderIncomeBars(income) {
    const items = [
      { name: '工资', value: income.salary, color: '#9BBBF4' },
      { name: '副业', value: income.side, color: '#F4B393' },
      { name: '被动', value: income.passive, color: '#A2DDAA' },
      { name: '投资', value: income.investment, color: '#DEBEF8' }
    ].filter(item => item.value > 0);
    const max = Math.max(...items.map(i => i.value), 1);
    return items.map(item => `
      <div class="cf-bar-row">
        <span class="cf-bar-label">${item.name}</span>
        <div class="cf-bar"><div class="cf-bar-fill" style="width:${(item.value / max * 100).toFixed(0)}%;background:${item.color}"></div></div>
        <span class="cf-bar-value">¥${this.formatNumber(item.value)}</span>
      </div>
    `).join('');
  }
  // 渲染支出条
  renderExpenseBars(expense) {
    const items = [
      { name: '生活', value: expense.base, color: '#8BC8EA' },
      { name: '还债', value: expense.debtPayment, color: '#EA6668' }
    ].filter(item => item.value > 0);
    const max = Math.max(...items.map(i => i.value), 1);
    return items.map(item => `
      <div class="cf-bar-row">
        <span class="cf-bar-label">${item.name}</span>
        <div class="cf-bar"><div class="cf-bar-fill" style="width:${(item.value / max * 100).toFixed(0)}%;background:${item.color}"></div></div>
        <span class="cf-bar-value">¥${this.formatNumber(item.value)}</span>
      </div>
    `).join('');
  }
  // 渲染技能树
  renderSkillTree() {
    const p = this.game.player;
    const categories = Object.keys(SKILL_CATEGORIES);
    const categoryTabs = categories.map(cat => `
      <button class="skill-tab ${this.selectedCategory === cat ? 'active' : ''}"
              style="border-color:${SKILL_CATEGORIES[cat].color}"
              onclick="game.ui.selectSkillCategory('${cat}')">
        ${SKILL_CATEGORIES[cat].icon} ${SKILL_CATEGORIES[cat].name}
      </button>
    `).join('');
    const cat = SKILL_CATEGORIES[this.selectedCategory];
    const learnable = Object.values(LEARNABLE_SKILLS).filter(s => s.category === this.selectedCategory);
    const developable = Object.values(DEVELOPABLE_SKILLS).filter(s => s.category === this.selectedCategory);
    const learnableHtml = learnable.map(skill => {
      const learned = p.learnedSkills[skill.id];
      const learning = p.learningQueue.some(q => q.skillId === skill.id);
      const prereqMet = p.checkPrerequisite(skill);
      const condMet = p.checkPrerequisiteCondition(skill);
      const canAfford = p.savings >= skill.cost;
      const canLearn = !learned && !learning && prereqMet && condMet && canAfford;
      let statusText = '可学习';
      let btnClass = 'btn-learn';
      if (learned) { statusText = '已学会 ✓'; btnClass = 'btn-done'; }
      else if (learning) { statusText = '学习中...'; btnClass = 'btn-learning'; }
      else if (!prereqMet) { statusText = '需前置技能'; btnClass = 'btn-disabled'; }
      else if (!condMet) { statusText = '条件未满足'; btnClass = 'btn-disabled'; }
      else if (!canAfford) { statusText = '金钱不足'; btnClass = 'btn-disabled'; }
      return `
        <div class="skill-card ${learned ? 'learned' : ''}">
          <div class="skill-header">
            <span class="skill-icon">${skill.icon}</span>
            <div class="skill-info">
              <div class="skill-name">${skill.name}</div>
              <div class="skill-desc">${skill.description}</div>
            </div>
          </div>
          <div class="skill-footer">
            <div class="skill-cost">
              <span>💰 ¥${skill.cost}</span>
              <span>⏱️ ${skill.duration}月</span>
            </div>
            <button class="btn-skill ${btnClass}"
                    onclick="game.learnSkill('${skill.id}')"
                    ${!canLearn ? 'disabled' : ''}>
              ${statusText}
            </button>
          </div>
        </div>
      `;
    }).join('');
    const developableHtml = developable.map(skill => {
      const level = p.developedSkills[skill.id] || 0;
      const maxed = level >= skill.maxLevel;
      const developing = p.learningQueue.some(q => q.skillId === skill.id);
      const canAfford = p.savings >= skill.costPerLevel;
      const canDevelop = !maxed && !developing && canAfford;
      let statusText = '升级';
      let btnClass = 'btn-develop';
      if (maxed) { statusText = '已满级'; btnClass = 'btn-done'; }
      else if (developing) { statusText = '升级中...'; btnClass = 'btn-learning'; }
      else if (!canAfford) { statusText = '金钱不足'; btnClass = 'btn-disabled'; }
      const levelDots = Array(skill.maxLevel).fill(0).map((_, i) =>
        `<div class="level-dot ${i < level ? 'filled' : ''}" style="background:${i < level ? cat.color : '#ddd'}"></div>`
      ).join('');
      return `
        <div class="skill-card develop-card">
          <div class="skill-header">
            <span class="skill-icon">${skill.icon}</span>
            <div class="skill-info">
              <div class="skill-name">${skill.name} <span class="skill-level">Lv.${level}/${skill.maxLevel}</span></div>
              <div class="skill-desc">${skill.description}</div>
              <div class="level-dots">${levelDots}</div>
            </div>
          </div>
          <div class="skill-footer">
            <div class="skill-cost">
              <span>💰 ¥${skill.costPerLevel}/级</span>
              <span>⏱️ ${skill.durationPerLevel}月/级</span>
            </div>
            <button class="btn-skill ${btnClass}"
                    onclick="game.developSkill('${skill.id}')"
                    ${!canDevelop ? 'disabled' : ''}>
              ${statusText}
            </button>
          </div>
        </div>
      `;
    }).join('');
    return `
      <div class="screen skill-screen">
        <div class="screen-header">
          <button class="btn-back" onclick="game.backToGame()">← 返回</button>
          <h2>🎯 技能树</h2>
          <div class="skill-money">💰 ¥${this.formatNumber(p.savings)}</div>
        </div>
        <div class="skill-categories">
          ${categoryTabs}
        </div>
        <div class="skill-category-info" style="border-left:3px solid ${cat.color}">
          <span style="color:${cat.color}">${cat.icon} ${cat.name}</span>
          <span class="cat-desc">${cat.description}</span>
          <span class="cat-level">等级: ${p.skillLevels[this.selectedCategory] || 0}</span>
        </div>
        <div class="skill-section">
          <h3>📖 该学习（新技能解锁）</h3>
          <div class="skill-list">
            ${learnableHtml}
          </div>
        </div>
        <div class="skill-section">
          <h3>⬆️ 该发展（已有技能升级）</h3>
          <div class="skill-list">
            ${developableHtml}
          </div>
        </div>
      </div>
    `;
  }
  // 渲染投资界面
  renderInvest() {
    const p = this.game.player;
    return `
      <div class="screen invest-screen">
        <div class="screen-header">
          <button class="btn-back" onclick="game.backToGame()">← 返回</button>
          <h2>💹 投资与还债</h2>
          <div class="skill-money">💰 ¥${this.formatNumber(p.savings)}</div>
        </div>
        <div class="invest-overview">
          <div class="io-item">
            <div class="io-label">储蓄</div>
            <div class="io-value">¥${this.formatNumber(p.savings)}</div>
          </div>
          <div class="io-item">
            <div class="io-label">投资</div>
            <div class="io-value">¥${this.formatNumber(p.investments)}</div>
          </div>
          <div class="io-item">
            <div class="io-label">负债</div>
            <div class="io-value negative">¥${this.formatNumber(p.debt)}</div>
          </div>
        </div>
        <div class="invest-section">
          <h3>📈 投资产品</h3>
          <div class="invest-options">
            <div class="invest-card">
              <div class="invest-header">
                <span class="invest-icon">🏦</span>
                <div>
                  <div class="invest-name">货币基金</div>
                  <div class="invest-desc">年化约3%，低风险</div>
                </div>
              </div>
              <div class="invest-actions">
                <button class="btn-invest" onclick="game.invest(500, 'fund')">投¥500</button>
                <button class="btn-invest" onclick="game.invest(2000, 'fund')">投¥2000</button>
              </div>
            </div>
            <div class="invest-card ${!p.unlocks.fund ? 'locked' : ''}">
              <div class="invest-header">
                <span class="invest-icon">📈</span>
                <div>
                  <div class="invest-name">指数基金 ${!p.unlocks.fund ? '🔒' : ''}</div>
                  <div class="invest-desc">年化约8%，中风险（需学习基金定投）</div>
                </div>
              </div>
              <div class="invest-actions">
                <button class="btn-invest" onclick="game.invest(500, 'fund')" ${!p.unlocks.fund ? 'disabled' : ''}>投¥500</button>
                <button class="btn-invest" onclick="game.invest(2000, 'fund')" ${!p.unlocks.fund ? 'disabled' : ''}>投¥2000</button>
              </div>
            </div>
            <div class="invest-card ${!p.unlocks.stock ? 'locked' : ''}">
              <div class="invest-header">
                <span class="invest-icon">📊</span>
                <div>
                  <div class="invest-name">股票投资 ${!p.unlocks.stock ? '🔒' : ''}</div>
                  <div class="invest-desc">年化约12%，高风险（需学习股票基础）</div>
                </div>
              </div>
              <div class="invest-actions">
                <button class="btn-invest" onclick="game.invest(1000, 'stock')" ${!p.unlocks.stock ? 'disabled' : ''}>投¥1000</button>
                <button class="btn-invest" onclick="game.invest(5000, 'stock')" ${!p.unlocks.stock ? 'disabled' : ''}>投¥5000</button>
              </div>
            </div>
          </div>
        </div>
        <div class="invest-section">
          <h3>💰 取出投资</h3>
          <div class="invest-actions">
            <button class="btn-withdraw" onclick="game.withdrawInvestment(1000)">取出¥1000</button>
            <button class="btn-withdraw" onclick="game.withdrawInvestment(${p.investments})">全部取出</button>
          </div>
        </div>
        <div class="invest-section">
          <h3>💳 提前还债（相当于15%年化收益）</h3>
          <div class="debt-info">
            <span>当前负债: ¥${this.formatNumber(p.debt)}</span>
            <span>月利率: 1.2%</span>
          </div>
          <div class="invest-actions">
            <button class="btn-repay" onclick="game.repayDebt(500)" ${p.debt <= 0 ? 'disabled' : ''}>还¥500</button>
            <button class="btn-repay" onclick="game.repayDebt(2000)" ${p.debt <= 0 ? 'disabled' : ''}>还¥2000</button>
            <button class="btn-repay" onclick="game.repayDebt(${p.savings})" ${p.debt <= 0 ? 'disabled' : ''}>全部还清</button>
          </div>
        </div>
      </div>
    `;
  }
  // 渲染事件弹窗
  renderEvent(event) {
    const isLifeChoice = event.isLifeChoice === true;
    const choicesHtml = event.choices.map((choice, index) => {
      let disabled = false;
      let reqText = '';
      if (choice.requirement) {
        if (choice.requirement.minNetwork && this.game.player.network < choice.requirement.minNetwork) {
          disabled = true;
          reqText = `（需人脉≥${choice.requirement.minNetwork}）`;
        }
        if (choice.requirement.minSavings && this.game.player.savings < choice.requirement.minSavings) {
          disabled = true;
          reqText = `（需储蓄≥¥${this.formatNumber(choice.requirement.minSavings)}）`;
        }
      }
      // 人生岔路选项：显示图标、名称、描述
      if (isLifeChoice) {
        // 【P1记忆继承】检查玩家是否之前体验过这个选择
        const age = this.game.player ? this.game.player.age : 0;
        const experienced = typeof CollectionManager !== 'undefined' &&
                           CollectionManager.hasExperiencedChoice(age, choice.id);
        const dejaVuBadge = experienced ? '<span class="deja-vu-badge">✨ 似曾相识</span>' : '';
        return `
          <button class="event-choice life-choice ${disabled ? 'disabled' : ''} ${experienced ? 'experienced' : ''}"
                  onclick="game.resolveEvent(${index})"
                  ${disabled ? 'disabled' : ''}>
            <div class="lc-icon">${choice.icon || '🔀'}</div>
            <div class="lc-content">
              <div class="lc-title">${choice.shortName || choice.text} ${dejaVuBadge}</div>
              <div class="lc-desc">${choice.description || ''}</div>
              ${experienced ? '<div class="lc-deja-vu">你上一段人生选过这条路，结局如何？</div>' : ''}
            </div>
          </button>
        `;
      }
      return `
        <button class="event-choice ${disabled ? 'disabled' : ''}"
                onclick="game.resolveEvent(${index})"
                ${disabled ? 'disabled' : ''}>
          ${choice.text} ${reqText}
        </button>
      `;
    }).join('');
    // 人生岔路特殊头部
    const headerHtml = isLifeChoice ? `
      <div class="life-choice-badge">🚦 人生岔路 · 不可逆选择</div>
      <div class="life-choice-warning">这个选择将改变你接下来的人生轨迹，无法反悔。</div>
    ` : '';
    return `
      <div class="event-modal-overlay">
        <div class="event-modal ${isLifeChoice ? 'life-choice-modal' : ''}">
          ${headerHtml}
          <div class="event-icon">${event.icon}</div>
          <h3 class="event-title">${event.name}</h3>
          <p class="event-desc">${event.description}</p>
          <div class="event-choices">
            ${choicesHtml}
          </div>
        </div>
      </div>
    `;
  }
  // 渲染年度回顾
  renderYearReview() {
    const p = this.game.player;
    const lastYear = p.monthlyHistory.filter(h => h.year === this.game.currentYear - 1);
    const totalIncome = lastYear.reduce((sum, h) => sum + h.income, 0);
    const totalExpense = lastYear.reduce((sum, h) => sum + h.expense, 0);
    const totalSaved = lastYear.reduce((sum, h) => sum + h.balance, 0);
    return `
      <div class="event-modal-overlay">
        <div class="event-modal year-review">
          <div class="event-icon">🎂</div>
          <h3 class="event-title">${p.age}岁了！</h3>
          <p class="event-desc">回顾过去一年：</p>
          <div class="year-stats">
            <div class="ys-item">
              <div class="ys-label">总收入</div>
              <div class="ys-value positive">¥${this.formatNumber(totalIncome)}</div>
            </div>
            <div class="ys-item">
              <div class="ys-label">总支出</div>
              <div class="ys-value negative">¥${this.formatNumber(totalExpense)}</div>
            </div>
            <div class="ys-item">
              <div class="ys-label">年度结余</div>
              <div class="ys-value ${totalSaved >= 0 ? 'positive' : 'negative'}">${totalSaved >= 0 ? '+' : ''}¥${this.formatNumber(totalSaved)}</div>
            </div>
            <div class="ys-item">
              <div class="ys-label">净资产</div>
              <div class="ys-value">¥${this.formatNumber(p.getNetWorth())}</div>
            </div>
          </div>
          <button class="event-choice" onclick="game.continueAfterYearReview()">继续人生 →</button>
        </div>
      </div>
    `;
  }
  // 渲染游戏结束
  renderGameOver(reason) {
    const p = this.game.player;
    const ending = this.game.calculateEnding();
    const totalMonths = this.game.totalMonthsPlayed;
    const yearsPlayed = Math.floor(totalMonths / 12);
    // 稀有度颜色和标签
    const rarityConfig = {
      legendary: { color: '#FFD700', label: '传奇', bg: 'linear-gradient(135deg, rgba(255,215,0,0.2), rgba(255,165,0,0.3))' },
      epic: { color: '#9B59B6', label: '史诗', bg: 'linear-gradient(135deg, rgba(155,89,182,0.2), rgba(142,68,173,0.3))' },
      rare: { color: '#3498DB', label: '稀有', bg: 'linear-gradient(135deg, rgba(52,152,219,0.2), rgba(41,128,185,0.3))' },
      common: { color: '#95A5A6', label: '普通', bg: 'linear-gradient(135deg, rgba(149,165,166,0.15), rgba(127,140,141,0.2))' }
    };
    const rarity = ending.rarity || 'common';
    const rc = rarityConfig[rarity] || rarityConfig.common;
    // 未体验结局提示（取前3个，激发探索欲）
    let lockedEndingsHtml = '';
    if (ending.lockedEndings && ending.lockedEndings.length > 0) {
      const showCount = Math.min(3, ending.lockedEndings.length);
      const lockedItems = ending.lockedEndings.slice(0, showCount);
      lockedEndingsHtml = `
        <div class="locked-endings-section">
          <div class="le-title">🔮 还有这些结局你没玩到</div>
          <div class="le-subtitle">总共有${ending.lockedEndings.length}种结局等你探索</div>
          <div class="le-list">
            ${lockedItems.map(e => `
              <div class="le-item">
                <span class="le-icon">${e.icon}</span>
                <span class="le-name">${e.name}</span>
                <span class="le-hint">${e.hint}</span>
              </div>
            `).join('')}
          </div>
        </div>
      `;
    }
    return `
      <div class="screen gameover-screen">
        <div class="gameover-content">
          <div class="gameover-icon">🎬</div>
          <h2>人生谢幕</h2>
          <p class="gameover-reason">${reason.message}</p>
          <div class="ending-card" style="background:${rc.bg};border-color:${rc.color}">
            <div class="ending-rarity" style="color:${rc.color}">【${rc.label}结局】</div>
            <div class="ending-name">${ending.name}</div>
            <div class="ending-desc">${ending.description}</div>
          </div>
          ${ending.parallelHooks && ending.parallelHooks.length > 0 ? `
            <div class="parallel-hooks-section">
              <div class="ph-title">🎭 平行人生</div>
              <div class="ph-subtitle">如果当时……</div>
              ${ending.parallelHooks.map(hook => `
                <div class="parallel-hook">
                  <div class="ph-quote">"</div>
                  <div class="ph-text">${hook}</div>
                </div>
              `).join('')}
              <div class="ph-cta">再开一局，试试不同的选择？</div>
            </div>
          ` : ''}
          ${lockedEndingsHtml}
          <div class="final-stats">
            <div class="fs-item">
              <div class="fs-label">享年</div>
              <div class="fs-value">${p.age}岁</div>
            </div>
            <div class="fs-item">
              <div class="fs-label">最终净资产</div>
              <div class="fs-value">¥${this.formatNumber(p.getNetWorth())}</div>
            </div>
            <div class="fs-item">
              <div class="fs-label">学会技能</div>
              <div class="fs-value">${Object.keys(p.learnedSkills).length}个</div>
            </div>
            <div class="fs-item">
              <div class="fs-label">获得成就</div>
              <div class="fs-value">${p.achievements.length}个</div>
            </div>
          </div>
          <div class="gameover-actions">
            <button class="btn btn-primary" onclick="game.restart()">🔄 重开新人生</button>
            <button class="btn btn-secondary" onclick="game.backToMenu()">🏠 返回主菜单</button>
          </div>
        </div>
      </div>
    `;
  }
  // 工具方法
  formatNumber(num) {
    if (Math.abs(num) >= 10000) {
      return (num / 10000).toFixed(1) + '万';
    }
    return Math.round(num).toLocaleString();
  }
  getScenarioIcon(id) {
    const s = SCENARIOS.find(x => x.id === id);
    return s ? s.icon : '👤';
  }
  // 【P1记忆继承】渲染上一局回顾弹窗
  renderLastGameReview() {
    const summary = this.game.lastGameSummary;
    const memoryLevel = this.game.memoryLevel || 1;
    if (!summary) return '';
    const memoryLevelNames = ['', '似曾相识', '模糊预感', '清晰记忆'];
    const memoryLevelDesc = [
      '',
      '你隐约记得上一段人生的一些片段...',
      '你能模糊预感到接下来会发生什么...',
      '你清晰地记得上一段人生的每一个关键选择...'
    ];
    const choicesHtml = summary.lifeChoiceHistory && summary.lifeChoiceHistory.length > 0
      ? summary.lifeChoiceHistory.map(c => `
          <div class="review-choice">
            <span class="review-choice-age">${c.age}岁</span>
            <span class="review-choice-name">${c.choiceName}</span>
          </div>
        `).join('')
      : '<div class="review-empty">上一局没有做出关键人生选择</div>';
    let unexperiencedHint = '';
    if (typeof CollectionManager !== 'undefined') {
      const stats = CollectionManager.getUnexperiencedChoicesCount();
      if (stats.unexperienced > 0) {
        unexperiencedHint = `
          <div class="review-unexperienced">
            <span class="unexperienced-icon">🔮</span>
            <span>还有 <b>${stats.unexperienced}</b> 种人生选择你从未尝试过</span>
          </div>
        `;
      }
    }
    return `
      <div class="event-modal-overlay">
        <div class="event-modal memory-review-modal">
          <div class="memory-badge">✨ ${memoryLevelNames[memoryLevel] || '似曾相识'}</div>
          <div class="event-icon">🎭</div>
          <h3 class="event-title">记忆回响</h3>
          <p class="memory-desc">${memoryLevelDesc[memoryLevel] || '你隐约记得上一段人生...'}</p>
          <div class="review-summary">
            <div class="review-row">
              <span class="review-label">上一局身份</span>
              <span class="review-value">${summary.scenarioName}</span>
            </div>
            <div class="review-row">
              <span class="review-label">最终结局</span>
              <span class="review-value">${summary.endingName}</span>
            </div>
            <div class="review-row">
              <span class="review-label">享年</span>
              <span class="review-value">${summary.finalAge}岁</span>
            </div>
            <div class="review-row">
              <span class="review-label">最终净资产</span>
              <span class="review-value ${summary.finalNetWorth >= 0 ? 'positive' : 'negative'}">¥${this.formatNumber(summary.finalNetWorth)}</span>
            </div>
            <div class="review-row">
              <span class="review-label">学会技能</span>
              <span class="review-value">${summary.learnedSkills}个</span>
            </div>
          </div>
          <div class="review-choices-section">
            <div class="review-choices-title">🔀 上一局的关键选择</div>
            <div class="review-choices-list">${choicesHtml}</div>
          </div>
          ${unexperiencedHint}
          <div class="review-cta">这次，你想做出不同的选择吗？</div>
          <button class="event-choice memory-continue-btn" onclick="game.continueAfterLastGameReview()">
            🎬 开启新的人生 →
          </button>
        </div>
      </div>
    `;
  }
  selectSkillCategory(cat) {
    this.selectedCategory = cat;
    this.game.render();
  }
  // 【P1】渲染人生图鉴界面
  renderCollection() {
    const collection = typeof CollectionManager !== 'undefined' ? CollectionManager.getCollection() : CollectionManager.getEmptyCollection();
    const progress = typeof CollectionManager !== 'undefined' ? CollectionManager.getProgress() : { overall: 0, scenarios: {collected:0,total:6}, endings: {collected:0,total:15}, lifeChoices: {collected:0,total:15} };
    // 剧本收集
    const scenariosHtml = SCENARIOS.map(s => {
      const collected = collection.scenarios[s.id];
      return `
        <div class="collection-item ${collected ? 'collected' : 'locked'}">
          <div class="ci-icon">${collected ? s.icon : '❓'}</div>
          <div class="ci-info">
            <div class="ci-name">${collected ? s.name : '???'}</div>
            <div class="ci-desc">${collected ? `已玩${collected.playCount}次` : '未体验'}</div>
          </div>
        </div>
      `;
    }).join('');
    // 结局收集（按稀有度分组显示15种结局）
    const rarityOrder = ['legendary', 'epic', 'rare', 'common'];
    const rarityLabels = { legendary: '👑 传奇结局', epic: '💎 史诗结局', rare: '⭐ 稀有结局', common: '📖 普通结局' };
    const rarityColors = { legendary: '#FFD700', epic: '#9B59B6', rare: '#3498DB', common: '#95A5A6' };
    let endingsHtml = '';
    if (typeof ENDINGS !== 'undefined') {
      for (const rarity of rarityOrder) {
        const rarityEndings = Object.values(ENDINGS).filter(e => e.rarity === rarity);
        if (rarityEndings.length === 0) continue;
        const collectedCount = rarityEndings.filter(e => collection.endings[e.id]).length;
        const itemsHtml = rarityEndings.map(e => {
          const collected = collection.endings[e.id];
          return `
            <div class="collection-item ${collected ? 'collected' : 'locked'}" style="border-color:${collected ? rarityColors[rarity] : '#ddd'}">
              <div class="ci-icon">${collected ? e.icon : '❓'}</div>
              <div class="ci-info">
                <div class="ci-name">${collected ? e.name : '???'}</div>
                <div class="ci-desc">${collected ? `达成${collected.count}次` : '未达成'}</div>
              </div>
            </div>
          `;
        }).join('');
        endingsHtml += `
          <div class="ending-rarity-group">
            <div class="ending-rarity-title" style="color:${rarityColors[rarity]}">${rarityLabels[rarity]} (${collectedCount}/${rarityEndings.length})</div>
            <div class="collection-grid">${itemsHtml}</div>
          </div>
        `;
      }
    }
    // 岔路收集
    const choicesHtml = Object.keys(LIFE_CHOICES).map(age => {
      const lc = LIFE_CHOICES[age];
      const choices = lc.choices.map(c => {
        const collected = collection.lifeChoices[age] && collection.lifeChoices[age][c.id];
        return `
          <div class="choice-item ${collected ? 'collected' : 'locked'}">
            <span class="choice-icon">${collected ? c.icon : '❓'}</span>
            <span class="choice-name">${collected ? c.shortName : '???'}</span>
          </div>
        `;
      }).join('');
      return `
        <div class="choice-group">
          <div class="choice-age">${age}岁 · ${lc.name}</div>
          <div class="choice-list">${choices}</div>
        </div>
      `;
    }).join('');
    // 【P1成就系统】获取成就数据并按分类分组
    const achievements = typeof CollectionManager !== 'undefined' && typeof ACHIEVEMENTS !== 'undefined'
      ? CollectionManager.getAchievements()
      : [];
    const achievementProgress = typeof CollectionManager !== 'undefined'
      ? CollectionManager.getAchievementProgress()
      : { total: 0, unlocked: 0, percentage: 0 };
    const achievementCategories = ['首次', '收集', '挑战', '重开'];
    const achievementsByCategoryHtml = achievementCategories.map(cat => {
      const catAchievements = achievements.filter(a => a.category === cat);
      if (catAchievements.length === 0) return '';
      const itemsHtml = catAchievements.map(a => `
        <div class="achievement-item ${a.unlocked ? 'unlocked' : 'locked'}">
          <div class="achievement-icon">${a.unlocked ? a.icon : '🔒'}</div>
          <div class="achievement-info">
            <div class="achievement-name">${a.unlocked ? a.name : '???'}</div>
            <div class="achievement-desc">${a.unlocked ? a.description : '未解锁'}</div>
          </div>
        </div>
      `).join('');
      return `
        <div class="achievement-category">
          <div class="achievement-cat-title">${cat}</div>
          <div class="achievement-list">${itemsHtml}</div>
        </div>
      `;
    }).join('');
    return `
      <div class="screen collection-screen">
        <div class="collection-header">
          <button class="btn-back" onclick="game.backToMenu()">← 返回</button>
          <h2>📚 人生图鉴</h2>
          <div class="collection-progress">
            <div class="progress-bar">
              <div class="progress-fill" style="width: ${progress.overall}%"></div>
            </div>
            <span class="progress-text">总收集度 ${progress.overall}%</span>
          </div>
        </div>
        <div class="collection-stats">
          <div class="stat-card">
            <div class="stat-value">${collection.stats.totalGames}</div>
            <div class="stat-label">总局数</div>
          </div>
          <div class="stat-card">
            <div class="stat-value">${progress.scenarios.collected}/${progress.scenarios.total}</div>
            <div class="stat-label">剧本</div>
          </div>
          <div class="stat-card">
            <div class="stat-value">${progress.endings.collected}/${progress.endings.total}</div>
            <div class="stat-label">结局</div>
          </div>
          <div class="stat-card">
            <div class="stat-value">${this.formatNumber(collection.stats.bestNetWorth)}</div>
            <div class="stat-label">最高净资产</div>
          </div>
        </div>
        <div class="collection-section">
          <h3>🎭 人生剧本</h3>
          <div class="collection-grid">${scenariosHtml}</div>
        </div>
        <div class="collection-section">
          <h3>🏆 人生结局</h3>
          ${endingsHtml}
        </div>
        <div class="collection-section">
          <h3>🚦 人生岔路</h3>
          ${choicesHtml}
        </div>
        <div class="collection-section">
          <h3>🏆 成就收集 <span class="achievement-progress">${achievementProgress.unlocked}/${achievementProgress.total}</span></h3>
          ${achievementsByCategoryHtml}
        </div>
        <div class="collection-footer">
          <p>每一次重开，都是一次新的人生。你体验过的所有选择，都记录在这里。</p>
        </div>
      </div>
    `;
  }
  // 渲染人际关系界面
  renderRelationships() {
    const p = this.game.player;
    const rm = this.game.relationshipManager;
    const overview = rm.getRelationshipOverview();
    // 朋友列表
    const friendsHtml = rm.friends.length > 0
      ? rm.friends.map(f => `
        <div class="friend-card">
          <div class="friend-info">
            <div class="friend-name">${f.name} <span class="friend-occupation">${f.occupation}</span></div>
            <div class="friend-meta">${f.meetContext} · ${f.meetAge}岁认识</div>
          </div>
          <div class="friend-relationship">
            <div class="relationship-bar">
              <div class="relationship-fill" style="width:${f.relationship}%;background:${f.relationship >= 70 ? '#52C41A' : f.relationship >= 40 ? '#FAAD14' : '#EA6668'}"></div>
            </div>
            <span class="relationship-value">${f.relationship}</span>
          </div>
          <button class="btn-contact" onclick="game.contactFriend('${f.id}')">📞 联系</button>
        </div>
      `).join('')
      : '<div class="empty-state">还没有朋友，多参加社交活动吧</div>';
    // 伴侣状态
    let partnerHtml = '';
    if (rm.partner) {
      const partner = rm.partner;
      const statusText = { dating: '💕 恋爱中', married: '💍 已婚', divorced: '💔 离异' }[partner.status] || partner.status;
      partnerHtml = `
        <div class="partner-card">
          <div class="partner-header">
            <div class="partner-name">${partner.name} <span class="partner-status">${statusText}</span></div>
            <div class="partner-occupation">${partner.occupation} · ${partner.personality}</div>
          </div>
          <div class="partner-relationship">
            <div class="relationship-bar">
              <div class="relationship-fill" style="width:${partner.relationship}%;background:#EAA7B2"></div>
            </div>
            <span class="relationship-value">${partner.relationship}</span>
          </div>
          <div class="partner-actions">
            ${partner.status === 'dating' ? `
              <button class="btn-date" onclick="game.goOnDate()">🌹 约会</button>
              <button class="btn-propose" onclick="game.propose()">💍 求婚</button>
            ` : ''}
            ${partner.status === 'married' ? `
              <button class="btn-divorce" onclick="game.divorce()">💔 离婚</button>
            ` : ''}
          </div>
        </div>
      `;
    } else {
      partnerHtml = '<div class="empty-state">单身中，等待遇到对的人</div>';
    }
    // 子女列表
    const childrenHtml = rm.children.length > 0
      ? rm.children.map(c => `
        <div class="child-card">
          <div class="child-info">
            <div class="child-name">${c.name} <span class="child-gender">${c.gender}</span></div>
            <div class="child-meta">${Math.floor(c.age)}岁 · ${c.educationLevel}</div>
          </div>
          <div class="child-stats">
            <div class="child-stat">
              <span class="stat-label">教育质量</span>
              <div class="relationship-bar"><div class="relationship-fill" style="width:${c.educationQuality}%;background:#9BBBF4"></div></div>
            </div>
            <div class="child-stat">
              <span class="stat-label">亲子关系</span>
              <div class="relationship-bar"><div class="relationship-fill" style="width:${c.relationship}%;background:#EAA7B2"></div></div>
            </div>
          </div>
          <div class="child-actions">
            <button class="btn-educate" onclick="game.investInChildEducation('${c.id}')">📚 教育投资</button>
            <button class="btn-accompany" onclick="game.spendTimeWithChild('${c.id}')">👨‍👧 陪伴</button>
          </div>
        </div>
      `).join('')
      : '<div class="empty-state">还没有孩子</div>';
    return `
      <div class="relationships-screen">
        <div class="screen-header">
          <h2>👥 人际关系</h2>
          <button class="btn-back" onclick="game.backToGame()">← 返回</button>
        </div>
        <div class="social-overview">
          <div class="social-score">
            <div class="score-label">社交分数</div>
            <div class="score-value">${overview.socialScore}</div>
            <div class="score-bar"><div class="score-fill" style="width:${overview.socialScore}%"></div></div>
          </div>
          <div class="social-stats">
            <div class="stat-item"><span class="stat-icon">👥</span><span class="stat-text">朋友 ${overview.friends.total}（亲密${overview.friends.close}）</span></div>
            <div class="stat-item"><span class="stat-icon">💕</span><span class="stat-text">${overview.partner.description}</span></div>
            <div class="stat-item"><span class="stat-icon">👶</span><span class="stat-text">子女 ${overview.children.total}（在学${overview.children.inSchool}）</span></div>
          </div>
        </div>
        <div class="relationship-section">
          <h3>💕 伴侣</h3>
          ${partnerHtml}
        </div>
        <div class="relationship-section">
          <h3>👥 朋友 <span class="section-count">${rm.friends.length}</span></h3>
          <div class="friends-list">${friendsHtml}</div>
        </div>
        <div class="relationship-section">
          <h3>👶 子女 <span class="section-count">${rm.children.length}</span></h3>
          <div class="children-list">${childrenHtml}</div>
        </div>
      </div>
    `;
  }
  // 渲染房产界面
  renderProperty() {
    const p = this.game.player;
    const pm = this.game.propertyManager;
    if (!p || !pm) return '<div class="property-screen"><p>加载中...</p></div>';
    const overview = pm.getPropertyOverview(p);
    const available = pm.getAvailableProperties(p);
    // 已持有房产HTML
    let ownedHtml = '';
    if (p.properties && p.properties.length > 0) {
      ownedHtml = p.properties.map(prop => {
        const equity = prop.currentValue - prop.remainingLoan;
        const paidPercent = prop.loanAmount > 0 ? Math.round((1 - prop.remainingLoan / prop.loanAmount) * 100) : 100;
        return `
          <div class="property-card owned">
            <div class="property-header">
              <span class="property-icon">${prop.icon}</span>
              <div class="property-info">
                <div class="property-name">${prop.name}</div>
                <div class="property-location">${prop.location} · ${prop.purchaseAge}岁购入</div>
              </div>
            </div>
            <div class="property-stats">
              <div class="prop-stat">
                <span class="prop-label">购入价</span>
                <span class="prop-value">¥${(prop.purchasePrice/10000).toFixed(1)}万</span>
              </div>
              <div class="prop-stat">
                <span class="prop-label">当前价</span>
                <span class="prop-value">¥${(prop.currentValue/10000).toFixed(1)}万</span>
              </div>
              <div class="prop-stat">
                <span class="prop-label">剩余贷款</span>
                <span class="prop-value">¥${(prop.remainingLoan/10000).toFixed(1)}万</span>
              </div>
              <div class="prop-stat">
                <span class="prop-label">月供</span>
                <span class="prop-value">¥${prop.monthlyMortgage}</span>
              </div>
            </div>
            <div class="loan-progress">
              <div class="loan-bar"><div class="loan-fill" style="width:${paidPercent}%"></div></div>
              <span class="loan-text">已还${paidPercent}%</span>
            </div>
            <div class="property-actions">
              <button class="btn-sell" onclick="game.sellProperty('${prop.id}')">💰 出售</button>
            </div>
          </div>
        `;
      }).join('');
    } else {
      ownedHtml = '<div class="empty-state">🏠 还没有房产，考虑买一套吗？</div>';
    }
    // 可购买房产HTML
    const availableHtml = available.map(prop => {
      const disabled = !prop.canAfford ? 'disabled' : '';
      return `
        <div class="property-card available ${!prop.canAfford ? 'locked' : ''}">
          <div class="property-header">
            <span class="property-icon">${prop.icon}</span>
            <div class="property-info">
              <div class="property-name">${prop.name}</div>
              <div class="property-desc">${prop.description}</div>
            </div>
          </div>
          <div class="property-stats">
            <div class="prop-stat">
              <span class="prop-label">总价</span>
              <span class="prop-value">¥${(prop.price/10000).toFixed(1)}万</span>
            </div>
            <div class="prop-stat">
              <span class="prop-label">首付</span>
              <span class="prop-value">¥${(prop.downPayment/10000).toFixed(1)}万</span>
            </div>
            <div class="prop-stat">
              <span class="prop-label">贷款</span>
              <span class="prop-value">¥${(prop.loanAmount/10000).toFixed(1)}万</span>
            </div>
            <div class="prop-stat">
              <span class="prop-label">月供</span>
              <span class="prop-value">¥${prop.monthlyMortgage}</span>
            </div>
          </div>
          <div class="property-actions">
            <button class="btn-buy" onclick="game.buyProperty('${prop.id}')" ${disabled}>
              ${prop.canAfford ? '🏠 购买' : '💸 首付不足'}
            </button>
          </div>
        </div>
      `;
    }).join('');
    const marketTrendText = overview.marketTrend > 0.2 ? '📈 上涨' : overview.marketTrend < -0.2 ? '📉 下跌' : '➡️ 平稳';
    return `
      <div class="property-screen">
        <div class="screen-header">
          <button class="btn-back" onclick="game.backToGame()">← 返回</button>
          <h2>🏠 房产</h2>
        </div>
        <div class="property-overview">
          <div class="overview-grid">
            <div class="overview-item">
              <div class="overview-label">房产总值</div>
              <div class="overview-value">¥${(overview.totalValue/10000).toFixed(1)}万</div>
            </div>
            <div class="overview-item">
              <div class="overview-label">剩余贷款</div>
              <div class="overview-value danger">¥${(overview.totalRemainingLoan/10000).toFixed(1)}万</div>
            </div>
            <div class="overview-item">
              <div class="overview-label">房产净值</div>
              <div class="overview-value success">¥${(overview.equity/10000).toFixed(1)}万</div>
            </div>
            <div class="overview-item">
              <div class="overview-label">${overview.hasProperty ? '月供' : '房租'}</div>
              <div class="overview-value">¥${overview.hasProperty ? overview.totalMonthlyMortgage : overview.rent}</div>
            </div>
          </div>
          <div class="market-trend">市场趋势：${marketTrendText}</div>
        </div>
        <div class="property-section">
          <h3>🏠 我的房产 <span class="section-count">${overview.propertyCount}</span></h3>
          <div class="property-list">${ownedHtml}</div>
        </div>
        <div class="property-section">
          <h3>🛒 可购买房产</h3>
          <div class="property-list">${availableHtml}</div>
        </div>
      </div>
    `;
  }
}
