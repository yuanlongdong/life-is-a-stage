/**
 * 《人生如戏》主入口
 * Life is a Stage - Main Entry
 */
// 全局游戏实例
var game = null;

class Game {
  constructor() {
    this.state = new GameState();
    this.ui = new UIManager(this.state);
    this.container = document.getElementById('app');
  }

  init() {
    this.render();
  }

  render() {
    let html = '';
    switch (this.state.phase) {
      case GamePhase.MENU:
        html = this.ui.renderMenu();
        break;
      case GamePhase.SCENARIO_SELECT:
        html = this.ui.renderScenarioSelect();
        break;
      case GamePhase.PLAYING:
        html = this.ui.renderGame();
        break;
      case GamePhase.SKILL_TREE:
        html = this.ui.renderSkillTree();
        break;
      case GamePhase.INVEST:
        html = this.ui.renderInvest();
        break;
      case GamePhase.RELATIONSHIPS:
        html = this.ui.renderRelationships();
        break;
      case GamePhase.PROPERTY:
        html = this.ui.renderProperty();
        break;
      case GamePhase.GAME_OVER:
        html = this.ui.renderGameOver(this.state.gameOverReason || { message: '游戏结束' });
        break;
      case GamePhase.COLLECTION:
        html = this.ui.renderCollection();
        break;
      case GamePhase.LAST_GAME_REVIEW:
        html = this.ui.renderGame() + this.ui.renderLastGameReview();
        break;
      default:
        html = this.ui.renderMenu();
    }
    // 事件弹窗（叠加层）
    if (this.state.phase === GamePhase.EVENT && this.state.pendingEvent) {
      html += this.ui.renderEvent(this.state.pendingEvent);
    }
    // 年度回顾（叠加层）
    if (this.state.phase === GamePhase.YEAR_REVIEW) {
      html += this.ui.renderYearReview();
    }
    this.container.innerHTML = html;
  }

  // === 菜单操作 ===
  startScenarioSelect() {
    this.state.phase = GamePhase.SCENARIO_SELECT;
    this.render();
  }

  backToMenu() {
    this.state.phase = GamePhase.MENU;
    this.render();
  }

  selectScenario(scenarioId) {
    const scenario = SCENARIOS.find(s => s.id === scenarioId);
    if (scenario) {
      this.state.startNewGame(scenario);
      this.render();
    }
  }

  showAbout() {
    alert('《人生如戏》\n\n一款人生模拟 × 财商教育 × 卡牌决策游戏。\n\n每个人都是自己人生的主角，你的每一个选择，都在书写剧本的下一幕。\n\n版本: v0.9');
  }

  // 显示人生图鉴
  showCollection() {
    this.state.phase = GamePhase.COLLECTION;
    this.render();
  }

  loadGame() {
    if (this.state.load()) {
      this.render();
    } else {
      alert('没有找到存档，请开始新人生。');
    }
  }

  nextMonth() {
    if (this.state.phase !== GamePhase.PLAYING) return;

    // 【v0.9】记录上月财务阶段（用于检测阶段提升）
    const prevStage = this.state.getFinancialStage();
    const prevStageName = prevStage ? prevStage.name : '';

    const result = this.state.advanceMonth();

    // 【v0.9】成长反馈：记录收入和债务历史
    const p = this.state.player;
    const monthlyIncome = p.getMonthlyIncome().total;
    p.incomeHistory.push(monthlyIncome);
    if (p.incomeHistory.length > 12) p.incomeHistory.shift();
    p.debtHistory.push(p.debt);
    if (p.debtHistory.length > 12) p.debtHistory.shift();

    // 【v0.9】检测财务阶段提升
    const newStage = this.state.getFinancialStage();
    if (newStage && newStage.name !== prevStageName) {
      p.recentStageUp = `财务阶段提升：${prevStageName} → ${newStage.name}`;
    }

    if (result.gameOver) {
      this.state.gameOverReason = result.gameOver;
      this.state.phase = GamePhase.GAME_OVER;
    }

    // 自动存档
    this.state.save();
    this.render();
  }

  showSkillTree() {
    this.state.phase = GamePhase.SKILL_TREE;
    this.render();
  }

  showInvest() {
    this.state.phase = GamePhase.INVEST;
    this.render();
  }

  // 显示人际关系界面
  showRelationships() {
    this.state.phase = GamePhase.RELATIONSHIPS;
    this.render();
  }

  // 房产系统
  showProperty() {
    this.state.phase = GamePhase.PROPERTY;
    this.render();
  }

