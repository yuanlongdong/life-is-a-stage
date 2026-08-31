/**
 * 人际关系系统管理器
 * 管理朋友、伴侣、子女三大人际关系维度
 */

const FIRST_NAMES = ['伟', '芳', '娜', '敏', '静', '丽', '强', '磊', '军', '洋', '勇', '艳', '杰', '娟', '涛', '明', '超', '秀英', '霞', '平', '刚', '桂英', '文', '辉', '玲', '鑫', '斌', '波', '宇', '浩', '凯', '健', '俊', '帆', '鹏', '博', '婷', '雪', '倩', '琳', '欣', '怡', '佳', '悦', '璐', '瑶', '雯'];
const LAST_NAMES = ['王', '李', '张', '刘', '陈', '杨', '黄', '赵', '吴', '周', '徐', '孙', '马', '朱', '胡', '郭', '何', '高', '林', '罗', '郑', '梁', '谢', '宋', '唐', '许', '韩', '冯', '邓', '曹', '彭', '曾', '萧', '田', '董', '袁', '潘', '于', '蒋', '蔡', '余', '杜', '叶', '程', '苏', '魏', '吕', '丁', '任', '沈', '姚', '卢', '姜', '崔', '钟', '谭', '陆', '汪', '范', '金', '石', '廖', '贾', '夏', '韦', '付', '方', '白', '邹', '孟', '熊', '秦', '邱', '江', '尹', '薛', '闫', '段', '雷', '侯', '龙', '史', '陶', '黎', '贺', '顾', '毛', '郝', '龚', '邵', '万', '钱', '严', '覃', '武', '戴', '莫', '孔', '向', '汤'];
const OCCUPATIONS = ['程序员', '产品经理', '设计师', '教师', '医生', '护士', '律师', '会计师', '销售', '市场专员', 'HR', '运营', '记者', '编辑', '摄影师', '厨师', '司机', '公务员', '创业者', '自由职业者', '工程师', '建筑师', '心理咨询师', '金融分析师', '保险销售', '房地产中介', '快递员', '外卖员', '店员', '服务员'];
const PERSONALITIES = ['外向开朗', '内向沉稳', '幽默风趣', '认真严谨', '温柔体贴', '强势果断', '随和友善', '独立自我', '浪漫感性', '理性务实', '冒险精神', '安于现状'];
const FRIEND_TYPES = [
  { type: 'work', context: '工作中认识', icon: '💼' },
  { type: 'school', context: '同学/校友', icon: '🎓' },
  { type: 'social', context: '社交活动认识', icon: '🎉' },
  { type: 'hobby', context: '兴趣爱好认识', icon: '🎨' },
  { type: 'neighbor', context: '邻居', icon: '🏠' },
  { type: 'online', context: '网上认识', icon: '💻' }
];

class RelationshipManager {
  constructor() {
    this.friends = [];
    this.partner = null;
    this.children = [];
    this.relationshipEvents = [];
  }

  makeFriend(player, contextType = 'social') {
    const typeInfo = FRIEND_TYPES.find(t => t.type === contextType) || FRIEND_TYPES[2];
    const friend = {
      id: 'friend_' + Date.now() + '_' + Math.floor(Math.random() * 1000),
      name: this._randomName(),
      relationship: 50 + Math.floor(Math.random() * 30),
      occupation: this._randomOccupation(),
      personality: this._randomPersonality(),
      meetAge: player.age,
      meetContext: typeInfo.context,
      meetType: typeInfo.type,
      lastContactMonth: 0,
      totalContactCount: 1,
      helpGiven: 0,
      troubleCaused: 0
    };
    this.friends.push(friend);
    this._log(`🤝 认识了新朋友${friend.name}（${friend.occupation}），关系值${friend.relationship}`);
    return friend;
  }

