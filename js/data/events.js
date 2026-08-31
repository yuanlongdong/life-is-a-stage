/**
 * 人生事件系统配置
 */

const EVENT_CATEGORIES = {
  career: { name: '职业事件', icon: '🎯', color: '#9BBBF4' },
  finance: { name: '财务事件', icon: '💰', color: '#A2DDAA' },
  health: { name: '健康事件', icon: '🏥', color: '#EA6668' },
  relationship: { name: '关系事件', icon: '❤️', color: '#EAA7B2' },
  growth: { name: '成长事件', icon: '📚', color: '#DEBEF8' },
  accident: { name: '意外事件', icon: '⚡', color: '#F4B393' }
};

const EVENTS = [
  {
    id: 'evt_career_promo_001',
    category: 'career',
    name: '升职机会',
    icon: '⬆️',
    description: '领导找你谈话，考虑让你带一个小团队。',
    triggerCondition: { minCareerLevel: 2, minAge: 25, maxAge: 40, minNetwork: 20 },
    probability: 0.15,
    choices: [
      { text: '接受挑战', effects: { salaryMultiplier: 1.20, health: -10, happiness: -5, unlockManagement: true }, resultText: '你接受了挑战，工资上涨20%，但工作压力也增大了。' },
      { text: '婉拒，保持现状', effects: {}, resultText: '你婉拒了升职机会，生活保持平衡。' },
      { text: '谈条件，要求配助手', effects: { salaryMultiplier: 1.15, health: -5 }, requirement: { minNetwork: 30 }, resultText: '凭借你的人脉，你成功谈下了条件，工资+15%。' }
    ]
  },
  {
    id: 'evt_career_joboffer_001',
    category: 'career',
    name: '跳槽邀请',
    icon: '🔄',
    description: '一家竞品公司向你发出了邀请，薪资更高。',
    triggerCondition: { minCareerLevel: 2, minAge: 25, maxAge: 45 },
    probability: 0.12,
    choices: [
      { text: '接受新offer', effects: { salaryMultiplier: 1.25, network: -5, happiness: 5 }, resultText: '你接受了新工作，薪资上涨25%，但需要重新建立人脉。' },
      { text: '留在原公司', effects: {}, resultText: '你选择留在原公司。' },
      { text: '用offer谈加薪', effects: { salaryMultiplier: 1.10 }, requirement: { minNetwork: 25 }, resultText: '你用offer和老板谈加薪，成功涨薪10%。' }
    ]
  },
  {
    id: 'evt_career_bonus_001',
    category: 'career',
    name: '获得奖金！',
    icon: '🎉',
    description: '公司业绩好，发了一笔奖金！',
    triggerCondition: { minAge: 22 },
    probability: 0.15,
    choices: [
      { text: '存入应急金', effects: { savings: 5000 }, resultText: '你把奖金存了起来，应急金增加5000元。' },
      { text: '投资自己', effects: { savings: -2000, knowledge: 10 }, resultText: '你用奖金报名了课程，学识+10。' },
      { text: '犒劳自己', effects: { savings: -3000, happiness: 15 }, resultText: '你用奖金买了心仪已久的东西，幸福+15。' }
    ]
  },
  {
    id: 'evt_finance_market_001',
    category: 'finance',
    name: '市场波动',
    icon: '📉',
    description: '投资市场出现波动，你的投资组合受到影响。',
    triggerCondition: { minInvestment: 10000 },
    probability: 0.20,
    choices: [
      { text: '持有不动', effects: { investmentMultiplier: 0.90 }, resultText: '你选择持有，投资暂时下跌10%。' },
      { text: '加仓抄底', effects: { savings: -3000, investmentMultiplier: 1.05 }, requirement: { minSavings: 5000 }, resultText: '你加仓抄底，短期投资+5%。' },
      { text: '止损卖出', effects: { investmentMultiplier: 0.95 }, resultText: '你止损卖出，避免了更大损失。' }
    ]
  },
  {
    id: 'evt_finance_taxrefund_001',
    category: 'finance',
    name: '退税到账',
    icon: '🧾',
    description: '年度个税退税到账了！',
    triggerCondition: { minAge: 22, minSalary: 5000 },
    probability: 0.10,
    choices: [
      { text: '收到退税', effects: { savings: 1200 }, resultText: '你收到了1200元退税。' }
    ]
  },
  {
    id: 'evt_health_sick_001',
    category: 'health',
    name: '生病了',
    icon: '🤒',
    description: '身体不适，需要看病买药。',
    triggerCondition: { maxHealth: 50 },
    probability: 0.20,
    choices: [
      { text: '去医院', effects: { savings: -1500, health: 10 }, resultText: '你去医院看了病，花了1500元，健康恢复了一些。' },
      { text: '硬扛过去', effects: { health: -10, happiness: -5 }, resultText: '你选择硬扛，健康进一步下降。' }
    ]
  },
  {
    id: 'evt_health_checkup_001',
    category: 'health',
    name: '体检异常',
    icon: '🩺',
    description: '年度体检发现一些指标异常。',
    triggerCondition: { minAge: 30 },
    probability: 0.15,
    choices: [
      { text: '调整生活方式', effects: { health: -5, happiness: -5 }, resultText: '你开始调整作息和饮食。' },
      { text: '进一步检查', effects: { savings: -3000, health: 5 }, resultText: '你做了进一步检查，确认无大碍。' }
    ]
  },
  {
    id: 'evt_relation_friend_001',
    category: 'relationship',
    name: '朋友聚会',
    icon: '👥',
    description: '老朋友约聚会，好久没见了。',
    triggerCondition: { minAge: 20 },
    probability: 0.18,
    choices: [
      { text: '参加聚会', effects: { savings: -300, network: 5, happiness: 10 }, resultText: '你参加了聚会，人脉+5，幸福+10。' },
      { text: '婉拒，省钱', effects: { happiness: -3 }, resultText: '你婉拒了聚会，省了钱但心情有些低落。' }
    ]
  },
  {
    id: 'evt_relation_love_001',
    category: 'relationship',
    name: '遇到心动的人',
    icon: '💕',
    description: '你遇到了一个让你心动的人。',
    triggerCondition: { minAge: 18, maxAge: 40, isMarried: false },
    probability: 0.10,
    choices: [
      { text: '主动追求', effects: { savings: -500, happiness: 15, network: 5 }, resultText: '你主动出击，幸福+15。' },
      { text: '顺其自然', effects: { happiness: 5 }, resultText: '你选择顺其自然。' },
      { text: '专注事业', effects: { knowledge: 5, happiness: -3 }, resultText: '你选择专注事业，学识+5。' }
    ]
  },
  {
    id: 'evt_growth_insight_001',
    category: 'growth',
    name: '顿悟时刻',
    icon: '💡',
    description: '你突然想通了一些事情。',
    triggerCondition: { minKnowledge: 30 },
    probability: 0.08,
    choices: [
      { text: '记录下来', effects: { knowledge: 10, happiness: 5 }, resultText: '你把顿悟记录下来，学识+10。' }
    ]
  },
  {
    id: 'evt_growth_mentor_001',
    category: 'growth',
    name: '遇到贵人',
    icon: '🌟',
    description: '你遇到了一位愿意指点你的前辈。',
    triggerCondition: { minNetwork: 30 },
    probability: 0.08,
    choices: [
      { text: '虚心请教', effects: { knowledge: 15, network: 10, careerLevel: 1 }, resultText: '你虚心向前辈请教，学识+15，人脉+10，职业等级+1。' },
      { text: '保持距离', effects: {}, resultText: '你保持了距离，错过了一次机会。' }
    ]
  },
  {
    id: 'evt_accident_lottery_001',
    category: 'accident',
    name: '中奖了！',
    icon: '🎰',
    description: '你买的彩票居然中奖了！',
    triggerCondition: { minAge: 18 },
    probability: 0.02,
    choices: [
      { text: '领取奖金', effects: { savings: 50000, happiness: 30 }, resultText: '你中了5万元大奖！幸福+30。' }
    ]
  },
  {
    id: 'evt_accident_phone_001',
    category: 'accident',
    name: '手机坏了',
    icon: '📱',
    description: '手机突然坏了，需要更换。',
    triggerCondition: { minAge: 18 },
    probability: 0.10,
    choices: [
      { text: '买新手机', effects: { savings: -3000, happiness: 5 }, resultText: '你买了新手机，花了3000元。' },
      { text: '修一下继续用', effects: { savings: -500 }, resultText: '你修好了手机，只花了500元。' }
    ]
  },
  {
    id: 'evt_accident_scam_001',
    category: 'accident',
    name: '差点被骗',
    icon: '⚠️',
    description: '你遇到了一个看似很好的投资机会。',
    triggerCondition: { minSavings: 10000, minAge: 20 },
    probability: 0.08,
    choices: [
      { text: '谨慎调查', effects: { knowledge: 5 }, resultText: '你谨慎调查后发现是骗局，避免了损失。' },
      { text: '大胆投资', effects: { savings: -20000, happiness: -20 }, resultText: '你投了2万元，结果真的被骗了！' }
    ]
  }
];

