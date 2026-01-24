/**
 * ArchiveCard 测试
 */

import { ArchiveCard } from '../../models/ArchiveCard.js';
import { InterventionContent } from '../../models/InterventionContent.js';

describe('ArchiveCard', () => {
    let interventionContent;

    beforeEach(() => {
        interventionContent = new InterventionContent(
            '/static/images/pizza.jpg',
            '先缓一缓，现在不急，晚点再决定',
            '披萨'
        );
    });

    describe('初始化', () => {
        test('应该正确创建存档卡片', () => {
            const card = new ArchiveCard(interventionContent);

            expect(card).toBeDefined();
            expect(card.id).toBeDefined();
            expect(card.foodName).toBe('披萨');
            expect(card.imageResource).toBe('/static/images/pizza.jpg');
            expect(card.guidanceText).toBe('先缓一缓，现在不急，晚点再决定');
            expect(card.timestamp).toBeDefined();
        });

        test('应该在没有干预内容时抛出错误', () => {
            expect(() => {
                new ArchiveCard(null);
            }).toThrow('创建存档卡片需要提供干预内容');
        });

        test('应该生成唯一的卡片ID', () => {
            const card1 = new ArchiveCard(interventionContent);
            const card2 = new ArchiveCard(interventionContent);

            expect(card1.id).toBeDefined();
            expect(card2.id).toBeDefined();
            expect(card1.id).not.toBe(card2.id);
            expect(card1.id).toMatch(/^card_\d+_[a-z0-9]+$/);
        });

        test('应该正确设置元数据', () => {
            const card = new ArchiveCard(interventionContent);

            expect(card.metadata).toBeDefined();
            expect(card.metadata.cardType).toBe('intervention');
            expect(card.metadata.version).toBe('1.0');
            expect(card.metadata.createdAt).toBeDefined();
            expect(card.metadata.sessionId).toBeDefined();
        });

        test('应该正确生成缩略图路径', () => {
            const card = new ArchiveCard(interventionContent);

            expect(card.thumbnailResource).toBeDefined();
            expect(card.thumbnailResource).toContain('thumbnails');
            expect(card.thumbnailResource).toContain('thumb');
        });
    });

    describe('显示数据', () => {
        test('应该正确获取显示数据', () => {
            const card = new ArchiveCard(interventionContent);
            const displayData = card.getDisplayData();

            expect(displayData).toHaveProperty('id');
            expect(displayData).toHaveProperty('foodName');
            expect(displayData).toHaveProperty('image');
            expect(displayData).toHaveProperty('guidanceText');
            expect(displayData).toHaveProperty('timestamp');
            expect(displayData).toHaveProperty('formattedTime');
            expect(displayData).toHaveProperty('metadata');

            expect(displayData.foodName).toBe('披萨');
            expect(displayData.guidanceText).toBe('先缓一缓，现在不急，晚点再决定');
        });

        test('应该正确获取完整内容数据', () => {
            const card = new ArchiveCard(interventionContent);
            const fullData = card.getFullContentData();

            expect(fullData).toHaveProperty('id');
            expect(fullData).toHaveProperty('foodName');
            expect(fullData).toHaveProperty('imageResource');
            expect(fullData).toHaveProperty('thumbnailResource');
            expect(fullData).toHaveProperty('guidanceText');
            expect(fullData).toHaveProperty('timestamp');
            expect(fullData).toHaveProperty('metadata');
            expect(fullData).toHaveProperty('displayConfig');
            expect(fullData).toHaveProperty('interactionState');
        });

        test('应该正确格式化时间', () => {
            const card = new ArchiveCard(interventionContent);
            const formattedTime = card.getFormattedTime();

            expect(formattedTime).toBeDefined();
            expect(typeof formattedTime).toBe('string');
            expect(formattedTime).toBe('刚刚'); // 刚创建的卡片应该显示"刚刚"
        });

        test('应该正确处理较旧的时间戳', () => {
            const card = new ArchiveCard(interventionContent);
            // 设置为5分钟前
            card.timestamp = Date.now() - (5 * 60 * 1000);

            const formattedTime = card.getFormattedTime();
            expect(formattedTime).toBe('5分钟前');
        });
    });

    describe('交互状态', () => {
        test('应该正确设置聚焦状态', () => {
            const card = new ArchiveCard(interventionContent);

            expect(card.interactionState.isFocused).toBe(false);
            expect(card.interactionState.viewCount).toBe(0);

            card.setFocused();

            expect(card.interactionState.isFocused).toBe(true);
            expect(card.interactionState.viewCount).toBe(1);
            expect(card.interactionState.lastViewedAt).toBeDefined();
        });

        test('应该正确取消聚焦状态', () => {
            const card = new ArchiveCard(interventionContent);

            card.setFocused();
            expect(card.interactionState.isFocused).toBe(true);

            card.clearFocus();
            expect(card.interactionState.isFocused).toBe(false);
        });

        test('应该正确设置选中状态', () => {
            const card = new ArchiveCard(interventionContent);

            expect(card.interactionState.isSelected).toBe(false);

            card.setSelected(true);
            expect(card.interactionState.isSelected).toBe(true);

            card.setSelected(false);
            expect(card.interactionState.isSelected).toBe(false);
        });

        test('应该正确更新显示配置', () => {
            const card = new ArchiveCard(interventionContent);

            const newConfig = {
                showThumbnail: false,
                cardSize: 'large'
            };

            card.updateDisplayConfig(newConfig);

            expect(card.displayConfig.showThumbnail).toBe(false);
            expect(card.displayConfig.cardSize).toBe('large');
            expect(card.displayConfig.showFoodName).toBe(true); // 应该保留原有配置
        });
    });

    describe('验证和工具方法', () => {
        test('应该正确验证卡片有效性', () => {
            const card = new ArchiveCard(interventionContent);
            expect(card.isValid()).toBe(true);

            // 破坏卡片数据
            card.foodName = '';
            expect(card.isValid()).toBe(false);
        });

        test('应该正确获取卡片摘要', () => {
            const card = new ArchiveCard(interventionContent);
            const summary = card.getSummary();

            expect(summary).toHaveProperty('id');
            expect(summary).toHaveProperty('foodName');
            expect(summary).toHaveProperty('timestamp');
            expect(summary).toHaveProperty('formattedTime');
            expect(summary).toHaveProperty('viewCount');
            expect(summary).toHaveProperty('sessionId');

            expect(summary.foodName).toBe('披萨');
            expect(summary.viewCount).toBe(0);
        });

        test('应该正确克隆卡片', () => {
            const card = new ArchiveCard(interventionContent);
            card.setFocused(); // 设置一些状态

            const clonedCard = card.clone();

            expect(clonedCard).toBeDefined();
            expect(clonedCard.id).not.toBe(card.id); // 克隆应该有新的ID
            expect(clonedCard.foodName).toBe(card.foodName);
            expect(clonedCard.imageResource).toBe(card.imageResource);
            expect(clonedCard.guidanceText).toBe(card.guidanceText);
        });

        test('应该正确转换为JSON', () => {
            const card = new ArchiveCard(interventionContent);
            const jsonString = card.toJSON();

            expect(jsonString).toBeDefined();
            expect(typeof jsonString).toBe('string');

            const parsedData = JSON.parse(jsonString);
            expect(parsedData.foodName).toBe('披萨');
            expect(parsedData.id).toBe(card.id);
        });

        test('应该正确从JSON创建卡片', () => {
            const card = new ArchiveCard(interventionContent);
            const jsonData = card.getFullContentData();

            const restoredCard = ArchiveCard.fromJSON(jsonData);

            expect(restoredCard).toBeDefined();
            expect(restoredCard.foodName).toBe(card.foodName);
            expect(restoredCard.imageResource).toBe(card.imageResource);
            expect(restoredCard.guidanceText).toBe(card.guidanceText);
        });

        test('应该在无效JSON数据时返回null', () => {
            const result1 = ArchiveCard.fromJSON(null);
            const result2 = ArchiveCard.fromJSON('invalid');

            expect(result1).toBeNull();
            expect(result2).toBeNull();
        });

        test('应该正确获取调试信息', () => {
            const card = new ArchiveCard(interventionContent);
            const debugInfo = card.getDebugInfo();

            expect(debugInfo).toHaveProperty('id');
            expect(debugInfo).toHaveProperty('foodName');
            expect(debugInfo).toHaveProperty('hasImage');
            expect(debugInfo).toHaveProperty('hasThumbnail');
            expect(debugInfo).toHaveProperty('hasGuidanceText');
            expect(debugInfo).toHaveProperty('timestamp');
            expect(debugInfo).toHaveProperty('age');
            expect(debugInfo).toHaveProperty('isValid');

            expect(debugInfo.hasImage).toBe(true);
            expect(debugInfo.hasThumbnail).toBe(true);
            expect(debugInfo.hasGuidanceText).toBe(true);
            expect(debugInfo.isValid).toBe(true);
        });
    });

    describe('缩略图处理', () => {
        test('应该正确处理普通图片路径', () => {
            const content = new InterventionContent('/static/images/pizza.jpg', '测试文案', '披萨');
            const card = new ArchiveCard(content);

            expect(card.thumbnailResource).toBe('/static/images/thumbnails/pizza_thumb.jpg');
        });

        test('应该正确处理已经是缩略图的路径', () => {
            const content = new InterventionContent('/static/images/thumbnails/pizza_thumb.jpg', '测试文案', '披萨');
            const card = new ArchiveCard(content);

            expect(card.thumbnailResource).toBe('/static/images/thumbnails/pizza_thumb.jpg');
        });

        test('应该正确处理空图片路径', () => {
            const content = new InterventionContent('', '测试文案', '披萨');
            const card = new ArchiveCard(content);

            expect(card.thumbnailResource).toBe('/static/images/default_thumbnail.jpg');
        });

        test('应该正确处理无扩展名的图片路径', () => {
            const content = new InterventionContent('/static/images/pizza', '测试文案', '披萨');
            const card = new ArchiveCard(content);

            expect(card.thumbnailResource).toBe('/static/images/thumbnails/pizza_thumb.jpg');
        });
    });

    describe('会话ID生成', () => {
        test('应该生成有效的会话ID', () => {
            const card = new ArchiveCard(interventionContent);

            expect(card.metadata.sessionId).toBeDefined();
            expect(card.metadata.sessionId).toMatch(/^session_\d{8}_\d+$/);
        });

        test('应该在同一小时内生成相同的会话ID前缀', () => {
            const card1 = new ArchiveCard(interventionContent);
            const card2 = new ArchiveCard(interventionContent);

            const sessionId1 = card1.metadata.sessionId;
            const sessionId2 = card2.metadata.sessionId;

            // 会话ID的日期部分应该相同
            const datePart1 = sessionId1.split('_')[1];
            const datePart2 = sessionId2.split('_')[1];
            expect(datePart1).toBe(datePart2);
        });
    });
});