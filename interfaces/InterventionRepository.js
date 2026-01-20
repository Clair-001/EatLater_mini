import { ImageLibrary } from './ImageLibrary.js';
import { TextLibrary } from './TextLibrary.js';
import { InterventionContent } from '../models/InterventionContent.js';

/**
 * 数据仓库接口
 * 整合图片库和文案库，提供统一的数据访问接口
 */
export class InterventionRepository {
    constructor() {
        this.imageLibrary = new ImageLibrary();
        this.textLibrary = new TextLibrary();
        this.quickSelectFoods = [];

        this.initialize();
    }

    /**
     * 获取干预内容
     * @param {import('../models/FoodInput.js').FoodInput} foodInput - 食物输入对象
     * @returns {Promise<InterventionContent>} 干预内容
     */
    async getInterventionContent(foodInput) {
        try {
            if (!foodInput || !foodInput.isValid()) {
                throw new Error('无效的食物输入');
            }

            const foodName = foodInput.getCleanName();
            const imageResource = this.imageLibrary.getImageForFood(foodName);
            const guidanceText = this.textLibrary.getRandomGuidanceText();

            return new InterventionContent(imageResource, guidanceText, foodName);
        } catch (error) {
            console.error('获取干预内容失败:', error);

            // 返回默认内容
            return new InterventionContent(
                this.imageLibrary.getDefaultImage(),
                this.textLibrary.getDefaultText(),
                foodInput ? foodInput.getCleanName() : '未知食物'
            );
        }
    }

    /**
     * 获取快捷选择食物列表
     * @returns {Array<string>} 快捷选择食物列表
     */
    getQuickSelectFoods() {
        return [...this.quickSelectFoods];
    }

    /**
     * 检查食物是否有对应图片
     * @param {string} foodName - 食物名称
     * @returns {boolean} 是否有对应图片
     */
    hasImageForFood(foodName) {
        return this.imageLibrary.isImageAvailable(foodName);
    }

    /**
     * 获取所有可用的引导文案
     * @returns {Array<string>} 所有引导文案
     */
    getAllGuidanceTexts() {
        return this.textLibrary.getAllGuidanceTexts();
    }

    /**
     * 添加新的快捷选择食物
     * @param {string} foodName - 食物名称
     */
    addQuickSelectFood(foodName) {
        if (foodName && typeof foodName === 'string' && !this.quickSelectFoods.includes(foodName)) {
            this.quickSelectFoods.push(foodName);
        }
    }

    /**
     * 初始化仓库
     */
    initialize() {
        // 初始化图片库
        this.imageLibrary.initializeDefaultMappings();

        // 初始化快捷选择食物列表
        this.quickSelectFoods = [
            '披萨',
            '炸鸡',
            '奶茶',
            '蛋糕',
            '薯条'
        ];
    }

    /**
     * 重置仓库到初始状态
     */
    reset() {
        this.imageLibrary = new ImageLibrary();
        this.textLibrary = new TextLibrary();
        this.quickSelectFoods = [];
        this.initialize();
    }

    /**
     * 清理缓存数据
     * 清理临时缓存，但保留核心配置
     */
    clearCache() {
        try {
            console.log('清理数据仓库缓存');

            // 清理图片库缓存
            if (this.imageLibrary && typeof this.imageLibrary.clearCache === 'function') {
                this.imageLibrary.clearCache();
            }

            // 清理文案库缓存
            if (this.textLibrary && typeof this.textLibrary.clearCache === 'function') {
                this.textLibrary.clearCache();
            }

            // 清理临时存储的内容缓存
            this.clearTemporaryContentCache();

            console.log('数据仓库缓存清理完成');

        } catch (error) {
            console.error('清理数据仓库缓存时发生错误:', error);
        }
    }

    /**
     * 清理临时内容缓存
     */
    clearTemporaryContentCache() {
        try {
            // 清理可能存在的临时内容缓存
            const tempCacheKeys = [
                'lastInterventionContent',
                'recentFoodInputs',
                'imageLoadCache',
                'textSelectionCache'
            ];

            tempCacheKeys.forEach(key => {
                try {
                    if (typeof uni !== 'undefined' && uni.removeStorageSync) {
                        uni.removeStorageSync(key);
                    }
                } catch (error) {
                    console.warn(`清理内容缓存失败: ${key}`, error);
                }
            });

        } catch (error) {
            console.error('清理临时内容缓存时发生错误:', error);
        }
    }

    /**
     * 深度清理所有数据
     * 包括配置和缓存
     */
    deepClean() {
        try {
            console.log('深度清理数据仓库');

            // 清理缓存
            this.clearCache();

            // 重置到初始状态
            this.reset();

            console.log('数据仓库深度清理完成');

        } catch (error) {
            console.error('深度清理数据仓库时发生错误:', error);
        }
    }
}