  contactFriend(friendId, player) {
    const friend = this.friends.find(f => f.id === friendId);
    if (!friend) return { success: false, message: '朋友不存在' };
    const cost = 100 + Math.floor(Math.random() * 200);
    if (player.savings < cost) return { success: false, message: '钱不够联系朋友' };
    player.savings -= cost;
    friend.relationship = Math.min(100, friend.relationship + 5 + Math.floor(Math.random() * 10));
    friend.lastContactMonth = 0;
    friend.totalContactCount++;
    player.happiness = Math.min(100, player.happiness + 2);
    this._log(`📞 联系了${friend.name}，关系值+，花了${cost}元`);
    return { success: true, friend, cost, relationshipGain: friend.relationship };
  }

  friendAsksForHelp(friendId, player) {
    const friend = this.friends.find(f => f.id === friendId);
    if (!friend) return null;
    if (Math.random() > 0.3) return null;
    const helpAmount = 1000 + Math.floor(Math.random() * 5000);
    return {
      type: 'friend_help', friend, amount: helpAmount,
      description: `${friend.name}遇到了困难，向你借${helpAmount}元。`,
      choices: [
        { text: '借钱帮忙', effect: (p) => {
          if (p.savings < helpAmount) return { success: false, message: '钱不够' };
          p.savings -= helpAmount;
          friend.relationship = Math.min(100, friend.relationship + 15);
          friend.helpGiven++;
          p.happiness += 5;
          return { success: true, message: `你借了${helpAmount}元给${friend.name}，关系值+15` };
        }},
        { text: '婉拒', effect: (p) => {
          friend.relationship = Math.max(0, friend.relationship - 10);
          p.happiness -= 3;
          return { success: true, message: `你婉拒了${friend.name}，关系值-10` };
        }}
      ]
    };
  }

  friendBringsOpportunity(friendId, player) {
    const friend = this.friends.find(f => f.id === friendId);
    if (!friend) return null;
    if (friend.relationship < 60 || Math.random() > 0.2) return null;
    const opportunities = [
      { type: 'job_opportunity', title: '工作机会', description: `${friend.name}介绍了一个工作机会，薪资可能更高。`, effect: (p) => {
        const salaryBoost = 1.1 + Math.random() * 0.2;
        p.salary = Math.round(p.salary * salaryBoost);
        friend.relationship = Math.min(100, friend.relationship + 5);
        return { message: `通过${friend.name}的介绍，你换了工作，薪资提升${Math.round((salaryBoost-1)*100)}%` };
      }},
      { type: 'investment_tip', title: '投资建议', description: `${friend.name}分享了一个投资机会。`, effect: (p) => {
        if (p.savings < 5000) return { message: '钱不够投资' };
        const gain = Math.random() > 0.5;
        if (gain) {
          const amount = 2000 + Math.floor(Math.random() * 5000);
          p.savings += amount;
          return { message: `投资成功，赚了${amount}元` };
        } else {
          const amount = 1000 + Math.floor(Math.random() * 3000);
          p.savings -= amount;
          return { message: `投资失败，亏了${amount}元` };
        }
      }},
      { type: 'social_event', title: '社交活动', description: `${friend.name}邀请你参加一个社交活动。`, effect: (p) => {
        p.network = Math.min(100, p.network + 5);
        p.happiness = Math.min(100, p.happiness + 8);
        p.savings -= 200;
        return { message: '参加了社交活动，人脉+5，幸福+8，花了200元' };
      }}
    ];
    const opportunity = opportunities[Math.floor(Math.random() * opportunities.length)];
    return { ...opportunity, friend };
  }

  updateFriendships() {
    this.friends.forEach(friend => {
      friend.lastContactMonth++;
      if (friend.lastContactMonth > 3) {
        const decay = Math.min(5, Math.floor(friend.lastContactMonth / 3));
        friend.relationship = Math.max(0, friend.relationship - decay);
      }
      if (friend.relationship < 20 && Math.random() < 0.1) {
        this._log(`💔 和${friend.name}的关系变淡了，逐渐失去联系`);
      }
    });
    const before = this.friends.length;
    this.friends = this.friends.filter(f => f.relationship > 0);
    if (before > this.friends.length) {
      this._log(`😢 失去了${before - this.friends.length}个朋友的联系`);
    }
  }

  getCloseFriends() { return this.friends.filter(f => f.relationship >= 70); }

