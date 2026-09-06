/**
 * v1.0 演化适配层
 * 不重写旧 GameState，先在外围接入因果记录与人生时间线。
 */
(function () {
  if (typeof GameState === 'undefined' || typeof Player === 'undefined') return;

  const originalStart = GameState.prototype.startNewGame;
  const originalAdvance = GameState.prototype.advanceMonth;
  const originalApplyEffects = Player.prototype.applyEffects;
  const originalResolveEventChoice = GameState.prototype.resolveEventChoice;
  const originalBuyProperty = GameState.prototype.buyProperty;
  const originalSellProperty = GameState.prototype.sellProperty;
  const originalSerialize = typeof Player.prototype.serialize === 'function' ? Player.prototype.serialize : null;

  function attachV1Systems(state) {
    if (!state || !state.player || typeof CausalEngine === 'undefined' || typeof LifeTimeline === 'undefined') return;
    state.causalEngine = new CausalEngine(state.player);
    state.lifeTimeline = new LifeTimeline(state.player);
    state.player._v1CausalEngine = state.causalEngine;
    state.lifeTimeline.add({
      type: 'start', importance: 'critical', title: '人生开幕',
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

    if (this.causalEngine) {
      const applied = this.causalEngine.tick();
      applied.forEach(item => this.lifeTimeline.add({
        type: 'consequence', importance: 'major', title: '选择开始产生后果',
        text: item.result && (item.result.message || item.result.text) || `持续影响：${item.id}`,
        tags: ['causal', item.id], metadata: { appliedCount: item.appliedCount }
      }));
    }

    if (result && result.event) {
      this.lifeTimeline.add({
        type: 'event', importance: 'major', title: result.event.name || '人生事件',
        text: result.event.description || '', tags: ['event', result.event.category || 'life'],
        metadata: { eventId: result.event.id || null }
      });
    }
    if (result && result.gameOver) {
      this.lifeTimeline.add({
        type: 'ending', importance: 'critical', title: '人生终章',
        text: '本轮人生结束，等待复盘与平行人生推演。', tags: ['ending']
      });
    }
    return result;
  };

  Player.prototype.applyEffects = function (effects) {
    const applied = originalApplyEffects.call(this, effects);
    if (this && this._v1CausalEngine) this._v1CausalEngine.recordEffects('legacy_effects', effects);
    return applied;
  };

  // 真正的人生岔路：选择、结果、长期影响进入同一条可追溯因果链。
  GameState.prototype.resolveEventChoice = function (choiceIndex) {
    const event = this.pendingEvent;
    const choice = event && event.choices ? event.choices[choiceIndex] : null;
    if (event && choice && this.causalEngine) {
      const decision = this.recordLifeDecision({
        id: `${event.id || 'event'}:${choice.id || choiceIndex}`,
        optionId: choice.id || choiceIndex,
        title: choice.shortName || choice.text,
        name: event.name,
        text: event.description || '',
        category: event.isLifeChoice ? 'life_choice' : (event.category || 'event'),
        importance: event.isLifeChoice ? 'critical' : 'major',
        source: event.id || 'event'
      });
      if (decision && (choice.longTermEffects || choice.midTermEffects)) {
        this.causalEngine.addConsequence({
          id: `decision:${event.id || 'event'}:${choice.id || choiceIndex}`,
          sourceDecisionId: decision.id,
          mode: 'once',
          tags: ['persistent', event.isLifeChoice ? 'turning_point' : 'event'],
          metadata: { longTermEffects: choice.longTermEffects || null, midTermEffects: choice.midTermEffects || null },
          effect: () => ({ message: `【${choice.shortName || choice.text}】的长期影响已进入人生轨迹。` })
        });
      }
    }
    return originalResolveEventChoice.call(this, choiceIndex);
  };

  // 房产决策单独进入时间线，形成“资产负债表 -> 人生路径”的第一条真实链路。
  GameState.prototype.buyProperty = function (propertyTypeId) {
    const result = originalBuyProperty.call(this, propertyTypeId);
    if (result && result.success && this.causalEngine) {
      this.recordLifeDecision({
        id: `property:buy:${propertyTypeId}`, optionId: propertyTypeId,
        title: '买房', text: result.property && result.property.name || '购入房产',
        category: 'property', importance: 'major', source: 'property'
      });
      this.causalEngine.addConsequence({
        id: `property:ownership:${propertyTypeId}`, mode: 'once',
        tags: ['property', 'financial_commitment'],
        effect: () => ({ message: '购房后的资产、负债与流动性变化开始进入人生轨迹。' })
      });
    }
    return result;
  };

  GameState.prototype.sellProperty = function (propertyId) {
    const result = originalSellProperty.call(this, propertyId);
    if (result && result.success && this.causalEngine) {
      this.recordLifeDecision({
        id: `property:sell:${propertyId}`, optionId: propertyId,
        title: '卖房', text: result.netProfit >= 0 ? `实现盈利 ¥${result.netProfit}` : `实现亏损 ¥${Math.abs(result.netProfit)}`,
        category: 'property', importance: 'major', source: 'property'
      });
    }
    return result;
  };

  // 兼容旧存档格式；v1 数据只作为附加字段，不破坏旧系统。
  if (originalSerialize) {
    Player.prototype.serialize = function () {
      // 临时移除循环引用属性，避免JSON.stringify失败
      const v1Ref = this._v1CausalEngine;
      const v1Prog = this._v1Progression;
      delete this._v1CausalEngine;
      delete this._v1Progression;

      let raw;
      try {
        raw = originalSerialize.call(this);
      } finally {
        // 恢复引用
        if (v1Ref) this._v1CausalEngine = v1Ref;
        if (v1Prog) this._v1Progression = v1Prog;
      }

      let data;
      if (typeof raw === 'string') {
        try { data = JSON.parse(raw); } catch (error) { return raw; }
      } else if (raw && typeof raw === 'object') {
        data = { ...raw };
      } else return raw;
      if (v1Ref) data.v1CausalSnapshot = v1Ref.snapshot();
      return typeof raw === 'string' ? JSON.stringify(data) : data;
    };
  }

  // 给 UI / 事件系统一个稳定入口：以后所有真正改变人生路线的选择都应走这里。
  // 同时保存玩家状态快照，用于平行人生回溯。
  GameState.prototype.recordLifeDecision = function (decision) {
    if (!this.player) return null;
    if (!this.causalEngine || !this.lifeTimeline) attachV1Systems(this);
    if (!this.causalEngine || !this.lifeTimeline) return null;

    // 保存决策前的玩家状态快照（用于平行人生回溯）
    // 注意：需要排除循环引用属性（_v1CausalEngine等）
    let playerSnapshot = null;
    try {
      const v1Ref = this.player._v1CausalEngine;
      const v1Prog = this.player._v1Progression;
      delete this.player._v1CausalEngine;
      delete this.player._v1Progression;
      playerSnapshot = JSON.parse(JSON.stringify(this.player));
      if (v1Ref) this.player._v1CausalEngine = v1Ref;
      if (v1Prog) this.player._v1Progression = v1Prog;
    } catch (e) {
      console.warn('Failed to snapshot player for parallel life:', e);
    }

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
        source: decision.source || 'game',
        playerSnapshot: playerSnapshot,
        age: this.player.age,
        canParallel: decision.category === 'life_choice' || decision.isLifeChoice === true
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
      this.player._v1CausalEngine = this.causalEngine || null;
      return { causalEngine: this.causalEngine, lifeTimeline: this.lifeTimeline };
    }
  });

  window.LifeSimulation = {
    version: '1.0.0-alpha.3',
    get(state) { return state ? state.v1Simulation : null; }
  };
})();
