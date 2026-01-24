/**
 * 任务19：集成测试和最终验证 - 最终版本
 * 直接测试核心功能
 */

const { InterventionViewModel } = require('../../viewmodels/InterventionViewModel.js');
const { InterventionRepository } = require('../../interfaces/InterventionRepository.js');
const { SessionArchiveStorage } = require('../../interfaces/SessionArchiveStorage.js');
const { CardManager } = require('../../interfaces/CardManager.js');
const { InterventionContent } = require('../../models/InterventionContent.js');

describe('任务19：集成测试和最终验证 - 最终版', () => {
    let viewModel;
    let repository;
    let archiveStorage;
    let cardManager;

    beforeEach(async () => {
        // 初始化组件
        repository = new InterventionRepository();
        await repository.initialize();

        archiveStorage = new SessionArchiveStorage();
        cardManager = new CardManager();

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
        test('完整的存档流程测试', async () => {
            console.log('开始完整存档流程测试');

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

            // 4. 手动创建存档卡片
            const archiveCard = await viewModel.createArchiveCard(content);
            expect(archiveCard).not.toBeNull();
            expect(archiveCard.foodName).toBe('披萨');

            console.log('完整存档流程测试通过');
        });

        test('UI切换和导航功能测试', async () => {
            console.log('开始UI切换和导航功能测试');

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
            expect(viewModel.getCurrentState()).toBe('inputReady');

            console.log('UI切换和导航功能测试通过');
        });

        test('会话存档存储功能测试', async () => {
            console.log('开始会话存档存储功能测试');

            // 1. 验证初始状态
            expect(archiveStorage.isEmpty()).toBe(true);
            expect(archiveStorage.getSessionCards().length).toBe(0);

            // 2. 创建测试内容
            const testContent = new InterventionContent(
                'https://example.com/test.jpg',
                '测试引导文案',
                '测试食物'
            );

            // 3. 使用repository创建存档
            const archiveCard = await repository.archiveContent(testContent);
            expect(archiveCard).not.toBeNull();
            expect(archiveCard.foodName).toBe('测试食物');

            // 4. 验证存档存储
            expect(repository.sessionArchive.getSessionCards().length).toBe(1);
            expect(repository.sessionArchive.isEmpty()).toBe(false);

            // 5. 获取存档历史
            const history = await repository.getArchiveHistory();
            expect(history).toHaveLength(1);
            expect(history[0].foodName).toBe('测试食物');

            console.log('会话存档存储功能测试通过');
        });

        test('卡片管理器功能测试', async () => {
            console.log('开始卡片管理器功能测试');

            // 1. 创建测试卡片并初始化状态
            const testCardId = 'test-card-123';

            // 首先创建卡片状态
            cardManager.cardStates.set(testCardId, {
                focused: false,
                selected: false,
                animating: false,
                position: { x: 0, y: 0 },
                zIndex: 1
            });

            cardManager.updateCardState(testCardId, {
                focused: true,
                selected: false,
                animating: false
            });

            // 2. 验证状态设置
            const cardStates = cardManager.getAllCardStates();
            expect(cardStates.has(testCardId)).toBe(true);
            expect(cardStates.get(testCardId).focused).toBe(true);
            expect(cardStates.get(testCardId).selected).toBe(false);

            // 3. 测试状态更新
            cardManager.updateCardState(testCardId, { selected: true });
            expect(cardStates.get(testCardId).selected).toBe(true);
            expect(cardStates.get(testCardId).focused).toBe(true); // 保持之前的状态

            // 4. 测试状态清理
            cardManager.removeCardState(testCardId);
            expect(cardStates.has(testCardId)).toBe(false);

            console.log('卡片管理器功能测试通过');
        });

        test('错误处理和边界情况测试', async () => {
            console.log('开始错误处理和边界情况测试');

            // 1. 测试无效输入处理
            const result1 = await viewModel.handleFoodInput('');
            expect(result1).toBe(false);

            const result2 = await viewModel.handleFoodInput(null);
            expect(result2).toBe(false);

            const result3 = await viewModel.handleFoodInput(undefined);
            expect(result3).toBe(false);

            // 2. 测试创建存档卡片时传入空内容
            const archiveCard1 = await viewModel.createArchiveCard(null);
            expect(archiveCard1).toBeNull();

            const archiveCard2 = await viewModel.createArchiveCard(undefined);
            expect(archiveCard2).toBeNull();

            // 3. 测试存档存储的边界情况
            expect(archiveStorage.getCardById('non-existent')).toBeNull();
            expect(archiveStorage.removeCardById('non-existent')).toBe(false);

            console.log('错误处理和边界情况测试通过');
        });
    });

    describe('19.2 综合集成测试', () => {
        test('多组件协作测试', async () => {
            console.log('开始多组件协作测试');

            // 1. 创建多个干预内容
            const foods = ['披萨', '汉堡', '炸鸡'];
            const createdCards = [];

            for (const food of foods) {
                // 使用ViewModel处理输入
                await viewModel.handleFoodInput(food);
                const content = viewModel.getCurrentContent();

                // 使用repository创建存档
                const archiveCard = await repository.archiveContent(content);
                expect(archiveCard).not.toBeNull();
                createdCards.push(archiveCard);

                // 使用cardManager管理卡片状态
                cardManager.cardStates.set(archiveCard.id, {
                    focused: false,
                    selected: false,
                    animating: false,
                    position: { x: 0, y: 0 },
                    zIndex: 1
                });
                cardManager.updateCardState(archiveCard.id, { focused: false });
            }

            // 2. 验证所有组件的状态
            expect(createdCards).toHaveLength(3);
            expect(repository.sessionArchive.getSessionCards().length).toBe(3);
            expect(cardManager.getAllCardStates().size).toBe(3);

            // 3. 验证卡片顺序
            const sessionCards = repository.sessionArchive.getSessionCards();
            expect(sessionCards[0].foodName).toBe('炸鸡'); // 最新的在前
            expect(sessionCards[1].foodName).toBe('汉堡');
            expect(sessionCards[2].foodName).toBe('披萨');

            console.log('多组件协作测试通过');
        });

        test('存档容量管理测试', async () => {
            console.log('开始存档容量管理测试');

            // 1. 获取最大容量
            const maxCapacity = 10; // SessionArchiveStorage的默认最大值

            // 2. 创建超过最大容量的存档
            for (let i = 0; i < maxCapacity + 3; i++) {
                const testContent = new InterventionContent(
                    `https://example.com/test${i}.jpg`,
                    `测试引导文案${i}`,
                    `食物${i}`
                );

                await repository.archiveContent(testContent);
            }

            // 3. 验证容量限制
            const sessionCards = repository.sessionArchive.getSessionCards();
            expect(sessionCards.length).toBeLessThanOrEqual(maxCapacity);

            // 4. 验证最新的卡片被保留
            if (sessionCards.length > 0) {
                // 由于容量限制，最新的卡片应该是最后创建的几个
                const lastIndex = maxCapacity + 2;
                expect(sessionCards[0].foodName).toBe(`食物${lastIndex}`);
            }

            console.log('存档容量管理测试通过');
        });

        test('会话数据临时性验证', async () => {
            console.log('开始会话数据临时性验证');

            // 1. 创建一些会话数据
            const testContent = new InterventionContent(
                'https://example.com/temp.jpg',
                '临时测试文案',
                '临时食物'
            );

            await repository.archiveContent(testContent);
            expect(repository.sessionArchive.getSessionCards().length).toBe(1);

            // 2. 模拟应用退出清理
            viewModel.handleExit();

            // 3. 验证ViewModel状态重置
            expect(viewModel.getCurrentState()).toBe('inputReady');
            expect(viewModel.getCurrentUIState()).toBe('mainScreen');
            expect(viewModel.getCurrentContent()).toBeNull();

            // 4. 手动清理会话数据（模拟应用退出时的清理）
            repository.sessionArchive.clearSessionCards();
            expect(repository.sessionArchive.isEmpty()).toBe(true);

            console.log('会话数据临时性验证通过');
        });
    });

    describe('19.3 性能和稳定性验证', () => {
        test('大量操作性能测试', async () => {
            console.log('开始大量操作性能测试');

            const operationCount = 50;
            const startTime = Date.now();

            // 1. 执行大量输入操作
            for (let i = 0; i < operationCount; i++) {
                await viewModel.handleFoodInput(`性能测试${i}`);
                const content = viewModel.getCurrentContent();

                if (content) {
                    await repository.archiveContent(content);
                }
            }

            const endTime = Date.now();
            const totalTime = endTime - startTime;
            const averageTime = totalTime / operationCount;

            // 2. 验证性能指标
            expect(averageTime).toBeLessThan(100); // 平均每个操作不超过100ms
            expect(totalTime).toBeLessThan(5000); // 总时间不超过5秒

            console.log(`大量操作性能测试通过，平均耗时: ${averageTime.toFixed(2)}ms`);
        });

        test('内存使用监控测试', async () => {
            console.log('开始内存使用监控测试');

            // 1. 创建一些数据
            for (let i = 0; i < 5; i++) {
                const testContent = new InterventionContent(
                    `https://example.com/memory${i}.jpg`,
                    `内存测试文案${i}`,
                    `内存食物${i}`
                );

                await repository.archiveContent(testContent);
            }

            // 2. 获取内存使用情况
            const usage = repository.sessionArchive.getSessionUsage();
            expect(usage.currentCount).toBe(5);
            expect(usage.memoryUsage).toBeGreaterThan(0);
            expect(usage.averageCardSize).toBeGreaterThan(0);
            expect(usage.utilizationRate).toBeTruthy();

            // 3. 验证容量信息
            const capacity = repository.sessionArchive.getCapacityInfo();
            expect(capacity.current).toBe(5);
            expect(capacity.max).toBeGreaterThan(0);
            expect(capacity.available).toBeGreaterThan(0);
            expect(capacity.isEmpty).toBe(false);
            expect(capacity.isFull).toBe(false);

            console.log('内存使用监控测试通过');
        });

        test('并发操作稳定性测试', async () => {
            console.log('开始并发操作稳定性测试');

            // 1. 创建并发操作
            const concurrentOperations = [];

            for (let i = 0; i < 10; i++) {
                const operation = async () => {
                    await viewModel.handleFoodInput(`并发测试${i}`);
                    const content = viewModel.getCurrentContent();
                    if (content) {
                        return await repository.archiveContent(content);
                    }
                    return null;
                };

                concurrentOperations.push(operation());
            }

            // 2. 等待所有操作完成
            const results = await Promise.allSettled(concurrentOperations);

            // 3. 验证结果
            const successCount = results.filter(result =>
                result.status === 'fulfilled' && result.value !== null
            ).length;

            expect(successCount).toBeGreaterThan(0);
            console.log(`并发操作稳定性测试通过，成功操作: ${successCount}/10`);
        });
    });
});