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
            error: []
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

        // 检查长度限制
        if (cleanName.length > 50) {
            this.setError('食物名称过长，请输入50个字符以内');
            return false;
        }

        // 检查是否包含特殊字符（基本验证）
        const invalidChars = /[<>\"'&]/;
        if (invalidChars.test(cleanName)) {
            this.setError('食物名称包含无效字符');
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

            // 保存内容
            this.currentContent = content;

            // 转换状态到内容显示
            this.transitionToState(InterventionState.CONTENT_DISPLAYED);

            // 触发内容准备事件
            this.emitEvent('contentReady', content);

        } catch (error) {
            this.handleError('加载干预内容失败', error);
        }
    }

    /**
     * 处理快捷按钮点击
     * @param {string} foodName - 快捷按钮对应的食物名称
     * @returns {Promise<boolean>} 处理是否成功
     */
    async handleQuickSelectFood(foodName) {
        return await this.handleFoodInput(foodName);
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
            // 清理会话数据
            this.clearSessionData();

            // 转换到完成状态
            this.transitionToState(InterventionState.COMPLETED);

        } catch (error) {
            this.handleError('退出处理失败', error);
        }
    }

    /**
     * 重置应用状态
     */
    reset() {
        try {
            // 清理会话数据
            this.clearSessionData();

            // 重置状态管理器
            this.stateManager.reset();

            // 重新初始化
            this.initialize();

        } catch (error) {
            this.handleError('重置失败', error);
        }
    }

    /**
     * 清理会话数据
     */
    clearSessionData() {
        this.currentContent = null;
        this.currentFoodInput = null;
        this.clearError();
    }

    /**
     * 转换状态
     * @param {string} newState - 新状态
     */
    transitionToState(newState) {
        const success = this.stateManager.transitionTo(newState);
        if (success) {
            this.emitEvent('stateChanged', {
                oldState: this.stateManager.stateHistory[this.stateManager.stateHistory.length - 2],
                newState: newState
            });
        } else {
            console.warn(`无效的状态转换: ${this.stateManager.getCurrentState()} -> ${newState}`);
        }
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