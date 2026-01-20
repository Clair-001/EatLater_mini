import { FoodInput } from '../../models/FoodInput.js';

describe('FoodInput 数据类测试', () => {
    describe('构造函数', () => {
        test('应该正确创建 FoodInput 实例', () => {
            const foodInput = new FoodInput('披萨');

            expect(foodInput.name).toBe('披萨');
            expect(typeof foodInput.timestamp).toBe('number');
            expect(foodInput.timestamp).toBeGreaterThan(0);
        });

        test('应该处理空字符串输入', () => {
            const foodInput = new FoodInput('');

            expect(foodInput.name).toBe('');
            expect(typeof foodInput.timestamp).toBe('number');
        });

        test('应该处理 null 输入', () => {
            const foodInput = new FoodInput(null);

            expect(foodInput.name).toBeNull();
            expect(typeof foodInput.timestamp).toBe('number');
        });
    });

    describe('isValid 方法', () => {
        test('应该验证有效输入', () => {
            const validInput = new FoodInput('炸鸡');
            expect(validInput.isValid()).toBe(true);
        });

        test('应该拒绝空字符串', () => {
            const emptyInput = new FoodInput('');
            expect(emptyInput.isValid()).toBe(false);
        });

        test('应该拒绝只包含空格的字符串', () => {
            const whitespaceInput = new FoodInput('   ');
            expect(whitespaceInput.isValid()).toBe(false);
        });

        test('应该拒绝 null 输入', () => {
            const nullInput = new FoodInput(null);
            expect(nullInput.isValid()).toBe(false);
        });

        test('应该拒绝 undefined 输入', () => {
            const undefinedInput = new FoodInput(undefined);
            expect(undefinedInput.isValid()).toBe(false);
        });
    });

    describe('getCleanName 方法', () => {
        test('应该清理前后空格', () => {
            const input = new FoodInput('  奶茶  ');
            expect(input.getCleanName()).toBe('奶茶');
        });

        test('应该处理空字符串', () => {
            const input = new FoodInput('');
            expect(input.getCleanName()).toBe('');
        });

        test('应该处理 null 输入', () => {
            const input = new FoodInput(null);
            expect(input.getCleanName()).toBe('');
        });

        test('应该保持有效字符串不变', () => {
            const input = new FoodInput('蛋糕');
            expect(input.getCleanName()).toBe('蛋糕');
        });
    });

    describe('时间戳功能', () => {
        test('不同实例应该有不同的时间戳', async () => {
            const input1 = new FoodInput('食物1');

            // 等待一毫秒确保时间戳不同
            await new Promise(resolve => setTimeout(resolve, 1));

            const input2 = new FoodInput('食物2');

            expect(input2.timestamp).toBeGreaterThan(input1.timestamp);
        });
    });
});