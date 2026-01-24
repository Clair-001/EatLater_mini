"use strict";
Object.defineProperty(exports, Symbol.toStringTag, { value: "Module" });
const common_vendor = require("./common/vendor.js");
if (!Math) {
  "./pages/index/index.js";
}
const _sfc_main = {
  globalData: {
    // 全局状态管理
    userState: null,
    lastActiveTime: null,
    isFirstLaunch: true
  },
  onLaunch: function() {
    common_vendor.index.__f__("log", "at App.vue:11", "EatLater App Launch");
    this.initializeApp();
    this.globalData.lastActiveTime = Date.now();
    this.globalData.isFirstLaunch = true;
  },
  onShow: function() {
    common_vendor.index.__f__("log", "at App.vue:22", "EatLater App Show");
    this.handleAppResume();
    this.globalData.lastActiveTime = Date.now();
  },
  onHide: function() {
    common_vendor.index.__f__("log", "at App.vue:32", "EatLater App Hide");
    this.handleAppBackground();
  },
  onError: function(error) {
    common_vendor.index.__f__("error", "at App.vue:39", "EatLater App Error:", error);
    this.handleAppError(error);
  },
  methods: {
    // 初始化应用
    initializeApp() {
      try {
        this.preloadResources();
        this.initializeStorage();
        common_vendor.index.__f__("log", "at App.vue:55", "EatLater 应用初始化完成");
      } catch (error) {
        common_vendor.index.__f__("error", "at App.vue:57", "应用初始化失败:", error);
      }
    },
    // 处理应用恢复
    handleAppResume() {
      try {
        const currentTime = Date.now();
        const timeDiff = currentTime - (this.globalData.lastActiveTime || 0);
        if (timeDiff > 5 * 60 * 1e3) {
          this.clearUserState();
          common_vendor.index.__f__("log", "at App.vue:70", "长时间后台，已清理用户状态");
        }
        this.quickRestoreToMain();
        this.globalData.isFirstLaunch = false;
      } catch (error) {
        common_vendor.index.__f__("error", "at App.vue:78", "应用恢复处理失败:", error);
      }
    },
    // 处理应用进入后台
    handleAppBackground() {
      try {
        this.saveUserState();
        this.globalData.lastActiveTime = Date.now();
        common_vendor.index.__f__("log", "at App.vue:91", "应用已进入后台，状态已保存");
      } catch (error) {
        common_vendor.index.__f__("error", "at App.vue:93", "后台处理失败:", error);
      }
    },
    // 处理应用错误
    handleAppError(error) {
      try {
        this.clearUserState();
        this.initializeApp();
        common_vendor.index.reLaunch({
          url: "/pages/index/index"
        });
        common_vendor.index.__f__("log", "at App.vue:111", "错误恢复完成，已重新启动应用");
      } catch (recoveryError) {
        common_vendor.index.__f__("error", "at App.vue:113", "错误恢复失败:", recoveryError);
      }
    },
    // 预加载资源
    preloadResources() {
      try {
        const defaultImages = [
          "https://ob-assets-open.oss-cn-shanghai.aliyuncs.com/img/202601211107127.jpg",
          "https://ob-assets-open.oss-cn-shanghai.aliyuncs.com/img/202601211107400.jpg",
          "https://ob-assets-open.oss-cn-shanghai.aliyuncs.com/img/202601211107624.jpg",
          "https://ob-assets-open.oss-cn-shanghai.aliyuncs.com/img/202601211102004.jpg",
          "https://ob-assets-open.oss-cn-shanghai.aliyuncs.com/img/202601211107751.jpg",
          "https://ob-assets-open.oss-cn-shanghai.aliyuncs.com/img/202601211107542.jpg"
        ];
        defaultImages.forEach((imagePath) => {
          common_vendor.index.getImageInfo({
            src: imagePath,
            success: () => {
              common_vendor.index.__f__("log", "at App.vue:135", `预加载图片成功: ${imagePath}`);
            },
            fail: (error) => {
              common_vendor.index.__f__("warn", "at App.vue:138", `预加载图片失败: ${imagePath}`, error);
            }
          });
        });
      } catch (error) {
        common_vendor.index.__f__("error", "at App.vue:143", "资源预加载失败:", error);
      }
    },
    // 初始化本地存储
    initializeStorage() {
      try {
        const requiredKeys = ["userPreferences", "appVersion"];
        requiredKeys.forEach((key) => {
          const value = common_vendor.index.getStorageSync(key);
          if (!value) {
            switch (key) {
              case "userPreferences":
                common_vendor.index.setStorageSync(key, {
                  quickSelectFoods: ["披萨", "炸鸡", "奶茶", "蛋糕", "薯条"],
                  displayDuration: 5e3,
                  enableVibration: false
                });
                break;
              case "appVersion":
                common_vendor.index.setStorageSync(key, "1.0.0");
                break;
            }
          }
        });
      } catch (error) {
        common_vendor.index.__f__("error", "at App.vue:171", "存储初始化失败:", error);
      }
    },
    // 快速恢复到主界面
    quickRestoreToMain() {
      try {
        const pages = getCurrentPages();
        const currentPage = pages[pages.length - 1];
        if (currentPage && currentPage.route !== "pages/index/index") {
          common_vendor.index.reLaunch({
            url: "/pages/index/index",
            success: () => {
              common_vendor.index.__f__("log", "at App.vue:187", "快速恢复到主界面成功");
            },
            fail: (error) => {
              common_vendor.index.__f__("error", "at App.vue:190", "快速恢复到主界面失败:", error);
            }
          });
        }
      } catch (error) {
        common_vendor.index.__f__("error", "at App.vue:195", "快速恢复处理失败:", error);
      }
    },
    // 保存用户状态
    saveUserState() {
      try {
        if (this.globalData.userState) {
          common_vendor.index.setStorageSync("lastUserState", {
            ...this.globalData.userState,
            timestamp: Date.now()
          });
        }
      } catch (error) {
        common_vendor.index.__f__("error", "at App.vue:209", "保存用户状态失败:", error);
      }
    },
    // 清理用户状态
    clearUserState() {
      try {
        this.globalData.userState = null;
        const tempKeys = ["lastUserState", "currentSession", "tempFoodInput"];
        tempKeys.forEach((key) => {
          try {
            common_vendor.index.removeStorageSync(key);
          } catch (error) {
            common_vendor.index.__f__("warn", "at App.vue:224", `清理存储项失败: ${key}`, error);
          }
        });
        common_vendor.index.__f__("log", "at App.vue:228", "用户状态已清理");
      } catch (error) {
        common_vendor.index.__f__("error", "at App.vue:230", "清理用户状态失败:", error);
      }
    },
    /**
     * 处理应用退出
     * 提供给页面调用的退出处理方法
     */
    handleAppExit() {
      try {
        common_vendor.index.__f__("log", "at App.vue:240", "处理应用退出");
        this.clearUserState();
        this.globalData.userState = null;
        this.globalData.lastActiveTime = Date.now();
        if (typeof common_vendor.wx$1 !== "undefined" && common_vendor.wx$1.exitMiniProgram) {
          common_vendor.wx$1.exitMiniProgram({
            success: () => {
              common_vendor.index.__f__("log", "at App.vue:253", "小程序退出成功");
            },
            fail: (error) => {
              common_vendor.index.__f__("warn", "at App.vue:256", "小程序退出失败:", error);
            }
          });
        }
      } catch (error) {
        common_vendor.index.__f__("error", "at App.vue:262", "应用退出处理失败:", error);
      }
    },
    // 获取全局状态
    getGlobalState() {
      return this.globalData;
    },
    // 设置全局状态
    setGlobalState(key, value) {
      if (this.globalData.hasOwnProperty(key)) {
        this.globalData[key] = value;
      }
    }
  }
};
function createApp() {
  const app = common_vendor.createSSRApp(_sfc_main);
  return {
    app
  };
}
createApp().app.mount("#app");
exports.createApp = createApp;
//# sourceMappingURL=../.sourcemap/mp-weixin/app.js.map
