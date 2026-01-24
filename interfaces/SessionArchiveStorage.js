/**
 * 会话存档存储管理器
 * 用于管理会话期间的存档卡片，仅在内存中保存，应用退出后自动清除
 */
export class SessionArchiveStorage {
    constructor() {
        // 内存中的会话卡片存储
        this.sessionCards = [];

        // 单次会话最大卡片数量
        this.maxSessionCards = 10;

        // 仅会话期间保留数据标志
        this.sessionOnly = true;

        // 初始化时间戳
        this.sessionStartTime = Date.now();

        console.log('会话存档存储管理器已初始化');
    }

    /**
     * 添加卡片到会话存储
     * @param {import('../models/ArchiveCard.js').ArchiveCard} card - 存档卡片
     * @returns {boolean} 添加是否成功
     */
    addSessionCard(card) {
        try {
            if (!card) {
                console.warn('尝试添加空卡片到会话存储');
                return false;
            }

            // 检查卡片是否已存在
            const existingIndex = this.sessionCards.findIndex(existingCard => existingCard.id === card.id);
            if (existingIndex !== -1) {
                console.warn(`卡片 ${card.id} 已存在于会话存储中`);
                return false;
            }

            // 添加卡片到存储
            this.sessionCards.push(card);

            // 如果超过最大数量，移除最旧的卡片
            if (this.sessionCards.length > this.maxSessionCards) {
                const removedCard = this.sessionCards.shift();
                console.log(`会话存储已满，移除最旧的卡片: ${removedCard.id}`);
            }

            console.log(`成功添加卡片到会话存储: ${card.id}, 当前存储数量: ${this.sessionCards.length}`);
            return true;

        } catch (error) {
            console.error('添加卡片到会话存储失败:', error);
            return false;
        }
    }

    /**
     * 获取当前会话的所有卡片
     * @returns {Array<import('../models/ArchiveCard.js').ArchiveCard>} 会话卡片数组的副本
     */
    getSessionCards() {
        try {
            // 返回卡片数组的副本，按时间戳降序排列（最新的在前）
            return [...this.sessionCards].sort((a, b) => b.timestamp - a.timestamp);
        } catch (error) {
            console.error('获取会话卡片失败:', error);
            return [];
        }
    }

    /**
     * 根据ID获取特定卡片
     * @param {string} id - 卡片ID
     * @returns {import('../models/ArchiveCard.js').ArchiveCard|null} 找到的卡片或null
     */
    getCardById(id) {
        try {
            if (!id) {
                return null;
            }

            const card = this.sessionCards.find(card => card.id === id);
            return card || null;

        } catch (error) {
            console.error(`根据ID获取卡片失败 (${id}):`, error);
            return null;
        }
    }

    /**
     * 获取最近的卡片
     * @param {number} limit - 限制数量，默认为10
     * @returns {Array<import('../models/ArchiveCard.js').ArchiveCard>} 最近的卡片数组
     */
    getRecentCards(limit = 10) {
        try {
            const sortedCards = this.getSessionCards(); // 已经按时间戳降序排列
            return sortedCards.slice(0, Math.min(limit, sortedCards.length));
        } catch (error) {
            console.error('获取最近卡片失败:', error);
            return [];
        }
    }

    /**
     * 清空会话存储的所有卡片
     */
    clearSessionCards() {
        try {
            const cardCount = this.sessionCards.length;
            this.sessionCards = [];
            console.log(`已清空会话存储，共清除 ${cardCount} 张卡片`);
        } catch (error) {
            console.error('清空会话存储失败:', error);
        }
    }

