import { InterventionViewModel } from '../../viewmodels/InterventionViewModel.js';
import { InterventionState } from '../../models/InterventionState.js';
import { FoodInput } from '../../models/FoodInput.js';

describe('InterventionViewModel 测试', () => {
    let viewModel;

    beforeEach(() => {
        viewModel = new InterventionViewModel();
    });

    describe('构造函数', () => {
        test('应该正确初始化 ViewModel', () => {
            expect(viewModel).toBeDefined();
            expect(viewModel.stateManager).toBeDefined();
            expect(viewModel.repository).toBeDefined();
            expect(viewModel.currentContent).toBeNull();
            expect(viewModel.currentFoodInput).toBeNull();
            expect(viewModel.errorMessage).toBe('');
        });

        test('应该初始化为 INPUT_READY 状态', async () => {
            // 等待异步初始化完成
            await new Promise(resolve => setTimeout(resolve, 10));
            expect(viewModel.getCurrentState()).toBe(InterventionState.INPUT_READY);
        });
    });

    describe('handleFoodInput 方法', () => {
        test('应该处理有效的食物输入', async () => {
            const result = await viewModel.handleFoodInput('披萨');

            expect(result).toBe(true);
            expect(viewModel.getCurrentState()).toBe(InterventionState.CONTENT_DISPLAYED);
            expect(viewModel.getCurrentFoodInput()).toBeDefined();
            expect(viewModel.getCurrentFoodInput().name).toBe('披萨');
            expect(viewModel.getCurrentContent()).toBeDefined();
            expect(viewModel.hasError()).toBe(false);
        });

        test('应该拒绝空输入', async () => {
            const result = await viewModel.handleFoodInput('');

            expect(result).toBe(false);
            expect(viewModel.getCurrentState()).toBe(InterventionState.INPUT_READY);
            expect(viewModel.getCurrentFoodInput()).toBeNull();
            expect(viewModel.getCurrentContent()).toBeNull();
            expect(viewModel.hasError()).toBe(true);
            expect(viewModel.getErrorMessage()).toBe('请输入您想吃的食物');
        });

        test('应该拒绝只包含空格的输入', async () => {
            const result = await viewModel.handleFoodInput('   ');

            expect(result).toBe(false);
            expect(viewModel.hasError()).toBe(true);
            expect(viewModel.getErrorMessage()).toBe('请输入您想吃的食物');
        });

        test('应该拒绝过长的输入', async () => {
            const longInput = 'a'.repeat(51);
            const result = await viewModel.handleFoodInput(longInput);

            expect(result).toBe(false);
            expect(viewModel.hasError()).toBe(true);
            expect(viewModel.getErrorMessage()).toBe('食物名称过长，请输入50个字符以内');
        });

        test('应该拒绝包含特殊字符的输入', async () => {
            const result = await viewModel.handleFoodInput('披萨<script>');

            expect(result).toBe(false);
            expect(viewModel.hasError()).toBe(true);
            expect(viewModel.getErrorMessage()).toBe('食物名称包含无效字符');
        });
    });

    describe('handleQuickSelectFood 方法', () => {
        test('应该处理快捷按钮选择', async () => {
            const result = await viewModel.handleQuickSelectFood('炸鸡');

            expect(result).toBe(true);
            expect(viewModel.getCurrentState()).toBe(InterventionState.CONTENT_DISPLAYED);
            expect(viewModel.getCurrentFoodInput().name).toBe('炸鸡');
        });
    });

    describe('getQuickSelectFoods 方法', () => {
        test('应该返回快捷选择食物列表', () => {
            const foods = viewModel.getQuickSelectFoods();

            expect(Array.isArray(foods)).toBe(true);
            expect(foods.length).toBeGreaterThan(0);
            expect(foods).toContain('披萨');
            expect(foods).toContain('炸鸡');
            expect(foods).toContain('奶茶');
        });
    });

    describe('handleExit 方法', () => {
        test('应该正确处理退出', async () => {
            // 先设置一些数据
            await viewModel.handleFoodInput('披萨');
            expect(viewModel.getCurrentContent()).toBeDefined();

            // 执行退出
            viewModel.handleExit();

            // 退出后应该清理会话数据，但不改变状态（由UI层处理应用关闭）
            expect(viewModel.getCurrentContent()).toBeNull();
            expect(viewModel.getCurrentFoodInput()).toBeNull();
            expect(viewModel.hasError()).toBe(false);
        });
    });

    describe('reset 方法', () => {
        test('应该重置 ViewModel 到初始状态', async () => {
            // 先设置一些数据
            await viewModel.handleFoodInput('披萨');
            expect(viewModel.getCurrentContent()).toBeDefined();

            // 执行重置
            viewModel.reset();

            // 等待异步重置完成
            await new Promise(resolve => setTimeout(resolve, 10));

            expect(viewModel.getCurrentState()).toBe(InterventionState.INPUT_READY);
            expect(viewModel.getCurrentContent()).toBeNull();
            expect(viewModel.getCurrentFoodInput()).toBeNull();
            expect(viewModel.hasError()).toBe(false);
        });
    });

    describe('错误处理', () => {
        test('应该正确设置和清除错误信息', () => {
            expect(viewModel.hasError()).toBe(false);

            viewModel.setError('测试错误');
            expect(viewModel.hasError()).toBe(true);
            expect(viewModel.getErrorMessage()).toBe('测试错误');

            viewModel.clearError();
            expect(viewModel.hasError()).toBe(false);
            expect(viewModel.getErrorMessage()).toBe('');
        });
    });

    describe('事件监听', () => {
        test('应该支持添加和移除事件监听器', () => {
            let eventFired = false;
            const listener = () => { eventFired = true; };

            viewModel.addEventListener('stateChanged', listener);
            viewModel.emitEvent('stateChanged', {});
            expect(eventFired).toBe(true);

            eventFired = false;
            viewModel.removeEventListener('stateChanged', listener);
            viewModel.emitEvent('stateChanged', {});
            expect(eventFired).toBe(false);
        });

        test('应该在状态改变时触发事件', async () => {
            let stateChangeEvent = null;
            viewModel.addEventListener('stateChanged', (data) => {
                stateChangeEvent = data;
            });

            await viewModel.handleFoodInput('披萨');

            expect(stateChangeEvent).toBeDefined();
            expect(stateChangeEvent.newState).toBe(InterventionState.CONTENT_DISPLAYED);
        });

        test('应该在内容准备好时触发事件', async () => {
            let contentReadyEvent = null;
            viewModel.addEventListener('contentReady', (data) => {
                contentReadyEvent = data;
            });

            await viewModel.handleFoodInput('披萨');

            expect(contentReadyEvent).toBeDefined();
            expect(contentReadyEvent.foodName).toBe('披萨');
        });

        test('应该在错误时触发事件', async () => {
            let errorEvent = null;
            viewModel.addEventListener('error', (data) => {
                errorEvent = data;
            });

            await viewModel.handleFoodInput('');

            expect(errorEvent).toBe('请输入您想吃的食物');
        });
    });

    describe('getDebugInfo 方法', () => {
        test('应该返回调试信息', async () => {
            const debugInfo = viewModel.getDebugInfo();

            expect(debugInfo).toBeDefined();
            expect(debugInfo.currentState).toBe(InterventionState.INPUT_READY);
            expect(debugInfo.hasContent).toBe(false);
            expect(debugInfo.hasFoodInput).toBe(false);
            expect(debugInfo.hasError).toBe(false);
            expect(Array.isArray(debugInfo.quickSelectFoods)).toBe(true);
        });

        test('调试信息应该反映当前状态', async () => {
            await viewModel.handleFoodInput('披萨');
            const debugInfo = viewModel.getDebugInfo();

            expect(debugInfo.currentState).toBe(InterventionState.CONTENT_DISPLAYED);
            expect(debugInfo.hasContent).toBe(true);
            expect(debugInfo.hasFoodInput).toBe(true);
            expect(debugInfo.hasError).toBe(false);
        });
    });
});