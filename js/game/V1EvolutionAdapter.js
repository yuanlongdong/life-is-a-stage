/**
 * v1.0 演化适配层
 * 不重写旧 GameState，先在外围接入因果记录与人生时间线。
 * 后续核心模拟稳定后，再逐步把旧 effects 迁移为 consequence。
 */
(function () {
  if (typeof GameState === 'undefined' || typeof Player === 'undefined') return;

  const originalStart = GameState.prototype.startNewGame;
  const originalAdvance = GameState.prototype.advanceMonth;
  const originalApplyEffects = Player.prototype.applyEffects;

  function attachV1Systems(state) {
    if (!state || !state.player) return;
    state.causalEngine = new CausalEngine(state.player);
    state.lifeTimeline = new LifeTimeline(state.player);
    state.lifeTimeline.add({
      type: 'start',
      importance: 'critical',
      title: '人生开幕',
      text: `以【${state.player.scenarioName}】开始人生`,
      tags: ['start', state.player.scenarioId]
    });
  }

  GameState.prototype.startNewGame = function (scenario) {
    const player = originalStart.call(this, scenario);
    attachV1Systems(this);
    return player;
  };

  GameState.prototype.advanceMonth = function () {
    const result = originalAdvance.call(this);
    if (!this.player) return result;

    if (!this.causalEngine || !this.lifeTimeline) attachV1Systems(this);

    // 每个月推进一次持续因果。
    if (this.causalEngine) this.causalEngine.tick();

    // 只记录真正值得回看的节点，避免时间线变成流水账。
    if (result && result.event) {
      this.lifeTimeline.add({
        type: 'event',
        importance: 'major',
        title: result.event.name || '人生事件',
        text: result.event.description || '',
        tags: ['event', result.event.category || 'life'],
        metadata: { eventId: result.event.id || null }
      });
    }

    if (result && result.gameOver) {
      this.lifeTimeline.add({
        type: 'ending',
        importance: 'critical',
        title: '人生终章',
        text: '本轮人生结束，等待复盘与平行人生推演。',
        tags: ['ending']
      });
    }

    return result;
  };

  Player.prototype.applyEffects = function (effects) {
    const applied = originalApplyEffects.call(this, effects);
    if (this && this._v1CausalEngine) {
      this._v1CausalEngine.recordEffects('legacy_effects', effects);
    }
    return applied;
  };

  const originalSerialize = Player.prototype.serialize;
  Player.prototype.serialize = function () {
    const data = JSON.parse(originalSerialize.call(this));
    if (this._v1CausalEngine) data.v1CausalSnapshot = this._v1CausalEngine.snapshot();
    return JSON.stringify(data);
  };

  Object.defineProperty(GameState.prototype, 'v1Simulation', {
    configurable: true,
    get() {
      if (!this.player) return null;
      if (!this.causalEngine || !this.lifeTimeline) attachV1Systems(this);
      if (this.causalEngine) this.causalEngine.player = this.player;
      if (this.lifeTimeline) this.lifeTimeline.player = this.player;
      this.player._v1CausalEngine = this.causalEngine;
      return {
        causalEngine: this.causalEngine,
        lifeTimeline: this.lifeTimeline
      };
    }
  });

  window.LifeSimulation = {
    version: '1.0.0-alpha.1',
    get(state) {
      return state ? state.v1Simulation : null;
    }
  };
})();