    /**
     * 移除特定卡片
     * @param {string} id - 卡片ID
     * @returns {boolean} 移除是否成功
     */
    removeCardById(id) {
        try {
            if (!id) {
                return false;
            }

            const initialLength = this.sessionCards.length;
            this.sessionCards = this.sessionCards.filter(card => card.id !== id);

            const removed = this.sessionCards.length < initialLength;
            if (removed) {
                console.log(`成功移除卡片: ${id}`);
            } else {
                console.warn(`未找到要移除的卡片: ${id}`);
            }

            return removed;

        } catch (error) {
            console.error(`移除卡片失败 (${id}):`, error);
            return false;
        }
    }

    /**
     * 获取当前会话存储使用情况
     * @returns {Object} 存储使用情况统计
     */
    getSessionUsage() {
        try {
            const currentCount = this.sessionCards.length;
            const memoryUsage = JSON.stringify(this.sessionCards).length;
            const sessionDuration = Date.now() - this.sessionStartTime;

            return {
                currentCount,
                maxCount: this.maxSessionCards,
                memoryUsage,
                sessionDuration,
                utilizationRate: (currentCount / this.maxSessionCards * 100).toFixed(1) + '%',
                averageCardSize: currentCount > 0 ? Math.round(memoryUsage / currentCount) : 0
            };

        } catch (error) {
            console.error('获取会话存储使用情况失败:', error);
            return {
                currentCount: 0,
                maxCount: this.maxSessionCards,
                memoryUsage: 0,
                sessionDuration: 0,
                utilizationRate: '0%',
                averageCardSize: 0
            };
        }
    }

    /**
     * 检查存储是否已满
     * @returns {boolean} 存储是否已满
     */
    isFull() {
        return this.sessionCards.length >= this.maxSessionCards;
    }

    /**
     * 检查存储是否为空
     * @returns {boolean} 存储是否为空
     */
    isEmpty() {
        return this.sessionCards.length === 0;
    }

    /**
     * 获取存储容量信息
     * @returns {Object} 容量信息
     */
    getCapacityInfo() {
        return {
            current: this.sessionCards.length,
            max: this.maxSessionCards,
            available: this.maxSessionCards - this.sessionCards.length,
            isFull: this.isFull(),
            isEmpty: this.isEmpty()
        };
    }

    /**
     * 设置最大存储数量
     * @param {number} maxCount - 新的最大数量
     */
    setMaxSessionCards(maxCount) {
        if (typeof maxCount === 'number' && maxCount > 0) {
            this.maxSessionCards = maxCount;

            // 如果当前卡片数量超过新的限制，移除多余的卡片
            while (this.sessionCards.length > this.maxSessionCards) {
                const removedCard = this.sessionCards.shift();
                console.log(`调整存储限制，移除卡片: ${removedCard.id}`);
            }

            console.log(`会话存储最大数量已设置为: ${maxCount}`);
        } else {
            console.warn('无效的最大存储数量:', maxCount);
        }
    }

    /**
     * 获取会话统计信息
     * @returns {Object} 会话统计信息
     */
    getSessionStats() {
        try {
            const cards = this.sessionCards;
            const now = Date.now();

            if (cards.length === 0) {
                return {
                    totalCards: 0,
                    sessionDuration: now - this.sessionStartTime,
                    averageInterval: 0,
                    oldestCard: null,
                    newestCard: null
                };
            }

            const timestamps = cards.map(card => card.timestamp).sort((a, b) => a - b);
            const intervals = [];

            for (let i = 1; i < timestamps.length; i++) {
                intervals.push(timestamps[i] - timestamps[i - 1]);
            }

            return {
                totalCards: cards.length,
                sessionDuration: now - this.sessionStartTime,
                averageInterval: intervals.length > 0 ? Math.round(intervals.reduce((a, b) => a + b, 0) / intervals.length) : 0,
                oldestCard: timestamps[0],
                newestCard: timestamps[timestamps.length - 1]
            };

        } catch (error) {
            console.error('获取会话统计信息失败:', error);
            return {
                totalCards: 0,
                sessionDuration: 0,
                averageInterval: 0,
                oldestCard: null,
                newestCard: null
            };
        }
    }
}