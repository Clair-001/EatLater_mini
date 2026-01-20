/**
 * 文案库接口
 * 定义文案库的核心功能
 */
export class TextLibrary {
    constructor() {
        this.guidanceTexts = [];
        this.initializeDefaultTexts();
    }

    /**
     * 获取随机引导文案
     * @returns {string} 随机引导文案
     */
    getRandomGuidanceText() {
        if (this.guidanceTexts.length === 0) {
            return this.getDefaultText();
        }

        const randomIndex = Math.floor(Math.random() * this.guidanceTexts.length);
        return this.guidanceTexts[randomIndex];
    }

    /**
     * 获取所有引导文案
     * @returns {Array<string>} 所有引导文案
     */
    getAllGuidanceTexts() {
        return [...this.guidanceTexts];
    }

    /**
     * 添加新的引导文案
     * @param {string} text - 新的引导文案
     */
    addGuidanceText(text) {
        if (text && typeof text === 'string' && text.trim().length > 0) {
            this.guidanceTexts.push(text.trim());
        }
    }

    /**
     * 获取默认文案
     * @returns {string} 默认文案
     */
    getDefaultText() {
        return '先缓一缓，现在不急，晚点再决定';
    }

    /**
     * 验证文案是否有效
     * @param {string} text - 待验证的文案
     * @returns {boolean} 文案是否有效
     */
    isValidText(text) {
        return !!(text && typeof text === 'string' && text.trim().length > 0);
    }

    /**
     * 初始化默认文案
     */
    initializeDefaultTexts() {
        const defaultTexts = [
            '先缓一缓，现在不急，晚点再决定',
            '深呼吸一下，给自己一点时间思考',
            '也许过一会儿就不那么想吃了',
            '现在暂停一下，听听身体真正的需要',
            '等等再说，先做点别的事情',
            '给自己一个选择的机会，稍后再看',
            '这个想法可以先放一放',
            '让时间帮你做决定'
        ];

        this.guidanceTexts = [...defaultTexts];
    }

    /**
     * 清空所有文案
     */
    clearAllTexts() {
        this.guidanceTexts = [];
    }

    /**
     * 重置为默认文案
     */
    resetToDefault() {
        this.guidanceTexts = [];
        this.initializeDefaultTexts();
    }

    /**
     * 清理缓存
     * 清理可能存在的临时缓存数据
     */
    clearCache() {
        try {
            console.log('清理文案库缓存');

            // 清理可能存在的文案选择缓存
            const cacheKeys = [
                'lastSelectedText',
                'textSelectionHistory',
                'recentTexts'
            ];

            cacheKeys.forEach(key => {
                try {
                    if (typeof uni !== 'undefined' && uni.removeStorageSync) {
                        uni.removeStorageSync(key);
                    }
                } catch (error) {
                    console.warn(`清理文案缓存失败: ${key}`, error);
                }
            });

            console.log('文案库缓存清理完成');

        } catch (error) {
            console.error('清理文案库缓存时发生错误:', error);
        }
    }
}