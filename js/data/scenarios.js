/**
 * 剧本系统配置
 * 6种预设人生起点，每种有不同的初始属性、财务状况和技能基础
 */
const SCENARIOS = [
  {
    id: 'graduate',
    name: '应届生',
    icon: '🎓',
    age: 22,
    description: '低收入、低支出、无负债、学习能力强。刚毕业，一切从零开始。',
    initialStats: { health: 85, happiness: 75, network: 20, knowledge: 40 },
    initialFinance: { salary: 4000, baseExpense: 2500, savings: 5000, investments: 0, debt: 0, propertyValue: 0 },
    initialSkills: { career: 1, finance: 0, side: 0, life: 1 },
    city: 'newGraduate',
    difficulty: '简单',
    tips: '你的优势是年轻和学习能力强，早点开始投资和学习，复利效应会非常明显。'
  },
  {
    id: 'newbie',
    name: '职场新人',
    icon: '💼',
    age: 25,
    description: '中等收入、中等支出、可能有消费贷。工作几年，开始积累。',
    initialStats: { health: 80, happiness: 65, network: 30, knowledge: 45 },
    initialFinance: { salary: 6500, baseExpense: 4500, savings: 8000, investments: 0, debt: 15000, propertyValue: 0 },
    initialSkills: { career: 2, finance: 1, side: 0, life: 1 },
    city: 'tier1',
    difficulty: '普通',
    tips: '你有一定的工作经验，但也背负了一些债务。先还清高息负债，再开始投资。'
  },
  {
    id: 'senior',
    name: '资深职场',
    icon: '👔',
    age: 32,
    description: '中高收入、高支出（房贷/车贷/育儿）、资产较多。事业有成，但压力也大。',
    initialStats: { health: 65, happiness: 60, network: 50, knowledge: 60 },
    initialFinance: { salary: 15000, baseExpense: 10000, savings: 50000, investments: 100000, debt: 200000, propertyValue: 1500000 },
    initialSkills: { career: 4, finance: 2, side: 1, life: 2 },
    city: 'tier1',
    difficulty: '困难',
    tips: '你的收入高，但支出也高。注意健康管理，优化资产配置，构建被动收入。'
  },
  {
    id: 'startup',
    name: '创业者',
    icon: '🚀',
    age: 28,
    description: '收入波动大、有经营负债、上限高。创业路上，风险与机遇并存。',
    initialStats: { health: 70, happiness: 70, network: 45, knowledge: 55 },
    initialFinance: { salary: 8000, baseExpense: 6000, savings: 30000, investments: 0, debt: 50000, propertyValue: 0 },
    initialSkills: { career: 3, finance: 2, side: 3, life: 1 },
    city: 'tier1',
    difficulty: '困难',
    tips: '你的上限很高，但波动也大。注意现金流管理，保留足够的应急金。'
  },
  {
    id: 'freelance',
    name: '自由职业',
    icon: '🎨',
    age: 27,
    description: '收入不稳定、低固定支出、依赖技能。自由但需要自律。',
    initialStats: { health: 75, happiness: 75, network: 35, knowledge: 50 },
    initialFinance: { salary: 7000, baseExpense: 4000, savings: 15000, investments: 0, debt: 5000, propertyValue: 0 },
    initialSkills: { career: 2, finance: 1, side: 4, life: 2 },
    city: 'tier2',
    difficulty: '普通',
    tips: '你的技能是最大的资产。持续提升技能，建立稳定客户群，同时注意社保和保险。'
  },
  {
    id: 'debt',
    name: '负债上岸者',
    icon: '⛰️',
    age: 26,
    description: '目标明确、高债务支出、全力上岸。负债累累，但决心改变。',
    initialStats: { health: 70, happiness: 50, network: 25, knowledge: 45 },
    initialFinance: { salary: 6000, baseExpense: 3500, savings: 2000, investments: 0, debt: 70000, propertyValue: 0 },
    initialSkills: { career: 2, finance: 1, side: 2, life: 2 },
    city: 'tier2',
    difficulty: '地狱',
    tips: '你的首要目标是还清债务。停止新增负债，增加收入，减少支出，建立应急金。上岸后就是新生。'
  }
];
const CITY_COEFFICIENTS = {
  tier1: { name: '一线城市', salary: 1.4, expense: 1.5, opportunity: 1.4 },
  tier2: { name: '二线城市', salary: 1.0, expense: 1.0, opportunity: 1.0 },
  tier3: { name: '三线城市', salary: 0.8, expense: 0.7, opportunity: 0.7 },
  hometown: { name: '老家小城', salary: 0.7, expense: 0.6, opportunity: 0.6 },
  newGraduate: { name: '待定', salary: 1.0, expense: 1.0, opportunity: 1.0 }
};
const INDUSTRY_COEFFICIENTS = {
  tech: { name: '互联网/科技', salary: 1.4, volatility: 1.3 },
  finance: { name: '金融', salary: 1.5, volatility: 1.4 },
  medical: { name: '医疗/教育', salary: 1.0, volatility: 0.7 },
  manufacturing: { name: '制造业', salary: 0.9, volatility: 0.8 },
  service: { name: '服务业', salary: 0.8, volatility: 1.0 },
  freelance: { name: '自由职业', salary: 1.0, volatility: 1.5 }
};