  // 【v0.9】更多菜单 - 把人际关系和房产收进"更多"
  showMoreMenu() {
    const overlay = document.createElement('div');
    overlay.className = 'more-menu-overlay';
    overlay.innerHTML = `
      <div class="more-menu-modal">
        <div class="more-menu-title">更多功能</div>
        <button class="more-menu-item" onclick="game.showRelationships(); document.querySelector('.more-menu-overlay').remove();">
          <span class="more-menu-icon">👥</span>
          <span>人际关系</span>
        </button>
        <button class="more-menu-item" onclick="game.showProperty(); document.querySelector('.more-menu-overlay').remove();">
          <span class="more-menu-icon">🏠</span>
          <span>房产</span>
        </button>
        <button class="more-menu-item more-menu-close" onclick="document.querySelector('.more-menu-overlay').remove();">
          <span>取消</span>
        </button>
      </div>
    `;
    document.body.appendChild(overlay);
  }

  buyProperty(propertyTypeId) {
    const result = this.state.buyProperty(propertyTypeId);
    if (result.success) {
      alert(`🏠 成功购买【${result.property.name}】！`);
    } else {
      alert(`❌ ${result.message}`);
    }
    this.render();
  }

  sellProperty(propertyId) {
    const result = this.state.sellProperty(propertyId);
    if (result.success) {
      const profitText = result.netProfit >= 0 ? `盈利${(result.netProfit/10000).toFixed(1)}万` : `亏损${(Math.abs(result.netProfit)/10000).toFixed(1)}万`;
      alert(`💰 出售成功，${profitText}！`);
    } else {
      alert(`❌ ${result.message}`);
    }
    this.render();
  }

  backToGame() {
    this.state.phase = GamePhase.PLAYING;
    this.render();
  }

  learnSkill(skillId) {
    const result = this.state.learnSkill(skillId);
    if (!result.success) {
      alert(result.message);
    }
    this.render();
  }

  developSkill(skillId) {
    const result = this.state.developSkill(skillId);
    if (!result.success) {
      alert(result.message);
    }
    this.render();
  }

  invest(amount, type) {
    const result = this.state.invest(amount, type);
    if (!result.success) {
      alert(result.message);
    }
    this.render();
  }

  withdrawInvestment(amount) {
    const result = this.state.withdrawInvestment(amount);
    if (!result.success) {
      alert(result.message);
    }
    this.render();
  }

  repayDebt(amount) {
    const result = this.state.repayDebt(amount);
    if (!result.success) {
      alert(result.message);
    }
    this.render();
  }

  contactFriend(friendId) {
    const result = this.state.relationshipManager.contactFriend(friendId, this.state.player);
    if (!result.success) {
      alert(result.message);
    }
    this.render();
  }

  goOnDate() {
    const result = this.state.relationshipManager.goOnDate(this.state.player);
    if (!result.success) {
      alert(result.message);
    }
    this.render();
  }

  propose() {
    const result = this.state.relationshipManager.propose(this.state.player);
    if (!result.success) {
      alert(result.message);
    } else {
      alert('求婚成功！恭喜结婚！');
    }
    this.render();
  }

  divorce() {
    if (!confirm('确定要离婚吗？这将损失40%的储蓄。')) return;
    const result = this.state.relationshipManager.divorce(this.state.player);
    if (!result.success) {
      alert(result.message);
    }
    this.render();
  }

  investInChildEducation(childId) {
    const amount = prompt('教育投资金额（元）：', '5000');
    if (!amount) return;
    const result = this.state.relationshipManager.investInChildEducation(childId, parseInt(amount), this.state.player);
    if (!result.success) {
      alert(result.message);
    }
    this.render();
  }

  spendTimeWithChild(childId) {
    const result = this.state.relationshipManager.spendTimeWithChild(childId, this.state.player);
    if (!result.success) {
      alert(result.message);
    }
    this.render();
  }

  resolveEvent(choiceIndex) {
    const result = this.state.resolveEventChoice(choiceIndex);
    if (result && !result.success) {
      alert(result.message);
      return;
    }
    this.render();
  }

  continueAfterYearReview() {
    this.state.phase = GamePhase.PLAYING;
    this.render();
  }

  continueAfterLastGameReview() {
    this.state.continueAfterLastGameReview();
    this.render();
  }

  restart() {
    this.state.clearSave();
    this.state.phase = GamePhase.SCENARIO_SELECT;
    this.state.player = null;
    this.render();
  }
}

document.addEventListener('DOMContentLoaded', function() {
  game = new Game();
  window.game = game;
  game.init();
});

if (typeof module !== 'undefined' && module.exports) {
  module.exports = { Game, GameState, Player, UIManager };
}