const MILESTONE_EVENTS = {
  18: [{ id: 'milestone_18', category: 'growth', name: '成年了！', icon: '🎂', description: '你18岁了，正式成年。', choices: [{ text: '对未来充满期待', effects: { happiness: 10, knowledge: 5 }, resultText: '你对未来充满期待。' }] }],
  22: [{ id: 'milestone_22', category: 'career', name: '大学毕业', icon: '🎓', description: '你大学毕业了。', choices: [{ text: '直接工作', effects: { salary: 5000 }, resultText: '你选择直接工作。' }, { text: '继续考研', effects: { knowledge: 20, debt: 20000 }, resultText: '你选择考研。' }, { text: 'Gap一年', effects: { happiness: 15, network: 10 }, resultText: '你选择Gap一年。' }] }],
  25: [{ id: 'milestone_25', category: 'relationship', name: '25岁了', icon: '🎂', description: '你25岁了。', choices: [{ text: '专注事业', effects: { careerLevel: 1, happiness: -5 }, resultText: '你决定专注事业。' }, { text: '寻找另一半', effects: { happiness: 10 }, resultText: '你开始积极寻找另一半。' }, { text: '享受当下', effects: { happiness: 15, savings: -2000 }, resultText: '你选择享受当下。' }] }],
  30: [{ id: 'milestone_30', category: 'growth', name: '三十而立', icon: '🎂', description: '你30岁了。', choices: [{ text: '回顾过去，展望未来', effects: { knowledge: 10, happiness: 5 }, resultText: '你回顾了过去十年。' }] }],
  35: [{ id: 'milestone_35', category: 'career', name: '35岁危机', icon: '⚠️', description: '你35岁了。', choices: [{ text: '提升核心竞争力', effects: { knowledge: 15, careerLevel: 1 }, resultText: '你决定提升核心竞争力。' }, { text: '考虑转型', effects: { knowledge: 10, network: 10 }, resultText: '你开始考虑转型。' }, { text: '保持现状', effects: { happiness: -5 }, resultText: '你选择保持现状。' }] }],
  40: [{ id: 'milestone_40', category: 'growth', name: '四十不惑', icon: '🎂', description: '你40岁了。', choices: [{ text: '更加坚定', effects: { knowledge: 10, happiness: 10 }, resultText: '你对人生方向更加坚定。' }] }],
  50: [{ id: 'milestone_50', category: 'growth', name: '五十知天命', icon: '🎂', description: '你50岁了。', choices: [{ text: '接受人生', effects: { happiness: 15 }, resultText: '你接受了人生的一切。' }] }],
  60: [{ id: 'milestone_60', category: 'career', name: '退休年龄', icon: '🌅', description: '你60岁了，到了退休年龄。', choices: [{ text: '正式退休', effects: { salary: 0, pension: 3000, happiness: 20 }, resultText: '你正式退休，开始领养老金。' }, { text: '继续工作', effects: { salaryMultiplier: 0.8, health: -5 }, resultText: '你选择继续工作。' }, { text: '返聘/顾问', effects: { salary: 5000, happiness: 10 }, resultText: '你接受了返聘。' }] }]
};

