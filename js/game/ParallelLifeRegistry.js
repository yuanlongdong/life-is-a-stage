/**
 * 平行人生分支树 v1.0
 * 保存每一次“如果当时……”推演，让人生不再只有一次A/B比较。
 */
(function () {
  function clone(value) {
    if (value === undefined || value === null) return value;
    try { return JSON.parse(JSON.stringify(value)); } catch (_) { return null; }
  }

  function ensure(state) {
    if (!state) return [];
    if (!Array.isArray(state.parallelBranches)) state.parallelBranches = [];
    return state.parallelBranches;
  }

  function add(state, data) {
    const branches = ensure(state);
    const branch = {
      id: data.id || `branch_${Date.now()}_${Math.floor(Math.random() * 10000)}`,
      parentId: data.parentId || null,
      sourceTimelineId: data.sourceTimelineId || null,
      decisionAge: data.decisionAge ?? null,
      originalChoice: data.originalChoice || '',
      alternativeChoice: data.alternativeChoice || '',
      createdAt: data.createdAt || Date.now(),
      status: data.status || 'simulated',
      comparison: clone(data.comparison),
      stateSnapshot: clone(data.stateSnapshot)
    };
    branches.push(branch);
    return branch;
  }

  function get(state, id) {
    return ensure(state).find(item => item.id === id) || null;
  }

  function children(state, parentId) {
    return ensure(state).filter(item => (item.parentId || null) === (parentId || null));
  }

  function snapshot(state) { return clone(ensure(state)); }

  function restore(state, data) {
    state.parallelBranches = Array.isArray(data) ? clone(data) : [];
    return state.parallelBranches;
  }

  // 把分支树接入现有localStorage存档，而不改写旧GameState.save/load。
  function install() {
    if (typeof GameState === 'undefined') return;
    const originalSave = GameState.prototype.save;
    const originalLoad = GameState.prototype.load;
    if (GameState.prototype.__parallelRegistryInstalled) return;

    GameState.prototype.save = function () {
      const result = originalSave.call(this);
      try {
        const raw = localStorage.getItem('life_is_a_stage_save');
        if (raw) {
          const data = JSON.parse(raw);
          data.parallelBranches = snapshot(this);
          localStorage.setItem('life_is_a_stage_save', JSON.stringify(data));
        }
      } catch (e) { console.warn('Parallel branch save failed:', e); }
      return result;
    };

    GameState.prototype.load = function () {
      const result = originalLoad.call(this);
      try {
        const raw = localStorage.getItem('life_is_a_stage_save');
        const data = raw ? JSON.parse(raw) : null;
        restore(this, data && data.parallelBranches);
        if (this.player && this.lifeTimeline) this.lifeTimeline.player = this.player;
      } catch (e) { console.warn('Parallel branch load failed:', e); }
      return result;
    };
    GameState.prototype.__parallelRegistryInstalled = true;
  }

  window.ParallelLifeRegistry = { ensure, add, get, children, snapshot, restore, install };
  install();
})();
