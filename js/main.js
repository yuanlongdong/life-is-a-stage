/**
 * 《人生如戏》主入口
 * Life is a Stage - Main Entry
 */
var game = null;

class Game {
  constructor() {
    this.state = new GameState();
    this.ui = new UIManager(this.state);
    this.container = document.getElementById('app');
  }

  init() { this.render(); }

  render() {
    let html = '';
    switch (this.state.phase) {
      case GamePhase.MENU: html = this.ui.renderMenu(); break;
      case GamePhase.SCENARIO_SELECT: html = this.ui.renderScenarioSelect(); break;
      case GamePhase.PLAYING: html = this.ui.renderGame(); break;
      case GamePhase.SKILL_TREE: html = this.ui.renderSkillTree(); break;
      case GamePhase.INVEST: html = this.ui.renderInvest(); break;
      case GamePhase.RELATIONSHIPS: html = this.ui.renderRelationships(); break;
      case GamePhase.PROPERTY: html = this.ui.renderProperty(); break;
      case GamePhase.GAME_OVER: html = this.ui.renderGameOver(this.state.gameOverReason || { message: '游戏结束' }); break;
      case GamePhase.COLLECTION: html = this.ui.renderCollection(); break;
      case GamePhase.LAST_GAME_REVIEW: html = this.ui.renderGame() + this.ui.renderLastGameReview(); break;
      default: html = this.ui.renderMenu();
    }
    if (this.state.phase === GamePhase.EVENT && this.state.pendingEvent) html += this.ui.renderEvent(this.state.pendingEvent);
    if (this.state.phase === GamePhase.YEAR_REVIEW) html += this.ui.renderYearReview();
    if (this.state.phase === GamePhase.PLAYING && typeof LifeTimelineUI !== 'undefined') {
      html += '<button class="timeline-launcher" onclick="game.showTimeline()">⌛ 我的这一生</button>';
    }
    this.container.innerHTML = html;
  }

  startScenarioSelect() { this.state.phase = GamePhase.SCENARIO_SELECT; this.render(); }
  backToMenu() { this.state.phase = GamePhase.MENU; this.render(); }
  selectScenario(scenarioId) {
    const scenario = SCENARIOS.find(s => s.id === scenarioId);
    if (scenario) { this.state.startNewGame(scenario); this.render(); }
  }
  showAbout() { alert('《人生如戏》\n\n一款人生模拟 × 财商教育 × 卡牌决策游戏。\n\n每个人都是自己人生的主角，你的每一个选择，都在书写剧本的下一幕。\n\n版本: v1'); }
  showCollection() { this.state.phase = GamePhase.COLLECTION; this.render(); }
  loadGame() { if (this.state.load()) this.render(); else alert('没有找到存档，请开始新人生。'); }

  nextMonth() {
    if (this.state.phase !== GamePhase.PLAYING) return;
    const prevStage = this.state.getFinancialStage();
    const prevStageName = prevStage ? prevStage.name : '';
    const result = this.state.advanceMonth();
    const p = this.state.player;
    const monthlyIncome = p.getMonthlyIncome().total;
    p.incomeHistory.push(monthlyIncome);
    if (p.incomeHistory.length > 12) p.incomeHistory.shift();
    p.debtHistory.push(p.debt);
    if (p.debtHistory.length > 12) p.debtHistory.shift();
    const newStage = this.state.getFinancialStage();
    if (newStage && newStage.name !== prevStageName) p.recentStageUp = `财务阶段提升：${prevStageName} → ${newStage.name}`;
    if (result && result.gameOver) { this.state.gameOverReason = result.gameOver; this.state.phase = GamePhase.GAME_OVER; }
    this.state.save();
    this.render();
  }

  showTimeline() {
    if (!this.state.player || typeof LifeTimelineUI === 'undefined') return;
    const existing = document.querySelector('.timeline-overlay');
    if (existing) return;
    document.body.insertAdjacentHTML('beforeend', LifeTimelineUI.render(this.state));
  }
  closeTimeline() { const overlay = document.querySelector('.timeline-overlay'); if (overlay) overlay.remove(); }

  showParallelChoices(entryIndex) {
    if (!this.state.lifeTimeline || typeof LifeTimelineUI === 'undefined') return;
    const entries = this.state.lifeTimeline.getMajorMoments().slice().reverse();
    const entry = entries[entryIndex];
    if (!entry) return;
    this._currentParallelEntry = entry;
    this.closeTimeline();
    document.body.insertAdjacentHTML('beforeend', LifeTimelineUI.renderParallelChoices(this.state, entry));
  }

  closeParallelChoices() {
    const overlay = document.querySelector('.parallel-modal')?.closest('.timeline-overlay');
    if (overlay) overlay.remove();
    if (this.state.player && typeof LifeTimelineUI !== 'undefined') {
      document.body.insertAdjacentHTML('beforeend', LifeTimelineUI.render(this.state));
    }
  }

  startParallelLife(timelineId, choiceId) {
    if (typeof ParallelLife === 'undefined' || !this._currentParallelEntry) {
      alert('平行人生功能未加载');
      return;
    }
    this.closeParallelChoices();
    document.body.insertAdjacentHTML('beforeend', LifeTimelineUI.renderSimulating());

    setTimeout(() => {
      try {
        const result = ParallelLife.simulate(this.state, this._currentParallelEntry, choiceId);
        const simOverlay = document.querySelector('.simulating-modal')?.closest('.timeline-overlay');
        if (simOverlay) simOverlay.remove();

        if (!result.success) {
          alert(result.message || '平行人生模拟失败');
          return;
        }

        this._lastParallelResult = result;
        document.body.insertAdjacentHTML('beforeend', LifeTimelineUI.renderComparison(result.comparison));
      } catch (e) {
        console.error('Parallel life simulation error:', e);
        const simOverlay = document.querySelector('.simulating-modal')?.closest('.timeline-overlay');
        if (simOverlay) simOverlay.remove();
        alert('平行人生模拟出错：' + e.message);
      }
    }, 100);
  }

