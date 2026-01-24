/**
 * 任务19：集成测试和最终验证 - 简化版本
 * 专注于核心功能验证
 */

const { InterventionViewModel } = require('../../viewmodels/InterventionViewModel.js');
const { InterventionRepository } = require('../../interfaces/InterventionRepository.js');
const { CardManager } = require('../../interfaces/CardManager.js');

describe('任务19：集成测试和最终验证 - 简化版', () => {
    let viewModel;
    let repository;
    let archiveStorage;
    let cardManager;

    beforeEach(async () => {
        // 初始化所有组件
        repository = new InterventionRepository();
        await repository.initialize();

        // 获取repository的sessionArchive实例
        archiveStorage = repository.sessionArchive;
        cardManager = new CardManager();

        // 创建ViewModel（使用默认构造函数）
        viewModel = new InterventionViewModel();
        await viewModel.initialize();
    });

    afterEach(() => {
        if (archiveStorage) {
            archiveStorage.clearSessionCards();
        }
        if (cardManager) {
            cardManager.clearAllCardStates();
        }
    });

    describe('19.1 端到端功能测试', () => {
        test('基本存档流程验证', async () => {
            console.log('开始基本存档流程验证');

            // 1. 验证初始状态
            expect(viewModel.getCurrentState()).toBe('inputReady');
            expect(viewModel.getCurrentUIState()).toBe('mainScreen');

            // 2. 输入食物并生成干预内容
            const result = await viewModel.handleFoodInput('披萨');
            expect(result).toBe(true);
            expect(viewModel.getCurrentState()).toBe('contentDisplayed');

            // 3. 验证内容生成
            const content = viewModel.getCurrentContent();
            expect(content).not.toBeNull();
            expect(content.foodName).toBe('披萨');
            expect(content.imageResource).toBeTruthy();
            expect(content.guidanceText).toBeTruthy();

            console.log('基本存档流程验证通过');
        });

        test('UI状态切换验证', async () => {
            console.log('开始UI状态切换验证');

            // 1. 验证初始UI状态
            expect(viewModel.getCurrentUIState()).toBe('mainScreen');

            // 2. 测试切换到存档屏幕
            const switchToArchive = viewModel.switchToArchiveScreen();
            expect(switchToArchive).toBe(true);
            expect(viewModel.getCurrentUIState()).toBe('archiveScreen');

            // 3. 测试返回主屏幕
            const switchToMain = viewModel.switchToMainScreen();
            expect(switchToMain).toBe(true);
            expect(viewModel.getCurrentUIState()).toBe('mainScreen');

            console.log('UI状态切换验证通过');
        });

        test('会话数据管理验证', async () => {
            console.log('开始会话数据管理验证');

            // 1. 验证初始状态
            expect(archiveStorage.isEmpty()).toBe(true);
            expect(archiveStorage.getSessionCards().length).toBe(0);

            // 2. 手动创建存档卡片
            await viewModel.handleFoodInput('测试食物');
            const content = viewModel.getCurrentContent();
            const archiveCard = await viewModel.createArchiveCard(content);

            // 3. 验证卡片创建
            expect(archiveCard).not.toBeNull();
            expect(archiveCard.foodName).toBe('测试食物');

            // 4. 验证存档存储
            expect(archiveStorage.getSessionCards().length).toBe(1);
            expect(archiveStorage.isEmpty()).toBe(false);

            // 5. 测试清理功能
            archiveStorage.clearSessionCards();
            expect(archiveStorage.isEmpty()).toBe(true);
            expect(archiveStorage.getSessionCards().length).toBe(0);

            console.log('会话数据管理验证通过');
        });

        test('错误处理验证', async () => {
            console.log('开始错误处理验证');

            // 1. 测试无效输入
            const result1 = await viewModel.handleFoodInput('');
            expect(result1).toBe(false);

            const result2 = await viewModel.handleFoodInput(null);
            expect(result2).toBe(false);

            // 2. 测试创建存档卡片时传入空内容
            const archiveCard = await viewModel.createArchiveCard(null);
            expect(archiveCard).toBeNull();

            console.log('错误处理验证通过');
        });

        test('卡片管理器功能验证', async () => {
            console.log('开始卡片管理器功能验证');

            // 1. 创建测试卡片
            await viewModel.handleFoodInput('测试卡片');
            const content = viewModel.getCurrentContent();
            const archiveCard = await viewModel.createArchiveCard(content);

            expect(archiveCard).not.toBeNull();

            // 2. 测试卡片状态管理
            cardManager.updateCardState(archiveCard.id, { focused: true });
            const cardStates = cardManager.getAllCardStates();
            expect(cardStates.has(archiveCard.id)).toBe(true);
            expect(cardStates.get(archiveCard.id).focused).toBe(true);

            // 3. 测试清理卡片状态
            cardManager.removeCardState(archiveCard.id);
            expect(cardStates.has(archiveCard.id)).toBe(false);

            console.log('卡片管理器功能验证通过');
        });
    });

    describe('19.2 综合功能验证', () => {
        test('多卡片存档流程验证', async () => {
            console.log('开始多卡片存档流程验证');

            const foods = ['披萨', '汉堡', '炸鸡'];
            const createdCards = [];

            // 1. 创建多个存档卡片
            for (const food of foods) {
                await viewModel.handleFoodInput(food);
                const content = viewModel.getCurrentContent();
                const archiveCard = await viewModel.createArchiveCard(content);

                expect(archiveCard).not.toBeNull();
                expect(archiveCard.foodName).toBe(food);
                createdCards.push(archiveCard);
            }

            // 2. 验证存档数量
            expect(archiveStorage.getSessionCards().length).toBe(3);

            // 3. 验证卡片顺序（最新的在前）
            const sessionCards = archiveStorage.getSessionCards();
            expect(sessionCards[0].foodName).toBe('炸鸡');
            expect(sessionCards[1].foodName).toBe('汉堡');
            expect(sessionCards[2].foodName).toBe('披萨');

            console.log('多卡片存档流程验证通过');
        });

        test('存档容量限制验证', async () => {
            console.log('开始存档容量限制验证');

            // 1. 获取最大容量
            const maxCapacity = 10; // SessionArchiveStorage的默认最大值

            // 2. 创建超过最大容量的卡片
            for (let i = 0; i < maxCapacity + 2; i++) {
                await viewModel.handleFoodInput(`食物${i}`);
                const content = viewModel.getCurrentContent();
                await viewModel.createArchiveCard(content);
            }

            // 3. 验证不超过最大容量
            const sessionCards = archiveStorage.getSessionCards();
            expect(sessionCards.length).toBeLessThanOrEqual(maxCapacity);

            // 4. 验证最新的卡片被保留
            expect(sessionCards[0].foodName).toBe(`食物${maxCapacity + 1}`);

            console.log('存档容量限制验证通过');
        });

        test('应用生命周期验证', async () => {
            console.log('开始应用生命周期验证');

            // 1. 创建一些数据
            await viewModel.handleFoodInput('生命周期测试');
            const content = viewModel.getCurrentContent();
            await viewModel.createArchiveCard(content);

            expect(archiveStorage.getSessionCards().length).toBe(1);

            // 2. 模拟应用退出
            viewModel.handleAppExit();

            // 3. 验证状态重置
            expect(viewModel.getCurrentState()).toBe('inputReady');
            expect(viewModel.getCurrentUIState()).toBe('mainScreen');
            expect(viewModel.getCurrentContent()).toBeNull();

            console.log('应用生命周期验证通过');
        });
    });

    describe('19.3 性能和稳定性验证', () => {
        test('大量操作稳定性验证', async () => {
            console.log('开始大量操作稳定性验证');

            const operationCount = 20;
            let successCount = 0;

            // 1. 执行大量输入操作
            for (let i = 0; i < operationCount; i++) {
                try {
                    const result = await viewModel.handleFoodInput(`批量测试${i}`);
                    if (result) {
                        successCount++;
                    }
                } catch (error) {
                    console.warn(`操作 ${i} 失败:`, error);
                }
            }

            // 2. 验证成功率
            expect(successCount).toBeGreaterThan(operationCount * 0.9); // 至少90%成功率

            console.log(`大量操作稳定性验证通过，成功率: ${successCount}/${operationCount}`);
        });

        test('内存使用验证', async () => {
            console.log('开始内存使用验证');

            // 1. 创建一些数据
            for (let i = 0; i < 5; i++) {
                await viewModel.handleFoodInput(`内存测试${i}`);
                const content = viewModel.getCurrentContent();
                await viewModel.createArchiveCard(content);
            }

            // 2. 获取使用情况
            const usage = archiveStorage.getSessionUsage();
            expect(usage.currentCount).toBe(5);
            expect(usage.memoryUsage).toBeGreaterThan(0);
            expect(usage.averageCardSize).toBeGreaterThan(0);

            // 3. 清理并验证
            archiveStorage.clearSessionCards();
            const usageAfterClear = archiveStorage.getSessionUsage();
            expect(usageAfterClear.currentCount).toBe(0);

            console.log('内存使用验证通过');
        });
    });
});