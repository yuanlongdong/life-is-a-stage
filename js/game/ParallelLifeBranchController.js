/**
 * 平行人生分支控制器 v1.0
 * 负责：分支树可视化、分支恢复、从分支继续产生下一代人生。
 */
(function () {
  function clone(value) {
    if (value === undefined || value === null) return value;
    try { return JSON.parse(JSON.stringify(value)); } catch (_) { return null; }
  }

  function esc(value) {
    return String(value ?? '').replace(/[&<>"']/g, c => ({ '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;' }[c]));
  }

  function formatMoney(value) {
    return '¥' + Number(value || 0).toLocaleString();
  }

  function getBranchState(branch) {
    return branch && branch.stateSnapshot ? branch.stateSnapshot : null;
  }

  function restoreState(game, snapshot) {
    if (!snapshot || !snapshot.player) return { success: false, message: '这个人生分支没有可恢复的完整状态。' };
    try {
      const state = game.state;
      state.player = Player.deserialize(JSON.stringify(snapshot.player));
      state.currentMonth = snapshot.currentMonth || 1;
      state.currentYear = snapshot.currentYear || 1;
      state.totalMonthsPlayed = snapshot.totalMonthsPlayed || 0;
      state.scenarioStartAge = snapshot.scenarioStartAge || state.player.age;
      state.pendingEvent = null;
      state.phase = GamePhase.PLAYING;
      state.isPaused = false;

      state.relationshipManager = new RelationshipManager();
      state.propertyManager = new PropertyManager();
      if (snapshot.relationshipManager) Object.assign(state.relationshipManager, clone(snapshot.relationshipManager));
      if (snapshot.propertyManager) Object.assign(state.propertyManager, clone(snapshot.propertyManager));

      if (typeof CausalEngine !== 'undefined') {
        state.causalEngine = new CausalEngine(state.player);
        if (snapshot.causalSnapshot) {
          state.causalEngine.causalLog = clone(snapshot.causalSnapshot.causalLog || []);
          state.causalEngine.activeConsequences = (snapshot.causalSnapshot.activeConsequences || []).map(item => ({
            ...clone(item), effect: null, condition: null, tags: Array.isArray(item.tags) ? [...item.tags] : []
          }));
          state.causalEngine.sequence = state.causalEngine.causalLog.length;
        }
      }

      if (typeof LifeTimeline !== 'undefined') {
        state.lifeTimeline = new LifeTimeline(state.player);
        if (snapshot.timelineSnapshot) {
          state.lifeTimeline.entries = clone(snapshot.timelineSnapshot.entries || []);
          state.lifeTimeline.branches = clone(snapshot.timelineSnapshot.branches || []);
          state.lifeTimeline.sequence = state.lifeTimeline.entries.length + state.lifeTimeline.branches.length;
        }
        state.lifeTimeline.player = state.player;
      }

      state.player._v1CausalEngine = state.causalEngine || null;
      state.activeParallelBranchId = branch.id;
      return { success: true };
    } catch (error) {
      console.error('Restore parallel branch failed:', error);
      return { success: false, message: '恢复人生分支失败：' + error.message };
    }
  }

  function renderTree(game) {
    const branches = (typeof ParallelLifeRegistry !== 'undefined')
      ? ParallelLifeRegistry.ensure(game.state)
      : [];

    const roots = branches.filter(b => !b.parentId);
    const byParent = new Map();
    branches.forEach(b => {
      if (!byParent.has(b.parentId || null)) byParent.set(b.parentId || null, []);
      byParent.get(b.parentId || null).push(b);
    });

    function node(branch, depth) {
      const children = byParent.get(branch.id) || [];
      const c = branch.comparison || {};
      const p = c.parallel || {};
      return `
        <div class="branch-tree-node" style="--branch-depth:${depth}">
          <div class="branch-tree-line"></div>
          <div class="branch-tree-card">
            <div class="branch-tree-age">${branch.decisionAge != null ? branch.decisionAge + '岁分叉' : '人生分叉'}</div>
            <div class="branch-tree-title">如果选择「${esc(branch.alternativeChoice)}」</div>
            <div class="branch-tree-meta">
              <span>净资产 ${formatMoney(p.netWorth)}</span>
              <span>健康 ${Math.round(p.health || 0)}</span>
              <span>幸福 ${Math.round(p.happiness || 0)}</span>
            </div>
            <div class="branch-tree-actions">
              <button onclick="game.resumeParallelBranch('${esc(branch.id)}')">进入这条人生</button>
            </div>
          </div>
          ${children.length ? `<div class="branch-tree-children">${children.map(child => node(child, depth + 1)).join('')}</div>` : ''}
        </div>`;
    }

    const tree = roots.length
      ? roots.map(b => node(b, 0)).join('')
      : '<div class="branch-tree-empty">还没有平行人生。先完成一次关键选择，再点击「如果当时……」。</div>';

    return `
      <div class="branch-tree-overlay" onclick="if(event.target===this) game.closeParallelTree()">
        <div class="branch-tree-modal">
          <div class="branch-tree-header">
            <div><div class="branch-tree-kicker">LIFE BRANCHES</div><h2>我的人生分支</h2><p>每一次“如果当时”，都会留下一个可以继续生活的世界。</p></div>
            <button onclick="game.closeParallelTree()">×</button>
          </div>
          <div class="branch-tree-summary">
            <strong>${branches.length}</strong><span>条平行人生</span>
            <strong>${roots.length}</strong><span>个一级分叉</span>
          </div>
          <div class="branch-tree-list">${tree}</div>
        </div>
      </div>`;
  }

  function install() {
    if (typeof Game === 'undefined' || Game.prototype.__parallelBranchControllerInstalled) return;
    const originalRender = Game.prototype.render;
    Game.prototype.render = function () {
      originalRender.call(this);
      if (this.state && this.state.phase === GamePhase.PLAYING && !document.querySelector('.parallel-tree-launcher')) {
        const button = document.createElement('button');
        button.className = 'parallel-tree-launcher';
        button.textContent = '🌿 人生分支';
        button.onclick = () => this.showParallelTree();
        document.body.appendChild(button);
      }
      if (!this.state || this.state.phase !== GamePhase.PLAYING) {
        document.querySelector('.parallel-tree-launcher')?.remove();
      }
    };

    Game.prototype.showParallelTree = function () {
      if (document.querySelector('.branch-tree-overlay')) return;
      document.body.insertAdjacentHTML('beforeend', renderTree(this));
    };

    Game.prototype.closeParallelTree = function () {
      document.querySelector('.branch-tree-overlay')?.remove();
    };

    Game.prototype.resumeParallelBranch = function (branchId) {
      const branch = typeof ParallelLifeRegistry !== 'undefined'
        ? ParallelLifeRegistry.get(this.state, branchId)
        : null;
      if (!branch) { alert('找不到这条人生分支。'); return; }
      const snapshot = getBranchState(branch);
      if (!snapshot) { alert('这条人生没有完整状态快照。'); return; }
      if (!confirm(`确定进入这条${branch.decisionAge || ''}岁分叉的人生吗？当前人生将被替换，但分支树会保留。`)) return;
      const result = restoreState(this, snapshot);
      if (!result.success) { alert(result.message); return; }
      this.closeParallelTree();
      this.closeTimeline?.();
      this.closeComparison?.();
      this.state.save();
      this.render();
      alert('🌿 已进入这条平行人生。现在你可以继续做新的选择。');
    };

    Game.prototype.__parallelBranchControllerInstalled = true;
  }

  window.ParallelLifeBranchController = { renderTree, restoreState };
  install();
})();