  getFriendStats() {
    return {
      total: this.friends.length,
      close: this.getCloseFriends().length,
      averageRelationship: this.friends.length > 0
        ? Math.round(this.friends.reduce((sum, f) => sum + f.relationship, 0) / this.friends.length)
        : 0
    };
  }

  meetPotentialPartner(player, contextType = 'social') {
    if (this.partner && (this.partner.status === 'dating' || this.partner.status === 'married')) {
      return { success: false, message: '你已经有伴侣了' };
    }
    const typeInfo = FRIEND_TYPES.find(t => t.type === contextType) || FRIEND_TYPES[2];
    const partner = {
      id: 'partner_' + Date.now(),
      name: this._randomName(),
      relationship: 40 + Math.floor(Math.random() * 30),
      status: 'dating',
      occupation: this._randomOccupation(),
      personality: this._randomPersonality(),
      meetAge: player.age,
      meetContext: typeInfo.context,
      datingMonths: 0,
      marriageMonths: 0,
      income: 3000 + Math.floor(Math.random() * 10000),
      happinessContribution: 5 + Math.floor(Math.random() * 10),
      lastDateMonth: 0,
      conflictCount: 0
    };
    this.partner = partner;
    this._log(`💕 开始和${partner.name}交往（${partner.occupation}），好感度${partner.relationship}`);
    return { success: true, partner };
  }

  goOnDate(player) {
    if (!this.partner || this.partner.status !== 'dating') return { success: false, message: '没有交往对象' };
    const cost = 200 + Math.floor(Math.random() * 500);
    if (player.savings < cost) return { success: false, message: '钱不够约会' };
    player.savings -= cost;
    const relationshipGain = 5 + Math.floor(Math.random() * 15);
    this.partner.relationship = Math.min(100, this.partner.relationship + relationshipGain);
    this.partner.lastDateMonth = 0;
    player.happiness = Math.min(100, player.happiness + 8);
    this._log(`🌹 和${this.partner.name}约会，好感度+${relationshipGain}，花了${cost}元`);
    return { success: true, cost, relationshipGain };
  }

  propose(player) {
    if (!this.partner || this.partner.status !== 'dating') return { success: false, message: '没有交往对象' };
    if (this.partner.datingMonths < 6) return { success: false, message: '交往时间太短，至少6个月' };
    if (this.partner.relationship < 70) return { success: false, message: '好感度不够，至少70' };
    const ringCost = 5000 + Math.floor(Math.random() * 20000);
    if (player.savings < ringCost) return { success: false, message: `买戒指需要${ringCost}元，钱不够` };
    const successRate = this.partner.relationship / 100;
    if (Math.random() > successRate) {
      player.savings -= ringCost;
      this.partner.relationship = Math.max(0, this.partner.relationship - 20);
      this._log(`💍 向${this.partner.name}求婚被拒绝了，花了${ringCost}元买戒指，好感度-20`);
      return { success: false, message: '求婚被拒绝了', ringCost };
    }
    player.savings -= ringCost;
    this.partner.status = 'married';
    this.partner.marriageAge = player.age;
    player.isMarried = true;
    player.happiness = Math.min(100, player.happiness + 20);
    player.baseExpense = Math.round(player.baseExpense * 1.3);
    this._log(`💍 向${this.partner.name}求婚成功！结婚了，花了${ringCost}元买戒指`);
    return { success: true, ringCost, partner: this.partner };
  }

  divorce(player) {
    if (!this.partner || this.partner.status !== 'married') return { success: false, message: '没有结婚' };
    const propertySplit = Math.round(player.savings * 0.4);
    player.savings -= propertySplit;
    player.isMarried = false;
    player.happiness = Math.max(0, player.happiness - 25);
    player.baseExpense = Math.round(player.baseExpense / 1.3);
    this._log(`💔 和${this.partner.name}离婚了，财产分割损失${propertySplit}元，幸福-25`);
    const exPartner = this.partner;
    this.partner = null;
    return { success: true, propertySplit, exPartner };
  }

