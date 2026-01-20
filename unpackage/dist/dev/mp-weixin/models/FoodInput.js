"use strict";
class FoodInput {
  /**
   * 构造函数
   * @param {string} name - 食物名称
   */
  constructor(name) {
    this.name = name;
    this.timestamp = Date.now();
  }
  /**
   * 验证输入是否有效
   * @returns {boolean} 输入是否有效
   */
  isValid() {
    return !!(this.name && typeof this.name === "string" && this.name.trim().length > 0);
  }
  /**
   * 获取清理后的食物名称
   * @returns {string} 清理后的食物名称
   */
  getCleanName() {
    return this.name ? this.name.trim() : "";
  }
}
exports.FoodInput = FoodInput;
//# sourceMappingURL=../../.sourcemap/mp-weixin/models/FoodInput.js.map
