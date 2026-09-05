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
  const originalSerialize = typeof Player.prototype.serialize === 'function'
    ? Player.prototype.serialize
    : null;

  function attachV1Systems(state) {
    if (!state || !state.player || typeof CausalEngine === 'undefined' || typeof LifeTimeline === 'undefined') return;
    state.causalEngine = new CausalEngine(state.player);
    state.lifeTimeline = new LifeTimeline(state.player);
    state.player._v1CausalEngine = state.causalEngine;
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
    if (this.causalEngine) this.causalEngine.setPlayer(this.player);
    if (this.lifeTimeline) this.lifeTimeline.player = this.player;
    this.player._v1CausalEngine = this.causalEngine || null;

    // 旧模拟完成一个月后，再结算持续性因果后果，避免半个月状态被读取。
    if (this.causalEngine) this.causalEngine.tick();

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

  // 仅在旧系统已经提供 serialize 时增强；没有 serialize 时不改变旧存档行为。
  if (originalSerialize) {
    Player.prototype.serialize = function () {
      const raw = originalSerialize.call(this);
      let data;
      if (typeof raw === 'string') {
        try {
          data = JSON.parse(raw);
        } catch (error) {
          return raw;
        }
      } else if (raw && typeof raw === 'object') {
        data = { ...raw };
      } else {
        return raw;
      }
      if (this._v1CausalEngine) data.v1CausalSnapshot = this._v1CausalEngine.snapshot();
      return typeof raw === 'string' ? JSON.stringify(data) : data;
    };
  }

  // 给 UI / 事件系统一个稳定入口：以后所有真正改变人生路线的选择都应走这里。
  GameState.prototype.recordLifeDecision = function (decision) {
    if (!this.player) return null;
    if (!this.causalEngine || !this.lifeTimeline) attachV1Systems(this);
    if (!this.causalEngine || !this.lifeTimeline) return null;

    const record = this.causalEngine.recordDecision(decision);
    this.lifeTimeline.add({
      type: 'decision',
      importance: decision.importance || 'major',
      title: decision.title || decision.name || '人生选择',
      text: decision.text || '',
      tags: ['decision', decision.category || 'life'],
      metadata: {
        decisionId: decision.id || null,
        optionId: decision.optionId || null,
        source: decision.source || 'game'
      }
    });
    return record;
  };

  Object.defineProperty(GameState.prototype, 'v1Simulation', {
    configurable: true,
    get() {
      if (!this.player) return null;
      if (!this.causalEngine || !this.lifeTimeline) attachV1Systems(this);
      if (this.causalEngine) this.causalEngine.setPlayer(this.player);
      if (this.lifeTimeline) this.lifeTimeline.player = this.player;
      if (this.player) this.player._v1CausalEngine = this.causalEngine || null;
      return { causalEngine: this.causalEngine, lifeTimeline: this.lifeTimeline };
    }
  });

  window.LifeSimulation = {
    version: '1.0.0-alpha.2',
    get(state) {
      return state ? state.v1Simulation : null;
    }
  };
})();