  updatePartner() {
    if (!this.partner) return;
    if (this.partner.status === 'dating') {
      this.partner.datingMonths++;
      this.partner.lastDateMonth++;
      if (this.partner.lastDateMonth > 2) {
        this.partner.relationship = Math.max(0, this.partner.relationship - 5);
      }
      if (this.partner.relationship < 30 && Math.random() < 0.2) {
        this._log(`💔 和${this.partner.name}分手了`);
        this.partner = null;
      }
    } else if (this.partner.status === 'married') {
      this.partner.marriageMonths++;
      const fluctuation = Math.floor(Math.random() * 5) - 2;
      this.partner.relationship = Math.max(0, Math.min(100, this.partner.relationship + fluctuation));
      if (this.partner.relationship < 40 && Math.random() < 0.1) {
        this.partner.conflictCount++;
        this._log(`😠 和${this.partner.name}发生了矛盾，婚姻幸福度下降`);
      }
    }
  }

  getPartnerStatus() {
    if (!this.partner) return { status: 'single', description: '单身' };
    const statusMap = { dating: '恋爱中', married: '已婚', divorced: '离异' };
    return {
      status: this.partner.status,
      description: statusMap[this.partner.status] || this.partner.status,
      name: this.partner.name,
      relationship: this.partner.relationship,
      occupation: this.partner.occupation,
      datingMonths: this.partner.datingMonths,
      marriageMonths: this.partner.marriageMonths
    };
  }

  haveChild(player) {
    if (!this.partner || this.partner.status !== 'married') return { success: false, message: '需要先结婚' };
    if (player.age < 25 || player.age > 45) return { success: false, message: '年龄不合适（25-45岁）' };
    const fertilityRate = player.age < 35 ? 0.7 : player.age < 40 ? 0.5 : 0.3;
    if (Math.random() > fertilityRate) return { success: false, message: '这次没有成功怀孕' };
    const child = {
      id: 'child_' + Date.now(),
      name: this._randomName(),
      gender: Math.random() > 0.5 ? '男' : '女',
      age: 0,
      birthAge: player.age,
      educationLevel: '未上学',
      educationQuality: 50,
      relationship: 80,
      monthlyExpense: 1000,
      talent: Math.floor(Math.random() * 100),
      health: 80 + Math.floor(Math.random() * 20)
    };
    this.children.push(child);
    player.childrenCount = this.children.length;
    player.happiness = Math.min(100, player.happiness + 15);
    player.baseExpense += child.monthlyExpense;
    this._log(`👶 ${child.name}出生了！是个${child.gender}孩，幸福+15`);
    return { success: true, child };
  }

  investInChildEducation(childId, amount, player) {
    const child = this.children.find(c => c.id === childId);
    if (!child) return { success: false, message: '子女不存在' };
    if (player.savings < amount) return { success: false, message: '钱不够' };
    player.savings -= amount;
    const qualityGain = Math.min(20, Math.floor(amount / 1000));
    child.educationQuality = Math.min(100, child.educationQuality + qualityGain);
    child.relationship = Math.min(100, child.relationship + 3);
    this._log(`📚 为${child.name}教育投资${amount}元，教育质量+${qualityGain}`);
    return { success: true, qualityGain, amount };
  }

  spendTimeWithChild(childId, player) {
    const child = this.children.find(c => c.id === childId);
    if (!child) return { success: false, message: '子女不存在' };
    child.relationship = Math.min(100, child.relationship + 5);
    player.happiness = Math.min(100, player.happiness + 5);
    if (Math.random() < 0.2) player.salary = Math.round(player.salary * 0.98);
    this._log(`👨‍👧 陪伴${child.name}，亲子关系+5，幸福+5`);
    return { success: true };
  }

