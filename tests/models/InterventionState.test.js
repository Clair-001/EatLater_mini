import { InterventionState, StateManager } from '../../models/InterventionState.js';

describe('InterventionState 状态管理测试', () => {
    describe('InterventionState 枚举', () => {
        test('应该定义所有必需的状态', () => {
            expect(InterventionState.LOADING).toBe('loading');
            expect(InterventionState.INPUT_READY).toBe('inputReady');
            expect(InterventionState.CONTENT_DISPLAYED).toBe('contentDisplayed');
            expect(InterventionState.COMPLETED).toBe('completed');
        });
    });

    describe('StateManager 类', () => {
        let stateManager;

        beforeEach(() => {
            stateManager = new StateManager();
        });

        describe('构造函数', () => {
            test('应该初始化为 LOADING 状态', () => {
                expect(stateManager.getCurrentState()).toBe(InterventionState.LOADING);
                expect(stateManager.stateHistory).toEqual([InterventionState.LOADING]);
            });
        });

        describe('状态转换', () => {
            test('应该允许从 LOADING 转换到 INPUT_READY', () => {
                const result = stateManager.transitionTo(InterventionState.INPUT_READY);

                expect(result).toBe(true);
                expect(stateManager.getCurrentState()).toBe(InterventionState.INPUT_READY);
            });

            test('应该允许从 INPUT_READY 转换到 CONTENT_DISPLAYED', () => {
                stateManager.transitionTo(InterventionState.INPUT_READY);
                const result = stateManager.transitionTo(InterventionState.CONTENT_DISPLAYED);

                expect(result).toBe(true);
                expect(stateManager.getCurrentState()).toBe(InterventionState.CONTENT_DISPLAYED);
            });

            test('应该允许从 INPUT_READY 转换到 COMPLETED', () => {
                stateManager.transitionTo(InterventionState.INPUT_READY);
                const result = stateManager.transitionTo(InterventionState.COMPLETED);

                expect(result).toBe(true);
                expect(stateManager.getCurrentState()).toBe(InterventionState.COMPLETED);
            });

            test('应该允许从 CONTENT_DISPLAYED 转换到 COMPLETED', () => {
                stateManager.transitionTo(InterventionState.INPUT_READY);
                stateManager.transitionTo(InterventionState.CONTENT_DISPLAYED);
                const result = stateManager.transitionTo(InterventionState.COMPLETED);

                expect(result).toBe(true);
                expect(stateManager.getCurrentState()).toBe(InterventionState.COMPLETED);
            });

            test('应该允许从 CONTENT_DISPLAYED 转换回 INPUT_READY', () => {
                stateManager.transitionTo(InterventionState.INPUT_READY);
                stateManager.transitionTo(InterventionState.CONTENT_DISPLAYED);
                const result = stateManager.transitionTo(InterventionState.INPUT_READY);

                expect(result).toBe(true);
                expect(stateManager.getCurrentState()).toBe(InterventionState.INPUT_READY);
            });

            test('应该允许从 COMPLETED 转换回 INPUT_READY', () => {
                stateManager.transitionTo(InterventionState.INPUT_READY);
                stateManager.transitionTo(InterventionState.COMPLETED);
                const result = stateManager.transitionTo(InterventionState.INPUT_READY);

                expect(result).toBe(true);
                expect(stateManager.getCurrentState()).toBe(InterventionState.INPUT_READY);
            });
        });

        describe('无效状态转换', () => {
            test('应该拒绝从 LOADING 直接转换到 CONTENT_DISPLAYED', () => {
                const result = stateManager.transitionTo(InterventionState.CONTENT_DISPLAYED);

                expect(result).toBe(false);
                expect(stateManager.getCurrentState()).toBe(InterventionState.LOADING);
            });

            test('应该拒绝从 LOADING 直接转换到 COMPLETED', () => {
                const result = stateManager.transitionTo(InterventionState.COMPLETED);

                expect(result).toBe(false);
                expect(stateManager.getCurrentState()).toBe(InterventionState.LOADING);
            });

            test('应该拒绝无效的状态值', () => {
                const result = stateManager.transitionTo('invalid_state');

                expect(result).toBe(false);
                expect(stateManager.getCurrentState()).toBe(InterventionState.LOADING);
            });
        });

        describe('状态历史记录', () => {
            test('应该记录状态转换历史', () => {
                stateManager.transitionTo(InterventionState.INPUT_READY);
                stateManager.transitionTo(InterventionState.CONTENT_DISPLAYED);
                stateManager.transitionTo(InterventionState.COMPLETED);

                expect(stateManager.stateHistory).toEqual([
                    InterventionState.LOADING,
                    InterventionState.INPUT_READY,
                    InterventionState.CONTENT_DISPLAYED,
                    InterventionState.COMPLETED
                ]);
            });

            test('无效转换不应该被记录到历史中', () => {
                stateManager.transitionTo(InterventionState.CONTENT_DISPLAYED); // 无效转换

                expect(stateManager.stateHistory).toEqual([InterventionState.LOADING]);
            });
        });

        describe('重置功能', () => {
            test('应该重置状态管理器到初始状态', () => {
                // 进行一些状态转换
                stateManager.transitionTo(InterventionState.INPUT_READY);
                stateManager.transitionTo(InterventionState.CONTENT_DISPLAYED);

                // 重置
                stateManager.reset();

                expect(stateManager.getCurrentState()).toBe(InterventionState.LOADING);
                expect(stateManager.stateHistory).toEqual([InterventionState.LOADING]);
            });
        });

        describe('isValidTransition 方法', () => {
            test('应该正确验证有效转换', () => {
                expect(stateManager.isValidTransition(
                    InterventionState.LOADING,
                    InterventionState.INPUT_READY
                )).toBe(true);

                expect(stateManager.isValidTransition(
                    InterventionState.INPUT_READY,
                    InterventionState.CONTENT_DISPLAYED
                )).toBe(true);
            });

            test('应该正确识别无效转换', () => {
                expect(stateManager.isValidTransition(
                    InterventionState.LOADING,
                    InterventionState.CONTENT_DISPLAYED
                )).toBe(false);

                expect(stateManager.isValidTransition(
                    InterventionState.LOADING,
                    InterventionState.COMPLETED
                )).toBe(false);
            });
        });
    });
});