/**
 * 应用状态枚举
 * 定义应用的各种状态
 */
export const InterventionState = {
    // 加载中状态
    LOADING: 'loading',

    // 输入准备状态
    INPUT_READY: 'inputReady',

    // 内容显示状态
    CONTENT_DISPLAYED: 'contentDisplayed',

    // 完成状态
    COMPLETED: 'completed'
};

/**
 * 状态管理器类
 * 用于管理应用状态转换
 */
export class StateManager {
    constructor() {
        this.currentState = InterventionState.LOADING;
        this.stateHistory = [InterventionState.LOADING];
    }

    /**
     * 转换到新状态
     * @param {string} newState - 新状态
     * @returns {boolean} 转换是否成功
     */
    transitionTo(newState) {
        if (this.isValidTransition(this.currentState, newState)) {
            this.stateHistory.push(newState);
            this.currentState = newState;
            return true;
        }
        return false;
    }

    /**
     * 获取当前状态
     * @returns {string} 当前状态
     */
    getCurrentState() {
        return this.currentState;
    }

    /**
     * 验证状态转换是否有效
     * @param {string} fromState - 源状态
     * @param {string} toState - 目标状态
     * @returns {boolean} 转换是否有效
     */
    isValidTransition(fromState, toState) {
        const validTransitions = {
            [InterventionState.LOADING]: [InterventionState.INPUT_READY],
            [InterventionState.INPUT_READY]: [InterventionState.CONTENT_DISPLAYED, InterventionState.COMPLETED],
            [InterventionState.CONTENT_DISPLAYED]: [InterventionState.COMPLETED, InterventionState.INPUT_READY],
            [InterventionState.COMPLETED]: [InterventionState.INPUT_READY]
        };

        return validTransitions[fromState] && validTransitions[fromState].includes(toState);
    }

    /**
     * 重置状态管理器
     */
    reset() {
        this.currentState = InterventionState.LOADING;
        this.stateHistory = [InterventionState.LOADING];
    }
}