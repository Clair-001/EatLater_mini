import { InterventionContent } from '../../models/InterventionContent.js';

describe('InterventionContent 数据类测试', () => {
    describe('构造函数', () => {
        test('应该正确创建 InterventionContent 实例', () => {
            const content = new InterventionContent(
                '/static/images/pizza.jpg',
                '先缓一缓，现在不急，晚点再决定',
                '披萨'
            );

            expect(content.imageResource).toBe('/static/images/pizza.jpg');
            expect(content.guidanceText).toBe('先缓一缓，现在不急，晚点再决定');
            expect(content.foodName).toBe('披萨');
            expect(typeof content.createdAt).toBe('number');
            expect(content.createdAt).toBeGreaterThan(0);
        });

        test('应该处理空参数', () => {
            const content = new InterventionContent('', '', '');

            expect(content.imageResource).toBe('');
            expect(content.guidanceText).toBe('');
            expect(content.foodName).toBe('');
            expect(typeof content.createdAt).toBe('number');
        });
    });

    describe('isComplete 方法', () => {
        test('应该验证完整的内容', () => {
            const completeContent = new InterventionContent(
                '/static/images/pizza.jpg',
                '先缓一缓，现在不急，晚点再决定',
                '披萨'
            );

            expect(completeContent.isComplete()).toBe(true);
        });

        test('应该拒绝缺少图片资源的内容', () => {
            const incompleteContent = new InterventionContent(
                '',
                '先缓一缓，现在不急，晚点再决定',
                '披萨'
            );

            expect(incompleteContent.isComplete()).toBe(false);
        });

        test('应该拒绝缺少引导文案的内容', () => {
            const incompleteContent = new InterventionContent(
                '/static/images/pizza.jpg',
                '',
                '披萨'
            );

            expect(incompleteContent.isComplete()).toBe(false);
        });

        test('应该拒绝缺少食物名称的内容', () => {
            const incompleteContent = new InterventionContent(
                '/static/images/pizza.jpg',
                '先缓一缓，现在不急，晚点再决定',
                ''
            );

            expect(incompleteContent.isComplete()).toBe(false);
        });

        test('应该拒绝所有字段都为空的内容', () => {
            const emptyContent = new InterventionContent('', '', '');

            expect(emptyContent.isComplete()).toBe(false);
        });
    });

    describe('getDisplayData 方法', () => {
        test('应该返回正确的显示数据对象', () => {
            const content = new InterventionContent(
                '/static/images/pizza.jpg',
                '先缓一缓，现在不急，晚点再决定',
                '披萨'
            );

            const displayData = content.getDisplayData();

            expect(displayData).toEqual({
                image: '/static/images/pizza.jpg',
                text: '先缓一缓，现在不急，晚点再决定',
                food: '披萨',
                timestamp: content.createdAt
            });
        });

        test('应该包含创建时间戳', () => {
            const content = new InterventionContent(
                '/static/images/cake.jpg',
                '深呼吸一下，给自己一点时间思考',
                '蛋糕'
            );

            const displayData = content.getDisplayData();

            expect(displayData.timestamp).toBe(content.createdAt);
            expect(typeof displayData.timestamp).toBe('number');
        });
    });

    describe('时间戳功能', () => {
        test('不同实例应该有不同的时间戳', async () => {
            const content1 = new InterventionContent(
                '/static/images/pizza.jpg',
                '文案1',
                '食物1'
            );

            // 等待一毫秒确保时间戳不同
            await new Promise(resolve => setTimeout(resolve, 1));

            const content2 = new InterventionContent(
                '/static/images/cake.jpg',
                '文案2',
                '食物2'
            );

            expect(content2.createdAt).toBeGreaterThan(content1.createdAt);
        });
    });
});