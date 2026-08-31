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
  { id: 'evt_career_promo_001', category: 'career', name: '升职机会', icon: '⬆️', description: '领导找你谈话，考虑让你带一个小团队。但这意味着更多加班和更大压力。', triggerCondition: { minCareerLevel: 2, minAge: 25, maxAge: 40, minNetwork: 20 }, probability: 0.15, choices: [
    { text: '接受挑战', effects: { salaryMultiplier: 1.20, health: -10, happiness: -5, unlockManagement: true }, resultText: '你接受了挑战，工资上涨20%，但工作压力也增大了。' },
    { text: '婉拒，保持现状', effects: { leadershipImpression: -10 }, resultText: '你婉拒了升职机会，领导印象有所下降，但生活保持平衡。' },
    { text: '谈条件，要求配助手', effects: { salaryMultiplier: 1.15, health: -5 }, requirement: { minNetwork: 30 }, resultText: '凭借你的人脉，你成功谈下了条件，工资+15%，压力相对较小。' }
  ]},
  { id: 'evt_career_joboffer_001', category: 'career', name: '跳槽邀请', icon: '🔄', description: '一家竞品公司向你发出了邀请，薪资更高，但需要重新适应环境。', triggerCondition: { minCareerLevel: 2, minAge: 25, maxAge: 45 }, probability: 0.12, choices: [
    { text: '接受新offer', effects: { salaryMultiplier: 1.25, network: -5, happiness: 5 }, resultText: '你接受了新工作，薪资上涨25%，但需要重新建立人脉。' },
    { text: '留在原公司', effects: { loyalty: 10 }, resultText: '你选择留在原公司，忠诚度提升。' },
    { text: '用offer谈加薪', effects: { salaryMultiplier: 1.10, relationshipWithBoss: -5 }, requirement: { minNetwork: 25 }, resultText: '你用offer和老板谈加薪，成功涨薪10%，但老板对你的信任有所下降。' }
  ]},
  { id: 'evt_career_bonus_001', category: 'career', name: '获得奖金！', icon: '🎉', description: '公司业绩好，发了一笔奖金！', triggerCondition: { minAge: 22 }, probability: 0.15, choices: [
    { text: '存入应急金', effects: { savings: 5000 }, resultText: '你把奖金存了起来，应急金增加5000元。' },
    { text: '投资自己', effects: { savings: -2000, knowledge: 10, skillPoint: 1 }, resultText: '你用奖金报名了课程，学识+10，获得1个技能点。' },
    { text: '犒劳自己', effects: { savings: -3000, happiness: 15 }, resultText: '你用奖金买了心仪已久的东西，幸福+15。' }
  ]},
  { id: 'evt_finance_market_001', category: 'finance', name: '市场波动', icon: '📉', description: '投资市场出现波动，你的投资组合受到影响。', triggerCondition: { minInvestment: 10000 }, probability: 0.20, choices: [
    { text: '持有不动', effects: { investmentMultiplier: 0.90 }, resultText: '你选择持有，投资暂时下跌10%。' },
    { text: '加仓抄底', effects: { savings: -3000, investmentMultiplier: 1.05 }, requirement: { minSavings: 5000 }, resultText: '你加仓抄底，短期投资+5%，但消耗了3000元现金。' },
    { text: '止损卖出', effects: { investmentMultiplier: 0.95, savings: 0, realizedLoss: true }, resultText: '你止损卖出，避免了更大损失，但也错过了反弹机会。' }
  ]},
  { id: 'evt_finance_taxrefund_001', category: 'finance', name: '退税到账', icon: '🧾', description: '年度个税退税到账了！', triggerCondition: { minAge: 22, minSalary: 5000 }, probability: 0.10, choices: [
    { text: '收到退税', effects: { savings: 1200 }, resultText: '你收到了1200元退税。' }
  ]},
  { id: 'evt_health_sick_001', category: 'health', name: '生病了', icon: '🤒', description: '身体不适，需要看病买药。', triggerCondition: { maxHealth: 50 }, probability: 0.20, choices: [
    { text: '去医院', effects: { savings: -1500, health: 10 }, resultText: '你去医院看了病，花了1500元，健康恢复了一些。' },
    { text: '硬扛过去', effects: { health: -10, happiness: -5 }, resultText: '你选择硬扛，健康进一步下降，心情也变差了。' }
  ]},
  { id: 'evt_health_checkup_001', category: 'health', name: '体检异常', icon: '🩺', description: '年度体检发现一些指标异常，需要注意。', triggerCondition: { minAge: 30 }, probability: 0.15, choices: [
    { text: '调整生活方式', effects: { health: -5, happiness: -5, healthAwareness: true }, resultText: '你开始调整作息和饮食，短期有些不适应，但长期有益。' },
    { text: '进一步检查', effects: { savings: -3000, health: 5, peaceOfMind: true }, resultText: '你做了进一步检查，花了3000元，确认无大碍，心里踏实了。' }
  ]},
  { id: 'evt_relation_friend_001', category: 'relationship', name: '朋友聚会', icon: '👥', description: '老朋友约聚会，好久没见了。', triggerCondition: { minAge: 20 }, probability: 0.18, choices: [
    { text: '参加聚会', effects: { savings: -300, network: 5, happiness: 10 }, resultText: '你参加了聚会，花了300元，人脉+5，幸福+10。' },
    { text: '婉拒，省钱', effects: { happiness: -3 }, resultText: '你婉拒了聚会，省了钱但心情有些低落。' }
  ]},
  { id: 'evt_relation_love_001', category: 'relationship', name: '遇到心动的人', icon: '💕', description: '你遇到了一个让你心动的人，要不要主动出击？', triggerCondition: { minAge: 18, maxAge: 40, isMarried: false }, probability: 0.10, choices: [
    { text: '主动追求', effects: { savings: -500, happiness: 15, relationship: 20, network: 5 }, resultText: '你主动出击，花了500元约会，幸福+15，关系+20。' },
    { text: '顺其自然', effects: { happiness: 5 }, resultText: '你选择顺其自然，心情有些悸动。' },
    { text: '专注事业', effects: { knowledge: 5, happiness: -3 }, resultText: '你选择专注事业，学识+5，但有些遗憾。' }
  ]},
  { id: 'evt_growth_insight_001', category: 'growth', name: '顿悟时刻', icon: '💡', description: '你突然想通了一些事情，对人生有了新的理解。', triggerCondition: { minKnowledge: 30 }, probability: 0.08, choices: [
    { text: '记录下来', effects: { knowledge: 10, happiness: 5, skillPoint: 1 }, resultText: '你把顿悟记录下来，学识+10，获得1个技能点。' }
  ]},
  { id: 'evt_growth_mentor_001', category: 'growth', name: '遇到贵人', icon: '🌟', description: '你遇到了一位愿意指点你的前辈。', triggerCondition: { minNetwork: 30 }, probability: 0.08, choices: [
    { text: '虚心请教', effects: { knowledge: 15, network: 10, careerLevel: 1 }, resultText: '你虚心向前辈请教，学识+15，人脉+10，职业等级+1。' },
    { text: '保持距离', effects: {}, resultText: '你保持了距离，错过了一次机会。' }
  ]},
  { id: 'evt_accident_lottery_001', category: 'accident', name: '中奖了！', icon: '🎰', description: '你买的彩票居然中奖了！', triggerCondition: { minAge: 18 }, probability: 0.02, choices: [
    { text: '领取奖金', effects: { savings: 50000, happiness: 30 }, resultText: '你中了5万元大奖！幸福+30。' }
  ]},
  { id: 'evt_accident_phone_001', category: 'accident', name: '手机坏了', icon: '📱', description: '手机突然坏了，需要更换。', triggerCondition: { minAge: 18 }, probability: 0.10, choices: [
    { text: '买新手机', effects: { savings: -3000, happiness: 5 }, resultText: '你买了新手机，花了3000元。' },
    { text: '修一下继续用', effects: { savings: -500 }, resultText: '你修好了手机，只花了500元。' }
  ]},
  { id: 'evt_accident_scam_001', category: 'accident', name: '差点被骗', icon: '⚠️', description: '你遇到了一个看似很好的投资机会，但总觉得哪里不对。', triggerCondition: { minSavings: 10000, minAge: 20 }, probability: 0.08, choices: [
    { text: '谨慎调查', effects: { knowledge: 5, avoidedScam: true }, resultText: '你谨慎调查后发现是骗局，避免了损失，学识+5。' },
    { text: '大胆投资', effects: { savings: -20000, happiness: -20 }, resultText: '你投了2万元，结果真的被骗了！幸福-20。' }
  ]}
];
const MILESTONE_EVENTS = {
  18: [{ id: 'milestone_18', category: 'growth', name: '成年了！', icon: '🎂', description: '你18岁了，正式成年。人生的大幕即将拉开。', choices: [{ text: '对未来充满期待', effects: { happiness: 10, knowledge: 5 }, resultText: '你对未来充满期待，开启了人生的第一幕。' }] }],
  22: [{ id: 'milestone_22', category: 'career', name: '大学毕业', icon: '🎓', description: '你大学毕业了，面临人生的第一个重大选择。', choices: [
    { text: '直接工作', effects: { careerStart: true, salary: 5000 }, resultText: '你选择直接工作，开始了职业生涯。' },
    { text: '继续考研', effects: { knowledge: 20, salary: 0, studentLoan: 20000, delayedCareer: 2 }, resultText: '你选择考研，学识+20，但需要2年后才开始工作，还背负了助学贷款。' },
    { text: 'Gap一年', effects: { happiness: 15, network: 10, delayedCareer: 1 }, resultText: '你选择Gap一年，去旅行和思考人生，幸福+15，人脉+10。' }
  ] }],
  25: [{ id: 'milestone_25', category: 'relationship', name: '25岁了', icon: '🎂', description: '你25岁了，身边的朋友开始结婚生子，你也开始思考人生方向。', choices: [
    { text: '专注事业', effects: { careerLevel: 1, happiness: -5 }, resultText: '你决定专注事业，职业等级+1，但有些孤独。' },
    { text: '寻找另一半', effects: { relationship: 15, happiness: 10 }, resultText: '你开始积极寻找另一半，关系+15，幸福+10。' },
    { text: '享受当下', effects: { happiness: 15, savings: -2000 }, resultText: '你选择享受当下，花了2000元去旅行，幸福+15。' }
  ] }],
  30: [{ id: 'milestone_30', category: 'growth', name: '三十而立', icon: '🎂', description: '你30岁了。孔子说"三十而立"，你立住了吗？', choices: [{ text: '回顾过去，展望未来', effects: { knowledge: 10, happiness: 5 }, resultText: '你回顾了过去十年，对未来有了更清晰的规划。' }] }],
  35: [{ id: 'milestone_35', category: 'career', name: '35岁危机', icon: '⚠️', description: '你35岁了，职场上开始出现"35岁危机"的说法。', choices: [
    { text: '提升核心竞争力', effects: { knowledge: 15, careerLevel: 1 }, resultText: '你决定提升核心竞争力，学识+15，职业等级+1。' },
    { text: '考虑转型', effects: { knowledge: 10, network: 10 }, resultText: '你开始考虑转型，学习新知识，拓展新人脉。' },
    { text: '保持现状', effects: { happiness: -5 }, resultText: '你选择保持现状，但焦虑感增加了。' }
  ] }],
  40: [{ id: 'milestone_40', category: 'growth', name: '四十不惑', icon: '🎂', description: '你40岁了。"四十而不惑"，你对人生还有困惑吗？', choices: [{ text: '更加坚定', effects: { knowledge: 10, happiness: 10 }, resultText: '你对人生方向更加坚定，学识+10，幸福+10。' }] }],
  50: [{ id: 'milestone_50', category: 'growth', name: '五十知天命', icon: '🎂', description: '你50岁了。"五十而知天命"，你知道自己的使命了吗？', choices: [{ text: '接受人生', effects: { happiness: 15, peace: true }, resultText: '你接受了人生的一切，内心平静，幸福+15。' }] }],
  60: [{ id: 'milestone_60', category: 'career', name: '退休年龄', icon: '🌅', description: '你60岁了，到了退休年龄。要退休吗？', choices: [
    { text: '正式退休', effects: { salary: 0, pension: 3000, happiness: 20, freeTime: true }, resultText: '你正式退休，开始领养老金，幸福+20，时间自由了。' },
    { text: '继续工作', effects: { salaryMultiplier: 0.8, health: -5 }, resultText: '你选择继续工作，但薪资有所下降，健康也有些吃不消。' },
    { text: '返聘/顾问', effects: { salary: 5000, workHours: 'part-time', happiness: 10 }, resultText: '你接受了返聘，做兼职顾问，收入不错，时间也相对自由。' }
  ] }]
};
