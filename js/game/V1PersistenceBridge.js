/**
 * v1 持久化桥接
 * 在不破坏旧存档格式的前提下，把因果引擎、人生时间线和当前平行人生身份写入现有存档。
 */
(function () {
  if (typeof GameState === 'undefined') return;
  if (GameState.prototype.__v1PersistenceBridgeInstalled) return;

  const originalSave = GameState.prototype.save;
  const originalLoad = GameState.prototype.load;

  GameState.prototype.save = function () {
    const result = originalSave.call(this);
    try {
      const raw = localStorage.getItem('life_is_a_stage_save');
      if (!raw) return result;
      const data = JSON.parse(raw);
      data.v1Simulation = {
        activeParallelBranchId: this.activeParallelBranchId || null,
        causalSnapshot: this.causalEngine && typeof this.causalEngine.snapshot === 'function'
          ? this.causalEngine.snapshot() : null,
        timelineSnapshot: this.lifeTimeline && typeof this.lifeTimeline.snapshot === 'function'
          ? this.lifeTimeline.snapshot() : null
      };
      localStorage.setItem('life_is_a_stage_save', JSON.stringify(data));
    } catch (error) {
      console.warn('v1 simulation save failed:', error);
    }
    return result;
  };

  GameState.prototype.load = function () {
    const result = originalLoad.call(this);
    try {
      const raw = localStorage.getItem('life_is_a_stage_save');
      const data = raw ? JSON.parse(raw) : null;
      const saved = data && data.v1Simulation;
      if (!saved || !this.player) return result;

      this.activeParallelBranchId = saved.activeParallelBranchId || null;
      if (typeof CausalEngine !== 'undefined') {
        this.causalEngine = new CausalEngine(this.player);
        if (saved.causalSnapshot) {
          this.causalEngine.causalLog = JSON.parse(JSON.stringify(saved.causalSnapshot.causalLog || []));
          this.causalEngine.activeConsequences = (saved.causalSnapshot.activeConsequences || []).map(item => ({
            ...JSON.parse(JSON.stringify(item)), effect: null, condition: null,
            tags: Array.isArray(item.tags) ? [...item.tags] : []
          }));
          this.causalEngine.sequence = this.causalEngine.causalLog.length;
        }
        this.player._v1CausalEngine = this.causalEngine;
      }
      if (typeof LifeTimeline !== 'undefined' && saved.timelineSnapshot) {
        this.lifeTimeline = new LifeTimeline(this.player);
        this.lifeTimeline.entries = JSON.parse(JSON.stringify(saved.timelineSnapshot.entries || []));
        this.lifeTimeline.branches = JSON.parse(JSON.stringify(saved.timelineSnapshot.branches || []));
        this.lifeTimeline.sequence = this.lifeTimeline.entries.length + this.lifeTimeline.branches.length;
        this.lifeTimeline.player = this.player;
      }
    } catch (error) {
      console.warn('v1 simulation load failed:', error);
    }
    return result;
  };

  GameState.prototype.__v1PersistenceBridgeInstalled = true;
})();