const LIFE_CHOICES = {
  22: {
    id: 'choice_22', name: '毕业抉择', icon: '🎓', age: 22,
    description: '大学毕业了。站在人生的十字路口，你要往哪走？',
    isLifeChoice: true,
    choices: [
      { id: 'work', text: '直接工作', shortName: '直接工作', icon: '💼', description: '早点进入社会，积累工作经验和人脉', immediateEffects: { salary: 5000, knowledge: 5 }, midTermEffects: { salaryGrowthMultiplier: 1.0 }, longTermEffects: { careerLine: 'standard' }, unlocks: ['standard_career'], resultText: '你选择直接工作，开始了职业生涯。工资5000，一切从零开始。', parallelHook: '如果你当年选择了考研，现在可能已经是硕士毕业，工资起点高了50%。' },
      { id: 'gradschool', text: '考研深造', shortName: '考研深造', icon: '📚', description: '继续读书，2年后硕士毕业，工资起点更高', immediateEffects: { debt: 20000, knowledge: 20, happiness: 5 }, midTermEffects: { salaryGrowthMultiplier: 1.0, delayedCareer: 24, salaryStartMultiplier: 1.5 }, longTermEffects: { careerLine: 'academic', salaryCapMultiplier: 1.3 }, unlocks: ['academic_career', 'high_education'], resultText: '你选择考研。接下来2年没有收入，还背负了2万助学贷款，但学识大增。2年后硕士毕业，工资起点比同龄人高50%。', parallelHook: '如果你当年直接工作，现在已经有2年工作经验和积蓄，可能已经升职了。' },
      { id: 'gap', text: 'Gap一年去看看世界', shortName: 'Gap一年', icon: '✈️', description: '花一年时间旅行、思考、找自己', immediateEffects: { savings: -10000, happiness: 20, network: 15, knowledge: 10 }, midTermEffects: { delayedCareer: 12, salaryGrowthMultiplier: 1.0 }, longTermEffects: { careerLine: 'standard', happinessCapBonus: 10 }, unlocks: ['travel_experience'], resultText: '你选择Gap一年。花了1万块去旅行，见识了不同的人生，幸福+20，人脉+15，学识+10。一年后重新出发。', parallelHook: '如果你当年没有Gap，现在可能已经在公司站稳脚跟，有了一定的积蓄。' }
    ]
  },
  25: {
    id: 'choice_25', name: '人生方向', icon: '🧭', age: 25,
    description: '25岁了。身边的人开始分化：有人考研，有人升职，有人创业，有人结婚。你要把人生的重心放在哪里？',
    isLifeChoice: true,
    choices: [
      { id: 'career', text: '全力拼事业', shortName: '拼事业', icon: '🚀', description: '把所有精力投入工作，追求快速晋升', immediateEffects: { salaryMultiplier: 1.15, health: -10, happiness: -5, network: 10 }, midTermEffects: { salaryGrowthMultiplier: 1.5 }, longTermEffects: { careerLine: 'climber', salaryCapMultiplier: 1.5 }, unlocks: ['fast_track'], resultText: '你选择全力拼事业。工资+15%，但健康-10，幸福-5。接下来几年晋升速度会比别人快。', parallelHook: '如果你当年没有那么拼，现在可能身体更好，有更多时间陪家人。' },
      { id: 'sidehustle', text: '开始做副业', shortName: '做副业', icon: '🎨', description: '主业之外发展副业，为未来多一条路', immediateEffects: { happiness: 5, knowledge: 5 }, midTermEffects: { sideIncomeGrowthMultiplier: 2.0, salaryGrowthMultiplier: 0.8 }, longTermEffects: { careerLine: 'sidehustler' }, unlocks: ['side_hustle_path'], resultText: '你选择开始做副业。幸福+5，学识+5。主业晋升会慢一些，但副业增长速度快。', parallelHook: '如果你当年专注主业，现在可能已经是部门主管了。' },
      { id: 'marriage', text: '找对象结婚', shortName: '结婚', icon: '💍', description: '把重心放在家庭，找一个合适的人结婚', immediateEffects: { happiness: 15, baseExpenseMultiplier: 1.3, network: 10 }, midTermEffects: { salaryGrowthMultiplier: 0.9 }, longTermEffects: { careerLine: 'family', happinessCapBonus: 20, familyEndingPossible: true }, unlocks: ['family_path'], resultText: '你选择把重心放在家庭。幸福+15，人脉+10，但生活支出+30%。', parallelHook: '如果你当年没有那么早结婚，现在可能事业上更有成就。' },
      { id: 'startup', text: '辞职创业', shortName: '创业', icon: '🔥', description: '搏一把，辞职创业，上限很高但风险也大', immediateEffects: { salary: 3000, savings: -20000, debt: 30000, happiness: 10, network: 20, knowledge: 15 }, midTermEffects: { salaryGrowthMultiplier: 0 }, longTermEffects: { careerLine: 'entrepreneur', startupEndingPossible: true }, unlocks: ['startup_path'], resultText: '你选择辞职创业！投入了2万积蓄，又借了3万，工资降到3000。30%概率成功，70%概率可能血本无归。', parallelHook: '如果你当年没有创业，现在可能安安稳稳上班，没有大富大贵但也没有风险。' }
    ]
  },
  30: {
    id: 'choice_30', name: '三十而立', icon: '🏛️', age: 30,
    description: '30岁了。孔子说"三十而立"。你立住了吗？',
    isLifeChoice: true,
    choices: [
      { id: 'buyhouse', text: '买房安家', shortName: '买房', icon: '🏠', description: '付首付买房，背上房贷，但有了自己的家', immediateEffects: { savings: -100000, debt: 800000, propertyValue: 1000000, happiness: 10, baseExpenseMultiplier: 1.2 }, midTermEffects: { salaryGrowthMultiplier: 1.1 }, longTermEffects: { hasHouse: true }, unlocks: ['homeowner'], resultText: '你选择买房。花了100万首付，背上80万房贷。幸福+10，但生活支出+20%。', parallelHook: '如果你当年没有买房，现在可能手里有100万现金，投资收益可能比房产增值更高。' },
      { id: 'invest', text: 'all in投资', shortName: 'all in投资', icon: '📈', description: '把积蓄全部投入投资，追求资产快速增值', immediateEffects: { investments: 80000, savings: 0, happiness: -5, knowledge: 10 }, midTermEffects: { investmentReturnMultiplier: 1.5 }, longTermEffects: { investorLine: true }, unlocks: ['aggressive_investor'], resultText: '你选择all in投资。把80万积蓄全部投入投资组合，储蓄清零。投资回报率提升50%，但风险也翻倍。', parallelHook: '如果你当年没有all in，现在可能稳稳当当，资产增长慢但安全。' },
      { id: 'careerchange', text: '转行/转型', shortName: '转行', icon: '🔄', description: '放弃现有积累，转行到更有前景的领域', immediateEffects: { salaryMultiplier: 0.7, knowledge: 15, happiness: 5, network: -10 }, midTermEffects: { salaryGrowthMultiplier: 2.0 }, longTermEffects: { careerLine: 'transition', salaryCapMultiplier: 1.4 }, unlocks: ['career_changer'], resultText: '你选择转行。工资降到原来的70%，但学识+15，幸福+5。新行业增长快，工资增长速度翻倍。', parallelHook: '如果你当年没有转行，现在可能在原行业已经是资深人士了。' },
      { id: 'maintain', text: '保持现状，稳扎稳打', shortName: '稳扎稳打', icon: '⚖️', description: '不做重大改变，继续当前的生活节奏', immediateEffects: { happiness: 5, health: 5 }, midTermEffects: { salaryGrowthMultiplier: 1.0 }, longTermEffects: { careerLine: 'stable' }, unlocks: ['stable_path'], resultText: '你选择保持现状。幸福+5，健康+5。工资增长平稳，生活稳定。', parallelHook: '如果你当年做了不同的选择，现在可能人生完全不同。' }
    ]
  },
  35: {
    id: 'choice_35', name: '中年危机', icon: '⚠️', age: 35,
    description: '35岁了。职场上开始出现"35岁危机"的说法。',
    isLifeChoice: true,
    choices: [
      { id: 'upgrade', text: '提升核心竞争力', shortName: '提升竞争力', icon: '💪', description: '学习新技能，提升不可替代性', immediateEffects: { savings: -10000, knowledge: 20, salaryMultiplier: 1.1, health: -5 }, midTermEffects: { salaryGrowthMultiplier: 1.2 }, longTermEffects: { careerLine: 'upgrader' }, unlocks: ['core_competence'], resultText: '你选择提升核心竞争力。花了1万学习新技能，学识+20，工资+10%。', parallelHook: '如果你当年没有提升自己，现在可能已经被优化了。' },
      { id: 'sidebusiness', text: '发展副业/第二曲线', shortName: '发展副业', icon: '🌱', description: '主业之外发展副业，为失业做准备', immediateEffects: { happiness: 5, health: -10, knowledge: 10 }, midTermEffects: { sideIncomeGrowthMultiplier: 1.5 }, longTermEffects: { careerLine: 'second_curve' }, unlocks: ['second_curve'], resultText: '你选择发展副业。幸福+5，健康-10，学识+10。', parallelHook: '如果你当年只专注主业，现在可能收入更高但更焦虑。' },
      { id: 'healthfirst', text: '健康第一，降速生活', shortName: '健康第一', icon: '🧘', description: '降低工作强度，把健康放在第一位', immediateEffects: { salaryMultiplier: 0.85, health: 20, happiness: 15, baseExpenseMultiplier: 0.9 }, midTermEffects: { salaryGrowthMultiplier: 0.7 }, longTermEffects: { careerLine: 'health_first' }, unlocks: ['health_first'], resultText: '你选择健康第一。工资降到85%，但健康+20，幸福+15，支出-10%。', parallelHook: '如果你当年继续拼，现在可能职位更高收入更多，但身体可能已经垮了。' },
      { id: 'startup35', text: '35岁创业，最后一搏', shortName: '35岁创业', icon: '🔥', description: '趁着还有经验和资源，最后搏一把创业', immediateEffects: { salary: 5000, savings: -50000, debt: 100000, happiness: 10, network: 30, knowledge: 20 }, midTermEffects: {}, longTermEffects: { careerLine: 'late_startup', startupEndingPossible: true }, unlocks: ['late_startup'], resultText: '你选择35岁最后一搏创业。投入50万积蓄，借了100万，工资降到5000。成功概率25%。', parallelHook: '如果你当年安稳上班，现在可能平平淡淡但没有中年破产的风险。' }
    ]
  }
};

