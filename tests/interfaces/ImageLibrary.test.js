import { ImageLibrary } from '../../interfaces/ImageLibrary.js';

describe('ImageLibrary 图片库测试', () => {
    let imageLibrary;

    beforeEach(() => {
        imageLibrary = new ImageLibrary();
        imageLibrary.initializeDefaultMappings();
    });

    describe('构造函数', () => {
        test('应该正确初始化图片库', () => {
            const newLibrary = new ImageLibrary();

            expect(newLibrary.imageMapping).toBeInstanceOf(Map);
            expect(newLibrary.defaultImagePath).toBe('/static/images/default_unappetizing.jpg');
        });
    });

    describe('getImageForFood 方法', () => {
        test('应该为已知食物返回对应图片', () => {
            const pizzaImage = imageLibrary.getImageForFood('披萨');
            expect(pizzaImage).toBe('/static/images/pizza_unappetizing.jpg');

            const chickenImage = imageLibrary.getImageForFood('炸鸡');
            expect(chickenImage).toBe('/static/images/chicken_unappetizing.jpg');
        });

        test('应该处理大小写不敏感的匹配', () => {
            const pizzaImage = imageLibrary.getImageForFood('PIZZA');
            expect(pizzaImage).toBe('/static/images/pizza_unappetizing.jpg');

            const chickenImage = imageLibrary.getImageForFood('炸鸡');
            expect(chickenImage).toBe('/static/images/chicken_unappetizing.jpg');
        });

        test('应该处理包含关键词的食物名称', () => {
            const pizzaImage = imageLibrary.getImageForFood('意大利披萨');
            expect(pizzaImage).toBe('/static/images/pizza_unappetizing.jpg');

            const chickenImage = imageLibrary.getImageForFood('香辣炸鸡腿');
            expect(chickenImage).toBe('/static/images/chicken_unappetizing.jpg');
        });

        test('应该为未知食物返回默认图片', () => {
            const unknownImage = imageLibrary.getImageForFood('未知食物');
            expect(unknownImage).toBe('/static/images/default_unappetizing.jpg');
        });

        test('应该处理空输入', () => {
            expect(imageLibrary.getImageForFood('')).toBe('/static/images/default_unappetizing.jpg');
            expect(imageLibrary.getImageForFood(null)).toBe('/static/images/default_unappetizing.jpg');
            expect(imageLibrary.getImageForFood(undefined)).toBe('/static/images/default_unappetizing.jpg');
        });

        test('应该处理非字符串输入', () => {
            expect(imageLibrary.getImageForFood(123)).toBe('/static/images/default_unappetizing.jpg');
            expect(imageLibrary.getImageForFood({})).toBe('/static/images/default_unappetizing.jpg');
            expect(imageLibrary.getImageForFood([])).toBe('/static/images/default_unappetizing.jpg');
        });

        test('应该处理只包含空格的输入', () => {
            const result = imageLibrary.getImageForFood('   ');
            expect(result).toBe('/static/images/default_unappetizing.jpg');
        });
    });

    describe('getDefaultImage 方法', () => {
        test('应该返回默认图片路径', () => {
            const defaultImage = imageLibrary.getDefaultImage();
            expect(defaultImage).toBe('/static/images/default_unappetizing.jpg');
        });
    });

    describe('isImageAvailable 方法', () => {
        test('应该正确识别有图片的食物', () => {
            expect(imageLibrary.isImageAvailable('披萨')).toBe(true);
            expect(imageLibrary.isImageAvailable('炸鸡')).toBe(true);
            expect(imageLibrary.isImageAvailable('奶茶')).toBe(true);
        });

        test('应该正确识别没有图片的食物', () => {
            expect(imageLibrary.isImageAvailable('未知食物')).toBe(false);
            expect(imageLibrary.isImageAvailable('随机食物')).toBe(false);
        });

        test('应该处理空输入', () => {
            expect(imageLibrary.isImageAvailable('')).toBe(false);
            expect(imageLibrary.isImageAvailable(null)).toBe(false);
            expect(imageLibrary.isImageAvailable(undefined)).toBe(false);
        });

        test('应该处理非字符串输入', () => {
            expect(imageLibrary.isImageAvailable(123)).toBe(false);
            expect(imageLibrary.isImageAvailable({})).toBe(false);
        });
    });

    describe('addImageMapping 方法', () => {
        test('应该能够添加新的图片映射', () => {
            const keywords = ['汉堡', 'burger'];
            const imagePath = '/static/images/burger_unappetizing.jpg';

            imageLibrary.addImageMapping(keywords, imagePath);

            expect(imageLibrary.getImageForFood('汉堡')).toBe(imagePath);
            expect(imageLibrary.getImageForFood('burger')).toBe(imagePath);
            expect(imageLibrary.isImageAvailable('汉堡')).toBe(true);
        });

        test('新添加的映射应该覆盖默认图片', () => {
            const keywords = ['测试食物'];
            const imagePath = '/static/images/test_food.jpg';

            // 确认开始时返回默认图片
            expect(imageLibrary.getImageForFood('测试食物')).toBe('/static/images/default_unappetizing.jpg');

            // 添加映射
            imageLibrary.addImageMapping(keywords, imagePath);

            // 确认现在返回新图片
            expect(imageLibrary.getImageForFood('测试食物')).toBe(imagePath);
        });
    });

    describe('initializeDefaultMappings 方法', () => {
        test('应该初始化所有默认映射', () => {
            const newLibrary = new ImageLibrary();
            newLibrary.initializeDefaultMappings();

            // 测试快餐类
            expect(newLibrary.isImageAvailable('披萨')).toBe(true);
            expect(newLibrary.isImageAvailable('炸鸡')).toBe(true);

            // 测试饮品类
            expect(newLibrary.isImageAvailable('奶茶')).toBe(true);

            // 测试甜品类
            expect(newLibrary.isImageAvailable('蛋糕')).toBe(true);

            // 测试零食类
            expect(newLibrary.isImageAvailable('薯条')).toBe(true);
        });

        test('默认映射应该支持多个关键词', () => {
            expect(imageLibrary.getImageForFood('pizza')).toBe('/static/images/pizza_unappetizing.jpg');
            expect(imageLibrary.getImageForFood('比萨')).toBe('/static/images/pizza_unappetizing.jpg');

            expect(imageLibrary.getImageForFood('鸡腿')).toBe('/static/images/chicken_unappetizing.jpg');
            expect(imageLibrary.getImageForFood('肯德基')).toBe('/static/images/chicken_unappetizing.jpg');
        });
    });
});