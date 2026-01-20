"use strict";
Object.defineProperty(exports, Symbol.toStringTag, { value: "Module" });
class InterventionContent {
  /**
   * 构造函数
   * @param {string} imageResource - 图片资源路径
   * @param {string} guidanceText - 引导文案
   * @param {string} foodName - 食物名称
   */
  constructor(imageResource, guidanceText, foodName) {
    this.imageResource = imageResource;
    this.guidanceText = guidanceText;
    this.foodName = foodName;
    this.createdAt = Date.now();
  }
  /**
   * 验证内容是否完整
   * @returns {boolean} 内容是否完整
   */
  isComplete() {
    return !!(this.imageResource && this.guidanceText && this.foodName);
  }
  /**
   * 获取显示用的数据对象
   * @returns {Object} 显示用的数据对象
   */
  getDisplayData() {
    return {
      image: this.imageResource,
      text: this.guidanceText,
      food: this.foodName,
      timestamp: this.createdAt
    };
  }
}
exports.InterventionContent = InterventionContent;
//# sourceMappingURL=../../.sourcemap/mp-weixin/models/InterventionContent.js.map
