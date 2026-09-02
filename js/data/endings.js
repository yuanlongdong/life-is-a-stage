/**
 * 结局系统配置 v0.7
 * 多维度结局评分系统，每个结局有独特的描述和"如果当时"钩子
 * 核心目标：激发重开欲望——"我还没玩到那个结局"
 */

const ENDING_DIMENSIONS = {
  wealth: { name: '财富', weight: 0.25 },
  career: { name: '事业', weight: 0.15 },
  family: { name: '家庭', weight: 0.20 },
  health: { name: '健康', weight: 0.15 },
  growth: { name: '成长', weight: 0.10 },
  social: { name: '社交', weight: 0.15 }
};

const ENDINGS = {
  life_winner: {
    id: 'life_winner',
    name: '👑 人生赢家',
    icon: '👑',
    rarity: 'legendary',
    description: '你实现了大多数人梦寐以求的人生：财务自由、家庭幸福、事业有成、身体健康。你是真正的人生赢家。',
    condition: (p, stats) => stats.wealth >= 80 && stats.family >= 70 && stats.career >= 60 && stats.health >= 60,
    parallelHooks: [
      '你赢了。但如果25岁那年你选择了另一条路，现在会是什么样？',
      '人生赢家的背后，是无数个"如果当时"。再开一局，看看另一种人生？'
    ],
    unlockMessage: '🏆 解锁稀有结局：人生赢家！'
  },
  financial_freedom: {
    id: 'financial_freedom',
    name: '🏆 财务自由',
    icon: '🏆',
    rarity: 'epic',
    description: '你实现了财务自由，被动收入覆盖所有支出。你不再为钱工作，而是让钱为你工作。',
    condition: (p, stats) => {
      const passive = p.passiveIncome + Math.round(p.investments * 0.006);
      const monthlyExpense = p.getMonthlyExpense().total;
      return passive >= monthlyExpense && p.getNetWorth() > 2000000;
    },
    parallelHooks: [
      '你自由了。但如果30岁那年你没有all in投资，现在可能还在为房贷发愁。',
      '财务自由的代价是什么？再开一局，试试不投资的人生？'
    ],
    unlockMessage: '💰 解锁结局：财务自由！'
  },
  property_tycoon: {
    id: 'property_tycoon',
    name: '🏰 房产大亨',
    icon: '🏰',
    rarity: 'epic',
    description: '你靠房产实现了财富自由。手握多套房产，租金收入覆盖所有支出。',
    condition: (p, stats) => {
      if (!p.properties || p.properties.length < 2) return false;
      const totalPropertyValue = p.properties.reduce((sum, prop) => sum + prop.currentValue, 0);
      return totalPropertyValue > 3000000 && p.getNetWorth() > 1000000;
    },
    parallelHooks: [
      '你靠房子赢了。但如果30岁那年你没有咬牙买房，现在可能还在租房，看着房价一路上涨。',
      '房产大亨的背后，是当年那个"再等等"的念头被你压下去了。再开一局，试试不买房的人生？'
    ],
    unlockMessage: '🏰 解锁稀有结局：房产大亨！'
  },
  bankruptcy: {
    id: 'bankruptcy',
    name: '💔 破产人生',
    icon: '💔',
    rarity: 'common',
    description: '你的人生以破产告终。资不抵债，健康崩溃，众叛亲离。但这不是结束——人生可以重来。',
    condition: (p, stats) => p.getNetWorth() < -100000 || p.health <= 0,
    parallelHooks: [
      '你输了。但如果25岁那年你没有冲动创业，现在可能安安稳稳，有房有车。',
      '破产的人生也是人生。再开一局，这次你会做出不同的选择吗？'
    ],
    unlockMessage: '💔 解锁结局：破产人生（别灰心，再来一局！）'
  },
  career_peak: {
    id: 'career_peak',
    name: '🎖️ 事业巅峰',
    icon: '🎖️',
    rarity: 'rare',
    description: '你在事业上达到了顶峰，成为行业内有影响力的人物。你的名字在圈内无人不知。',
    condition: (p, stats) => (p.careerLevel || 0) >= 5 && stats.career >= 70,
    parallelHooks: [
      '你成功了。但如果25岁那年你选择了做副业，现在可能已经不需要看老板脸色了。',
      '事业巅峰的代价是什么？再开一局，试试不拼事业的人生？'
    ],
    unlockMessage: '🎖️ 解锁结局：事业巅峰！'
  },
  startup_success: {
    id: 'startup_success',
    name: '🚀 创业成功',
    icon: '🚀',
    rarity: 'epic',
    description: '你创业成功了！公司估值过亿，你成为了别人口中的"创业神话"。',
    condition: (p, stats) => p.canGetStartupEnding && p.getNetWorth() > 3000000 && (p.careerLevel || 0) >= 4,
    parallelHooks: [
      '你成了。但如果35岁那年你选择了安稳上班，现在可能平平淡淡，但也不会经历那些失眠的夜晚。',
      '创业成功的概率不到10%。再开一局，这次你还会选择创业吗？'
    ],
    unlockMessage: '🚀 解锁稀有结局：创业成功！'
  },
  family_happiness: {
    id: 'family_happiness',
    name: '👨‍👩‍👧 家庭幸福',
    icon: '👨‍👩‍👧',
    rarity: 'rare',
    description: '你拥有幸福的家庭。婚姻美满，子女成才，夫妻恩爱，儿孙绕膝。',
    condition: (p, stats) => p.isMarried && (p.childrenCount || 0) > 0 && p.happiness > 75 && stats.family >= 70,
    parallelHooks: [
      '你幸福了。但如果25岁那年你没有接受那个表白，现在可能事业有成，但除夕夜一个人吃泡面。',
      '家庭幸福的代价是什么？再开一局，试试不结婚的人生？'
    ],
    unlockMessage: '👨‍👩‍👧 解锁结局：家庭幸福！'
  },
  lonely_old_age: {
    id: 'lonely_old_age',
    name: '🌙 孤独终老',
    icon: '🌙',
    rarity: 'common',
    description: '你一生专注事业，却忽略了身边的人。老了以后，房子很大，却空荡荡的。',
    condition: (p, stats) => !p.isMarried && p.age >= 50 && p.happiness < 50,
    parallelHooks: [
      '你有钱，但你孤独。如果25岁那年你没有拒绝那个表白，现在可能已经有一个温暖的家了。',
      '孤独终老是很多人的宿命。但你可以改变——再开一局，这次试着去爱？'
    ],
    unlockMessage: '🌙 解锁结局：孤独终老（再开一局，试试不同的选择？）'
  },
  healthy_longevity: {
    id: 'healthy_longevity',
    name: '💪 健康长寿',
    icon: '💪',
    rarity: 'rare',
    description: '你一生注重健康，活到了90岁，身体还很硬朗。你看到了孙子结婚，甚至抱上了曾孙。',
    condition: (p, stats) => p.age >= 75 && p.health >= 60 && stats.health >= 70,
    parallelHooks: [
      '你健康地活到了90岁。但如果30岁那年你没有开始健身，现在可能已经疾病缠身了。',
      '健康长寿是最大的财富。再开一局，试试不注重健康的人生？'
    ],
    unlockMessage: '💪 解锁结局：健康长寿！'
  },
  health_collapse: {
    id: 'health_collapse',
    name: '🏥 健康崩溃',
    icon: '🏥',
    rarity: 'common',
    description: '你一生拼命工作，却忽略了健康。50岁那年，身体垮了。你躺在病床上，看着银行卡里的数字，第一次意识到：钱买不来健康。',
    condition: (p, stats) => p.health < 30 && p.age >= 40,
    parallelHooks: [
      '你有钱，但你没了健康。如果35岁那年你选择了健康第一，现在可能还能跑能跳。',
      '健康崩溃是很多人的警钟。再开一局，这次把健康放在第一位？'
    ],
    unlockMessage: '🏥 解锁结局：健康崩溃（再开一局，这次注意健康？）'
  },
  lifelong_learner: {
    id: 'lifelong_learner',
    name: '📚 终身学习者',
    icon: '📚',
    rarity: 'rare',
    description: '你一生都在学习，掌握了多项技能，成为了跨界人才。你的知识广度和深度让人惊叹。',
    condition: (p, stats) => {
      const learnedCount = Object.keys(p.learnedSkills || {}).length;
      const developedCount = Object.values(p.developedSkills || {}).reduce((sum, level) => sum + level, 0);
      return learnedCount >= 5 && developedCount >= 8 && stats.growth >= 60;
    },
    parallelHooks: [
      '你学了一辈子。但如果22岁那年你毕业后就停止学习，现在可能已经被时代淘汰了。',
      '终身学习者是这个时代最稀缺的人。再开一局，试试不学习的人生？'
    ],
    unlockMessage: '📚 解锁结局：终身学习者！'
  },
  peaceful: {
    id: 'peaceful',
    name: '🏠 平凡安稳',
    icon: '🏠',
    rarity: 'common',
    description: '你过着平凡但安稳的一生。有房有车，家庭和睦，虽无大富大贵但也无憾。平凡，也是一种幸福。',
    condition: (p, stats) => true,
    parallelHooks: [
      '你过得安稳。但如果25岁那年你选择了创业，现在可能已经财务自由，也可能负债累累。',
      '平凡安稳是大多数人的选择。但你真的甘心吗？再开一局，试试搏一把？'
    ],
    unlockMessage: '🏠 解锁结局：平凡安稳'
  },
  late_bloomer: {
    id: 'late_bloomer',
    name: '🌸 大器晚成',
    icon: '🌸',
    rarity: 'epic',
    description: '你前半生平平淡淡，40岁以后才开始发力。50岁那年，你终于实现了梦想。你证明了：人生没有太晚的开始。',
    condition: (p, stats) => p.age >= 55 && (p.careerLevel || 0) >= 4 && p.getNetWorth() > 1000000 && stats.wealth >= 60,
    parallelHooks: [
      '你大器晚成。但如果30岁那年你就开始发力，现在可能已经站在更高的地方了。',
      '大器晚成需要耐心。再开一局，试试早点开始的人生？'
    ],
    unlockMessage: '🌸 解锁稀有结局：大器晚成！'
  },
  spiritual_wealth: {
    id: 'spiritual_wealth',
    name: '🧘 精神富足',
    icon: '🧘',
    rarity: 'rare',
    description: '你一生追求精神富足，淡泊名利。你做公益、写书、带徒弟，把一辈子的经验和智慧传下去。你死后，很多人还记得你。',
    condition: (p, stats) => p.canGetFamilyEnding && p.happiness >= 70 && p.knowledge >= 70 && stats.growth >= 60,
    parallelHooks: [
      '你精神富足。但如果60岁那年你选择了继续赚钱，现在可能更有钱，但死后什么都留不下。',
      '精神富足是更高层次的追求。再开一局，试试只追求钱的人生？'
    ],
    unlockMessage: '🧘 解锁结局：精神富足！'
  }
};

