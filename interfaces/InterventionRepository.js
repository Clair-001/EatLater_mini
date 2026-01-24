import { ImageLibrary } from './ImageLibrary.js';
import { TextLibrary } from './TextLibrary.js';
import { InterventionContent } from '../models/InterventionContent.js';
import { SessionArchiveStorage } from './SessionArchiveStorage.js';
import { ArchiveCard } from '../models/ArchiveCard.js';

/**
 * 数据仓库接口
 * 整合图片库和文案库，提供统一的数据访问接口
 */
export class InterventionRepository {
    constructor() {
        this.imageLibrary = new ImageLibrary();
        this.textLibrary = new TextLibrary();
        this.quickSelectFoods = [];

        // 会话存档存储
        this.sessionArchive = new SessionArchiveStorage();

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

            // 清理会话存档
            if (this.sessionArchive) {
                this.sessionArchive.clearSessionCards();
            }

            // 重置到初始状态
            this.reset();

            console.log('数据仓库深度清理完成');

        } catch (error) {
            console.error('深度清理数据仓库时发生错误:', error);
        }
    }

    // ==================== 存档功能 ====================

    /**
     * 存档干预内容
     * @param {InterventionContent} interventionContent - 干预内容
     * @returns {Promise<ArchiveCard|null>} 存档卡片或null
     */
    async archiveContent(interventionContent) {
        try {
            if (!interventionContent) {
                console.warn('存档内容需要提供干预内容');
                return null;
            }

            console.log('开始存档干预内容:', interventionContent.foodName);

            // 创建存档卡片
            const archiveCard = new ArchiveCard(interventionContent);

            // 添加到会话存档
            const success = this.sessionArchive.addSessionCard(archiveCard);

            if (success) {
                console.log('干预内容存档成功:', archiveCard.id);
                return archiveCard;
            } else {
                console.warn('添加存档卡片到会话存储失败');
                return null;
            }

        } catch (error) {
            console.error('存档干预内容失败:', error);
            return null;
        }
    }

    /**
     * 获取存档历史
     * @param {number} limit - 限制数量，默认为10
     * @returns {Promise<Array<ArchiveCard>>} 存档历史数组
     */
    async getArchiveHistory(limit = 10) {
        try {
            if (!this.sessionArchive) {
                console.warn('会话存档未初始化');
                return [];
            }

            const cards = this.sessionArchive.getRecentCards(limit);
            console.log(`获取存档历史: ${cards.length} 张卡片`);
            return cards;

        } catch (error) {
            console.error('获取存档历史失败:', error);
            return [];
        }
    }

    /**
     * 根据ID获取存档卡片
     * @param {string} cardId - 卡片ID
     * @returns {Promise<ArchiveCard|null>} 存档卡片或null
     */
    async getArchiveCardById(cardId) {
        try {
            if (!cardId) {
                return null;
            }

            if (!this.sessionArchive) {
                console.warn('会话存档未初始化');
                return null;
            }

            const card = this.sessionArchive.getCardById(cardId);
            if (card) {
                console.log(`找到存档卡片: ${cardId}`);
            } else {
                console.warn(`未找到存档卡片: ${cardId}`);
            }

            return card;

        } catch (error) {
            console.error(`获取存档卡片失败 (${cardId}):`, error);
            return null;
        }
    }

    /**
     * 获取所有会话存档卡片
     * @returns {Promise<Array<ArchiveCard>>} 所有会话存档卡片
     */
    async getAllSessionCards() {
        try {
            if (!this.sessionArchive) {
                console.warn('会话存档未初始化');
                return [];
            }

            const cards = this.sessionArchive.getSessionCards();
            console.log(`获取所有会话存档卡片: ${cards.length} 张`);
            return cards;

        } catch (error) {
            console.error('获取所有会话存档卡片失败:', error);
            return [];
        }
    }

    /**
     * 清除所有存档
     * @returns {Promise<boolean>} 清除是否成功
     */
    async clearAllArchives() {
        try {
            if (!this.sessionArchive) {
                console.warn('会话存档未初始化');
                return false;
            }

            this.sessionArchive.clearSessionCards();
            console.log('所有存档已清除');
            return true;

        } catch (error) {
            console.error('清除所有存档失败:', error);
            return false;
        }
    }

    /**
     * 获取存档统计信息
     * @returns {Promise<Object>} 存档统计信息
     */
    async getArchiveStats() {
        try {
            if (!this.sessionArchive) {
                return {
                    totalCards: 0,
                    sessionDuration: 0,
                    memoryUsage: 0,
                    utilizationRate: '0%'
                };
            }

            const usage = this.sessionArchive.getSessionUsage();
            const stats = this.sessionArchive.getSessionStats();

            return {
                ...usage,
                ...stats
            };

        } catch (error) {
            console.error('获取存档统计信息失败:', error);
            return {
                totalCards: 0,
                sessionDuration: 0,
                memoryUsage: 0,
                utilizationRate: '0%'
            };
        }
    }

    /**
     * 检查存档容量
     * @returns {Promise<Object>} 存档容量信息
     */
    async getArchiveCapacity() {
        try {
            if (!this.sessionArchive) {
                return {
                    current: 0,
                    max: 0,
                    available: 0,
                    isFull: false,
                    isEmpty: true
                };
            }

            return this.sessionArchive.getCapacityInfo();

        } catch (error) {
            console.error('获取存档容量信息失败:', error);
            return {
                current: 0,
                max: 0,
                available: 0,
                isFull: false,
                isEmpty: true
            };
        }
    }

    /**
     * 为存档卡片生成干预内容
     * @param {ArchiveCard} archiveCard - 存档卡片
     * @returns {Promise<InterventionContent|null>} 重新生成的干预内容
     */
    async generateContentFromArchive(archiveCard) {
        try {
            if (!archiveCard) {
                console.warn('生成内容需要提供存档卡片');
                return null;
            }

            console.log('从存档卡片生成干预内容:', archiveCard.foodName);

            // 从存档卡片重新创建干预内容
            const content = new InterventionContent(
                archiveCard.imageResource,
                archiveCard.guidanceText,
                archiveCard.foodName
            );

            // 保持原始时间戳
            if (archiveCard.timestamp) {
                content.createdAt = archiveCard.timestamp;
            }

            return content;

        } catch (error) {
            console.error('从存档卡片生成干预内容失败:', error);
            return null;
        }
    }

    /**
     * 检查是否可以存档更多内容
     * @returns {Promise<boolean>} 是否可以存档更多内容
     */
    async canArchiveMore() {
        try {
            if (!this.sessionArchive) {
                return false;
            }

            return !this.sessionArchive.isFull();

        } catch (error) {
            console.error('检查存档容量失败:', error);
            return false;
        }
    }

    /**
     * 获取存档摘要信息
     * @returns {Promise<Array<Object>>} 存档摘要数组
     */
    async getArchiveSummary() {
        try {
            const cards = await this.getAllSessionCards();

            return cards.map(card => ({
                id: card.id,
                foodName: card.foodName,
                timestamp: card.timestamp,
                formattedTime: card.getFormattedTime(),
                hasImage: !!card.imageResource,
                hasText: !!card.guidanceText
            }));

        } catch (error) {
            console.error('获取存档摘要失败:', error);
            return [];
        }
    }
}