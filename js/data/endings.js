/**
 * 结局系统配置 v0.8
 * 多维度结局评分系统，每个结局有独特的描述和"如果当时"钩子
 * 核心目标：激发重开欲望——"我还没玩到那个结局"
 * P4强化：parallelHooks更扎心、更有画面感、更具体
 */

// 结局维度权重（用于计算最终结局）
const ENDING_DIMENSIONS = {
  wealth: { name: '财富', weight: 0.25 },
  career: { name: '事业', weight: 0.15 },
  family: { name: '家庭', weight: 0.20 },
  health: { name: '健康', weight: 0.15 },
  growth: { name: '成长', weight: 0.10 },
  social: { name: '社交', weight: 0.15 }
};

// 结局类型定义
const ENDINGS = {
  // ===== 顶级结局（传奇，需要多维度同时达标）=====
  life_winner: {
    id: 'life_winner',
    name: '👑 人生赢家',
    icon: '👑',
    rarity: 'legendary',
    description: '你实现了大多数人梦寐以求的人生：财务自由、家庭幸福、事业有成、身体健康。你是真正的人生赢家。',
    condition: (p, stats) => {
      return stats.wealth >= 80 && stats.family >= 70 && stats.career >= 60 && stats.health >= 60;
    },
    parallelHooks: [
      '你赢了。但你还记得25岁那年那个深夜吗？你差点放弃了现在的一切，选择了另一条路。如果当时你真的放弃了，现在会是什么样？',
      '人生赢家的背后，是无数个"差一点"。差一点就没买房，差一点就没创业，差一点就错过了那个对的人。再开一局，看看那些"差一点"如果成真了，人生会怎样？',
      '你什么都有了。但如果40岁那年你选择了二次创业而不是稳扎稳打，现在可能已经站在更高的地方，也可能已经摔得粉身碎骨。你不好奇吗？'
    ],
    unlockMessage: '🏆 解锁传奇结局：人生赢家！'
  },

  // ===== 财富类结局 =====
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
      '你自由了。但你还记得30岁那年吗？你把所有积蓄都all in了指数基金，那天晚上你失眠了。如果当时你选择了把钱存银行，现在可能还在为每个月的房贷发愁。',
      '财务自由的代价是什么？是30岁那年不敢谈恋爱，是35岁那年不敢辞职，是40岁那年还在算每一笔开销。再开一局，试试不投资的人生？也许你会更快乐，也许你会更焦虑。',
      '你不再为钱工作了。但如果25岁那年你选择了做副业而不是专注投资，现在可能已经有了自己的公司，也可能已经亏得底朝天。你不好奇另一种可能吗？'
    ],
    unlockMessage: '💰 解锁史诗结局：财务自由！'
  },

  property_tycoon: {
    id: 'property_tycoon',
    name: '🏰 房产大亨',
    icon: '🏰',
    rarity: 'epic',
    description: '你靠房产实现了财富自由。手握多套房产，租金收入覆盖所有支出。你是真正的"包租公/包租婆"。',
    condition: (p, stats) => {
      if (!p.properties || p.properties.length < 2) return false;
      const totalPropertyValue = p.properties.reduce((sum, prop) => sum + prop.currentValue, 0);
      return totalPropertyValue > 3000000 && p.getNetWorth() > 1000000;
    },
    parallelHooks: [
      '你靠房子赢了。但你还记得30岁那年吗？你咬着牙付了第一套房子的首付，那天你银行卡里只剩3000块。如果当时你选择了"再等等"，现在可能还在租房，看着房价一路上涨，心里骂着"早知道就买了"。',
      '房产大亨的背后，是每个月雷打不动的房贷，是不敢辞职的焦虑，是把所有钱都砸进房子里的孤注一掷。再开一局，试试不买房的人生？也许你会用那笔钱创业，也许你会用那笔钱环游世界，也许你会后悔。',
      '你手握多套房产，收租收到手软。但如果35岁那年你选择了把第二套房的钱拿去创业，现在可能已经是上市公司老板，也可能已经负债累累。你不好奇吗？'
    ],
    unlockMessage: '🏰 解锁史诗结局：房产大亨！'
  },

  bankruptcy: {
    id: 'bankruptcy',
    name: '💔 破产人生',
    icon: '💔',
    rarity: 'common',
    description: '你的人生以破产告终。资不抵债，健康崩溃，众叛亲离。但这不是结束——人生可以重来。',
    condition: (p, stats) => {
      return p.getNetWorth() < -100000 || p.health <= 0;
    },
    parallelHooks: [
      '你输了。但你还记得25岁那年吗？你冲动地辞了职去创业，那天你觉得自己会成为下一个马云。如果当时你选择了安安稳稳上班，现在可能已经有房有车，周末带着孩子去公园。你后悔吗？',
      '破产的人生也是人生。你经历了别人一辈子都不会经历的大起大落。但如果30岁那年你没有all in投资，现在可能不会输得这么惨。但也不会有翻盘的机会。再开一局，这次你会做出不同的选择吗？',
      '你躺在人生的谷底，看着头顶的那一点点光。但如果35岁那年你选择了健康第一而不是继续拼，现在可能还能跑能跳，而不是躺在病床上。你还有机会——再开一局，这次把健康放在第一位？'
    ],
    unlockMessage: '💔 解锁结局：破产人生（别灰心，再来一局！）'
  },

  // ===== 事业类结局 =====
  career_peak: {
    id: 'career_peak',
    name: '🎖️ 事业巅峰',
    icon: '🎖️',
    rarity: 'rare',
    description: '你在事业上达到了顶峰，成为行业内有影响力的人物。你的名字在圈内无人不知。',
    condition: (p, stats) => {
      return p.careerLevel >= 5 && stats.career >= 70;
    },
    parallelHooks: [
      '你成功了。但你还记得25岁那年吗？你拒绝了朋友一起做副业的邀请，选择了专注主业。如果当时你选择了做副业，现在可能已经不需要看老板脸色了，也可能已经亏得底朝天。你不好奇吗？',
      '事业巅峰的代价是什么？是每天加班到深夜，是错过了孩子的成长，是身体发出了一次又一次的警告。再开一局，试试不拼事业的人生？也许你会更快乐，也许你会更焦虑。',
      '你站在了行业的顶峰，俯瞰着下面的人。但如果30岁那年你选择了转行而不是继续深耕，现在可能已经在另一个领域风生水起，也可能已经后悔莫及。你不好奇另一种可能吗？'
    ],
    unlockMessage: '🎖️ 解锁稀有结局：事业巅峰！'
  },

  startup_success: {
    id: 'startup_success',
    name: '🚀 创业成功',
    icon: '🚀',
    rarity: 'epic',
    description: '你创业成功了！公司估值过亿，你成为了别人口中的"创业神话"。但你还记得当年那个差点放弃的夜晚吗？',
    condition: (p, stats) => {
      return p.canGetStartupEnding && p.getNetWorth() > 3000000 && p.careerLevel >= 4;
    },
    parallelHooks: [
      '你成了。但你还记得35岁那年那个深夜吗？公司账上只剩3个月的钱，你坐在办公室里，差点就放弃了。如果当时你真的放弃了，现在可能正在某个公司上班，平平淡淡，但也不会经历那些失眠的夜晚。',
      '创业成功的概率不到10%。你是那幸运的10%。但如果25岁那年你选择了安稳上班而不是创业，现在可能已经是部门主管，年薪百万，也可能已经被优化了。再开一局，这次你还会选择创业吗？',
      '你成为了别人口中的"创业神话"。但如果40岁那年你选择了见好就收而不是继续扩张，现在可能已经退休环游世界了，也可能已经错过了更大的机会。你不好奇吗？'
    ],
    unlockMessage: '🚀 解锁史诗结局：创业成功！'
  },

  // ===== 家庭类结局 =====
  family_happiness: {
    id: 'family_happiness',
    name: '👨‍👩‍👧 家庭幸福',
    icon: '👨‍👩‍👧',
    rarity: 'rare',
    description: '你拥有幸福的家庭。婚姻美满，子女成才，夫妻恩爱，儿孙绕膝。你是人生真正的赢家——不是因为钱，而是因为爱。',
    condition: (p, stats) => {
      return p.isMarried && p.childrenCount > 0 && p.happiness > 75 && stats.family >= 70;
    },
    parallelHooks: [
      '你幸福了。但你还记得25岁那年吗？你差点就拒绝了那个表白，因为你觉得"还早"。如果当时你真的拒绝了，现在可能事业有成，但除夕夜一个人吃着泡面，看着朋友圈里别人晒的全家福。',
      '家庭幸福的代价是什么？是放弃了一些事业机会，是减少了一些个人时间，是把最好的年华都给了家人。再开一局，试试不结婚的人生？也许你会更自由，也许你会更孤独。',
      '你拥有了一个温暖的家。但如果30岁那年你选择了丁克而不是生孩子，现在可能已经环游世界了，也可能已经后悔了。你不好奇另一种可能吗？'
    ],
    unlockMessage: '👨‍👩‍👧 解锁稀有结局：家庭幸福！'
  },

  lonely_old_age: {
    id: 'lonely_old_age',
    name: '🌙 孤独终老',
    icon: '🌙',
    rarity: 'common',
    description: '你一生专注事业，却忽略了身边的人。老了以后，房子很大，却空荡荡的。除夕夜，你一个人吃了碗泡面。',
    condition: (p, stats) => {
      return !p.isMarried && p.age >= 50 && p.happiness < 50;
    },
    parallelHooks: [
      '你有钱，但你孤独。你还记得25岁那年吗？有个人跟你表白，你说"我现在只想搞事业"。如果当时你接受了，现在可能正在给孩子讲睡前故事，而不是一个人对着空荡荡的房子发呆。',
      '孤独终老是很多人的宿命。但你可以改变。如果30岁那年你选择了相亲而不是继续加班，现在可能已经有一个温暖的家了。再开一局，这次试着去爱？也许你会发现，爱比事业更重要。',
      '除夕夜，你一个人吃了碗泡面。你看着窗外的烟花，想起了25岁那年那个被你拒绝的人。如果当时你没有拒绝，现在可能正在和家人一起看春晚，抢着红包。你后悔吗？再开一局，这次别再错过了。'
    ],
    unlockMessage: '🌙 解锁结局：孤独终老（再开一局，试试不同的选择？）'
  },

  // ===== 健康类结局 =====
  healthy_longevity: {
    id: 'healthy_longevity',
    name: '💪 健康长寿',
    icon: '💪',
    rarity: 'rare',
    description: '你一生注重健康，活到了90岁，身体还很硬朗。你看到了孙子结婚，甚至抱上了曾孙。人生最大的财富，是健康。',
    condition: (p, stats) => {
      return p.age >= 75 && p.health >= 60 && stats.health >= 70;
    },
    parallelHooks: [
      '你健康地活到了90岁。但你还记得30岁那年吗？你开始每天跑步，同事们都说你"疯了"。如果当时你没有开始健身，现在可能已经疾病缠身，每天吃药，而不是还能跑能跳。',
      '健康长寿是最大的财富。但你为此放弃了什么？是放弃了熬夜加班，是放弃了应酬喝酒，是放弃了一些事业机会。再开一局，试试不注重健康的人生？也许你会更有钱，但也许你会更早倒下。',
      '你看到了孙子结婚，甚至抱上了曾孙。但如果35岁那年你选择了继续拼事业而不是健康第一，现在可能已经是亿万富翁，但也可能已经躺在病床上，看不到这一切了。你不好奇吗？'
    ],
    unlockMessage: '💪 解锁稀有结局：健康长寿！'
  },

  health_collapse: {
    id: 'health_collapse',
    name: '🏥 健康崩溃',
    icon: '🏥',
    rarity: 'common',
    description: '你一生拼命工作，却忽略了健康。50岁那年，身体垮了。你躺在病床上，看着银行卡里的数字，第一次意识到：钱买不来健康。',
    condition: (p, stats) => {
      return p.health < 30 && p.age >= 40;
    },
    parallelHooks: [
      '你有钱，但你没了健康。你还记得35岁那年吗？你选择了继续拼事业，而不是去医院检查。如果当时你选择了健康第一，现在可能还能跑能跳，而不是躺在病床上，每天看着天花板发呆。',
      '健康崩溃是很多人的警钟。但你还有机会。如果30岁那年你选择了开始健身而不是继续熬夜，现在可能身体还很硬朗。再开一局，这次把健康放在第一位？也许你会发现，没有健康，一切都是零。',
      '你躺在病床上，看着银行卡里的数字，第一次意识到：钱买不来健康。你想起了25岁那年，你说"年轻就是要拼"。如果当时你没有那么拼，现在可能还能看到孩子结婚，而不是只能在病床上想象。你后悔吗？'
    ],
    unlockMessage: '🏥 解锁结局：健康崩溃（再开一局，这次注意健康？）'
  },

  // ===== 成长类结局 =====
  lifelong_learner: {
    id: 'lifelong_learner',
    name: '📚 终身学习者',
    icon: '📚',
    rarity: 'rare',
    description: '你一生都在学习，掌握了多项技能，成为了跨界人才。你的知识广度和深度让人惊叹。你证明了：活到老，学到老。',
    condition: (p, stats) => {
      const learnedCount = Object.keys(p.learnedSkills).length;
      const developedCount = Object.values(p.developedSkills).reduce((sum, level) => sum + level, 0);
      return learnedCount >= 5 && developedCount >= 8 && stats.growth >= 60;
    },
    parallelHooks: [
      '你学了一辈子。但你还记得22岁那年吗？你毕业后没有停止学习，而是每年花1000块学一个新技能。如果当时你选择了"毕业就不用学了"，现在可能已经被时代淘汰了，而不是成为了跨界人才。',
      '终身学习者是这个时代最稀缺的人。但你为此付出了什么？是每个周末都在学习，是放弃了很多娱乐时间，是把别人刷手机的时间都用在了看书上。再开一局，试试不学习的人生？也许你会更轻松，但也许你会被淘汰。',
      '你掌握了多项技能，成为了跨界人才。但如果30岁那年你选择了只专注一个领域而不是跨界学习，现在可能已经是那个领域的专家了，也可能已经遇到了瓶颈。你不好奇另一种可能吗？'
    ],
    unlockMessage: '📚 解锁稀有结局：终身学习者！'
  },

  // ===== 复合/特殊结局 =====
  peaceful: {
    id: 'peaceful',
    name: '🏠 平凡安稳',
    icon: '🏠',
    rarity: 'common',
    description: '你过着平凡但安稳的一生。有房有车，家庭和睦，虽无大富大贵但也无憾。平凡，也是一种幸福。',
    condition: (p, stats) => {
      return true; // 默认结局
    },
    parallelHooks: [
      '你过得安稳。但你还记得25岁那年吗？你差点就辞职去创业了，最后还是选择了安稳。如果当时你真的辞职了，现在可能已经财务自由，也可能已经负债累累。你不好奇吗？',
      '平凡安稳是大多数人的选择。但你真的甘心吗？你看着朋友圈里那些"折腾"的人，有的成了，有的败了。你有没有想过，如果当时你也"折腾"一下，现在会是什么样？再开一局，试试搏一把？',
      '你有房有车，家庭和睦，虽无大富大贵但也无憾。但如果30岁那年你选择了all in投资而不是稳扎稳打，现在可能已经实现了财务自由，也可能已经亏得底朝天。你不好奇另一种人生吗？'
    ],
    unlockMessage: '🏠 解锁结局：平凡安稳'
  },

  late_bloomer: {
    id: 'late_bloomer',
    name: '🌸 大器晚成',
    icon: '🌸',
    rarity: 'epic',
    description: '你前半生平平淡淡，40岁以后才开始发力。50岁那年，你终于实现了梦想。你证明了：人生没有太晚的开始。',
    condition: (p, stats) => {
      return p.age >= 55 && p.careerLevel >= 4 && p.getNetWorth() > 1000000 && stats.wealth >= 60;
    },
    parallelHooks: [
      '你大器晚成。但你还记得30岁那年吗？你看着同龄人一个个升职加薪，自己却还在原地踏步。如果当时你选择了放弃，现在可能已经平平淡淡过完一生，而不是在50岁那年终于实现了梦想。',
      '大器晚成需要耐心。你前半生平平淡淡，被人看不起，被人说"没出息"。但你没有放弃。再开一局，试试早点开始的人生？也许你会更早成功，也许你会因为太年轻而摔得更惨。',
      '你在50岁那年终于实现了梦想。但如果40岁那年你选择了继续躺平而不是重新开始，现在可能已经退休了，平平淡淡，但也不会经历那些重新开始的艰辛。你后悔吗？还是庆幸？'
    ],
    unlockMessage: '🌸 解锁史诗结局：大器晚成！'
  },

  spiritual_wealth: {
    id: 'spiritual_wealth',
    name: '🧘 精神富足',
    icon: '🧘',
    rarity: 'rare',
    description: '你一生追求精神富足，淡泊名利。你做公益、写书、带徒弟，把一辈子的经验和智慧传下去。你死后，很多人还记得你。',
    condition: (p, stats) => {
      return p.canGetFamilyEnding && p.happiness >= 70 && p.knowledge >= 70 && stats.growth >= 60;
    },
    parallelHooks: [
      '你精神富足。但你还记得60岁那年吗？你选择了做公益、写书、带徒弟，而不是继续赚钱。如果当时你选择了继续赚钱，现在可能更有钱，但死后什么都留不下。而现在，很多人还记得你。',
      '精神富足是更高层次的追求。但你为此放弃了什么？是放弃了更多的财富，是放弃了更高的地位，是把一辈子的经验和智慧都传给了别人。再开一局，试试只追求钱的人生？也许你会更有钱，但也许你会更空虚。',
      '你死后，很多人还记得你。你的书还在被人读，你的徒弟还在传承你的思想。但如果50岁那年你选择了继续拼事业而不是追求精神富足，现在可能已经是亿万富翁，但死后可能很快就被人遗忘了。你不好奇吗？'
    ],
    unlockMessage: '🧘 解锁稀有结局：精神富足！'
  }
};