function calculateDimensionScores(player) {
  const p = player;
  const netWorth = p.getNetWorth();
  const passive = p.passiveIncome + Math.round(p.investments * 0.006);
  const monthlyExpense = p.getMonthlyExpense().total;
  return {
    wealth: Math.min(100, Math.max(0,
      (netWorth > 0 ? Math.min(50, netWorth / 100000) : 0) +
      (passive >= monthlyExpense ? 30 : passive / monthlyExpense * 30) +
      (p.properties && p.properties.length > 0 ? 10 : 0) +
      (p.investments > 500000 ? 10 : 0)
    )),
    career: Math.min(100, Math.max(0,
      (p.careerLevel || 0) * 15 +
      (p.salary > 20000 ? 20 : p.salary / 1000) +
      (p.careerLine ? 10 : 0)
    )),
    family: Math.min(100, Math.max(0,
      (p.isMarried ? 30 : 0) +
      (p.childrenCount || 0) * 15 +
      (p.happiness > 60 ? (p.happiness - 60) : 0) +
      (p.relationshipManager && p.relationshipManager.partner && p.relationshipManager.partner.relationship > 70 ? 15 : 0)
    )),
    health: Math.min(100, Math.max(0,
      p.health +
      (p.learnedSkills && p.learnedSkills['life_fitness'] ? 10 : 0) +
      (p.age < 50 ? 10 : 0)
    )),
    growth: Math.min(100, Math.max(0,
      (Object.keys(p.learnedSkills || {}).length) * 8 +
      (Object.values(p.developedSkills || {}).reduce((sum, level) => sum + level, 0)) * 3 +
      (p.knowledge || 0) * 0.5
    )),
    social: Math.min(100, Math.max(0,
      (p.network || 0) +
      (p.relationshipManager && p.relationshipManager.friends ? p.relationshipManager.friends.length * 3 : 0)
    ))
  };
}

