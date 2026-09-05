/**
 * 人生时间线 v1.0
 * 记录重大决定、事件、阶段变化，为“我的这一生”和平行人生提供统一数据源。
 */
class LifeTimeline {
  constructor(player) {
    this.player = player;
    this.entries = [];
    this.branches = [];
    this.sequence = 0;
  }

  setPlayer(player) {
    this.player = player;
  }

  add(entry) {
    if (!entry) return null;
    const normalized = {
      id: entry.id || `timeline_${++this.sequence}`,
      age: entry.age ?? (this.player ? this.player.age : null),
      year: entry.year ?? null,
      month: entry.month ?? null,
      type: entry.type || 'moment',
      title: entry.title || entry.text || '人生片段',
      text: entry.text || '',
      importance: entry.importance || 'normal',
      decisionId: entry.decisionId || null,
      tags: Array.isArray(entry.tags) ? [...entry.tags] : [],
      metadata: entry.metadata || {},
      timestamp: Date.now()
    };
    this.entries.push(normalized);
    return normalized;
  }

  addDecision(decision) {
    return this.add({
      type: 'decision',
      importance: 'major',
      decisionId: decision.id || null,
      title: decision.name || decision.text || '人生选择',
      text: decision.text || decision.name || '',
      tags: ['choice', decision.category || 'life']
    });
  }

  addBranch(branch) {
    const item = {
      id: branch.id || `branch_${++this.sequence}`,
      fromAge: branch.fromAge ?? (this.player ? this.player.age : null),
      label: branch.label || '另一条人生',
      sourceDecisionId: branch.sourceDecisionId || null,
      status: branch.status || 'available',
      description: branch.description || '',
      metadata: branch.metadata || {}
    };
    this.branches.push(item);
    return item;
  }

  getEntries(options = {}) {
    let result = [...this.entries];
    if (options.type) result = result.filter(item => item.type === options.type);
    if (options.minAge !== undefined) result = result.filter(item => item.age >= options.minAge);
    if (options.maxAge !== undefined) result = result.filter(item => item.age <= options.maxAge);
    if (options.importance) result = result.filter(item => item.importance === options.importance);
    return result;
  }

  getMajorMoments() {
    return this.entries.filter(item => item.importance === 'major' || item.importance === 'critical');
  }

  getLastMajorDecision() {
    const decisions = this.entries.filter(item => item.type === 'decision');
    return decisions.length ? decisions[decisions.length - 1] : null;
  }

  snapshot() {
    return {
      entries: [...this.entries],
      branches: [...this.branches]
    };
  }
}

window.LifeTimeline = LifeTimeline;
