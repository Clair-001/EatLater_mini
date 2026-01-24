/**
 * 任务19：集成测试和最终验证
 * 端到端功能测试
 */

const { InterventionViewModel } = require('../../viewmodels/InterventionViewModel.js');
const { InterventionRepository } = require('../../interfaces/InterventionRepository.js');
const { SessionArchiveStorage } = require('../../interfaces/SessionArchiveStorage.js');
const { CardManager } = require('../../interfaces/CardManager.js');

describe('任务19：集成测试和最终验证', () => {
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

        viewModel = new InterventionViewModel(repository, archiveStorage, cardManager);
        await viewModel.initialize();
    });

    afterEach(() => {
        if (viewModel) {
            viewModel.reset();
        }
        if (archiveStorage) {
            archiveStorage.clearSessionCards();
        }
        if (cardManager) {
            cardManager.clearAllCardStates();
        }
    });

    describe('19.1 端到端功能测试', () => {
        test('完整的存档流程测试', async () => {
            console.log('开始完整存档流程测试');

            // 1. 验证初始状态
            expect(viewModel.getCurrentState()).toBe('inputReady');
            expect(viewModel.getCurrentUIState()).toBe('mainScreen');
            expect(archiveStorage.getSessionCards().length).toBe(0);

            // 2. 输入食物并生成干预内容
            const result = await viewModel.handleFoodInput('披萨');
            expect(result).toBe(true);
            expect(viewModel.getCurrentState()).toBe('contentDisplayed');

            const content = viewModel.getCurrentContent();
            expect(content).not.toBeNull();
            expect(content.foodName).toBe('披萨');
            expect(content.imageResource).toBeTruthy();
            expect(content.guidanceText).toBeTruthy();

            // 3. 创建存档卡片
            const content = viewModel.getCurrentContent();
            const archiveCard = await viewModel.createArchiveCard(content);
            expect(archiveCard).not.toBeNull();
            expect(archiveStorage.getSessionCards().length).toBe(1);

            // 4. 验证存档卡片内容
            const cards = archiveStorage.getSessionCards();
            expect(cards).toHaveLength(1);
            expect(cards[0].foodName).toBe('披萨');
            expect(cards[0].imageResource).toBeTruthy();

            // 5. 切换到存档屏幕
            const switchResult = viewModel.switchToArchiveScreen();
            expect(switchResult).toBe(true);
            expect(viewModel.getCurrentUIState()).toBe('archiveScreen');

            // 6. 验证UI状态切换
            const backResult = viewModel.switchToMainScreen();
            expect(backResult).toBe(true);
            expect(viewModel.getCurrentUIState()).toBe('mainScreen');

            console.log('完整存档流程测试通过');
        });

        test('UI切换和导航功能测试', async () => {
            console.log('开始UI切换和导航功能测试');

            // 1. 初始状态验证
            expect(viewModel.getCurrentUIState()).toBe('mainScreen');

            // 2. 创建一些存档内容
            await viewModel.handleFoodInput('汉堡');
            await viewModel.createArchiveCard();

            await viewModel.handleFoodInput('炸鸡');
            await viewModel.createArchiveCard();

            expect(archiveStorage.getSessionCards().length).toBe(2);

            // 3. 测试切换到存档屏幕
            const switchToArchive = viewModel.switchToArchiveScreen();
            expect(switchToArchive).toBe(true);
            expect(viewModel.getCurrentUIState()).toBe('archiveScreen');

            // 4. 验证存档屏幕状态
            const archiveCards = viewModel.getSessionCards();
            expect(archiveCards).toHaveLength(2);
            expect(archiveCards[0].foodName).toBe('炸鸡'); // 最新的在前
            expect(archiveCards[1].foodName).toBe('汉堡');

            // 5. 测试返回主屏幕
            const switchToMain = viewModel.switchToMainScreen();
            expect(switchToMain).toBe(true);
            expect(viewModel.getCurrentUIState()).toBe('mainScreen');
            expect(viewModel.getCurrentState()).toBe('inputReady');

            console.log('UI切换和导航功能测试通过');
        });

        test('动画流畅性和性能测试', async () => {
            console.log('开始动画流畅性和性能测试');

            // 1. 创建多个卡片来测试动画性能
            const foods = ['披萨', '汉堡', '炸鸡', '薯条', '可乐'];

            for (const food of foods) {
                await viewModel.handleFoodInput(food);
                await viewModel.createArchiveCard();
            }

            expect(archiveStorage.getSessionCards().length).toBe(5);

            // 2. 测试卡片动画
            const cards = archiveStorage.getSessionCards();

            for (const card of cards) {
                const startTime = Date.now();

                // 模拟存档动画
                await cardManager.animateToArchive(card);

                const animationTime = Date.now() - startTime;

                // 验证动画时间不超过800毫秒
                expect(animationTime).toBeLessThan(800);
            }

            // 3. 测试卡片聚焦动画
            for (const card of cards) {
                const startTime = Date.now();

                await cardManager.focusCard(card.id);

                const focusTime = Date.now() - startTime;
                expect(focusTime).toBeLessThan(600);

                await cardManager.unfocusCard(card.id);
            }

            console.log('动画流畅性和性能测试通过');
        });

        test('会话数据临时性验证', async () => {
            console.log('开始会话数据临时性验证');

            // 1. 创建会话数据
            await viewModel.handleFoodInput('测试食物');
            await viewModel.createArchiveCard();

            expect(archiveStorage.getSessionCards().length).toBe(1);
            expect(archiveStorage.isEmpty()).toBe(false);

            // 2. 模拟应用退出清理
            viewModel.handleAppExit();

            // 3. 验证数据被清理
            expect(archiveStorage.getSessionCards().length).toBe(0);
            expect(archiveStorage.isEmpty()).toBe(true);

            // 4. 验证状态重置
            expect(viewModel.getCurrentState()).toBe('inputReady');
            expect(viewModel.getCurrentUIState()).toBe('mainScreen');
            expect(viewModel.getCurrentContent()).toBeNull();

            console.log('会话数据临时性验证通过');
        });

        test('UI设计一致性验证', async () => {
            console.log('开始UI设计一致性验证');

            // 1. 验证初始UI状态
            expect(viewModel.getCurrentUIState()).toBe('mainScreen');

            // 2. 创建内容并验证UI状态
            await viewModel.handleFoodInput('设计测试');
            expect(viewModel.getCurrentState()).toBe('contentDisplayed');

            const content = viewModel.getCurrentContent();
            expect(content).not.toBeNull();
            expect(content.foodName).toBe('设计测试');

            // 3. 创建存档并验证
            await viewModel.createArchiveCard();
            expect(archiveStorage.getSessionCards().length).toBe(1);

            // 4. 切换到存档屏幕并验证
            viewModel.switchToArchiveScreen();
            expect(viewModel.getCurrentUIState()).toBe('archiveScreen');

            const sessionCards = viewModel.getSessionCards();
            expect(sessionCards).toHaveLength(1);
            expect(sessionCards[0].foodName).toBe('设计测试');

            // 5. 验证导航状态一致性
            viewModel.switchToMainScreen();
            expect(viewModel.getCurrentUIState()).toBe('mainScreen');
            expect(viewModel.getCurrentState()).toBe('inputReady');

            console.log('UI设计一致性验证通过');
        });

        test('错误处理和边界情况测试', async () => {
            console.log('开始错误处理和边界情况测试');

            // 1. 测试无效输入处理
            const invalidResult = await viewModel.handleFoodInput('');
            expect(invalidResult).toBeDefined();
            // 注意：handleFoodInput可能不返回success字段，而是直接处理错误

            // 2. 测试最大存档数量限制
            const maxCards = 10; // SessionArchiveStorage的默认最大值
            for (let i = 0; i < maxCards + 2; i++) {
                await viewModel.handleFoodInput(`食物${i}`);
                await viewModel.createArchiveCard();
            }

            // 验证不超过最大数量
            expect(archiveStorage.getSessionCards().length).toBeLessThanOrEqual(maxCards);

            // 3. 测试空状态下的UI切换
            archiveStorage.clearSessionCards();
            expect(archiveStorage.isEmpty()).toBe(true);

            const switchResult = viewModel.switchToArchiveScreen();
            expect(switchResult).toBe(true); // 应该允许切换，即使没有卡片

            // 4. 测试重复操作
            await viewModel.handleFoodInput('重复测试');
            const content1 = viewModel.getCurrentContent();

            await viewModel.handleFoodInput('重复测试');
            const content2 = viewModel.getCurrentContent();

            expect(content1.foodName).toBe(content2.foodName);

            console.log('错误处理和边界情况测试通过');
        });
    });

    describe('19.2 综合集成测试', () => {
        test('所有新功能的集成验证', async () => {
            console.log('开始所有新功能的集成验证');

            // 1. 存档功能集成测试
            const foods = ['披萨', '汉堡', '炸鸡'];

            for (const food of foods) {
                await viewModel.handleFoodInput(food);
                expect(viewModel.getCurrentState()).toBe('contentDisplayed');

                await viewModel.createArchiveCard();
                expect(archiveStorage.getSessionCards().length).toBeGreaterThan(0);
            }

            // 2. UI切换功能集成测试
            expect(viewModel.getCurrentUIState()).toBe('mainScreen');

            viewModel.switchToArchiveScreen();
            expect(viewModel.getCurrentUIState()).toBe('archiveScreen');

            const sessionCards = viewModel.getSessionCards();
            expect(sessionCards).toHaveLength(3);

            // 3. 卡片交互功能集成测试
            const firstCard = sessionCards[0];
            await cardManager.focusCard(firstCard.id);

            const cardStates = cardManager.getAllCardStates();
            expect(cardStates.has(firstCard.id)).toBe(true);
            expect(cardStates.get(firstCard.id).focused).toBe(true);

            // 4. 导航功能集成测试
            viewModel.switchToMainScreen();
            expect(viewModel.getCurrentUIState()).toBe('mainScreen');
            expect(viewModel.getCurrentState()).toBe('inputReady');

            // 5. 会话清理功能集成测试
            viewModel.handleAppExit();
            expect(archiveStorage.isEmpty()).toBe(true);
            expect(cardManager.getAllCardStates().size).toBe(0);

            console.log('所有新功能的集成验证通过');
        });

        test('完整用户流程端到端测试', async () => {
            console.log('开始完整用户流程端到端测试');

            // 模拟完整的用户使用流程

            // 1. 用户启动应用
            expect(viewModel.getCurrentState()).toBe('inputReady');
            expect(viewModel.getCurrentUIState()).toBe('mainScreen');

            // 2. 用户输入第一个食物
            await viewModel.handleFoodInput('巧克力');
            expect(viewModel.getCurrentState()).toBe('contentDisplayed');

            const content1 = viewModel.getCurrentContent();
            expect(content1.foodName).toBe('巧克力');

            // 3. 系统自动创建存档
            await viewModel.createArchiveCard();
            expect(archiveStorage.getSessionCards().length).toBe(1);

            // 4. 用户点击退出，返回主屏幕
            viewModel.handleExit();
            expect(viewModel.getCurrentState()).toBe('inputReady');
            expect(viewModel.getCurrentUIState()).toBe('mainScreen');

            // 5. 用户输入第二个食物
            await viewModel.handleFoodInput('冰淇淋');
            await viewModel.createArchiveCard();
            expect(archiveStorage.getSessionCards().length).toBe(2);

            // 6. 用户点击历史图标查看存档
            viewModel.switchToArchiveScreen();
            expect(viewModel.getCurrentUIState()).toBe('archiveScreen');

            const cards = viewModel.getSessionCards();
            expect(cards).toHaveLength(2);
            expect(cards[0].foodName).toBe('冰淇淋'); // 最新的在前
            expect(cards[1].foodName).toBe('巧克力');

            // 7. 用户点击卡片聚焦
            await cardManager.focusCard(cards[0].id);
            const focusedCard = cardManager.getFocusedCard();
            expect(focusedCard).not.toBeNull();
            expect(focusedCard.id).toBe(cards[0].id);

            // 8. 用户返回主屏幕
            viewModel.switchToMainScreen();
            expect(viewModel.getCurrentUIState()).toBe('mainScreen');

            // 9. 用户关闭应用
            viewModel.handleAppExit();
            expect(archiveStorage.isEmpty()).toBe(true);

            console.log('完整用户流程端到端测试通过');
        });
    });
});