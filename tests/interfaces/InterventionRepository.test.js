import { InterventionRepository } from '../../interfaces/InterventionRepository.js';
import { FoodInput } from '../../models/FoodInput.js';
import { InterventionContent } from '../../models/InterventionContent.js';

describe('InterventionRepository 数据仓库测试', () => {
    let repository;

    beforeEach(() => {
        repository = new InterventionRepository();
    });

    describe('构造函数', () => {
        test('应该正确初始化数据仓库', () => {
            const newRepository = new InterventionRepository();

            expect(newRepository.imageLibrary).toBeDefined();
            expect(newRepository.textLibrary).toBeDefined();
            expect(newRepository.quickSelectFoods).toBeInstanceOf(Array);
            expect(newRepository.quickSelectFoods.length).toBeGreaterThan(0);
        });

        test('应该自动初始化快捷选择食物列表', () => {
            expect(repository.quickSelectFoods).toContain('披萨');
            expect(repository.quickSelectFoods).toContain('炸鸡');
            expect(repository.quickSelectFoods).toContain('奶茶');
            expect(repository.quickSelectFoods).toContain('蛋糕');
            expect(repository.quickSelectFoods).toContain('薯条');
        });
    });

    describe('getInterventionContent 方法', () => {
        test('应该为有效输入返回完整的干预内容', async () => {
            const foodInput = new FoodInput('披萨');
            const content = await repository.getInterventionContent(foodInput);

            expect(content).toBeInstanceOf(InterventionContent);
            expect(content.isComplete()).toBe(true);
            expect(content.foodName).toBe('披萨');
            expect(content.imageResource).toContain('.jpg');
            expect(typeof content.guidanceText).toBe('string');
            expect(content.guidanceText.length).toBeGreaterThan(0);
        });

        test('应该为已知食物返回对应图片', async () => {
            const foodInput = new FoodInput('披萨');
            const content = await repository.getInterventionContent(foodInput);

            expect(content.imageResource).toBe('/static/images/pizza_unappetizing.jpg');
        });

        test('应该为未知食物返回默认图片', async () => {
            const foodInput = new FoodInput('未知食物');
            const content = await repository.getInterventionContent(foodInput);

            expect(content.imageResource).toBe('/static/images/default_unappetizing.jpg');
        });

        test('应该处理无效输入', async () => {
            const invalidInput = new FoodInput('');
            const content = await repository.getInterventionContent(invalidInput);

            expect(content).toBeInstanceOf(InterventionContent);
            expect(content.imageResource).toBe('/static/images/default_unappetizing.jpg');
            expect(content.guidanceText).toBe('先缓一缓，现在不急，晚点再决定');
        });

        test('应该处理 null 输入', async () => {
            const content = await repository.getInterventionContent(null);

            expect(content).toBeInstanceOf(InterventionContent);
            expect(content.imageResource).toBe('/static/images/default_unappetizing.jpg');
            expect(content.foodName).toBe('未知食物');
        });

        test('应该处理输入验证失败的情况', async () => {
            const invalidInput = { isValid: () => false, getCleanName: () => '' };
            const content = await repository.getInterventionContent(invalidInput);

            expect(content).toBeInstanceOf(InterventionContent);
            expect(content.imageResource).toBe('/static/images/default_unappetizing.jpg');
        });
    });

    describe('getQuickSelectFoods 方法', () => {
        test('应该返回快捷选择食物列表的副本', () => {
            const foods = repository.getQuickSelectFoods();

            expect(foods).toBeInstanceOf(Array);
            expect(foods.length).toBe(repository.quickSelectFoods.length);
            expect(foods).toEqual(repository.quickSelectFoods);

            // 确保返回的是副本
            expect(foods).not.toBe(repository.quickSelectFoods);
        });

        test('修改返回的数组不应该影响原始数据', () => {
            const foods = repository.getQuickSelectFoods();
            const originalLength = repository.quickSelectFoods.length;

            foods.push('新食物');

            expect(repository.quickSelectFoods.length).toBe(originalLength);
        });
    });

    describe('hasImageForFood 方法', () => {
        test('应该正确识别有图片的食物', () => {
            expect(repository.hasImageForFood('披萨')).toBe(true);
            expect(repository.hasImageForFood('炸鸡')).toBe(true);
        });

        test('应该正确识别没有图片的食物', () => {
            expect(repository.hasImageForFood('未知食物')).toBe(false);
        });
    });

    describe('getAllGuidanceTexts 方法', () => {
        test('应该返回所有引导文案', () => {
            const texts = repository.getAllGuidanceTexts();

            expect(texts).toBeInstanceOf(Array);
            expect(texts.length).toBeGreaterThan(0);
            expect(texts).toContain('先缓一缓，现在不急，晚点再决定');
        });
    });

    describe('addQuickSelectFood 方法', () => {
        test('应该能够添加新的快捷选择食物', () => {
            const originalLength = repository.quickSelectFoods.length;
            const newFood = '汉堡';

            repository.addQuickSelectFood(newFood);

            expect(repository.quickSelectFoods.length).toBe(originalLength + 1);
            expect(repository.quickSelectFoods).toContain(newFood);
        });

        test('应该避免重复添加相同食物', () => {
            const originalLength = repository.quickSelectFoods.length;
            const existingFood = '披萨';

            repository.addQuickSelectFood(existingFood);

            expect(repository.quickSelectFoods.length).toBe(originalLength);
        });

        test('应该拒绝无效输入', () => {
            const originalLength = repository.quickSelectFoods.length;

            repository.addQuickSelectFood('');
            repository.addQuickSelectFood(null);
            repository.addQuickSelectFood(undefined);
            repository.addQuickSelectFood(123);

            expect(repository.quickSelectFoods.length).toBe(originalLength);
        });
    });

    describe('reset 方法', () => {
        test('应该重置仓库到初始状态', () => {
            // 修改一些数据
            repository.addQuickSelectFood('新食物');

            // 重置
            repository.reset();

            // 验证重置后的状态
            expect(repository.quickSelectFoods).toEqual([
                '披萨',
                '炸鸡',
                '奶茶',
                '蛋糕',
                '薯条'
            ]);

            expect(repository.hasImageForFood('披萨')).toBe(true);
        });
    });

    describe('initialize 方法', () => {
        test('应该正确初始化所有组件', () => {
            const newRepository = new InterventionRepository();

            // 清空数据
            newRepository.quickSelectFoods = [];

            // 重新初始化
            newRepository.initialize();

            expect(newRepository.quickSelectFoods.length).toBe(5);
            expect(newRepository.hasImageForFood('披萨')).toBe(true);
        });
    });

    describe('错误处理', () => {
        test('getInterventionContent 应该处理图片库错误', async () => {
            // 模拟图片库错误
            repository.imageLibrary.getImageForFood = jest.fn(() => {
                throw new Error('图片库错误');
            });

            const foodInput = new FoodInput('测试食物');
            const content = await repository.getInterventionContent(foodInput);

            expect(content).toBeInstanceOf(InterventionContent);
            expect(content.imageResource).toBe('/static/images/default_unappetizing.jpg');
        });

        test('getInterventionContent 应该处理文案库错误', async () => {
            // 模拟文案库错误
            repository.textLibrary.getRandomGuidanceText = jest.fn(() => {
                throw new Error('文案库错误');
            });

            const foodInput = new FoodInput('测试食物');
            const content = await repository.getInterventionContent(foodInput);

            expect(content).toBeInstanceOf(InterventionContent);
            expect(content.guidanceText).toBe('先缓一缓，现在不急，晚点再决定');
        });
    });
});