  closeComparison() {
    const overlay = document.querySelector('.comparison-modal')?.closest('.timeline-overlay');
    if (overlay) overlay.remove();
    this._lastParallelResult = null;
  }

  continueFromParallel() {
    if (!this._lastParallelResult || !this._lastParallelResult.parallelState) {
      alert('没有可继续的平行人生');
      return;
    }
    if (!confirm('确定要以B人生继续吗？当前A人生的进度将被替换。')) return;

    const parallelState = this._lastParallelResult.parallelState;
    this.state.player = parallelState.player;
    this.state.causalEngine = parallelState.causalEngine;
    this.state.lifeTimeline = parallelState.lifeTimeline;
    this.state.phase = GamePhase.PLAYING;
    this.state.currentMonth = parallelState.currentMonth;
    this.state.currentYear = parallelState.currentYear;
    this.state.totalMonthsPlayed = parallelState.totalMonthsPlayed;
    this.state.relationshipManager = parallelState.relationshipManager;
    this.state.propertyManager = parallelState.propertyManager;
    // 确保后续所有 Player.applyEffects 都继续写入当前B人生的因果引擎。
    if (this.state.player) this.state.player._v1CausalEngine = this.state.causalEngine || null;

    this.closeComparison();
    this.state.save();
    this.render();
    alert('🔀 你已进入平行人生！');
  }

  showSkillTree() { this.state.phase = GamePhase.SKILL_TREE; this.render(); }
  showInvest() { this.state.phase = GamePhase.INVEST; this.render(); }
  showRelationships() { this.state.phase = GamePhase.RELATIONSHIPS; this.render(); }
  showProperty() { this.state.phase = GamePhase.PROPERTY; this.render(); }

  showMoreMenu() {
    const overlay = document.createElement('div'); overlay.className = 'more-menu-overlay';
    overlay.innerHTML = `<div class="more-menu-modal"><div class="more-menu-title">更多功能</div>
      <button class="more-menu-item" onclick="game.showRelationships(); document.querySelector('.more-menu-overlay').remove();"><span class="more-menu-icon">👥</span><span>人际关系</span></button>
      <button class="more-menu-item" onclick="game.showProperty(); document.querySelector('.more-menu-overlay').remove();"><span class="more-menu-icon">🏠</span><span>房产</span></button>
      <button class="more-menu-close" onclick="document.querySelector('.more-menu-overlay').remove();"><span>取消</span></button></div>`;
    document.body.appendChild(overlay);
  }

  buyProperty(id) { const r=this.state.buyProperty(id); alert(r.success ? `🏠 成功购买【${r.property.name}】！` : `❌ ${r.message}`); this.render(); }
  sellProperty(id) { const r=this.state.sellProperty(id); if(r.success){const t=r.netProfit>=0?`盈利${(r.netProfit/10000).toFixed(1)}万`:`亏损${(Math.abs(r.netProfit)/10000).toFixed(1)}万`;alert(`💰 出售成功，${t}！`);}else alert(`❌ ${r.message}`);this.render(); }
  backToGame() { this.state.phase = GamePhase.PLAYING; this.render(); }
  learnSkill(id) { const r=this.state.learnSkill(id); if(!r.success) alert(r.message); this.render(); }
  developSkill(id) { const r=this.state.developSkill(id); if(!r.success) alert(r.message); this.render(); }
  invest(amount,type) { const r=this.state.invest(amount,type); if(!r.success) alert(r.message); this.render(); }
  withdrawInvestment(amount) { const r=this.state.withdrawInvestment(amount); if(!r.success) alert(r.message); this.render(); }
  repayDebt(amount) { const r=this.state.repayDebt(amount); if(!r.success) alert(r.message); this.render(); }
  contactFriend(id) { const r=this.state.relationshipManager.contactFriend(id,this.state.player); if(!r.success) alert(r.message); this.render(); }
  goOnDate() { const r=this.state.relationshipManager.goOnDate(this.state.player); if(!r.success) alert(r.message); this.render(); }
  propose() { const r=this.state.relationshipManager.propose(this.state.player); if(!r.success) alert(r.message); else alert('求婚成功！恭喜结婚！'); this.render(); }
  divorce() { if(!confirm('确定要离婚吗？这将损失40%的储蓄。')) return; const r=this.state.relationshipManager.divorce(this.state.player); if(!r.success) alert(r.message); this.render(); }
  investInChildEducation(id) { const amount=prompt('教育投资金额（元）：','5000'); if(!amount)return; const r=this.state.relationshipManager.investInChildEducation(id,parseInt(amount),this.state.player); if(!r.success)alert(r.message);this.render(); }
  spendTimeWithChild(id) { const r=this.state.relationshipManager.spendTimeWithChild(id,this.state.player); if(!r.success)alert(r.message);this.render(); }
  resolveEvent(index) { const r=this.state.resolveEventChoice(index); if(r&&!r.success){alert(r.message);return;} this.render(); }
  continueAfterYearReview() { this.state.phase=GamePhase.PLAYING; this.render(); }
  continueAfterLastGameReview() { this.state.continueAfterLastGameReview(); this.render(); }
  restart() { this.state.clearSave(); this.state.phase=GamePhase.SCENARIO_SELECT; this.state.player=null; this.render(); }
}

document.addEventListener('DOMContentLoaded',function(){game=new Game();window.game=game;game.init();});
if(typeof module!=='undefined'&&module.exports) module.exports={Game,GameState,Player,UIManager};