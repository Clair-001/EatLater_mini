/**
 * Jest 测试环境设置文件
 * 在所有测试运行前执行的配置
 */

// 全局测试配置
global.console = {
    ...console,
    // 在测试中静默某些日志输出
    log: jest.fn(),
    debug: jest.fn(),
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn()
};

// 模拟微信小程序环境
global.wx = {
    // 模拟微信小程序 API
    getSystemInfo: jest.fn(),
    showToast: jest.fn(),
    hideToast: jest.fn(),
    showLoading: jest.fn(),
    hideLoading: jest.fn(),
    navigateTo: jest.fn(),
    navigateBack: jest.fn(),
    setStorageSync: jest.fn(),
    getStorageSync: jest.fn(),
    removeStorageSync: jest.fn(),
    clearStorageSync: jest.fn()
};

// 设置测试超时
jest.setTimeout(10000);

// 测试前的全局设置
beforeEach(() => {
    // 清理模拟函数的调用记录
    jest.clearAllMocks();
});

// 测试后的全局清理
afterEach(() => {
    // 清理任何可能的定时器
    jest.clearAllTimers();
});