  updateChildren(player) {
    this.children.forEach(child => {
      child.age += 1 / 12;
      if (child.age >= 3 && child.educationLevel === '未上学') {
        child.educationLevel = '幼儿园'; child.monthlyExpense = 2000; player.baseExpense += 1000;
        this._log(`🎒 ${child.name}上幼儿园了`);
      } else if (child.age >= 6 && child.educationLevel === '幼儿园') {
        child.educationLevel = '小学'; child.monthlyExpense = 1500; player.baseExpense -= 500;
        this._log(`📖 ${child.name}上小学了`);
      } else if (child.age >= 12 && child.educationLevel === '小学') {
        child.educationLevel = '初中'; child.monthlyExpense = 2000; player.baseExpense += 500;
        this._log(`📚 ${child.name}上初中了`);
      } else if (child.age >= 15 && child.educationLevel === '初中') {
        child.educationLevel = '高中'; child.monthlyExpense = 2500; player.baseExpense += 500;
        this._log(`🎓 ${child.name}上高中了`);
      } else if (child.age >= 18 && child.educationLevel === '高中') {
        child.educationLevel = '大学'; child.monthlyExpense = 3000; player.baseExpense += 500;
        this._log(`🏛️ ${child.name}上大学了`);
      } else if (child.age >= 22 && child.educationLevel === '大学') {
        child.educationLevel = '已毕业'; child.monthlyExpense = 0; player.baseExpense -= 3000;
        const successScore = child.educationQuality * 0.6 + child.talent * 0.4;
        if (successScore >= 80) {
          this._log(`🌟 ${child.name}大学毕业，找到了好工作！教育投资有了回报`);
          player.happiness += 20;
        } else if (successScore >= 60) {
          this._log(`✅ ${child.name}大学毕业，工作一般`);
          player.happiness += 10;
        } else {
          this._log(`😔 ${child.name}大学毕业，工作不太理想`);
          player.happiness += 5;
        }
      }
      if (child.age >= 12 && child.age <= 18) {
        child.relationship = Math.max(0, child.relationship - 1);
      }
    });
  }

  getChildrenStats() {
    return {
      total: this.children.length,
      inSchool: this.children.filter(c => c.age >= 3 && c.age < 22).length,
      graduated: this.children.filter(c => c.age >= 22).length,
      averageEducationQuality: this.children.length > 0
        ? Math.round(this.children.reduce((sum, c) => sum + c.educationQuality, 0) / this.children.length)
        : 0
    };
  }

  getRelationshipOverview() {
    return {
      friends: this.getFriendStats(),
      partner: this.getPartnerStatus(),
      children: this.getChildrenStats(),
      socialScore: this._calculateSocialScore()
    };
  }

  _calculateSocialScore() {
    let score = 0;
    score += Math.min(30, this.friends.length * 3);
    score += Math.min(10, this.getCloseFriends().length * 2);
    if (this.partner) {
      if (this.partner.status === 'married') score += 30;
      else if (this.partner.status === 'dating') score += 15;
      score += Math.round(this.partner.relationship / 10);
    }
    score += Math.min(20, this.children.length * 5);
    if (this.children.length > 0) {
      const avgRelationship = this.children.reduce((sum, c) => sum + c.relationship, 0) / this.children.length;
      score += Math.round(avgRelationship / 20);
    }
    return Math.min(100, score);
  }

  _randomName() {
    const lastName = LAST_NAMES[Math.floor(Math.random() * LAST_NAMES.length)];
    const firstName = FIRST_NAMES[Math.floor(Math.random() * FIRST_NAMES.length)];
    return lastName + firstName;
  }

  _randomOccupation() { return OCCUPATIONS[Math.floor(Math.random() * OCCUPATIONS.length)]; }
  _randomPersonality() { return PERSONALITIES[Math.floor(Math.random() * PERSONALITIES.length)]; }

  _log(message) {
    this.relationshipEvents.push({ time: new Date().toISOString(), message });
    if (this.relationshipEvents.length > 100) this.relationshipEvents.shift();
  }

  serialize() {
    return {
      friends: this.friends,
      partner: this.partner,
      children: this.children,
      relationshipEvents: this.relationshipEvents.slice(-50)
    };
  }

  deserialize(data) {
    if (!data) return;
    this.friends = data.friends || [];
    this.partner = data.partner || null;
    this.children = data.children || [];
    this.relationshipEvents = data.relationshipEvents || [];
  }
}

const relationshipManager = new RelationshipManager();
