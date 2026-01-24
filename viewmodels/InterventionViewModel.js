import { InterventionState, StateManager } from '../models/InterventionState.js';
import { InterventionRepository } from '../interfaces/InterventionRepository.js';
import { FoodInput } from '../models/FoodInput.js';

/**
 * 干预 ViewModel 类
 * 连接数据仓库和 UI 层，处理业务逻辑和状态管理
 */
export class InterventionViewModel {
    constructor() {
        // 状态管理器
        this.stateManager = new StateManager();

        // 数据仓库
        this.repository = new InterventionRepository();

        // 当前干预内容
        this.currentContent = null;

        // 当前食物输入
        this.currentFoodInput = null;

        // 错误信息
        this.errorMessage = '';

        // 事件监听器
        this.eventListeners = {
            stateChanged: [],
            contentReady: [],
            error: [],
            userExit: []
        };

        // 初始化
        this.initialize();
    }

    /**
     * 初始化 ViewModel
     */
    async initialize() {
        try {
            // 转换到输入准备状态
            this.transitionToState(InterventionState.INPUT_READY);
        } catch (error) {
            this.handleError('初始化失败', error);
        }
    }

    /**
     * 处理用户食物输入
     * @param {string} foodName - 食物名称
     * @returns {Promise<boolean>} 处理是否成功
     */
    async handleFoodInput(foodName) {
        try {
            // 清除之前的错误信息
            this.clearError();

            // 基本输入验证
            if (!foodName || typeof foodName !== 'string') {
                this.setError('请输入您想吃的食物');
                return false;
            }

            // 创建食物输入对象
            const foodInput = new FoodInput(foodName);

            // 验证输入
            if (!this.validateFoodInput(foodInput)) {
                return false;
            }

            // 保存当前输入
            this.currentFoodInput = foodInput;

            // 获取干预内容
            await this.loadInterventionContent(foodInput);

            return true;
        } catch (error) {
            this.handleError('处理食物输入失败', error);
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
            this.setError('请输入您想吃的食物');
            return false;
        }

        const cleanName = foodInput.getCleanName();

        // 检查是否为空或只包含空白字符
        if (!cleanName || cleanName.length === 0) {
            this.setError('请输入您想吃的食物');
            return false;
        }

        // 检查长度限制
        if (cleanName.length > 50) {
            this.setError('食物名称过长，请输入50个字符以内');
            return false;
        }

        // 检查最小长度
        if (cleanName.length < 1) {
            this.setError('食物名称过短');
            return false;
        }

        // 检查是否包含特殊字符（基本验证）
        const invalidChars = /[<>\"'&]/;
        if (invalidChars.test(cleanName)) {
            this.setError('食物名称包含无效字符');
            return false;
        }

        // 检查是否只包含数字
        const onlyNumbers = /^\d+$/;
        if (onlyNumbers.test(cleanName)) {
            this.setError('请输入有效的食物名称');
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
            // 获取干预内容
            const content = await this.repository.getInterventionContent(foodInput);

            if (!content || !content.isComplete()) {
                throw new Error('获取的干预内容不完整');
            }

            // 验证内容的有效性
            if (!content.imageResource || !content.guidanceText) {
                console.warn('干预内容缺少必要信息，使用默认内容');

                // 使用默认内容补充
                if (!content.imageResource) {
                    content.imageResource = this.repository.imageLibrary.getDefaultImage();
                }
                if (!content.guidanceText) {
                    content.guidanceText = this.repository.textLibrary.getDefaultText();
                }
            }

            // 保存内容
            this.currentContent = content;

            // 转换状态到内容显示
            this.transitionToState(InterventionState.CONTENT_DISPLAYED);

            // 触发内容准备事件
            this.emitEvent('contentReady', content);

            console.log('干预内容加载成功:', {
                food: content.foodName,
                hasImage: !!content.imageResource,
                hasText: !!content.guidanceText
            });

        } catch (error) {
            this.handleError('加载干预内容失败', error);

            // 尝试使用默认内容
            try {
                const defaultContent = await this.createDefaultContent(foodInput);
                this.currentContent = defaultContent;
                this.transitionToState(InterventionState.CONTENT_DISPLAYED);
                this.emitEvent('contentReady', defaultContent);
            } catch (defaultError) {
                console.error('创建默认内容也失败:', defaultError);
                // 回到输入状态
                this.transitionToState(InterventionState.INPUT_READY);
            }
        }
    }

    /**
     * 创建默认干预内容
     * @param {FoodInput} foodInput - 食物输入对象
     * @returns {Promise<InterventionContent>} 默认干预内容
     */
    async createDefaultContent(foodInput) {
        const { InterventionContent } = await import('../models/InterventionContent.js');

        return new InterventionContent(
            '/static/images/default_unappetizing.jpg',
            '先缓一缓，现在不急，晚点再决定',
            foodInput ? foodInput.getCleanName() : '未知食物'
        );
    }

    /**
     * 处理快捷按钮点击
     * @param {string} foodName - 快捷按钮对应的食物名称
     * @returns {Promise<boolean>} 处理是否成功
     */
    async handleQuickSelectFood(foodName) {
        try {
            // 验证快捷选择的食物名称
            if (!foodName || typeof foodName !== 'string') {
                this.setError('无效的食物选择');
                return false;
            }

            const cleanFoodName = foodName.trim();
            if (!cleanFoodName) {
                this.setError('无效的食物选择');
                return false;
            }

            // 调用通用的食物输入处理方法
            return await this.handleFoodInput(cleanFoodName);
        } catch (error) {
            this.handleError('处理快捷选择失败', error);
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
            console.log('用户选择退出干预');

            // 记录退出事件（用于统计，不强制用户）
            const exitData = {
                exitTime: Date.now(),
                foodName: this.currentFoodInput ? this.currentFoodInput.getCleanName() : null,
                stateAtExit: this.getCurrentState(),
                sessionDuration: this.calculateSessionDuration()
            };

            // 清理会话数据
            this.clearSessionData();

            // 不转换到完成状态，而是直接准备退出
            // 这样避免显示额外的界面或推荐

            // 触发退出事件
            this.emitEvent('userExit', exitData);

            console.log('退出处理完成，准备关闭应用');

        } catch (error) {
            this.handleError('退出处理失败', error);
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
            console.log('重置应用状态');

            // 深度清理会话数据
            this.deepCleanSessionData();

            // 准备下次使用
            this.prepareForNextUse();

            // 确保状态正确转换到输入准备状态
            this.transitionToState(InterventionState.INPUT_READY);

            console.log('应用状态重置完成，当前状态:', this.getCurrentState());

        } catch (error) {
            this.handleError('重置失败', error);
        }
    }

    /**
     * 清理会话数据
     * 清除临时输入数据、重置应用状态、准备下次使用
     */
    clearSessionData() {
        try {
            console.log('开始清理会话数据');

            // 清理当前内容
            this.currentContent = null;

            // 清理当前食物输入
            this.currentFoodInput = null;

            // 清理错误信息
            this.clearError();

            // 清理本地存储中的临时数据
            this.clearTemporaryStorage();

            // 重置状态管理器
            if (this.stateManager) {
                this.stateManager.reset();
            }

            // 清理事件监听器中的临时数据
            this.clearEventListenerData();

            console.log('会话数据清理完成');

        } catch (error) {
            console.error('清理会话数据时发生错误:', error);
        }
    }

    /**
     * 清理临时存储数据
     */
    clearTemporaryStorage() {
        try {
            // 定义需要清理的临时存储键
            const temporaryKeys = [
                'currentSession',
                'tempFoodInput',
                'lastInterventionContent',
                'sessionStartTime',
                'userInputHistory',
                'tempImageCache',
                'tempTextCache'
            ];

            // 清理每个临时存储项
            temporaryKeys.forEach(key => {
                try {
                    if (typeof uni !== 'undefined' && uni.removeStorageSync) {
                        uni.removeStorageSync(key);
                        console.log(`已清理存储项: ${key}`);
                    }
                } catch (error) {
                    console.warn(`清理存储项失败: ${key}`, error);
                }
            });

        } catch (error) {
            console.error('清理临时存储时发生错误:', error);
        }
    }

    /**
     * 清理事件监听器中的临时数据
     */
    clearEventListenerData() {
        try {
            // 清理事件监听器数组中的临时引用
            Object.keys(this.eventListeners).forEach(eventType => {
                // 保留事件监听器数组结构，但可以清理其中的临时数据
                // 这里不清理监听器本身，因为它们可能在下次使用时需要
            });

        } catch (error) {
            console.error('清理事件监听器数据时发生错误:', error);
        }
    }

    /**
     * 深度清理所有数据
     * 用于应用完全重置或退出时
     */
    deepCleanSessionData() {
        try {
            console.log('开始深度清理会话数据');

            // 执行标准清理
            this.clearSessionData();

            // 清理数据仓库缓存
            if (this.repository) {
                if (typeof this.repository.clearCache === 'function') {
                    this.repository.clearCache();
                }
            }

            // 清理所有事件监听器
            this.removeAllEventListeners();

            // 清理更多的存储项
            this.clearAllTemporaryStorage();

            console.log('深度清理完成');

        } catch (error) {
            console.error('深度清理时发生错误:', error);
        }
    }

    /**
     * 清理所有临时存储
     */
    clearAllTemporaryStorage() {
        try {
            // 获取所有存储键
            if (typeof uni !== 'undefined' && uni.getStorageInfoSync) {
                const storageInfo = uni.getStorageInfoSync();
                const allKeys = storageInfo.keys || [];

                // 定义需要保留的持久化数据键
                const persistentKeys = [
                    'userPreferences',
                    'appVersion',
                    'installTime',
                    'userSettings'
                ];

                // 清理所有非持久化数据
                allKeys.forEach(key => {
                    if (!persistentKeys.includes(key)) {
                        try {
                            uni.removeStorageSync(key);
                            console.log(`已清理存储项: ${key}`);
                        } catch (error) {
                            console.warn(`清理存储项失败: ${key}`, error);
                        }
                    }
                });
            }

        } catch (error) {
            console.error('清理所有临时存储时发生错误:', error);
        }
    }

    /**
     * 移除所有事件监听器
     */
    removeAllEventListeners() {
        try {
            Object.keys(this.eventListeners).forEach(eventType => {
                this.eventListeners[eventType] = [];
            });
            console.log('所有事件监听器已清理');
        } catch (error) {
            console.error('清理事件监听器时发生错误:', error);
        }
    }

    /**
     * 准备下次使用
     * 重置必要的状态，但保留配置
     */
    prepareForNextUse() {
        try {
            console.log('准备应用下次使用');

            // 清理会话数据
            this.clearSessionData();

            // 重新初始化状态管理器
            if (this.stateManager) {
                this.stateManager.reset();
            }

            // 重置到初始状态
            this.transitionToState(InterventionState.INPUT_READY);

            // 预加载必要资源（如果需要）
            this.preloadEssentialResources();

            console.log('应用已准备好下次使用，当前状态:', this.getCurrentState());

        } catch (error) {
            console.error('准备下次使用时发生错误:', error);
        }
    }

    /**
     * 预加载必要资源
     */
    preloadEssentialResources() {
        try {
            // 这里可以预加载一些关键资源
            // 比如默认图片、常用文案等

            // 预加载快捷选择食物列表
            if (this.repository) {
                this.repository.getQuickSelectFoods();
            }

        } catch (error) {
            console.error('预加载资源时发生错误:', error);
        }
    }

    /**
     * 转换状态
     * @param {string} newState - 新状态
     */
    transitionToState(newState) {
        const currentState = this.stateManager.getCurrentState();

        // 如果已经是目标状态，则不需要转换
        if (currentState === newState) {
            console.log(`已经处于目标状态: ${newState}`);
            return true;
        }

        const success = this.stateManager.transitionTo(newState);
        if (success) {
            this.emitEvent('stateChanged', {
                oldState: this.stateManager.stateHistory[this.stateManager.stateHistory.length - 2],
                newState: newState
            });
        } else {
            console.warn(`无效的状态转换: ${currentState} -> ${newState}`);
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
        this.emitEvent('error', message);
    }

    /**
     * 清除错误信息
     */
    clearError() {
        this.errorMessage = '';
    }

    /**
     * 处理错误
     * @param {string} context - 错误上下文
     * @param {Error} error - 错误对象
     */
    handleError(context, error) {
        console.error(`${context}:`, error);
        this.setError(error.message || '发生未知错误');
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
            this.eventListeners[eventType].forEach(listener => {
                try {
                    listener(data);
                } catch (error) {
                    console.error(`事件监听器执行失败 (${eventType}):`, error);
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