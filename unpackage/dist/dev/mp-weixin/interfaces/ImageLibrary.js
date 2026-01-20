"use strict";
const common_vendor = require("../common/vendor.js");
class ImageLibrary {
  constructor() {
    this.imageMapping = /* @__PURE__ */ new Map();
    this.defaultImagePath = "/static/images/default_unappetizing.jpg";
  }
  /**
   * 根据食物名称获取对应图片
   * @param {string} foodName - 食物名称
   * @returns {string} 图片路径
   */
  getImageForFood(foodName) {
    if (!foodName || typeof foodName !== "string") {
      return this.getDefaultImage();
    }
    const cleanName = foodName.trim().toLowerCase();
    for (const [keywords, imagePath] of this.imageMapping) {
      if (keywords.some((keyword) => cleanName.includes(keyword.toLowerCase()))) {
        return imagePath;
      }
    }
    return this.getDefaultImage();
  }
  /**
   * 获取默认图片
   * @returns {string} 默认图片路径
   */
  getDefaultImage() {
    return this.defaultImagePath;
  }
  /**
   * 检查指定食物是否有对应图片
   * @param {string} foodName - 食物名称
   * @returns {boolean} 是否有对应图片
   */
  isImageAvailable(foodName) {
    if (!foodName || typeof foodName !== "string") {
      return false;
    }
    const cleanName = foodName.trim().toLowerCase();
    for (const [keywords] of this.imageMapping) {
      if (keywords.some((keyword) => cleanName.includes(keyword.toLowerCase()))) {
        return true;
      }
    }
    return false;
  }
  /**
   * 添加图片映射
   * @param {Array<string>} keywords - 关键词数组
   * @param {string} imagePath - 图片路径
   */
  addImageMapping(keywords, imagePath) {
    this.imageMapping.set(keywords, imagePath);
  }
  /**
   * 初始化默认图片映射
   */
  initializeDefaultMappings() {
    this.addImageMapping(
      ["披萨", "pizza", "比萨"],
      "/static/images/pizza_unappetizing.jpg"
    );
    this.addImageMapping(
      ["炸鸡", "鸡腿", "肯德基", "麦当劳", "kfc"],
      "/static/images/chicken_unappetizing.jpg"
    );
    this.addImageMapping(
      ["奶茶", "珍珠奶茶", "茶饮"],
      "/static/images/milktea_unappetizing.jpg"
    );
    this.addImageMapping(
      ["蛋糕", "cake", "甜品", "甜点"],
      "/static/images/cake_unappetizing.jpg"
    );
    this.addImageMapping(
      ["薯条", "薯片", "炸薯条"],
      "/static/images/fries_unappetizing.jpg"
    );
  }
  /**
   * 清理缓存
   * 清理可能存在的临时缓存数据
   */
  clearCache() {
    try {
      common_vendor.index.__f__("log", "at interfaces/ImageLibrary.js:111", "清理图片库缓存");
      const cacheKeys = [
        "imageLoadCache",
        "lastSelectedImage",
        "imageSelectionHistory",
        "recentImages"
      ];
      cacheKeys.forEach((key) => {
        try {
          if (typeof common_vendor.index !== "undefined" && common_vendor.index.removeStorageSync) {
            common_vendor.index.removeStorageSync(key);
          }
        } catch (error) {
          common_vendor.index.__f__("warn", "at interfaces/ImageLibrary.js:127", `清理图片缓存失败: ${key}`, error);
        }
      });
      common_vendor.index.__f__("log", "at interfaces/ImageLibrary.js:131", "图片库缓存清理完成");
    } catch (error) {
      common_vendor.index.__f__("error", "at interfaces/ImageLibrary.js:134", "清理图片库缓存时发生错误:", error);
    }
  }
  /**
   * 重置图片映射
   */
  resetMappings() {
    this.imageMapping.clear();
    this.initializeDefaultMappings();
  }
}
exports.ImageLibrary = ImageLibrary;
//# sourceMappingURL=../../.sourcemap/mp-weixin/interfaces/ImageLibrary.js.map
