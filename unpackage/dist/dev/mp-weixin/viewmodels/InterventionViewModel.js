"use strict";
const common_vendor = require("../common/vendor.js");
const models_InterventionState = require("../models/InterventionState.js");
const interfaces_InterventionRepository = require("../interfaces/InterventionRepository.js");
const models_FoodInput = require("../models/FoodInput.js");
class InterventionViewModel {
  constructor() {
    this.stateManager = new models_InterventionState.StateManager();
    this.repository = new interfaces_InterventionRepository.InterventionRepository();
    this.currentContent = null;
    this.currentFoodInput = null;
    this.errorMessage = "";
    this.eventListeners = {
      stateChanged: [],
      contentReady: [],
      error: [],
      userExit: []
    };
    this.initialize();
  }
  /**
   * 初始化 ViewModel
   */
  async initialize() {
    try {
      this.transitionToState(models_InterventionState.InterventionState.INPUT_READY);
    } catch (error) {
      this.handleError("初始化失败", error);
    }
  }
  /**
   * 处理用户食物输入
   * @param {string} foodName - 食物名称
   * @returns {Promise<boolean>} 处理是否成功
   */
  async handleFoodInput(foodName) {
    try {
      this.clearError();
      if (!foodName || typeof foodName !== "string") {
        this.setError("请输入您想吃的食物");
        return false;
      }
      const foodInput = new models_FoodInput.FoodInput(foodName);
      if (!this.validateFoodInput(foodInput)) {
        return false;
      }
      this.currentFoodInput = foodInput;
      await this.loadInterventionContent(foodInput);
      return true;
    } catch (error) {
      this.handleError("处理食物输入失败", error);
      return false;
    }
  }
  /**
   * 验证食物输入
   * @param {FoodInput} foodInput - 食物输入对象
   * @returns {boolean} 验证是否通过
   */
  validateFoodInput(foodInput) {
    if (!foodInput || !foodInput.isValid()) {
      this.setError("请输入您想吃的食物");
      return false;
    }
    const cleanName = foodInput.getCleanName();
    if (!cleanName || cleanName.length === 0) {
      this.setError("请输入您想吃的食物");
      return false;
    }
    if (cleanName.length > 50) {
      this.setError("食物名称过长，请输入50个字符以内");
      return false;
    }
    if (cleanName.length < 1) {
      this.setError("食物名称过短");
      return false;
    }
    const invalidChars = /[<>\"'&]/;
    if (invalidChars.test(cleanName)) {
      this.setError("食物名称包含无效字符");
      return false;
    }
    const onlyNumbers = /^\d+$/;
    if (onlyNumbers.test(cleanName)) {
      this.setError("请输入有效的食物名称");
      return false;
    }
    return true;
  }
  /**
   * 加载干预内容
   * @param {FoodInput} foodInput - 食物输入对象
   */
  async loadInterventionContent(foodInput) {
    try {
      const content = await this.repository.getInterventionContent(foodInput);
      if (!content || !content.isComplete()) {
        throw new Error("获取的干预内容不完整");
      }
      if (!content.imageResource || !content.guidanceText) {
        common_vendor.index.__f__("warn", "at viewmodels/InterventionViewModel.js:150", "干预内容缺少必要信息，使用默认内容");
        if (!content.imageResource) {
          content.imageResource = this.repository.imageLibrary.getDefaultImage();
        }
        if (!content.guidanceText) {
          content.guidanceText = this.repository.textLibrary.getDefaultText();
        }
      }
      this.currentContent = content;
      this.transitionToState(models_InterventionState.InterventionState.CONTENT_DISPLAYED);
      this.emitEvent("contentReady", content);
      common_vendor.index.__f__("log", "at viewmodels/InterventionViewModel.js:170", "干预内容加载成功:", {
        food: content.foodName,
        hasImage: !!content.imageResource,
        hasText: !!content.guidanceText
      });
    } catch (error) {
      this.handleError("加载干预内容失败", error);
      try {
        const defaultContent = await this.createDefaultContent(foodInput);
        this.currentContent = defaultContent;
        this.transitionToState(models_InterventionState.InterventionState.CONTENT_DISPLAYED);
        this.emitEvent("contentReady", defaultContent);
      } catch (defaultError) {
        common_vendor.index.__f__("error", "at viewmodels/InterventionViewModel.js:186", "创建默认内容也失败:", defaultError);
        this.transitionToState(models_InterventionState.InterventionState.INPUT_READY);
      }
    }
  }
  /**
   * 创建默认干预内容
   * @param {FoodInput} foodInput - 食物输入对象
   * @returns {Promise<InterventionContent>} 默认干预内容
   */
  async createDefaultContent(foodInput) {
    const { InterventionContent } = await "../models/InterventionContent.js";
    return new InterventionContent(
      "/static/images/default_unappetizing.jpg",
      "先缓一缓，现在不急，晚点再决定",
      foodInput ? foodInput.getCleanName() : "未知食物"
    );
  }
  /**
   * 处理快捷按钮点击
   * @param {string} foodName - 快捷按钮对应的食物名称
   * @returns {Promise<boolean>} 处理是否成功
   */
  async handleQuickSelectFood(foodName) {
    try {
      if (!foodName || typeof foodName !== "string") {
        this.setError("无效的食物选择");
        return false;
      }
      const cleanFoodName = foodName.trim();
      if (!cleanFoodName) {
        this.setError("无效的食物选择");
        return false;
      }
      return await this.handleFoodInput(cleanFoodName);
    } catch (error) {
      this.handleError("处理快捷选择失败", error);
      return false;
    }
  }
  /**
   * 获取快捷选择食物列表
   * @returns {Array<string>} 快捷选择食物列表
   */
  getQuickSelectFoods() {
    return this.repository.getQuickSelectFoods();
  }
  /**
   * 处理用户退出
   */
  handleExit() {
    try {
      common_vendor.index.__f__("log", "at viewmodels/InterventionViewModel.js:248", "用户选择退出干预");
      const exitData = {
        exitTime: Date.now(),
        foodName: this.currentFoodInput ? this.currentFoodInput.getCleanName() : null,
        stateAtExit: this.getCurrentState(),
        sessionDuration: this.calculateSessionDuration()
      };
      this.clearSessionData();
      this.emitEvent("userExit", exitData);
      common_vendor.index.__f__("log", "at viewmodels/InterventionViewModel.js:267", "退出处理完成，准备关闭应用");
    } catch (error) {
      this.handleError("退出处理失败", error);
    }
  }
  /**
   * 计算会话持续时间
   * @returns {number} 会话持续时间（毫秒）
   */
  calculateSessionDuration() {
    if (this.currentFoodInput && this.currentFoodInput.timestamp) {
      return Date.now() - this.currentFoodInput.timestamp;
    }
    return 0;
  }
  /**
   * 重置应用状态
   */
  reset() {
    try {
      common_vendor.index.__f__("log", "at viewmodels/InterventionViewModel.js:290", "重置应用状态");
      this.deepCleanSessionData();
      this.prepareForNextUse();
      this.transitionToState(models_InterventionState.InterventionState.INPUT_READY);
      common_vendor.index.__f__("log", "at viewmodels/InterventionViewModel.js:301", "应用状态重置完成，当前状态:", this.getCurrentState());
    } catch (error) {
      this.handleError("重置失败", error);
    }
  }
  /**
   * 清理会话数据
   * 清除临时输入数据、重置应用状态、准备下次使用
   */
  clearSessionData() {
    try {
      common_vendor.index.__f__("log", "at viewmodels/InterventionViewModel.js:314", "开始清理会话数据");
      this.currentContent = null;
      this.currentFoodInput = null;
      this.clearError();
      this.clearTemporaryStorage();
      if (this.stateManager) {
        this.stateManager.reset();
      }
      this.clearEventListenerData();
      common_vendor.index.__f__("log", "at viewmodels/InterventionViewModel.js:336", "会话数据清理完成");
    } catch (error) {
      common_vendor.index.__f__("error", "at viewmodels/InterventionViewModel.js:339", "清理会话数据时发生错误:", error);
    }
  }
  /**
   * 清理临时存储数据
   */
  clearTemporaryStorage() {
    try {
      const temporaryKeys = [
        "currentSession",
        "tempFoodInput",
        "lastInterventionContent",
        "sessionStartTime",
        "userInputHistory",
        "tempImageCache",
        "tempTextCache"
      ];
      temporaryKeys.forEach((key) => {
        try {
          if (typeof common_vendor.index !== "undefined" && common_vendor.index.removeStorageSync) {
            common_vendor.index.removeStorageSync(key);
            common_vendor.index.__f__("log", "at viewmodels/InterventionViewModel.js:364", `已清理存储项: ${key}`);
          }
        } catch (error) {
          common_vendor.index.__f__("warn", "at viewmodels/InterventionViewModel.js:367", `清理存储项失败: ${key}`, error);
        }
      });
    } catch (error) {
      common_vendor.index.__f__("error", "at viewmodels/InterventionViewModel.js:372", "清理临时存储时发生错误:", error);
    }
  }
  /**
   * 清理事件监听器中的临时数据
   */
  clearEventListenerData() {
    try {
      Object.keys(this.eventListeners).forEach((eventType) => {
      });
    } catch (error) {
      common_vendor.index.__f__("error", "at viewmodels/InterventionViewModel.js:388", "清理事件监听器数据时发生错误:", error);
    }
  }
  /**
   * 深度清理所有数据
   * 用于应用完全重置或退出时
   */
  deepCleanSessionData() {
    try {
      common_vendor.index.__f__("log", "at viewmodels/InterventionViewModel.js:398", "开始深度清理会话数据");
      this.clearSessionData();
      if (this.repository) {
        if (typeof this.repository.clearCache === "function") {
          this.repository.clearCache();
        }
      }
      this.removeAllEventListeners();
      this.clearAllTemporaryStorage();
      common_vendor.index.__f__("log", "at viewmodels/InterventionViewModel.js:416", "深度清理完成");
    } catch (error) {
      common_vendor.index.__f__("error", "at viewmodels/InterventionViewModel.js:419", "深度清理时发生错误:", error);
    }
  }
  /**
   * 清理所有临时存储
   */
  clearAllTemporaryStorage() {
    try {
      if (typeof common_vendor.index !== "undefined" && common_vendor.index.getStorageInfoSync) {
        const storageInfo = common_vendor.index.getStorageInfoSync();
        const allKeys = storageInfo.keys || [];
        const persistentKeys = [
          "userPreferences",
          "appVersion",
          "installTime",
          "userSettings"
        ];
        allKeys.forEach((key) => {
          if (!persistentKeys.includes(key)) {
            try {
              common_vendor.index.removeStorageSync(key);
              common_vendor.index.__f__("log", "at viewmodels/InterventionViewModel.js:446", `已清理存储项: ${key}`);
            } catch (error) {
              common_vendor.index.__f__("warn", "at viewmodels/InterventionViewModel.js:448", `清理存储项失败: ${key}`, error);
            }
          }
        });
      }
    } catch (error) {
      common_vendor.index.__f__("error", "at viewmodels/InterventionViewModel.js:455", "清理所有临时存储时发生错误:", error);
    }
  }
  /**
   * 移除所有事件监听器
   */
  removeAllEventListeners() {
    try {
      Object.keys(this.eventListeners).forEach((eventType) => {
        this.eventListeners[eventType] = [];
      });
      common_vendor.index.__f__("log", "at viewmodels/InterventionViewModel.js:467", "所有事件监听器已清理");
    } catch (error) {
      common_vendor.index.__f__("error", "at viewmodels/InterventionViewModel.js:469", "清理事件监听器时发生错误:", error);
    }
  }
  /**
   * 准备下次使用
   * 重置必要的状态，但保留配置
   */
  prepareForNextUse() {
    try {
      common_vendor.index.__f__("log", "at viewmodels/InterventionViewModel.js:479", "准备应用下次使用");
      this.clearSessionData();
      if (this.stateManager) {
        this.stateManager.reset();
      }
      this.transitionToState(models_InterventionState.InterventionState.INPUT_READY);
      this.preloadEssentialResources();
      common_vendor.index.__f__("log", "at viewmodels/InterventionViewModel.js:495", "应用已准备好下次使用，当前状态:", this.getCurrentState());
    } catch (error) {
      common_vendor.index.__f__("error", "at viewmodels/InterventionViewModel.js:498", "准备下次使用时发生错误:", error);
    }
  }
  /**
   * 预加载必要资源
   */
  preloadEssentialResources() {
    try {
      if (this.repository) {
        this.repository.getQuickSelectFoods();
      }
    } catch (error) {
      common_vendor.index.__f__("error", "at viewmodels/InterventionViewModel.js:516", "预加载资源时发生错误:", error);
    }
  }
  /**
   * 转换状态
   * @param {string} newState - 新状态
   */
  transitionToState(newState) {
    const currentState = this.stateManager.getCurrentState();
    if (currentState === newState) {
      common_vendor.index.__f__("log", "at viewmodels/InterventionViewModel.js:529", `已经处于目标状态: ${newState}`);
      return true;
    }
    const success = this.stateManager.transitionTo(newState);
    if (success) {
      this.emitEvent("stateChanged", {
        oldState: this.stateManager.stateHistory[this.stateManager.stateHistory.length - 2],
        newState
      });
    } else {
      common_vendor.index.__f__("warn", "at viewmodels/InterventionViewModel.js:540", `无效的状态转换: ${currentState} -> ${newState}`);
    }
    return success;
  }
  /**
   * 获取当前状态
   * @returns {string} 当前状态
   */
  getCurrentState() {
    return this.stateManager.getCurrentState();
  }
  /**
   * 获取当前干预内容
   * @returns {InterventionContent|null} 当前干预内容
   */
  getCurrentContent() {
    return this.currentContent;
  }
  /**
   * 获取当前食物输入
   * @returns {FoodInput|null} 当前食物输入
   */
  getCurrentFoodInput() {
    return this.currentFoodInput;
  }
  /**
   * 检查是否有错误
   * @returns {boolean} 是否有错误
   */
  hasError() {
    return !!this.errorMessage;
  }
  /**
   * 获取错误信息
   * @returns {string} 错误信息
   */
  getErrorMessage() {
    return this.errorMessage;
  }
  /**
   * 设置错误信息
   * @param {string} message - 错误信息
   */
  setError(message) {
    this.errorMessage = message;
    this.emitEvent("error", message);
  }
  /**
   * 清除错误信息
   */
  clearError() {
    this.errorMessage = "";
  }
  /**
   * 处理错误
   * @param {string} context - 错误上下文
   * @param {Error} error - 错误对象
   */
  handleError(context, error) {
    common_vendor.index.__f__("error", "at viewmodels/InterventionViewModel.js:607", `${context}:`, error);
    this.setError(error.message || "发生未知错误");
  }
  /**
   * 添加事件监听器
   * @param {string} eventType - 事件类型
   * @param {Function} listener - 监听器函数
   */
  addEventListener(eventType, listener) {
    if (this.eventListeners[eventType]) {
      this.eventListeners[eventType].push(listener);
    }
  }
  /**
   * 移除事件监听器
   * @param {string} eventType - 事件类型
   * @param {Function} listener - 监听器函数
   */
  removeEventListener(eventType, listener) {
    if (this.eventListeners[eventType]) {
      const index = this.eventListeners[eventType].indexOf(listener);
      if (index > -1) {
        this.eventListeners[eventType].splice(index, 1);
      }
    }
  }
  /**
   * 触发事件
   * @param {string} eventType - 事件类型
   * @param {*} data - 事件数据
   */
  emitEvent(eventType, data) {
    if (this.eventListeners[eventType]) {
      this.eventListeners[eventType].forEach((listener) => {
        try {
          listener(data);
        } catch (error) {
          common_vendor.index.__f__("error", "at viewmodels/InterventionViewModel.js:647", `事件监听器执行失败 (${eventType}):`, error);
        }
      });
    }
  }
  /**
   * 获取 ViewModel 状态信息（用于调试）
   * @returns {Object} 状态信息
   */
  getDebugInfo() {
    return {
      currentState: this.getCurrentState(),
      hasContent: !!this.currentContent,
      hasFoodInput: !!this.currentFoodInput,
      hasError: this.hasError(),
      errorMessage: this.errorMessage,
      quickSelectFoods: this.getQuickSelectFoods()
    };
  }
}
exports.InterventionViewModel = InterventionViewModel;
//# sourceMappingURL=../../.sourcemap/mp-weixin/viewmodels/InterventionViewModel.js.map