const PARALLEL_HOOKS = {
  notChosen: {
    22: {
      work: '你22岁选择了直接工作。如果你当年考研，现在可能硕士毕业，工资起点高了50%，但也少了2年工作经验。',
      gradschool: '你22岁选择了考研深造。如果你当年直接工作，现在已经有2年工作经验和积蓄，可能已经升职了。',
      gap: '你22岁选择了Gap一年。如果你当年直接工作，现在可能已经在公司站稳脚跟，有了一定的积蓄。'
    },
    25: {
      career: '你25岁选择了全力拼事业。如果你当年选择做副业，现在可能副业收入已经超过主业。',
      sidehustle: '你25岁选择了做副业。如果你当年全力拼事业，现在可能已经是部门主管，年薪翻倍。',
      marriage: '你25岁选择了结婚。如果你当年专注事业，现在可能事业上更有成就，但也可能更孤独。',
      startup: '你25岁选择了创业。如果你当年安稳上班，现在可能没有大富大贵但也没有负债累累。'
    },
    30: {
      buyhouse: '你30岁选择了买房。如果你当年把钱拿去投资，现在可能资产增值更多，但也没有自己的家。',
      invest: '你30岁选择了all in投资。如果你当年买房，现在可能有了自己的家，虽然背上了房贷但心里踏实。',
      careerchange: '你30岁选择了转行。如果你当年留在原行业，现在可能已经是资深人士。',
      maintain: '你30岁选择了稳扎稳打。如果你当年搏一把，现在可能人生完全不同。'
    },
    35: {
      upgrade: '你35岁选择了提升竞争力。如果你当年选择健康第一，现在可能身体更好，但职业上可能已经遇到了瓶颈。',
      sidebusiness: '你35岁选择了发展副业。如果你当年只专注主业，现在可能收入更高但更焦虑。',
      healthfirst: '你35岁选择了健康第一。如果你当年继续拼，现在可能职位更高，但身体可能已经发出了警告。',
      startup35: '你35岁选择了最后一搏创业。如果你当年安稳上班，现在可能平平淡淡但没有中年破产的风险。'
    }
  },
  generic: {
    noSideIncome: '你一辈子都在靠工资生活。如果25岁那年开始做副业，现在可能已经不需要上班了。',
    noInvestment: '你一直把钱存在银行。如果30岁那年开始学习投资，现在可能资产已经翻倍了。',
    poorHealth: '你一直忽略健康。如果30岁那年开始健身，现在可能身体还很硬朗。',
    noMarriage: '你一直专注事业。40岁那年除夕夜，一个人吃了泡面。如果25岁那年接受了那个表白，现在可能已经有一个温暖的家了。',
    highDebt: '你被债务压了一辈子。如果25岁那年没有冲动消费，现在可能已经无债一身轻了。',
    noLearning: '你毕业后就没再学习过。如果每年花1000块学一个新技能，现在可能已经是跨界人才了。'
  }
};