function getEndingUnlockStatus(player) {
  const stats = calculateDimensionScores(player);
  const status = {};
  for (const [id, ending] of Object.entries(ENDINGS)) {
    try { status[id] = ending.condition(player, stats); } catch (e) { status[id] = false; }
  }
  return status;
}

function getLockedEndings(player) {
  const status = getEndingUnlockStatus(player);
  return Object.entries(ENDINGS)
    .filter(([id, unlocked]) => !unlocked)
    .map(([id, ending]) => ({
      id: ending.id,
      name: ending.name,
      icon: ending.icon,
      rarity: ending.rarity,
      hint: getEndingHint(ending.id)
    }));
}

function getEndingHint(endingId) {
  const hints = {
    life_winner: '需要财富、家庭、事业、健康同时达标',
    financial_freedom: '被动收入覆盖支出，净资产超200万',
    property_tycoon: '手握2套以上房产，总值超300万',
    career_peak: '职业等级达到5级以上',
    startup_success: '创业路线，净资产超300万',
    family_happiness: '已婚有孩，幸福度超75',
    lonely_old_age: '未婚，50岁以上，幸福度低于50',
    healthy_longevity: '活到75岁以上，健康度超60',
    health_collapse: '40岁以上，健康度低于30',
    lifelong_learner: '学会5个以上技能，发展等级总和超8',
    late_bloomer: '55岁以上，职业等级4级以上，净资产超100万',
    spiritual_wealth: '幸福度超70，学识超70',
    bankruptcy: '净资产负10万以上，或健康归零',
    peaceful: '默认结局，每个人都能达成'
  };
  return hints[endingId] || '继续探索人生的可能性';
}