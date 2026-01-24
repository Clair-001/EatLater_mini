/**
 * SessionArchiveStorage 测试
 */

import { SessionArchiveStorage } from '../../interfaces/SessionArchiveStorage.js';
import { ArchiveCard } from '../../models/ArchiveCard.js';
import { InterventionContent } from '../../models/InterventionContent.js';

describe('SessionArchiveStorage', () => {
    let storage;

    beforeEach(() => {
        storage = new SessionArchiveStorage();
    });

    afterEach(() => {
        if (storage) {
            storage.clearSessionCards();
        }
    });

    describe('初始化', () => {
        test('应该正确初始化存储管理器', () => {
            expect(storage).toBeDefined();
            expect(storage.sessionCards).toEqual([]);
            expect(storage.maxSessionCards).toBe(10);
            expect(storage.sessionOnly).toBe(true);
            expect(storage.sessionStartTime).toBeDefined();
        });

        test('应该正确报告空存储状态', () => {
            expect(storage.isEmpty()).toBe(true);
            expect(storage.isFull()).toBe(false);
            expect(storage.getSessionCards()).toEqual([]);
        });
    });

    describe('添加卡片', () => {
        test('应该成功添加有效卡片', () => {
            const content = new InterventionContent('/test/image.jpg', '测试文案', '测试食物');
            const card = new ArchiveCard(content);

            const result = storage.addSessionCard(card);

            expect(result).toBe(true);
            expect(storage.getSessionCards()).toHaveLength(1);
            expect(storage.getSessionCards()[0].id).toBe(card.id);
        });

        test('应该拒绝添加空卡片', () => {
            const result = storage.addSessionCard(null);

            expect(result).toBe(false);
            expect(storage.getSessionCards()).toHaveLength(0);
        });

        test('应该拒绝添加重复卡片', () => {
            const content = new InterventionContent('/test/image.jpg', '测试文案', '测试食物');
            const card = new ArchiveCard(content);

            storage.addSessionCard(card);
            const result = storage.addSessionCard(card);

            expect(result).toBe(false);
            expect(storage.getSessionCards()).toHaveLength(1);
        });

        test('应该在超过最大数量时移除最旧的卡片', () => {
            // 设置较小的最大数量便于测试
            storage.setMaxSessionCards(3);

            const cards = [];
            for (let i = 0; i < 5; i++) {
                const content = new InterventionContent(`/test/image${i}.jpg`, `测试文案${i}`, `测试食物${i}`);
                const card = new ArchiveCard(content);
                cards.push(card);
                storage.addSessionCard(card);
            }

            expect(storage.getSessionCards()).toHaveLength(3);
            // 最新的3张卡片应该被保留
            const storedCards = storage.getSessionCards();
            expect(storedCards.some(card => card.foodName === '测试食物2')).toBe(true);
            expect(storedCards.some(card => card.foodName === '测试食物3')).toBe(true);
            expect(storedCards.some(card => card.foodName === '测试食物4')).toBe(true);
            // 最旧的卡片应该被移除
            expect(storedCards.some(card => card.foodName === '测试食物0')).toBe(false);
            expect(storedCards.some(card => card.foodName === '测试食物1')).toBe(false);
        });
    });

    describe('获取卡片', () => {
        test('应该根据ID正确获取卡片', () => {
            const content = new InterventionContent('/test/image.jpg', '测试文案', '测试食物');
            const card = new ArchiveCard(content);
            storage.addSessionCard(card);

            const retrievedCard = storage.getCardById(card.id);

            expect(retrievedCard).toBeDefined();
            expect(retrievedCard.id).toBe(card.id);
            expect(retrievedCard.foodName).toBe('测试食物');
        });

        test('应该在找不到卡片时返回null', () => {
            const result = storage.getCardById('不存在的ID');
            expect(result).toBeNull();
        });

        test('应该正确获取最近的卡片', () => {
            // 添加多张卡片
            const cards = [];
            for (let i = 0; i < 5; i++) {
                const content = new InterventionContent(`/test/image${i}.jpg`, `测试文案${i}`, `测试食物${i}`);
                const card = new ArchiveCard(content);
                cards.push(card);
                storage.addSessionCard(card);

                // 确保时间戳不同
                if (i < 4) {
                    // 模拟时间间隔
                    card.timestamp = Date.now() - (4 - i) * 1000;
                }
            }

            const recentCards = storage.getRecentCards(3);

            expect(recentCards).toHaveLength(3);
            // 应该按时间戳降序排列（最新的在前）
            expect(recentCards[0].timestamp >= recentCards[1].timestamp).toBe(true);
            expect(recentCards[1].timestamp >= recentCards[2].timestamp).toBe(true);
        });
    });

    describe('存储管理', () => {
        test('应该正确清空所有卡片', () => {
            // 添加一些卡片
            for (let i = 0; i < 3; i++) {
                const content = new InterventionContent(`/test/image${i}.jpg`, `测试文案${i}`, `测试食物${i}`);
                const card = new ArchiveCard(content);
                storage.addSessionCard(card);
            }

            expect(storage.getSessionCards()).toHaveLength(3);

            storage.clearSessionCards();

            expect(storage.getSessionCards()).toHaveLength(0);
            expect(storage.isEmpty()).toBe(true);
        });

        test('应该正确移除特定卡片', () => {
            const content = new InterventionContent('/test/image.jpg', '测试文案', '测试食物');
            const card = new ArchiveCard(content);
            storage.addSessionCard(card);

            const result = storage.removeCardById(card.id);

            expect(result).toBe(true);
            expect(storage.getSessionCards()).toHaveLength(0);
        });

        test('应该正确报告存储使用情况', () => {
            const usage = storage.getSessionUsage();

            expect(usage).toHaveProperty('currentCount');
            expect(usage).toHaveProperty('maxCount');
            expect(usage).toHaveProperty('memoryUsage');
            expect(usage).toHaveProperty('sessionDuration');
            expect(usage).toHaveProperty('utilizationRate');
            expect(usage).toHaveProperty('averageCardSize');

            expect(usage.currentCount).toBe(0);
            expect(usage.maxCount).toBe(10);
            expect(usage.utilizationRate).toBe('0.0%');
        });

        test('应该正确设置最大存储数量', () => {
            storage.setMaxSessionCards(5);
            expect(storage.maxSessionCards).toBe(5);

            const capacityInfo = storage.getCapacityInfo();
            expect(capacityInfo.max).toBe(5);
        });
    });

    describe('状态检查', () => {
        test('应该正确报告存储状态', () => {
            expect(storage.isEmpty()).toBe(true);
            expect(storage.isFull()).toBe(false);

            // 添加卡片到满
            for (let i = 0; i < 10; i++) {
                const content = new InterventionContent(`/test/image${i}.jpg`, `测试文案${i}`, `测试食物${i}`);
                const card = new ArchiveCard(content);
                storage.addSessionCard(card);
            }

            expect(storage.isEmpty()).toBe(false);
            expect(storage.isFull()).toBe(true);
        });

        test('应该正确获取容量信息', () => {
            const capacityInfo = storage.getCapacityInfo();

            expect(capacityInfo).toHaveProperty('current');
            expect(capacityInfo).toHaveProperty('max');
            expect(capacityInfo).toHaveProperty('available');
            expect(capacityInfo).toHaveProperty('isFull');
            expect(capacityInfo).toHaveProperty('isEmpty');

            expect(capacityInfo.current).toBe(0);
            expect(capacityInfo.max).toBe(10);
            expect(capacityInfo.available).toBe(10);
            expect(capacityInfo.isFull).toBe(false);
            expect(capacityInfo.isEmpty).toBe(true);
        });
    });

    describe('会话统计', () => {
        test('应该正确获取会话统计信息', () => {
            const stats = storage.getSessionStats();

            expect(stats).toHaveProperty('totalCards');
            expect(stats).toHaveProperty('sessionDuration');
            expect(stats).toHaveProperty('averageInterval');
            expect(stats).toHaveProperty('oldestCard');
            expect(stats).toHaveProperty('newestCard');

            expect(stats.totalCards).toBe(0);
            expect(stats.sessionDuration).toBeGreaterThanOrEqual(0);
            expect(stats.averageInterval).toBe(0);
            expect(stats.oldestCard).toBeNull();
            expect(stats.newestCard).toBeNull();
        });

        test('应该正确计算多卡片的统计信息', () => {
            // 添加多张卡片
            for (let i = 0; i < 3; i++) {
                const content = new InterventionContent(`/test/image${i}.jpg`, `测试文案${i}`, `测试食物${i}`);
                const card = new ArchiveCard(content);
                storage.addSessionCard(card);
            }

            const stats = storage.getSessionStats();

            expect(stats.totalCards).toBe(3);
            expect(stats.oldestCard).toBeDefined();
            expect(stats.newestCard).toBeDefined();
            expect(stats.newestCard >= stats.oldestCard).toBe(true);
        });
    });
});