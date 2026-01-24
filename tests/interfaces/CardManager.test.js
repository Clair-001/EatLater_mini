/**
 * CardManager 测试
 */

import { CardManager } from '../../interfaces/CardManager.js';
import { ArchiveCard } from '../../models/ArchiveCard.js';
import { InterventionContent } from '../../models/InterventionContent.js';

describe('CardManager', () => {
    let cardManager;
    let mockInterventionContent;

    beforeEach(() => {
        cardManager = new CardManager();

        // 创建模拟的干预内容
        mockInterventionContent = new InterventionContent(
            '/static/images/test.jpg',
            '测试引导文案',
            '测试食物'
        );
    });

    afterEach(() => {
        // 清理卡片状态
        if (cardManager) {
            cardManager.clearAllCardStates();
        }
    });

    describe('卡片创建', () => {
        test('应该能够成功创建卡片', async () => {
            const card = await cardManager.createCard(mockInterventionContent);

            expect(card).toBeInstanceOf(ArchiveCard);
            expect(card.foodName).toBe('测试食物');
            expect(cardManager.getCardState(card.id)).toBeTruthy();
        });

        test('创建卡片时应该初始化卡片状态', async () => {
            const card = await cardManager.createCard(mockInterventionContent);
            const cardState = cardManager.getCardState(card.id);

            expect(cardState).toBeTruthy();
            expect(cardState.id).toBe(card.id);
            expect(cardState.isVisible).toBe(true);
            expect(cardState.isAnimating).toBe(false);
            expect(cardState.isFocused).toBe(false);
            expect(cardState.isInStack).toBe(false);
        });

        test('创建卡片时传入空内容应该抛出错误', async () => {
            await expect(cardManager.createCard(null)).rejects.toThrow('创建卡片需要提供干预内容');
        });
    });

    describe('卡片动画', () => {
        let testCard;

        beforeEach(async () => {
            testCard = await cardManager.createCard(mockInterventionContent);
        });

        test('应该能够执行存档动画', async () => {
            const targetPosition = { x: 100, y: 400 };
            const success = await cardManager.animateCardToStack(testCard, targetPosition);

            expect(success).toBe(true);

            const cardState = cardManager.getCardState(testCard.id);
            expect(cardState.isInStack).toBe(true);
            expect(cardState.isFocused).toBe(false);
            expect(cardState.position).toEqual(targetPosition);
        });

        test('应该能够聚焦卡片', async () => {
            const success = await cardManager.focusCard(testCard.id);

            expect(success).toBe(true);
            expect(cardManager.getFocusedCardId()).toBe(testCard.id);

            const cardState = cardManager.getCardState(testCard.id);
            expect(cardState.isFocused).toBe(true);
            expect(cardState.isInStack).toBe(false);
            expect(cardState.scale).toBe(1);
        });

        test('聚焦新卡片时应该清除其他卡片的聚焦状态', async () => {
            // 创建第二张卡片
            const secondCard = await cardManager.createCard(mockInterventionContent);

            // 聚焦第一张卡片
            await cardManager.focusCard(testCard.id);
            expect(cardManager.getFocusedCardId()).toBe(testCard.id);

            // 聚焦第二张卡片
            await cardManager.focusCard(secondCard.id);
            expect(cardManager.getFocusedCardId()).toBe(secondCard.id);

            // 第一张卡片应该不再聚焦
            const firstCardState = cardManager.getCardState(testCard.id);
            expect(firstCardState.isFocused).toBe(false);
        });

        test('应该能够取消卡片聚焦', async () => {
            // 先聚焦卡片
            await cardManager.focusCard(testCard.id);
            expect(cardManager.getFocusedCardId()).toBe(testCard.id);

            // 取消聚焦
            const success = await cardManager.unfocusCard(testCard.id);
            expect(success).toBe(true);
            expect(cardManager.getFocusedCardId()).toBeNull();

            const cardState = cardManager.getCardState(testCard.id);
            expect(cardState.isFocused).toBe(false);
        });
    });

    describe('卡片滚动', () => {
        let testCards;

        beforeEach(async () => {
            // 创建多张卡片用于测试滚动
            testCards = [];
            for (let i = 0; i < 5; i++) {
                const content = new InterventionContent(
                    `/static/images/test${i}.jpg`,
                    `测试引导文案${i}`,
                    `测试食物${i}`
                );
                const card = await cardManager.createCard(content);

                // 将卡片设置为堆叠状态
                await cardManager.animateCardToStack(card, { x: i * 180, y: 400 });
                testCards.push(card);
            }
        });

        test('应该能够滚动到指定卡片', async () => {
            const targetCard = testCards[2];
            const success = await cardManager.scrollToCard(targetCard.id);

            expect(success).toBe(true);
        });

        test('应该能够计算正确的滚动位置', () => {
            const targetCard = testCards[2];
            const scrollPosition = cardManager.calculateScrollPosition(targetCard.id);

            expect(scrollPosition.x).toBe(2 * 220); // 卡片宽度200 + 间距20
            expect(scrollPosition.y).toBe(0);
        });

        test('应该能够获取堆叠中的卡片', () => {
            const stackCards = cardManager.getStackCards();

            expect(stackCards).toHaveLength(5);
            expect(stackCards[0].id).toBe(testCards[0].id);
        });

        test('应该能够处理卡片点击事件', async () => {
            const targetCard = testCards[1];
            const success = await cardManager.handleCardClick(targetCard.id);

            expect(success).toBe(true);
            expect(cardManager.getFocusedCardId()).toBe(targetCard.id);
        });

        test('点击已聚焦的卡片应该取消聚焦', async () => {
            const targetCard = testCards[1];

            // 先聚焦卡片
            await cardManager.focusCard(targetCard.id);
            expect(cardManager.getFocusedCardId()).toBe(targetCard.id);

            // 再次点击应该取消聚焦
            const success = await cardManager.handleCardClick(targetCard.id);
            expect(success).toBe(true);
            expect(cardManager.getFocusedCardId()).toBeNull();
        });
    });

    describe('卡片堆叠渲染', () => {
        let testCards;

        beforeEach(async () => {
            testCards = [];
            for (let i = 0; i < 3; i++) {
                const content = new InterventionContent(
                    `/static/images/test${i}.jpg`,
                    `测试引导文案${i}`,
                    `测试食物${i}`
                );
                const card = await cardManager.createCard(content);
                testCards.push(card);
            }
        });

        test('应该能够渲染卡片堆叠', () => {
            const renderResult = cardManager.renderCardStack(testCards);

            expect(renderResult.cards).toHaveLength(3);
            expect(renderResult.layout).toBeTruthy();
            expect(renderResult.totalCards).toBe(3);
            expect(renderResult.scrollable).toBe(false); // 3张卡片不需要滚动
        });

        test('应该能够计算堆叠布局', () => {
            const layout = cardManager.calculateStackLayout(testCards);

            expect(layout.positions).toHaveLength(3);
            expect(layout.cardWidth).toBe(160);
            expect(layout.cardHeight).toBe(120);
            expect(layout.stackY).toBe(400);
        });

        test('超过3张卡片时应该启用滚动', () => {
            // 创建更多卡片
            const moreCards = [...testCards];
            for (let i = 3; i < 6; i++) {
                moreCards.push({ id: `card${i}`, getDisplayData: () => ({}) });
            }

            const renderResult = cardManager.renderCardStack(moreCards);
            expect(renderResult.scrollable).toBe(true);
        });
    });

    describe('滚动惯性和回弹', () => {
        test('应该能够处理滚动惯性', async () => {
            const scrollData = {
                velocity: 100,
                position: { x: 200, y: 0 }
            };

            const finalPosition = await cardManager.handleScrollInertia(scrollData);

            expect(finalPosition).toBeTruthy();
            expect(typeof finalPosition.x).toBe('number');
            expect(typeof finalPosition.y).toBe('number');
        });

        test('超出边界时应该触发回弹效果', async () => {
            const scrollData = {
                velocity: -500, // 负速度，向左滚动
                position: { x: -100, y: 0 } // 已经超出左边界
            };

            const finalPosition = await cardManager.handleScrollInertia(scrollData);

            // 应该回弹到边界内
            expect(finalPosition.x).toBeGreaterThanOrEqual(0);
        });
    });

    describe('状态管理', () => {
        let testCard;

        beforeEach(async () => {
            testCard = await cardManager.createCard(mockInterventionContent);
        });

        test('应该能够更新卡片状态', () => {
            const updates = {
                isFocused: true,
                scale: 1.2,
                position: { x: 100, y: 200 }
            };

            cardManager.updateCardState(testCard.id, updates);

            const cardState = cardManager.getCardState(testCard.id);
            expect(cardState.isFocused).toBe(true);
            expect(cardState.scale).toBe(1.2);
            expect(cardState.position).toEqual({ x: 100, y: 200 });
        });

        test('应该能够移除卡片状态', () => {
            expect(cardManager.getCardState(testCard.id)).toBeTruthy();

            cardManager.removeCardState(testCard.id);

            expect(cardManager.getCardState(testCard.id)).toBeNull();
        });

        test('应该能够清除所有卡片状态', async () => {
            // 创建多张卡片
            const card2 = await cardManager.createCard(mockInterventionContent);
            const card3 = await cardManager.createCard(mockInterventionContent);

            expect(cardManager.getAllCardStates().size).toBe(3);

            cardManager.clearAllCardStates();

            expect(cardManager.getAllCardStates().size).toBe(0);
            expect(cardManager.getFocusedCardId()).toBeNull();
        });
    });

    describe('动画配置', () => {
        test('应该能够获取动画配置', () => {
            const archiveConfig = cardManager.getAnimationConfig('archive');
            expect(archiveConfig).toBeTruthy();
            expect(archiveConfig.duration).toBe(800);

            const focusConfig = cardManager.getAnimationConfig('focus');
            expect(focusConfig).toBeTruthy();
            expect(focusConfig.duration).toBe(600);
        });

        test('应该能够更新动画配置', () => {
            const newConfig = { duration: 1000 };
            cardManager.updateAnimationConfig('archive', newConfig);

            const updatedConfig = cardManager.getAnimationConfig('archive');
            expect(updatedConfig.duration).toBe(1000);
        });

        test('获取未知动画类型应该返回null', () => {
            const config = cardManager.getAnimationConfig('unknown');
            expect(config).toBeNull();
        });
    });

    describe('调试信息', () => {
        test('应该能够获取调试信息', async () => {
            const card1 = await cardManager.createCard(mockInterventionContent);
            const card2 = await cardManager.createCard(mockInterventionContent);

            await cardManager.focusCard(card1.id);

            const debugInfo = cardManager.getDebugInfo();

            expect(debugInfo.totalCards).toBe(2);
            expect(debugInfo.focusedCardId).toBe(card1.id);
            expect(debugInfo.cardStates).toHaveLength(2);
            expect(debugInfo.cardStates[0].isFocused).toBe(true);
        });
    });
});