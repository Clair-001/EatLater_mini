/**
 * 端到端集成测试
 * 验证所有 MVVM 组件的集成和数据流
 */

import { InterventionViewModel } from '../../viewmodels/InterventionViewModel.js';
import { FoodInput } from '../../models/FoodInput.js';
import { InterventionState } from '../../models/InterventionState.js';

describe('端到端集成测试', () => {
    let viewModel;

    beforeEach(async () => {
        viewModel = new InterventionViewModel();
        // 等待初始化完成
        await new Promise(resolve => setTimeout(resolve, 10));
    });

    afterEach(() => {
        if (viewModel) {
            viewModel.deepCleanSessionData();
        }
    });

    describe('完整用户流程', () => {
        test('应该完成完整的食物输入到干预显示流程', async () => {
            // 1. 验证初始状态
            expect(viewModel.getCurrentState()).toBe(InterventionState.INPUT_READY);
            expect(viewModel.getCurrentContent()).toBeNull();
            expect(viewModel.getCurrentFoodInput()).toBeNull();

            // 2. 获取快捷选择食物列表
            const quickFoods = viewModel.getQuickSelectFoods();
            expect(quickFoods).toBeInstanceOf(Array);
            expect(quickFoods.length).toBeGreaterThan(0);
            expect(quickFoods).toContain('披萨');

            // 3. 处理食物输入
            const success = await viewModel.handleFoodInput('披萨');
            expect(success).toBe(true);

            // 4. 验证状态转换
            expect(viewModel.getCurrentState()).toBe(InterventionState.CONTENT_DISPLAYED);

            // 5. 验证干预内容
            const content = viewModel.getCurrentContent();
            expect(content).not.toBeNull();
            expect(content.isComplete()).toBe(true);
            expect(content.imageResource).toBeTruthy();
            expect(content.guidanceText).toBeTruthy();
            expect(content.foodName).toBe('披萨');

            // 6. 验证食物输入对象
            const foodInput = viewModel.getCurrentFoodInput();
            expect(foodInput).toBeInstanceOf(FoodInput);
            expect(foodInput.getCleanName()).toBe('披萨');
            expect(foodInput.isValid()).toBe(true);
        });

        test('应该正确处理快捷按钮选择流程', async () => {
            // 1. 验证初始状态
            expect(viewModel.getCurrentState()).toBe(InterventionState.INPUT_READY);

            // 2. 处理快捷选择
            const success = await viewModel.handleQuickSelectFood('炸鸡');
            expect(success).toBe(true);

            // 3. 验证状态和内容
            expect(viewModel.getCurrentState()).toBe(InterventionState.CONTENT_DISPLAYED);

            const content = viewModel.getCurrentContent();
            expect(content).not.toBeNull();
            expect(content.foodName).toBe('炸鸡');
            expect(content.imageResource).toContain('chicken');
        });

        test('应该正确处理退出流程', async () => {
            // 1. 先进入内容显示状态
            await viewModel.handleFoodInput('蛋糕');
            expect(viewModel.getCurrentState()).toBe(InterventionState.CONTENT_DISPLAYED);
            expect(viewModel.getCurrentContent()).not.toBeNull();

            // 2. 处理退出
            viewModel.handleExit();

            // 3. 验证数据清理
            expect(viewModel.getCurrentContent()).toBeNull();
            expect(viewModel.getCurrentFoodInput()).toBeNull();
            expect(viewModel.hasError()).toBe(false);
        });

        test('应该正确处理重置流程', async () => {
            // 1. 先进入内容显示状态
            await viewModel.handleFoodInput('奶茶');
            expect(viewModel.getCurrentState()).toBe(InterventionState.CONTENT_DISPLAYED);

            // 2. 重置
            viewModel.reset();

            // 3. 验证重置后状态
            expect(viewModel.getCurrentState()).toBe(InterventionState.INPUT_READY);
            expect(viewModel.getCurrentContent()).toBeNull();
            expect(viewModel.getCurrentFoodInput()).toBeNull();
            expect(viewModel.hasError()).toBe(false);
        });
    });

    describe('错误处理集成', () => {
        test('应该正确处理无效输入的完整流程', async () => {
            // 1. 尝试空输入
            let success = await viewModel.handleFoodInput('');
            expect(success).toBe(false);
            expect(viewModel.hasError()).toBe(true);
            expect(viewModel.getCurrentState()).toBe(InterventionState.INPUT_READY);

            // 2. 清除错误
            viewModel.clearError();
            expect(viewModel.hasError()).toBe(false);

            // 3. 尝试过长输入
            const longInput = 'a'.repeat(100);
            success = await viewModel.handleFoodInput(longInput);
            expect(success).toBe(false);
            expect(viewModel.hasError()).toBe(true);

            // 4. 清除错误后正常输入
            viewModel.clearError();
            success = await viewModel.handleFoodInput('正常食物');
            expect(success).toBe(true);
            expect(viewModel.getCurrentState()).toBe(InterventionState.CONTENT_DISPLAYED);
        });

        test('应该处理未知食物的默认图片流程', async () => {
            // 1. 输入未知食物
            const success = await viewModel.handleFoodInput('未知的奇怪食物');
            expect(success).toBe(true);

            // 2. 验证使用默认图片
            const content = viewModel.getCurrentContent();
            expect(content).not.toBeNull();
            expect(content.imageResource).toBe('/static/images/default_unappetizing.jpg');
            expect(content.guidanceText).toBeTruthy();
            expect(content.foodName).toBe('未知的奇怪食物');
        });
    });

    describe('事件系统集成', () => {
        test('应该正确触发所有相关事件', async () => {
            const events = {
                stateChanged: [],
                contentReady: [],
                error: [],
                userExit: []
            };

            // 添加事件监听器
            viewModel.addEventListener('stateChanged', (data) => {
                events.stateChanged.push(data);
            });

            viewModel.addEventListener('contentReady', (content) => {
                events.contentReady.push(content);
            });

            viewModel.addEventListener('error', (message) => {
                events.error.push(message);
            });

            viewModel.addEventListener('userExit', (data) => {
                events.userExit.push(data);
            });

            // 1. 处理有效输入（应该触发状态改变和内容准备事件）
            await viewModel.handleFoodInput('薯条');

            expect(events.stateChanged.length).toBeGreaterThan(0);
            expect(events.contentReady.length).toBe(1);
            expect(events.contentReady[0].foodName).toBe('薯条');

            // 2. 处理错误输入（应该触发错误事件）
            await viewModel.handleFoodInput('');
            expect(events.error.length).toBe(1);

            // 3. 处理退出（应该触发退出事件）
            viewModel.clearError();
            await viewModel.handleFoodInput('测试食物');
            viewModel.handleExit();
            expect(events.userExit.length).toBe(1);
        });
    });

    describe('数据一致性验证', () => {
        test('所有组件应该保持数据一致性', async () => {
            // 1. 处理输入
            await viewModel.handleFoodInput('披萨');

            // 2. 验证 ViewModel 层数据
            const foodInput = viewModel.getCurrentFoodInput();
            const content = viewModel.getCurrentContent();

            expect(foodInput.getCleanName()).toBe(content.foodName);
            expect(content.isComplete()).toBe(true);

            // 3. 验证数据仓库层数据
            const repository = viewModel.repository;
            const quickFoods = repository.getQuickSelectFoods();
            const hasImage = repository.hasImageForFood('披萨');

            expect(quickFoods).toContain('披萨');
            expect(hasImage).toBe(true);

            // 4. 验证状态管理器数据
            const stateManager = viewModel.stateManager;
            expect(stateManager.getCurrentState()).toBe(InterventionState.CONTENT_DISPLAYED);
        });

        test('重置后所有组件应该回到初始状态', async () => {
            // 1. 先进入复杂状态
            await viewModel.handleFoodInput('复杂食物名称');
            expect(viewModel.getCurrentState()).toBe(InterventionState.CONTENT_DISPLAYED);

            // 2. 重置
            viewModel.reset();

            // 3. 验证所有组件都回到初始状态
            expect(viewModel.getCurrentState()).toBe(InterventionState.INPUT_READY);
            expect(viewModel.getCurrentContent()).toBeNull();
            expect(viewModel.getCurrentFoodInput()).toBeNull();
            expect(viewModel.hasError()).toBe(false);

            // 4. 验证可以正常重新使用
            const success = await viewModel.handleFoodInput('新食物');
            expect(success).toBe(true);
            expect(viewModel.getCurrentState()).toBe(InterventionState.CONTENT_DISPLAYED);
        });
    });

    describe('性能和资源管理', () => {
        test('应该正确管理内存和资源', async () => {
            // 1. 多次操作
            for (let i = 0; i < 5; i++) {
                await viewModel.handleFoodInput(`食物${i}`);
                viewModel.reset();
            }

            // 2. 验证最终状态正常
            expect(viewModel.getCurrentState()).toBe(InterventionState.INPUT_READY);
            expect(viewModel.getCurrentContent()).toBeNull();
            expect(viewModel.getCurrentFoodInput()).toBeNull();

            // 3. 验证仍然可以正常工作
            const success = await viewModel.handleFoodInput('最终测试');
            expect(success).toBe(true);
        });

        test('深度清理应该彻底清除所有数据', () => {
            // 1. 创建一些数据
            viewModel.handleFoodInput('测试数据');

            // 2. 深度清理
            viewModel.deepCleanSessionData();

            // 3. 验证所有数据都被清理
            expect(viewModel.getCurrentContent()).toBeNull();
            expect(viewModel.getCurrentFoodInput()).toBeNull();
            expect(viewModel.hasError()).toBe(false);

            // 4. 验证事件监听器被清理
            expect(Object.values(viewModel.eventListeners).every(listeners => listeners.length === 0)).toBe(true);
        });
    });
});