// 计算各维度得分
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

// 获取所有结局的解锁状态
function getEndingUnlockStatus(player) {
  const stats = calculateDimensionScores(player);
  const status = {};
  for (const [id, ending] of Object.entries(ENDINGS)) {
    try {
      status[id] = ending.condition(player, stats);
    } catch (e) {
      status[id] = false;
    }
  }
  return status;
}

// 获取未解锁的结局列表（用于结局页面展示"还有这些结局你没玩到"）
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

// 获取结局的解锁提示（不直接说条件，给模糊提示激发探索欲）
function getEndingHint(endingId) {
  const hints = {
    life_winner: '财富、家庭、事业、健康同时达标——很难，但值得一试',
    financial_freedom: '被动收入覆盖支出，净资产超200万',
    property_tycoon: '手握2套以上房产，总值超300万',
    career_peak: '职业等级达到5级以上，成为行业大佬',
    startup_success: '走创业路线，净资产超300万',
    family_happiness: '已婚有孩，幸福度超75——爱比钱重要',
    lonely_old_age: '未婚，50岁以上，幸福度低于50',
    healthy_longevity: '活到75岁以上，健康度超60',
    health_collapse: '40岁以上，健康度低于30——别忽略健康',
    lifelong_learner: '学会5个以上技能，发展等级总和超8',
    late_bloomer: '55岁以上，职业等级4级以上，净资产超100万——大器晚成',
    spiritual_wealth: '幸福度超70，学识超70——追求精神富足',
    bankruptcy: '净资产负10万以上，或健康归零',
    peaceful: '默认结局，每个人都能达成——但你真的甘心吗？'
  };
  return hints[endingId] || '继续探索人生的可能性';
}
