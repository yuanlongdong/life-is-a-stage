/**
 * 技能系统配置
 * 双轨制：该学习（新技能解锁）+ 该发展（已有技能升级）
 */
const SKILL_CATEGORIES = {
  career: { name: '职业演技', icon: '💼', color: '#9BBBF4', description: '主业能力，决定工资收入' },
  finance: { name: '财商演技', icon: '💰', color: '#A2DDAA', description: '理财能力，决定投资收益和风险控制' },
  side: { name: '副业演技', icon: '🎨', color: '#F4B393', description: '多元收入，决定副业收入' },
  life: { name: '生活演技', icon: '🌱', color: '#DEBEF8', description: '幸福能力，影响支出、健康和幸福' }
};
const LEARNABLE_SKILLS = {
  career_cert: { id: 'career_cert', category: 'career', name: '专业认证', icon: '📜', cost: 2000, duration: 2, prerequisite: null, effects: { salaryMultiplier: 1.10 }, description: '考取行业相关证书，工资+10%' },
  career_management: { id: 'career_management', category: 'career', name: '管理能力', icon: '👔', cost: 3000, duration: 3, prerequisite: 'career_cert', effects: { salaryMultiplier: 1.15, unlockManagement: true }, description: '学习团队管理，为晋升做准备，工资+15%' },
  career_speech: { id: 'career_speech', category: 'career', name: '演讲表达', icon: '🎤', cost: 1000, duration: 1, prerequisite: null, effects: { salaryMultiplier: 1.05, network: 10 }, description: '提升沟通和汇报能力，工资+5%，人脉+10' },
  career_insight: { id: 'career_insight', category: 'career', name: '行业洞察', icon: '🔍', cost: 1500, duration: 2, prerequisite: null, effects: { unlockStartup: true }, description: '深入理解行业，解锁创业机会事件' },
  finance_saving: { id: 'finance_saving', category: 'finance', name: '储蓄习惯', icon: '🏦', cost: 0, duration: 1, prerequisite: null, effects: { forcedSaving: 0.10 }, description: '养成储蓄习惯，每月强制储蓄10%工资' },
  finance_fund: { id: 'finance_fund', category: 'finance', name: '基金定投', icon: '📈', cost: 500, duration: 1, prerequisite: null, effects: { unlockFund: true }, description: '学习指数基金定投策略，解锁基金投资' },
  finance_insurance: { id: 'finance_insurance', category: 'finance', name: '保险配置', icon: '🛡️', cost: 300, duration: 1, prerequisite: null, effects: { expenseMultiplier: 0.95, riskTransfer: true }, description: '用保险转移重大风险，支出-5%' },
  finance_stock: { id: 'finance_stock', category: 'finance', name: '股票基础', icon: '📊', cost: 1500, duration: 2, prerequisite: 'finance_fund', effects: { unlockStock: true }, description: '学习基本面分析，解锁股票投资' },
  finance_property: { id: 'finance_property', category: 'finance', name: '房产投资', icon: '🏠', cost: 5000, duration: 6, prerequisite: null, prerequisiteCondition: { minAssets: 500000 }, effects: { unlockProperty: true }, description: '学习房产投资，解锁房产购买（需资产≥50万）' },
  side_writing: { id: 'side_writing', category: 'side', name: '写作能力', icon: '✍️', cost: 800, duration: 2, prerequisite: null, effects: { unlockSide: 'writing', sideIncomeBase: 500 }, description: '自媒体写作、文案创作，月入0-1000' },
  side_design: { id: 'side_design', category: 'side', name: '设计技能', icon: '🎨', cost: 1500, duration: 2, prerequisite: null, effects: { unlockSide: 'design', sideIncomeBase: 1000 }, description: '平面设计、UI设计接单，月入0-2000' },
  side_code: { id: 'side_code', category: 'side', name: '编程技能', icon: '💻', cost: 3000, duration: 4, prerequisite: null, effects: { unlockSide: 'code', sideIncomeBase: 2000 }, description: '前端/后端开发接单，月入0-4000' },
  side_video: { id: 'side_video', category: 'side', name: '短视频', icon: '🎬', cost: 1000, duration: 2, prerequisite: null, effects: { unlockSide: 'video', sideIncomeBase: 1500 }, description: '短视频创作，月入0-3000' },
  side_live: { id: 'side_live', category: 'side', name: '直播带货', icon: '📱', cost: 2000, duration: 3, prerequisite: null, prerequisiteCondition: { minFans: 10000 }, effects: { unlockSide: 'live', sideIncomeBase: 2500 }, description: '直播带货，月入0-5000（需粉丝≥1万）' },
  life_cooking: { id: 'life_cooking', category: 'life', name: '烹饪技能', icon: '🍳', cost: 300, duration: 1, prerequisite: null, effects: { foodExpenseMultiplier: 0.85 }, description: '自己做饭，减少外食，餐饮支出-15%' },
  life_fitness: { id: 'life_fitness', category: 'life', name: '健身习惯', icon: '🏋️', cost: 500, duration: 2, prerequisite: null, effects: { health: 20, medicalExpenseMultiplier: 0.80 }, description: '提升健康，减少生病，医疗支出-20%' },
  life_timemanage: { id: 'life_timemanage', category: 'life', name: '时间管理', icon: '⏰', cost: 200, duration: 1, prerequisite: null, effects: { learningSpeedMultiplier: 1.20 }, description: '提升效率，技能学习速度+20%' },
  life_communication: { id: 'life_communication', category: 'life', name: '沟通技巧', icon: '💬', cost: 600, duration: 1, prerequisite: null, effects: { network: 15, relationship: 10 }, description: '提升沟通能力，人脉+15，亲密关系+10' }
};
const DEVELOPABLE_SKILLS = {
  career_depth: { id: 'career_depth', category: 'career', name: '职业深度', icon: '⭐', costPerLevel: 1500, durationPerLevel: 2, maxLevel: 5, effectsPerLevel: { salaryMultiplier: 1.08 }, description: '在当前领域深耕，从专员到专家，每级工资+8%' },
  career_network: { id: 'career_network', category: 'career', name: '人脉经营', icon: '🤝', costPerLevel: 1000, durationPerLevel: 2, maxLevel: 5, effectsPerLevel: { opportunityBonus: 0.10 }, description: '拓展人脉，每级机会事件概率+10%' },
  finance_assetalloc: { id: 'finance_assetalloc', category: 'finance', name: '资产配置', icon: '📊', costPerLevel: 2000, durationPerLevel: 2, maxLevel: 5, effectsPerLevel: { investmentReturnBonus: 0.02 }, description: '构建多元资产组合，每级投资收益+2%' },
  finance_riskcontrol: { id: 'finance_riskcontrol', category: 'finance', name: '风险控制', icon: '🛡️', costPerLevel: 1000, durationPerLevel: 1, maxLevel: 5, effectsPerLevel: { maxLossReduction: 0.10 }, description: '提升风险控制能力，每级投资亏损上限-10%' },
  side_brand: { id: 'side_brand', category: 'side', name: '个人品牌', icon: '🌟', costPerLevel: 2000, durationPerLevel: 3, maxLevel: 5, effectsPerLevel: { sideIncomeMultiplier: 1.20 }, description: '打造个人IP，每级副业收入+20%' },
  side_product: { id: 'side_product', category: 'side', name: '产品化', icon: '📦', costPerLevel: 5000, durationPerLevel: 6, maxLevel: 3, effectsPerLevel: { sideIncomeMultiplier: 2.0, sideTimeReduction: 0.5 }, description: '从接单到产品化，每级副业收入翻倍但时间投入减半' },
  life_health: { id: 'life_health', category: 'life', name: '健康管理', icon: '❤️', costPerLevel: 500, durationPerLevel: 1, maxLevel: 5, effectsPerLevel: { maxHealthBonus: 10 }, description: '持续健康管理，每级健康上限+10' },
  life_relationship: { id: 'life_relationship', category: 'life', name: '亲密关系', icon: '💕', costPerLevel: 300, durationPerLevel: 1, maxLevel: 5, effectsPerLevel: { happinessBonus: 10 }, description: '经营亲密关系，每级幸福+10，影响家庭事件' }
};
