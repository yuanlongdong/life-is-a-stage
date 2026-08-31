/**
 * 《人生如戏》主入口
 * Life is a Stage - Main Entry
 */
// 全局游戏实例
let game = null;
class Game {
  constructor() {
    this.state = new GameState();
    this.ui = new UIManager(this.state);
    this.container = document.getElementById('app');
  }
  // 初始化
  init() {
    this.render();
  }
  // 渲染当前界面
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
      case GamePhase.GAME_OVER:
        html = this.ui.renderGameOver(this.state.gameOverReason || { message: '游戏结束' });
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
    alert('《人生如戏》\n\n一款人生模拟 × 财商教育 × 卡牌决策游戏。\n\n每个人都是自己人生的主角，你的每一个选择，都在书写剧本的下一幕。\n\n版本: MVP v0.1');
  }
  loadGame() {
    if (this.state.load()) {
      this.render();
    } else {
      alert('没有找到存档，请开始新人生。');
    }
  }
  // === 游戏操作 ===
  nextMonth() {
    if (this.state.phase !== GamePhase.PLAYING) return;
    const result = this.state.advanceMonth();
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
  backToGame() {
    this.state.phase = GamePhase.PLAYING;
    this.render();
  }
  // === 技能操作 ===
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
  // === 投资操作 ===
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
  // === 事件操作 ===
  resolveEvent(choiceIndex) {
    const result = this.state.resolveEventChoice(choiceIndex);
    if (result && !result.success) {
      alert(result.message);
      return;
    }
    if (result && result.resultText) {
      // 可以显示结果提示
    }
    this.render();
  }
  continueAfterYearReview() {
    this.state.phase = GamePhase.PLAYING;
    this.render();
  }
  // === 游戏结束操作 ===
  restart() {
    this.state.clearSave();
    this.state.phase = GamePhase.SCENARIO_SELECT;
    this.state.player = null;
    this.render();
  }
}
// 页面加载完成后初始化
document.addEventListener('DOMContentLoaded', function() {
  game = new Game();
  game.init();
});
// 防止未定义错误
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { Game, GameState, Player, UIManager };
}
