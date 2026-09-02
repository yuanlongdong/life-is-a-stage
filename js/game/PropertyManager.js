/**
 * 房产系统管理器
 */
const PROPERTY_TYPES = [
  { id: 'studio', name: '单身公寓', icon: '🏠', basePrice: 500000, downPaymentRatio: 0.3, loanRate: 0.042, loanTerm: 30, description: '小户型，适合单身或情侣', happinessBonus: 5, expenseMultiplier: 0.9 },
  { id: 'apartment', name: '两居室', icon: '🏡', basePrice: 1200000, downPaymentRatio: 0.3, loanRate: 0.042, loanTerm: 30, description: '标准两居室，适合小家庭', happinessBonus: 15, expenseMultiplier: 1.0 },
  { id: 'house', name: '三居室', icon: '🏘️', basePrice: 2500000, downPaymentRatio: 0.3, loanRate: 0.042, loanTerm: 30, description: '宽敞三居室，适合有孩家庭', happinessBonus: 25, expenseMultiplier: 1.2 },
  { id: 'villa', name: '别墅', icon: '🏰', basePrice: 8000000, downPaymentRatio: 0.4, loanRate: 0.045, loanTerm: 20, description: '豪华别墅，人生巅峰', happinessBonus: 40, expenseMultiplier: 1.5 }
];
const CITY_PRICE_MULTIPLIER = {
  '北京': 2.5, '上海': 2.4, '深圳': 2.3, '广州': 1.8,
  '杭州': 1.7, '南京': 1.5, '成都': 1.2, '武汉': 1.1,
  '西安': 1.0, '重庆': 0.9, '长沙': 0.9, '郑州': 0.9,
  'default': 1.0
};
class PropertyManager {
  constructor() {
    this.marketTrend = 0;
    this.monthCount = 0;
  }
  getCityMultiplier(city) {
    return CITY_PRICE_MULTIPLIER[city] || CITY_PRICE_MULTIPLIER['default'];
  }
  getCurrentPrice(propertyType, city) {
    const type = PROPERTY_TYPES.find(t => t.id === propertyType);
    if (!type) return 0;
    const cityMultiplier = this.getCityMultiplier(city);
    const marketMultiplier = 1 + this.marketTrend * 0.3;
    return Math.round(type.basePrice * cityMultiplier * marketMultiplier);
  }
  calculateMonthlyMortgage(loanAmount, annualRate, years) {
    const monthlyRate = annualRate / 12;
    const months = years * 12;
    if (monthlyRate === 0) return Math.round(loanAmount / months);
    const monthlyPayment = loanAmount * monthlyRate * Math.pow(1 + monthlyRate, months) / (Math.pow(1 + monthlyRate, months) - 1);
    return Math.round(monthlyPayment);
  }
  canBuyProperty(player, propertyType) {
    const type = PROPERTY_TYPES.find(t => t.id === propertyType);
    if (!type) return { canBuy: false, reason: '房产类型不存在' };
    const price = this.getCurrentPrice(propertyType, player.city);
    const downPayment = Math.round(price * type.downPaymentRatio);
    if (player.savings < downPayment) {
      return { canBuy: false, reason: `首付需要${downPayment}元，当前储蓄${player.savings}元` };
    }
    if (player.age < 22) return { canBuy: false, reason: '年龄太小，无法贷款' };
    if (player.age > 60) return { canBuy: false, reason: '年龄太大，无法贷款' };
    return { canBuy: true, price, downPayment, type };
  }
  buyProperty(player, propertyType) {
    const check = this.canBuyProperty(player, propertyType);
    if (!check.canBuy) return { success: false, message: check.reason };
    const { price, downPayment, type } = check;
    const loanAmount = price - downPayment;
    const monthlyMortgage = this.calculateMonthlyMortgage(loanAmount, type.loanRate, type.loanTerm);
    player.savings -= downPayment;
    const property = {
      id: 'property_' + Date.now(),
      typeId: type.id, name: type.name, icon: type.icon,
      purchasePrice: price, currentValue: price,
      downPayment: downPayment, loanAmount: loanAmount,
      remainingLoan: loanAmount, monthlyMortgage: monthlyMortgage,
      loanTerm: type.loanTerm, loanRemainingMonths: type.loanTerm * 12,
      purchaseAge: player.age, purchaseMonth: player.month || 1,
      location: player.city, happinessBonus: type.happinessBonus,
      expenseMultiplier: type.expenseMultiplier
    };
    player.properties.push(property);
    player.hasHouse = true;
    player.monthlyMortgage += monthlyMortgage;
    player.remainingMortgage += loanAmount;
    player.happiness = Math.min(100, player.happiness + type.happinessBonus);
    player.propertyValue = this.getTotalPropertyValue(player);
    player.addEventLog(`🏠 购买了【${type.name}】，总价${price}元，首付${downPayment}元，贷款${loanAmount}元，月供${monthlyMortgage}元`);
    return { success: true, property, price, downPayment, loanAmount, monthlyMortgage };
  }
  updateMortgages(player) {
    if (!player.properties || player.properties.length === 0) return;
    let totalMonthlyMortgage = 0;
    let totalRemainingLoan = 0;
    player.properties.forEach(property => {
      if (property.remainingLoan > 0 && property.loanRemainingMonths > 0) {
        const monthlyRate = 0.042 / 12;
        const interest = Math.round(property.remainingLoan * monthlyRate);
        const principal = Math.min(property.monthlyMortgage - interest, property.remainingLoan);
        property.remainingLoan -= principal;
        property.loanRemainingMonths--;
        if (property.remainingLoan <= 0) {
          property.remainingLoan = 0;
          property.loanRemainingMonths = 0;
          player.addEventLog(`🎉 【${property.name}】房贷还清了！`);
          player.happiness = Math.min(100, player.happiness + 10);
        }
      }
      totalMonthlyMortgage += property.remainingLoan > 0 ? property.monthlyMortgage : 0;
      totalRemainingLoan += property.remainingLoan;
    });
    player.monthlyMortgage = totalMonthlyMortgage;
    player.remainingMortgage = totalRemainingLoan;
  }
  updatePropertyPrices(player) {
    this.monthCount++;
    if (this.monthCount % 3 === 0) {
      const change = (Math.random() - 0.48) * 0.2;
      this.marketTrend = Math.max(-1, Math.min(1, this.marketTrend + change));
    }
    if (player.properties && player.properties.length > 0) {
      player.properties.forEach(property => {
        const type = PROPERTY_TYPES.find(t => t.id === property.typeId);
        if (type) {
          const cityMultiplier = this.getCityMultiplier(player.city);
          const marketMultiplier = 1 + this.marketTrend * 0.3;
          const ageFactor = 1 - (player.age - property.purchaseAge) * 0.002;
          property.currentValue = Math.round(type.basePrice * cityMultiplier * marketMultiplier * ageFactor);
        }
      });
      player.propertyValue = this.getTotalPropertyValue(player);
    }
  }
  sellProperty(player, propertyId) {
    const propertyIndex = player.properties.findIndex(p => p.id === propertyId);
    if (propertyIndex === -1) return { success: false, message: '房产不存在' };
    const property = player.properties[propertyIndex];
    const salePrice = property.currentValue;
    const remainingLoan = property.remainingLoan;
    const netProfit = salePrice - remainingLoan - property.purchasePrice;
    const cashFromSale = salePrice - remainingLoan;
    player.savings += cashFromSale;
    player.monthlyMortgage -= property.remainingLoan > 0 ? property.monthlyMortgage : 0;
    player.remainingMortgage -= remainingLoan;
    player.happiness = Math.max(0, player.happiness - property.happinessBonus);
    player.properties.splice(propertyIndex, 1);
    if (player.properties.length === 0) player.hasHouse = false;
    player.propertyValue = this.getTotalPropertyValue(player);
    const profitText = netProfit >= 0 ? `盈利${netProfit}元` : `亏损${Math.abs(netProfit)}元`;
    player.addEventLog(`💰 出售了【${property.name}】，售价${salePrice}元，还清贷款${remainingLoan}元，到手${cashFromSale}元，${profitText}`);
    return { success: true, salePrice, remainingLoan, cashFromSale, netProfit, property };
  }
  getTotalPropertyValue(player) {
    if (!player.properties || player.properties.length === 0) return 0;
    return player.properties.reduce((sum, p) => sum + p.currentValue, 0);
  }
  getAvailableProperties(player) {
    return PROPERTY_TYPES.map(type => {
      const price = this.getCurrentPrice(type.id, player.city);
      const downPayment = Math.round(price * type.downPaymentRatio);
      const loanAmount = price - downPayment;
      const monthlyMortgage = this.calculateMonthlyMortgage(loanAmount, type.loanRate, type.loanTerm);
      const canAfford = player.savings >= downPayment;
      return { ...type, price, downPayment, loanAmount, monthlyMortgage, canAfford };
    });
  }
  getPropertyOverview(player) {
    const totalValue = this.getTotalPropertyValue(player);
    const totalRemainingLoan = player.remainingMortgage || 0;
    const totalMonthlyMortgage = player.monthlyMortgage || 0;
    const equity = totalValue - totalRemainingLoan;
    const hasProperty = player.properties && player.properties.length > 0;
    return {
      hasProperty, propertyCount: player.properties ? player.properties.length : 0,
      totalValue, totalRemainingLoan, totalMonthlyMortgage, equity,
      rent: hasProperty ? 0 : (player.rent || 1500),
      marketTrend: this.marketTrend
    };
  }
  serialize() {
    return { marketTrend: this.marketTrend, monthCount: this.monthCount };
  }
  deserialize(data) {
    if (!data) return;
    this.marketTrend = data.marketTrend || 0;
    this.monthCount = data.monthCount || 0;
  }
}
const propertyManager = new PropertyManager();