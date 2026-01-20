import { TextLibrary } from '../../interfaces/TextLibrary.js';

describe('TextLibrary 文案库测试', () => {
    let textLibrary;

    beforeEach(() => {
        textLibrary = new TextLibrary();
    });

    describe('构造函数', () => {
        test('应该正确初始化文案库', () => {
            const newLibrary = new TextLibrary();

            expect(newLibrary.guidanceTexts).toBeInstanceOf(Array);
            expect(newLibrary.guidanceTexts.length).toBeGreaterThan(0);
        });

        test('应该自动初始化默认文案', () => {
            expect(textLibrary.guidanceTexts).toContain('先缓一缓，现在不急，晚点再决定');
            expect(textLibrary.guidanceTexts).toContain('深呼吸一下，给自己一点时间思考');
        });
    });

    describe('getRandomGuidanceText 方法', () => {
        test('应该返回有效的引导文案', () => {
            const text = textLibrary.getRandomGuidanceText();

            expect(typeof text).toBe('string');
            expect(text.length).toBeGreaterThan(0);
            expect(textLibrary.guidanceTexts).toContain(text);
        });

        test('多次调用应该可能返回不同的文案', () => {
            const texts = new Set();

            // 调用多次收集不同的文案
            for (let i = 0; i < 50; i++) {
                texts.add(textLibrary.getRandomGuidanceText());
            }

            // 如果文案库有多个文案，应该能收集到不同的文案
            if (textLibrary.guidanceTexts.length > 1) {
                expect(texts.size).toBeGreaterThan(1);
            }
        });

        test('空文案库应该返回默认文案', () => {
            textLibrary.clearAllTexts();
            const text = textLibrary.getRandomGuidanceText();

            expect(text).toBe('先缓一缓，现在不急，晚点再决定');
        });
    });

    describe('getAllGuidanceTexts 方法', () => {
        test('应该返回所有引导文案的副本', () => {
            const allTexts = textLibrary.getAllGuidanceTexts();

            expect(allTexts).toBeInstanceOf(Array);
            expect(allTexts.length).toBe(textLibrary.guidanceTexts.length);
            expect(allTexts).toEqual(textLibrary.guidanceTexts);

            // 确保返回的是副本，不是原数组的引用
            expect(allTexts).not.toBe(textLibrary.guidanceTexts);
        });

        test('修改返回的数组不应该影响原始数据', () => {
            const allTexts = textLibrary.getAllGuidanceTexts();
            const originalLength = textLibrary.guidanceTexts.length;

            allTexts.push('新增文案');

            expect(textLibrary.guidanceTexts.length).toBe(originalLength);
        });
    });

    describe('addGuidanceText 方法', () => {
        test('应该能够添加新的引导文案', () => {
            const newText = '这是一个新的引导文案';
            const originalLength = textLibrary.guidanceTexts.length;

            textLibrary.addGuidanceText(newText);

            expect(textLibrary.guidanceTexts.length).toBe(originalLength + 1);
            expect(textLibrary.guidanceTexts).toContain(newText);
        });

        test('应该自动清理文案前后的空格', () => {
            const textWithSpaces = '  带空格的文案  ';
            const cleanText = '带空格的文案';

            textLibrary.addGuidanceText(textWithSpaces);

            expect(textLibrary.guidanceTexts).toContain(cleanText);
            expect(textLibrary.guidanceTexts).not.toContain(textWithSpaces);
        });

        test('应该拒绝空字符串', () => {
            const originalLength = textLibrary.guidanceTexts.length;

            textLibrary.addGuidanceText('');
            textLibrary.addGuidanceText('   ');

            expect(textLibrary.guidanceTexts.length).toBe(originalLength);
        });

        test('应该拒绝非字符串输入', () => {
            const originalLength = textLibrary.guidanceTexts.length;

            textLibrary.addGuidanceText(null);
            textLibrary.addGuidanceText(undefined);
            textLibrary.addGuidanceText(123);
            textLibrary.addGuidanceText({});

            expect(textLibrary.guidanceTexts.length).toBe(originalLength);
        });
    });

    describe('getDefaultText 方法', () => {
        test('应该返回默认文案', () => {
            const defaultText = textLibrary.getDefaultText();

            expect(defaultText).toBe('先缓一缓，现在不急，晚点再决定');
        });
    });

    describe('isValidText 方法', () => {
        test('应该验证有效文案', () => {
            expect(textLibrary.isValidText('有效的文案')).toBe(true);
            expect(textLibrary.isValidText('  有效的文案  ')).toBe(true);
        });

        test('应该拒绝无效文案', () => {
            expect(textLibrary.isValidText('')).toBe(false);
            expect(textLibrary.isValidText('   ')).toBe(false);
            expect(textLibrary.isValidText(null)).toBe(false);
            expect(textLibrary.isValidText(undefined)).toBe(false);
            expect(textLibrary.isValidText(123)).toBe(false);
            expect(textLibrary.isValidText({})).toBe(false);
        });
    });

    describe('clearAllTexts 方法', () => {
        test('应该清空所有文案', () => {
            textLibrary.clearAllTexts();

            expect(textLibrary.guidanceTexts.length).toBe(0);
        });

        test('清空后 getRandomGuidanceText 应该返回默认文案', () => {
            textLibrary.clearAllTexts();
            const text = textLibrary.getRandomGuidanceText();

            expect(text).toBe('先缓一缓，现在不急，晚点再决定');
        });
    });

    describe('resetToDefault 方法', () => {
        test('应该重置为默认文案', () => {
            // 添加一些自定义文案
            textLibrary.addGuidanceText('自定义文案1');
            textLibrary.addGuidanceText('自定义文案2');

            const originalDefaultCount = 8; // 根据 initializeDefaultTexts 中的数量

            // 重置
            textLibrary.resetToDefault();

            expect(textLibrary.guidanceTexts.length).toBe(originalDefaultCount);
            expect(textLibrary.guidanceTexts).toContain('先缓一缓，现在不急，晚点再决定');
            expect(textLibrary.guidanceTexts).not.toContain('自定义文案1');
        });
    });

    describe('initializeDefaultTexts 方法', () => {
        test('应该初始化所有默认文案', () => {
            const newLibrary = new TextLibrary();
            newLibrary.clearAllTexts();
            newLibrary.initializeDefaultTexts();

            const expectedTexts = [
                '先缓一缓，现在不急，晚点再决定',
                '深呼吸一下，给自己一点时间思考',
                '也许过一会儿就不那么想吃了',
                '现在暂停一下，听听身体真正的需要',
                '等等再说，先做点别的事情',
                '给自己一个选择的机会，稍后再看',
                '这个想法可以先放一放',
                '让时间帮你做决定'
            ];

            expectedTexts.forEach(text => {
                expect(newLibrary.guidanceTexts).toContain(text);
            });

            expect(newLibrary.guidanceTexts.length).toBe(expectedTexts.length);
        });
    });
});