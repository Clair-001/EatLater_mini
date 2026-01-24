"use strict";
const common_vendor = require("../../common/vendor.js");
const viewmodels_InterventionViewModel = require("../../viewmodels/InterventionViewModel.js");
const models_InterventionState = require("../../models/InterventionState.js");
const _sfc_main = {
  data() {
    return {
      // ViewModel 实例
      viewModel: null,
      // 界面状态
      currentState: models_InterventionState.InterventionState.LOADING,
      // 用户输入
      foodInputText: "",
      // 快捷选择食物列表
      quickSelectFoods: [],
      // 当前干预内容
      currentContent: null,
      // 错误信息
      errorMessage: "",
      // 手势相关
      touchStartY: 0,
      touchStartTime: 0
    };
  },
  onLoad() {
    this.initializeViewModel();
  },
  onUnload() {
    common_vendor.index.__f__("log", "at pages/index/index.vue:139", "页面卸载，开始清理");
    this.cleanupViewModel();
    this.clearLocalTemporaryData();
  },
  methods: {
    /**
     * 初始化 ViewModel
     */
    async initializeViewModel() {
      try {
        this.currentState = models_InterventionState.InterventionState.LOADING;
        this.viewModel = new viewmodels_InterventionViewModel.InterventionViewModel();
        this.setupEventListeners();
        this.quickSelectFoods = this.viewModel.getQuickSelectFoods();
        await this.$nextTick();
        this.currentState = models_InterventionState.InterventionState.INPUT_READY;
      } catch (error) {
        common_vendor.index.__f__("error", "at pages/index/index.vue:169", "初始化 ViewModel 失败:", error);
        this.errorMessage = "应用初始化失败，请重试";
        this.currentState = models_InterventionState.InterventionState.INPUT_READY;
      }
    },
    /**
     * 设置事件监听器
     */
    setupEventListeners() {
      if (!this.viewModel)
        return;
      this.viewModel.addEventListener("stateChanged", (data) => {
        this.currentState = data.newState;
      });
      this.viewModel.addEventListener("contentReady", (content) => {
        this.currentContent = content;
      });
      this.viewModel.addEventListener("error", (message) => {
        this.errorMessage = message;
      });
    },
    /**
     * 清理 ViewModel
     */
    cleanupViewModel() {
      try {
        if (this.viewModel) {
          common_vendor.index.__f__("log", "at pages/index/index.vue:203", "清理 ViewModel");
          this.viewModel.deepCleanSessionData();
          this.viewModel.removeAllEventListeners();
          this.viewModel = null;
        }
        common_vendor.index.__f__("log", "at pages/index/index.vue:215", "ViewModel 清理完成");
      } catch (error) {
        common_vendor.index.__f__("error", "at pages/index/index.vue:217", "清理 ViewModel 时发生错误:", error);
      }
    },
    /**
     * 处理输入确认
     */
    async handleInputConfirm() {
      if (!this.viewModel) {
        this.errorMessage = "系统未初始化，请重试";
        return;
      }
      this.clearError();
      const foodName = this.foodInputText.trim();
      if (!foodName) {
        this.errorMessage = "请输入您想吃的食物";
        return;
      }
      if (foodName.length > 50) {
        this.errorMessage = "食物名称过长，请输入50个字符以内";
        return;
      }
      const invalidChars = /[<>\"'&]/;
      if (invalidChars.test(foodName)) {
        this.errorMessage = "食物名称包含无效字符";
        return;
      }
      try {
        this.currentState = "loading";
        const success = await this.viewModel.handleFoodInput(foodName);
        if (success) {
          this.foodInputText = "";
        } else {
          this.currentState = "inputReady";
        }
      } catch (error) {
        common_vendor.index.__f__("error", "at pages/index/index.vue:268", "处理食物输入时发生错误:", error);
        this.errorMessage = "处理输入时发生错误，请重试";
        this.currentState = "inputReady";
      }
    },
    /**
     * 处理快捷选择
     */
    async handleQuickSelect(foodName) {
      if (!this.viewModel) {
        this.errorMessage = "系统未初始化，请重试";
        return;
      }
      this.clearError();
      if (!foodName || typeof foodName !== "string") {
        this.errorMessage = "无效的食物选择";
        return;
      }
      try {
        this.currentState = "loading";
        this.foodInputText = foodName;
        const success = await this.viewModel.handleQuickSelectFood(foodName);
        if (success) {
          this.foodInputText = "";
        } else {
          this.currentState = "inputReady";
        }
      } catch (error) {
        common_vendor.index.__f__("error", "at pages/index/index.vue:310", "处理快捷选择时发生错误:", error);
        this.errorMessage = "处理选择时发生错误，请重试";
        this.currentState = "inputReady";
      }
    },
    /**
     * 处理退出
     */
    handleExit() {
      common_vendor.index.__f__("log", "at pages/index/index.vue:320", "用户点击退出按钮");
      common_vendor.index.showToast({
        title: "正在退出...",
        icon: "none",
        duration: 1e3
      });
      if (!this.viewModel) {
        common_vendor.index.__f__("error", "at pages/index/index.vue:330", "ViewModel 未初始化");
        return;
      }
      try {
        this.viewModel.handleExit();
        this.foodInputText = "";
        this.currentContent = null;
        this.clearError();
        this.exitApplication();
      } catch (error) {
        common_vendor.index.__f__("error", "at pages/index/index.vue:347", "处理退出时发生错误:", error);
        this.errorMessage = "退出时发生错误";
      }
    },
    /**
     * 退出应用程序
     * 实现自然退出功能，直接关闭小程序
     */
    exitApplication() {
      try {
        common_vendor.index.showToast({
          title: "感谢使用",
          icon: "none",
          duration: 1e3,
          mask: false
        });
        setTimeout(() => {
          const app = getApp();
          if (app && app.handleAppExit) {
            app.handleAppExit();
          } else {
            if (typeof common_vendor.wx$1 !== "undefined" && common_vendor.wx$1.exitMiniProgram) {
              common_vendor.wx$1.exitMiniProgram({
                success: () => {
                  common_vendor.index.__f__("log", "at pages/index/index.vue:377", "小程序已关闭");
                },
                fail: (error) => {
                  common_vendor.index.__f__("warn", "at pages/index/index.vue:380", "关闭小程序失败，使用备用方案:", error);
                  this.fallbackExit();
                }
              });
            } else {
              this.fallbackExit();
            }
          }
        }, 1e3);
      } catch (error) {
        common_vendor.index.__f__("error", "at pages/index/index.vue:391", "退出应用时发生错误:", error);
        this.fallbackExit();
      }
    },
    /**
     * 备用退出方案
     * 当无法直接关闭小程序时的处理
     */
    fallbackExit() {
      try {
        this.cleanupAllState();
        common_vendor.index.reLaunch({
          url: "/pages/index/index",
          success: () => {
            setTimeout(() => {
              common_vendor.index.showModal({
                title: "感谢使用",
                content: "您可以关闭小程序了",
                showCancel: false,
                confirmText: "知道了"
              });
            }, 500);
          }
        });
      } catch (error) {
        common_vendor.index.__f__("error", "at pages/index/index.vue:422", "备用退出方案失败:", error);
      }
    },
    /**
     * 清理所有状态
     */
    cleanupAllState() {
      try {
        this.foodInputText = "";
        this.currentContent = null;
        this.clearError();
        this.touchStartY = 0;
        this.touchStartTime = 0;
        if (this.viewModel) {
          this.viewModel.deepCleanSessionData();
        }
        this.clearLocalTemporaryData();
        const app = getApp();
        if (app && app.clearUserState) {
          app.clearUserState();
        }
        common_vendor.index.__f__("log", "at pages/index/index.vue:454", "所有状态已清理");
      } catch (error) {
        common_vendor.index.__f__("error", "at pages/index/index.vue:456", "清理状态时发生错误:", error);
      }
    },
    /**
     * 清理本地临时数据
     */
    clearLocalTemporaryData() {
      try {
        const tempKeys = [
          "pageState",
          "tempInput",
          "lastError",
          "gestureData",
          "uiCache"
        ];
        tempKeys.forEach((key) => {
          try {
            common_vendor.index.removeStorageSync(key);
          } catch (error) {
            common_vendor.index.__f__("warn", "at pages/index/index.vue:478", `清理页面临时数据失败: ${key}`, error);
          }
        });
      } catch (error) {
        common_vendor.index.__f__("error", "at pages/index/index.vue:483", "清理本地临时数据时发生错误:", error);
      }
    },
    /**
     * 处理重新开始
     */
    handleRestart() {
      common_vendor.index.__f__("log", "at pages/index/index.vue:491", "用户点击重新选择按钮");
      common_vendor.index.showToast({
        title: "重新开始",
        icon: "none",
        duration: 1e3
      });
      if (!this.viewModel) {
        common_vendor.index.__f__("error", "at pages/index/index.vue:501", "ViewModel 未初始化");
        return;
      }
      try {
        this.foodInputText = "";
        this.currentContent = null;
        this.clearError();
        this.viewModel.reset();
        this.currentState = models_InterventionState.InterventionState.INPUT_READY;
        common_vendor.index.__f__("log", "at pages/index/index.vue:517", "重新开始完成，当前状态:", this.currentState);
      } catch (error) {
        common_vendor.index.__f__("error", "at pages/index/index.vue:520", "处理重新开始时发生错误:", error);
        this.errorMessage = "重新开始时发生错误";
        this.currentState = models_InterventionState.InterventionState.INPUT_READY;
      }
    },
    /**
     * 处理输入失焦
     */
    handleInputBlur() {
    },
    /**
     * 清除错误信息
     */
    clearError() {
      this.errorMessage = "";
      if (this.viewModel) {
        this.viewModel.clearError();
      }
    },
    /**
     * 处理图片加载错误
     */
    handleImageError(error) {
      common_vendor.index.__f__("error", "at pages/index/index.vue:550", "图片加载失败:", error);
      if (this.viewModel && this.currentContent) {
        const defaultImage = "/static/images/default_unappetizing.jpg";
        this.currentContent.imageResource = defaultImage;
      }
    },
    /**
     * 处理图片加载成功
     */
    handleImageLoad() {
      common_vendor.index.__f__("log", "at pages/index/index.vue:570", "图片加载成功");
    },
    /**
     * 处理触摸开始
     */
    handleTouchStart(event) {
      const target = event.target;
      if (target && (target.classList.contains("exit-button") || target.classList.contains("restart-button"))) {
        common_vendor.index.__f__("log", "at pages/index/index.vue:580", "触摸在按钮区域，跳过手势处理");
        return;
      }
      if (event.touches && event.touches.length > 0) {
        this.touchStartY = event.touches[0].clientY;
        this.touchStartTime = Date.now();
      }
    },
    /**
     * 处理触摸结束
     */
    handleTouchEnd(event) {
      const target = event.target;
      if (target && (target.classList.contains("exit-button") || target.classList.contains("restart-button"))) {
        common_vendor.index.__f__("log", "at pages/index/index.vue:597", "触摸结束在按钮区域，跳过手势处理");
        return;
      }
      if (event.changedTouches && event.changedTouches.length > 0) {
        const touchEndY = event.changedTouches[0].clientY;
        const touchEndTime = Date.now();
        const deltaY = touchEndY - this.touchStartY;
        const deltaTime = touchEndTime - this.touchStartTime;
        if (deltaY > 100 && deltaTime < 500) {
          common_vendor.index.__f__("log", "at pages/index/index.vue:612", "检测到向下滑动手势，触发退出");
          this.handleExit();
        }
      }
    }
  }
};
function _sfc_render(_ctx, _cache, $props, $setup, $data, $options) {
  return common_vendor.e({
    a: $data.currentState === "loading"
  }, $data.currentState === "loading" ? {} : $data.currentState === "inputReady" ? common_vendor.e({
    c: common_vendor.o((...args) => $options.handleInputConfirm && $options.handleInputConfirm(...args)),
    d: common_vendor.o([($event) => $data.foodInputText = $event.detail.value, (...args) => $options.clearError && $options.clearError(...args)]),
    e: common_vendor.o((...args) => $options.handleInputBlur && $options.handleInputBlur(...args)),
    f: $data.foodInputText,
    g: $data.errorMessage
  }, $data.errorMessage ? {
    h: common_vendor.t($data.errorMessage)
  } : {}, {
    i: common_vendor.f($data.quickSelectFoods, (food, k0, i0) => {
      return {
        a: common_vendor.t(food),
        b: food,
        c: common_vendor.o(($event) => $options.handleQuickSelect(food), food)
      };
    })
  }) : $data.currentState === "contentDisplayed" ? common_vendor.e({
    k: $data.currentContent && $data.currentContent.imageResource
  }, $data.currentContent && $data.currentContent.imageResource ? {
    l: $data.currentContent.imageResource,
    m: common_vendor.o((...args) => $options.handleImageError && $options.handleImageError(...args)),
    n: common_vendor.o((...args) => $options.handleImageLoad && $options.handleImageLoad(...args))
  } : {}, {
    o: $data.currentContent && $data.currentContent.guidanceText
  }, $data.currentContent && $data.currentContent.guidanceText ? {
    p: common_vendor.t($data.currentContent.guidanceText)
  } : {}, {
    q: common_vendor.o((...args) => $options.handleExit && $options.handleExit(...args)),
    r: common_vendor.o((...args) => $options.handleExit && $options.handleExit(...args)),
    s: common_vendor.o((...args) => $options.handleRestart && $options.handleRestart(...args)),
    t: common_vendor.o((...args) => $options.handleRestart && $options.handleRestart(...args)),
    v: common_vendor.o((...args) => $options.handleTouchStart && $options.handleTouchStart(...args)),
    w: common_vendor.o((...args) => $options.handleTouchEnd && $options.handleTouchEnd(...args))
  }) : $data.currentState === "completed" ? {
    y: common_vendor.o((...args) => $options.handleRestart && $options.handleRestart(...args))
  } : {}, {
    b: $data.currentState === "inputReady",
    j: $data.currentState === "contentDisplayed",
    x: $data.currentState === "completed"
  });
}
const MiniProgramPage = /* @__PURE__ */ common_vendor._export_sfc(_sfc_main, [["render", _sfc_render]]);
wx.createPage(MiniProgramPage);
//# sourceMappingURL=../../../.sourcemap/mp-weixin/pages/index/index.js.map
