"use strict";
const common_vendor = require("../common/vendor.js");
const interfaces_ImageLibrary = require("./ImageLibrary.js");
const interfaces_TextLibrary = require("./TextLibrary.js");
const models_InterventionContent = require("../models/InterventionContent.js");
class InterventionRepository {
  constructor() {
    this.imageLibrary = new interfaces_ImageLibrary.ImageLibrary();
    this.textLibrary = new interfaces_TextLibrary.TextLibrary();
    this.quickSelectFoods = [];
    this.initialize();
  }
  /**
   * 获取干预内容
   * @param {import('../models/FoodInput.js').FoodInput} foodInput - 食物输入对象
   * @returns {Promise<InterventionContent>} 干预内容
   */
  async getInterventionContent(foodInput) {
    try {
      if (!foodInput || !foodInput.isValid()) {
        throw new Error("无效的食物输入");
      }
      const foodName = foodInput.getCleanName();
      const imageResource = this.imageLibrary.getImageForFood(foodName);
      const guidanceText = this.textLibrary.getRandomGuidanceText();
      return new models_InterventionContent.InterventionContent(imageResource, guidanceText, foodName);
    } catch (error) {
      common_vendor.index.__f__("error", "at interfaces/InterventionRepository.js:35", "获取干预内容失败:", error);
      return new models_InterventionContent.InterventionContent(
        this.imageLibrary.getDefaultImage(),
        this.textLibrary.getDefaultText(),
        foodInput ? foodInput.getCleanName() : "未知食物"
      );
    }
  }
  /**
   * 获取快捷选择食物列表
   * @returns {Array<string>} 快捷选择食物列表
   */
  getQuickSelectFoods() {
    return [...this.quickSelectFoods];
  }
  /**
   * 检查食物是否有对应图片
   * @param {string} foodName - 食物名称
   * @returns {boolean} 是否有对应图片
   */
  hasImageForFood(foodName) {
    return this.imageLibrary.isImageAvailable(foodName);
  }
  /**
   * 获取所有可用的引导文案
   * @returns {Array<string>} 所有引导文案
   */
  getAllGuidanceTexts() {
    return this.textLibrary.getAllGuidanceTexts();
  }
  /**
   * 添加新的快捷选择食物
   * @param {string} foodName - 食物名称
   */
  addQuickSelectFood(foodName) {
    if (foodName && typeof foodName === "string" && !this.quickSelectFoods.includes(foodName)) {
      this.quickSelectFoods.push(foodName);
    }
  }
  /**
   * 初始化仓库
   */
  initialize() {
    this.imageLibrary.initializeDefaultMappings();
    this.quickSelectFoods = [
      "披萨",
      "炸鸡",
      "奶茶",
      "蛋糕",
      "薯条"
    ];
  }
  /**
   * 重置仓库到初始状态
   */
  reset() {
    this.imageLibrary = new interfaces_ImageLibrary.ImageLibrary();
    this.textLibrary = new interfaces_TextLibrary.TextLibrary();
    this.quickSelectFoods = [];
    this.initialize();
  }
  /**
   * 清理缓存数据
   * 清理临时缓存，但保留核心配置
   */
  clearCache() {
    try {
      common_vendor.index.__f__("log", "at interfaces/InterventionRepository.js:114", "清理数据仓库缓存");
      if (this.imageLibrary && typeof this.imageLibrary.clearCache === "function") {
        this.imageLibrary.clearCache();
      }
      if (this.textLibrary && typeof this.textLibrary.clearCache === "function") {
        this.textLibrary.clearCache();
      }
      this.clearTemporaryContentCache();
      common_vendor.index.__f__("log", "at interfaces/InterventionRepository.js:129", "数据仓库缓存清理完成");
    } catch (error) {
      common_vendor.index.__f__("error", "at interfaces/InterventionRepository.js:132", "清理数据仓库缓存时发生错误:", error);
    }
  }
  /**
   * 清理临时内容缓存
   */
  clearTemporaryContentCache() {
    try {
      const tempCacheKeys = [
        "lastInterventionContent",
        "recentFoodInputs",
        "imageLoadCache",
        "textSelectionCache"
      ];
      tempCacheKeys.forEach((key) => {
        try {
          if (typeof common_vendor.index !== "undefined" && common_vendor.index.removeStorageSync) {
            common_vendor.index.removeStorageSync(key);
          }
        } catch (error) {
          common_vendor.index.__f__("warn", "at interfaces/InterventionRepository.js:155", `清理内容缓存失败: ${key}`, error);
        }
      });
    } catch (error) {
      common_vendor.index.__f__("error", "at interfaces/InterventionRepository.js:160", "清理临时内容缓存时发生错误:", error);
    }
  }
  /**
   * 深度清理所有数据
   * 包括配置和缓存
   */
  deepClean() {
    try {
      common_vendor.index.__f__("log", "at interfaces/InterventionRepository.js:170", "深度清理数据仓库");
      this.clearCache();
      this.reset();
      common_vendor.index.__f__("log", "at interfaces/InterventionRepository.js:178", "数据仓库深度清理完成");
    } catch (error) {
      common_vendor.index.__f__("error", "at interfaces/InterventionRepository.js:181", "深度清理数据仓库时发生错误:", error);
    }
  }
}
exports.InterventionRepository = InterventionRepository;
//# sourceMappingURL=../../.sourcemap/mp-weixin/interfaces/InterventionRepository.js.map
