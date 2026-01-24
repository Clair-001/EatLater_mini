/**
 * 卡片管理器
 * 负责管理卡片的创建、动画和交互逻辑
 */
export class CardManager {
    constructor() {
        // 卡片动画配置
        this.animationConfig = {
            // 存档动画配置
            archiveAnimation: {
                duration: 800, // 动画持续时间（毫秒）
                easing: 'cubic-bezier(0.4, 0.0, 0.2, 1)', // 缓动函数
                steps: [
                    { transform: 'scale(1)', offset: 0 },
                    { transform: 'scale(0.8)', offset: 0.3 },
                    { transform: 'scale(0.6) translateY(200rpx)', offset: 0.7 },
                    { transform: 'scale(0.4) translateY(400rpx)', offset: 1 }
                ]
            },
            // 聚焦动画配置
            focusAnimation: {
                duration: 600,
                easing: 'cubic-bezier(0.4, 0.0, 0.2, 1)',
                steps: [
                    { transform: 'scale(0.4) translateY(400rpx)', offset: 0 },
                    { transform: 'scale(0.8) translateY(200rpx)', offset: 0.4 },
                    { transform: 'scale(1) translateY(0)', offset: 1 }
                ]
            },
            // 滚动动画配置
            scrollAnimation: {
                duration: 300,
                easing: 'ease-out'
            }
        };

        // 卡片状态管理
        this.cardStates = new Map(); // 存储每个卡片的状态

        // 当前聚焦的卡片ID
        this.focusedCardId = null;

        // 动画队列
        this.animationQueue = [];

        // 是否正在执行动画
        this.isAnimating = false;

        console.log('卡片管理器已初始化');
    }

    /**
     * 创建新卡片
     * @param {import('../models/InterventionContent.js').InterventionContent} interventionContent - 干预内容
     * @returns {import('../models/ArchiveCard.js').ArchiveCard} 创建的卡片
     */
    async createCard(interventionContent) {
        try {
            if (!interventionContent) {
                throw new Error('创建卡片需要提供干预内容');
            }

            // 动态导入 ArchiveCard 类
            const { ArchiveCard } = await import('../models/ArchiveCard.js');

            // 创建新卡片
            const card = new ArchiveCard(interventionContent);

            // 初始化卡片状态
            this.initializeCardState(card);

            console.log(`成功创建卡片: ${card.id} (食物: ${card.foodName})`);
            return card;

        } catch (error) {
            console.error('创建卡片失败:', error);
            throw error;
        }
    }

    /**
     * 初始化卡片状态
     * @param {import('../models/ArchiveCard.js').ArchiveCard} card - 卡片对象
     */
    initializeCardState(card) {
        if (!card || !card.id) {
            console.warn('无法初始化无效卡片的状态');
            return;
        }

        // 设置卡片初始状态
        const initialState = {
            id: card.id,
            position: { x: 0, y: 0 },
            scale: 1,
            opacity: 1,
            zIndex: 1,
            isVisible: true,
            isAnimating: false,
            isFocused: false,
            isInStack: false,
            animationHistory: []
        };

        this.cardStates.set(card.id, initialState);
        console.log(`卡片状态已初始化: ${card.id}`);
    }

    /**
     * 执行卡片到堆叠的动画效果
     * @param {import('../models/ArchiveCard.js').ArchiveCard} card - 要执行动画的卡片
     * @param {Object} targetPosition - 目标位置 {x, y}
     * @returns {Promise<boolean>} 动画是否成功完成
     */
    async animateCardToStack(card, targetPosition = { x: 0, y: 400 }) {
        try {
            if (!card || !card.id) {
                throw new Error('无效的卡片对象');
            }

            // 检查卡片状态
            const cardState = this.cardStates.get(card.id);
            if (!cardState) {
                console.warn(`卡片 ${card.id} 状态不存在，重新初始化`);
                this.initializeCardState(card);
            }

            // 检查是否已在动画中
            if (this.isCardAnimating(card.id)) {
                console.warn(`卡片 ${card.id} 正在动画中，跳过新动画`);
                return false;
            }

            // 标记卡片为动画状态
            this.setCardAnimating(card.id, true);

            console.log(`开始执行卡片存档动画: ${card.id}`);

            // 创建动画配置
            const animationData = {
                cardId: card.id,
                type: 'archive',
                startTime: Date.now(),
                duration: this.animationConfig.archiveAnimation.duration,
                targetPosition,
                onComplete: () => {
                    this.onArchiveAnimationComplete(card.id, targetPosition);
                }
            };

            // 执行动画
            const success = await this.executeAnimation(animationData);

            if (success) {
                // 更新卡片状态为堆叠状态
                this.updateCardState(card.id, {
                    isInStack: true,
                    isFocused: false,
                    position: targetPosition,
                    scale: 0.4
                });

                console.log(`卡片存档动画完成: ${card.id}`);
            }

            return success;

        } catch (error) {
            console.error(`卡片存档动画失败 (${card.id}):`, error);
            this.setCardAnimating(card.id, false);
            return false;
        }
    }

    /**
     * 执行动画
     * @param {Object} animationData - 动画数据
     * @returns {Promise<boolean>} 动画是否成功
     */
    async executeAnimation(animationData) {
        return new Promise((resolve) => {
            try {
                const { cardId, type, duration, onComplete } = animationData;

                // 模拟动画执行
                // 在实际的小程序环境中，这里会使用 uni.createAnimation() 或 CSS 动画
                console.log(`执行 ${type} 动画: ${cardId}, 持续时间: ${duration}ms`);

                // 记录动画历史
                this.recordAnimationHistory(cardId, {
                    type,
                    startTime: animationData.startTime,
                    duration,
                    targetPosition: animationData.targetPosition
                });

                // 模拟动画延迟
                setTimeout(() => {
                    try {
                        // 标记动画完成
                        this.setCardAnimating(cardId, false);

                        // 调用完成回调
                        if (typeof onComplete === 'function') {
                            onComplete();
                        }

                        resolve(true);
                    } catch (error) {
                        console.error(`动画完成回调失败 (${cardId}):`, error);
                        resolve(false);
                    }
                }, duration);

            } catch (error) {
                console.error('执行动画失败:', error);
                resolve(false);
            }
        });
    }

    /**
     * 存档动画完成回调
     * @param {string} cardId - 卡片ID
     * @param {Object} finalPosition - 最终位置
     */
    onArchiveAnimationComplete(cardId, finalPosition) {
        try {
            console.log(`存档动画完成回调: ${cardId}`);

            // 更新卡片最终状态
            this.updateCardState(cardId, {
                position: finalPosition,
                isInStack: true,
                isFocused: false,
                isAnimating: false
            });

            // 触发存档完成事件
            this.emitCardEvent('archiveComplete', {
                cardId,
                finalPosition,
                timestamp: Date.now()
            });

        } catch (error) {
            console.error(`存档动画完成回调失败 (${cardId}):`, error);
        }
    }

    /**
     * 聚焦卡片动画
     * @param {string} cardId - 卡片ID
     * @returns {Promise<boolean>} 动画是否成功
     */
    async focusCard(cardId) {
        try {
            if (!cardId) {
                throw new Error('聚焦卡片需要提供卡片ID');
            }

            // 检查卡片状态
            const cardState = this.cardStates.get(cardId);
            if (!cardState) {
                throw new Error(`卡片 ${cardId} 状态不存在`);
            }

            // 如果已经聚焦，直接返回
            if (cardState.isFocused) {
                console.log(`卡片 ${cardId} 已经处于聚焦状态`);
                return true;
            }

            // 取消其他卡片的聚焦状态
            this.clearAllFocus();

            // 检查是否已在动画中
            if (this.isCardAnimating(cardId)) {
                console.warn(`卡片 ${cardId} 正在动画中，等待动画完成`);
                await this.waitForAnimationComplete(cardId);
            }

            // 标记卡片为动画状态
            this.setCardAnimating(cardId, true);

            console.log(`开始聚焦卡片: ${cardId}`);

            // 创建聚焦动画配置
            const animationData = {
                cardId,
                type: 'focus',
                startTime: Date.now(),
                duration: this.animationConfig.focusAnimation.duration,
                targetPosition: { x: 0, y: 0 }, // 聚焦到屏幕中央
                onComplete: () => {
                    this.onFocusAnimationComplete(cardId);
                }
            };

            // 执行聚焦动画
            const success = await this.executeAnimation(animationData);

            if (success) {
                // 更新聚焦状态
                this.focusedCardId = cardId;
                this.updateCardState(cardId, {
                    isFocused: true,
                    isInStack: false,
                    position: { x: 0, y: 0 },
                    scale: 1,
                    zIndex: 10
                });

                console.log(`卡片聚焦完成: ${cardId}`);
            }

            return success;

        } catch (error) {
            console.error(`聚焦卡片失败 (${cardId}):`, error);
            this.setCardAnimating(cardId, false);
            return false;
        }
    }

    /**
     * 聚焦动画完成回调
     * @param {string} cardId - 卡片ID
     */
    onFocusAnimationComplete(cardId) {
        try {
            console.log(`聚焦动画完成回调: ${cardId}`);

            // 触发聚焦完成事件
            this.emitCardEvent('focusComplete', {
                cardId,
                timestamp: Date.now()
            });

        } catch (error) {
            console.error(`聚焦动画完成回调失败 (${cardId}):`, error);
        }
    }

    /**
     * 清除所有卡片的聚焦状态
     */
    clearAllFocus() {
        try {
            this.cardStates.forEach((state, cardId) => {
                if (state.isFocused) {
                    this.updateCardState(cardId, {
                        isFocused: false,
                        zIndex: 1
                    });
                }
            });

            this.focusedCardId = null;
            console.log('已清除所有卡片的聚焦状态');

        } catch (error) {
            console.error('清除聚焦状态失败:', error);
        }
    }

    /**
     * 检查卡片是否正在动画中
     * @param {string} cardId - 卡片ID
     * @returns {boolean} 是否在动画中
     */
    isCardAnimating(cardId) {
        const cardState = this.cardStates.get(cardId);
        return cardState ? cardState.isAnimating : false;
    }

    /**
     * 设置卡片动画状态
     * @param {string} cardId - 卡片ID
     * @param {boolean} isAnimating - 是否在动画中
     */
    setCardAnimating(cardId, isAnimating) {
        this.updateCardState(cardId, { isAnimating });
    }

    /**
     * 等待卡片动画完成
     * @param {string} cardId - 卡片ID
     * @param {number} timeout - 超时时间（毫秒）
     * @returns {Promise<boolean>} 是否在超时前完成
     */
    async waitForAnimationComplete(cardId, timeout = 2000) {
        return new Promise((resolve) => {
            const startTime = Date.now();
            const checkInterval = 50;

            const checkAnimation = () => {
                if (!this.isCardAnimating(cardId)) {
                    resolve(true);
                    return;
                }

                if (Date.now() - startTime > timeout) {
                    console.warn(`等待卡片动画完成超时: ${cardId}`);
                    resolve(false);
                    return;
                }

                setTimeout(checkAnimation, checkInterval);
            };

            checkAnimation();
        });
    }

    /**
     * 更新卡片状态
     * @param {string} cardId - 卡片ID
     * @param {Object} updates - 要更新的状态
     */
    updateCardState(cardId, updates) {
        try {
            const currentState = this.cardStates.get(cardId);
            if (!currentState) {
                console.warn(`尝试更新不存在的卡片状态: ${cardId}`);
                return;
            }

            const newState = { ...currentState, ...updates };
            this.cardStates.set(cardId, newState);

        } catch (error) {
            console.error(`更新卡片状态失败 (${cardId}):`, error);
        }
    }

    /**
     * 记录动画历史
     * @param {string} cardId - 卡片ID
     * @param {Object} animationInfo - 动画信息
     */
    recordAnimationHistory(cardId, animationInfo) {
        try {
            const cardState = this.cardStates.get(cardId);
            if (cardState) {
                if (!cardState.animationHistory) {
                    cardState.animationHistory = [];
                }
                cardState.animationHistory.push(animationInfo);

                // 限制历史记录数量
                if (cardState.animationHistory.length > 10) {
                    cardState.animationHistory.shift();
                }
            }
        } catch (error) {
            console.error(`记录动画历史失败 (${cardId}):`, error);
        }
    }

    /**
     * 获取卡片状态
     * @param {string} cardId - 卡片ID
     * @returns {Object|null} 卡片状态
     */
    getCardState(cardId) {
        return this.cardStates.get(cardId) || null;
    }

    /**
     * 获取所有卡片状态
     * @returns {Map} 所有卡片状态
     */
    getAllCardStates() {
        return new Map(this.cardStates);
    }

    /**
     * 获取当前聚焦的卡片ID
     * @returns {string|null} 聚焦的卡片ID
     */
    getFocusedCardId() {
        return this.focusedCardId;
    }

    /**
     * 移除卡片状态
     * @param {string} cardId - 卡片ID
     */
    removeCardState(cardId) {
        try {
            if (this.cardStates.has(cardId)) {
                this.cardStates.delete(cardId);
                console.log(`已移除卡片状态: ${cardId}`);

                // 如果移除的是聚焦卡片，清除聚焦状态
                if (this.focusedCardId === cardId) {
                    this.focusedCardId = null;
                }
            }
        } catch (error) {
            console.error(`移除卡片状态失败 (${cardId}):`, error);
        }
    }

    /**
     * 清除所有卡片状态
     */
    clearAllCardStates() {
        try {
            this.cardStates.clear();
            this.focusedCardId = null;
            this.animationQueue = [];
            this.isAnimating = false;
            console.log('已清除所有卡片状态');
        } catch (error) {
            console.error('清除所有卡片状态失败:', error);
        }
    }

    /**
     * 触发卡片事件
     * @param {string} eventType - 事件类型
     * @param {Object} eventData - 事件数据
     */
    emitCardEvent(eventType, eventData) {
        try {
            // 在实际应用中，这里会触发自定义事件
            console.log(`卡片事件: ${eventType}`, eventData);

            // 可以在这里添加事件监听器机制
            if (this.eventListeners && this.eventListeners[eventType]) {
                this.eventListeners[eventType].forEach(listener => {
                    try {
                        listener(eventData);
                    } catch (error) {
                        console.error(`卡片事件监听器执行失败 (${eventType}):`, error);
                    }
                });
            }

        } catch (error) {
            console.error(`触发卡片事件失败 (${eventType}):`, error);
        }
    }

    /**
     * 获取动画配置
     * @param {string} animationType - 动画类型 ('archive', 'focus', 'scroll')
     * @returns {Object} 动画配置
     */
    getAnimationConfig(animationType) {
        const configs = {
            archive: this.animationConfig.archiveAnimation,
            focus: this.animationConfig.focusAnimation,
            scroll: this.animationConfig.scrollAnimation
        };

        return configs[animationType] || null;
    }

    /**
     * 更新动画配置
     * @param {string} animationType - 动画类型
     * @param {Object} newConfig - 新配置
     */
    updateAnimationConfig(animationType, newConfig) {
        try {
            if (this.animationConfig[animationType + 'Animation']) {
                this.animationConfig[animationType + 'Animation'] = {
                    ...this.animationConfig[animationType + 'Animation'],
                    ...newConfig
                };
                console.log(`${animationType} 动画配置已更新`);
            } else {
                console.warn(`未知的动画类型: ${animationType}`);
            }
        } catch (error) {
            console.error(`更新动画配置失败 (${animationType}):`, error);
        }
    }

    /**
     * 滚动到指定卡片
     * @param {string} cardId - 目标卡片ID
     * @param {boolean} smooth - 是否使用平滑滚动
     * @returns {Promise<boolean>} 滚动是否成功
     */
    async scrollToCard(cardId, smooth = true) {
        try {
            if (!cardId) {
                throw new Error('滚动到卡片需要提供卡片ID');
            }

            // 检查卡片状态
            const cardState = this.cardStates.get(cardId);
            if (!cardState) {
                throw new Error(`卡片 ${cardId} 状态不存在`);
            }

            console.log(`开始滚动到卡片: ${cardId}, 平滑滚动: ${smooth}`);

            // 计算目标滚动位置
            const targetScrollPosition = this.calculateScrollPosition(cardId);

            if (smooth) {
                // 执行平滑滚动动画
                const scrollAnimationData = {
                    cardId,
                    type: 'scroll',
                    startTime: Date.now(),
                    duration: this.animationConfig.scrollAnimation.duration,
                    targetPosition: targetScrollPosition,
                    onComplete: () => {
                        this.onScrollAnimationComplete(cardId);
                    }
                };

                return await this.executeAnimation(scrollAnimationData);
            } else {
                // 直接跳转到目标位置
                this.setScrollPosition(targetScrollPosition);
                this.onScrollAnimationComplete(cardId);
                return true;
            }

        } catch (error) {
            console.error(`滚动到卡片失败 (${cardId}):`, error);
            return false;
        }
    }

    /**
     * 计算卡片的滚动位置
     * @param {string} cardId - 卡片ID
     * @returns {Object} 滚动位置 {x, y}
     */
    calculateScrollPosition(cardId) {
        try {
            // 获取所有在堆叠中的卡片
            const stackCards = this.getStackCards();

            // 找到目标卡片在堆叠中的索引
            const cardIndex = stackCards.findIndex(card => card.id === cardId);

            if (cardIndex === -1) {
                console.warn(`卡片 ${cardId} 不在堆叠中`);
                return { x: 0, y: 0 };
            }

            // 计算水平滚动位置
            // 假设每个卡片宽度为 200rpx，间距为 20rpx
            const cardWidth = 200;
            const cardSpacing = 20;
            const scrollX = cardIndex * (cardWidth + cardSpacing);

            return {
                x: scrollX,
                y: 0 // 垂直位置固定在底部
            };

        } catch (error) {
            console.error(`计算滚动位置失败 (${cardId}):`, error);
            return { x: 0, y: 0 };
        }
    }

    /**
     * 获取堆叠中的所有卡片
     * @returns {Array} 堆叠中的卡片数组
     */
    getStackCards() {
        try {
            const stackCards = [];

            this.cardStates.forEach((state, cardId) => {
                if (state.isInStack) {
                    stackCards.push({
                        id: cardId,
                        timestamp: state.timestamp || 0,
                        position: state.position
                    });
                }
            });

            // 按时间戳排序（最新的在右边）
            return stackCards.sort((a, b) => a.timestamp - b.timestamp);

        } catch (error) {
            console.error('获取堆叠卡片失败:', error);
            return [];
        }
    }

    /**
     * 设置滚动位置
     * @param {Object} position - 滚动位置 {x, y}
     */
    setScrollPosition(position) {
        try {
            // 在实际的小程序环境中，这里会调用滚动API
            console.log(`设置滚动位置: x=${position.x}, y=${position.y}`);

            // 触发滚动位置变化事件
            this.emitCardEvent('scrollPositionChanged', {
                position,
                timestamp: Date.now()
            });

        } catch (error) {
            console.error('设置滚动位置失败:', error);
        }
    }

    /**
     * 滚动动画完成回调
     * @param {string} cardId - 目标卡片ID
     */
    onScrollAnimationComplete(cardId) {
        try {
            console.log(`滚动动画完成: ${cardId}`);

            // 触发滚动完成事件
            this.emitCardEvent('scrollComplete', {
                cardId,
                timestamp: Date.now()
            });

        } catch (error) {
            console.error(`滚动动画完成回调失败 (${cardId}):`, error);
        }
    }

    /**
     * 渲染卡片堆叠
     * @param {Array<import('../models/ArchiveCard.js').ArchiveCard>} cards - 卡片数组
     * @returns {Object} 渲染配置
     */
    renderCardStack(cards) {
        try {
            if (!Array.isArray(cards)) {
                console.warn('渲染卡片堆叠需要提供卡片数组');
                return { cards: [], layout: null };
            }

            console.log(`渲染卡片堆叠: ${cards.length} 张卡片`);

            // 计算布局配置
            const layout = this.calculateStackLayout(cards);

            // 为每个卡片生成渲染数据
            const renderData = cards.map((card, index) => {
                const cardState = this.cardStates.get(card.id);

                return {
                    id: card.id,
                    displayData: card.getDisplayData(),
                    position: layout.positions[index] || { x: 0, y: 0 },
                    scale: cardState ? cardState.scale : 0.4,
                    zIndex: cardState ? cardState.zIndex : 1,
                    isVisible: cardState ? cardState.isVisible : true,
                    isFocused: cardState ? cardState.isFocused : false,
                    isAnimating: cardState ? cardState.isAnimating : false
                };
            });

            return {
                cards: renderData,
                layout,
                totalCards: cards.length,
                scrollable: cards.length > 3 // 超过3张卡片时启用滚动
            };

        } catch (error) {
            console.error('渲染卡片堆叠失败:', error);
            return { cards: [], layout: null };
        }
    }

    /**
     * 计算堆叠布局
     * @param {Array} cards - 卡片数组
     * @returns {Object} 布局配置
     */
    calculateStackLayout(cards) {
        try {
            const cardWidth = 160; // 卡片宽度 (rpx)
            const cardHeight = 120; // 卡片高度 (rpx)
            const cardSpacing = 20; // 卡片间距 (rpx)
            const stackY = 400; // 堆叠的垂直位置 (rpx)

            // 计算每个卡片的位置
            const positions = cards.map((card, index) => ({
                x: index * (cardWidth + cardSpacing),
                y: stackY
            }));

            // 计算总宽度
            const totalWidth = cards.length > 0
                ? (cards.length - 1) * (cardWidth + cardSpacing) + cardWidth
                : 0;

            return {
                positions,
                cardWidth,
                cardHeight,
                cardSpacing,
                totalWidth,
                stackY,
                scrollable: totalWidth > 750 // 屏幕宽度约750rpx
            };

        } catch (error) {
            console.error('计算堆叠布局失败:', error);
            return {
                positions: [],
                cardWidth: 160,
                cardHeight: 120,
                cardSpacing: 20,
                totalWidth: 0,
                stackY: 400,
                scrollable: false
            };
        }
    }

    /**
     * 处理卡片点击事件
     * @param {string} cardId - 被点击的卡片ID
     * @returns {Promise<boolean>} 处理是否成功
     */
    async handleCardClick(cardId) {
        try {
            if (!cardId) {
                console.warn('处理卡片点击需要提供卡片ID');
                return false;
            }

            const cardState = this.cardStates.get(cardId);
            if (!cardState) {
                console.warn(`卡片 ${cardId} 状态不存在`);
                return false;
            }

            console.log(`处理卡片点击: ${cardId}`);

            // 如果卡片已经聚焦，则取消聚焦
            if (cardState.isFocused) {
                return await this.unfocusCard(cardId);
            } else {
                // 否则聚焦该卡片
                return await this.focusCard(cardId);
            }

        } catch (error) {
            console.error(`处理卡片点击失败 (${cardId}):`, error);
            return false;
        }
    }

    /**
     * 取消卡片聚焦
     * @param {string} cardId - 卡片ID
     * @returns {Promise<boolean>} 是否成功
     */
    async unfocusCard(cardId) {
        try {
            if (!cardId) {
                throw new Error('取消聚焦需要提供卡片ID');
            }

            const cardState = this.cardStates.get(cardId);
            if (!cardState || !cardState.isFocused) {
                console.log(`卡片 ${cardId} 未处于聚焦状态`);
                return true;
            }

            console.log(`取消卡片聚焦: ${cardId}`);

            // 执行取消聚焦动画（回到堆叠位置）
            const stackPosition = this.calculateCardStackPosition(cardId);

            const animationData = {
                cardId,
                type: 'unfocus',
                startTime: Date.now(),
                duration: this.animationConfig.focusAnimation.duration,
                targetPosition: stackPosition,
                onComplete: () => {
                    this.onUnfocusAnimationComplete(cardId);
                }
            };

            // 标记为动画状态
            this.setCardAnimating(cardId, true);

            // 执行动画
            const success = await this.executeAnimation(animationData);

            if (success) {
                // 更新状态
                this.updateCardState(cardId, {
                    isFocused: false,
                    isInStack: true,
                    position: stackPosition,
                    scale: 0.4,
                    zIndex: 1
                });

                // 清除全局聚焦状态
                if (this.focusedCardId === cardId) {
                    this.focusedCardId = null;
                }
            }

            return success;

        } catch (error) {
            console.error(`取消卡片聚焦失败 (${cardId}):`, error);
            this.setCardAnimating(cardId, false);
            return false;
        }
    }

    /**
     * 计算卡片在堆叠中的位置
     * @param {string} cardId - 卡片ID
     * @returns {Object} 堆叠位置 {x, y}
     */
    calculateCardStackPosition(cardId) {
        try {
            const stackCards = this.getStackCards();
            const cardIndex = stackCards.findIndex(card => card.id === cardId);

            if (cardIndex === -1) {
                // 如果不在堆叠中，添加到末尾
                return {
                    x: stackCards.length * 180, // 卡片宽度 + 间距
                    y: 400
                };
            }

            return {
                x: cardIndex * 180,
                y: 400
            };

        } catch (error) {
            console.error(`计算卡片堆叠位置失败 (${cardId}):`, error);
            return { x: 0, y: 400 };
        }
    }

    /**
     * 取消聚焦动画完成回调
     * @param {string} cardId - 卡片ID
     */
    onUnfocusAnimationComplete(cardId) {
        try {
            console.log(`取消聚焦动画完成: ${cardId}`);

            // 触发取消聚焦完成事件
            this.emitCardEvent('unfocusComplete', {
                cardId,
                timestamp: Date.now()
            });

        } catch (error) {
            console.error(`取消聚焦动画完成回调失败 (${cardId}):`, error);
        }
    }

    /**
     * 处理滚动惯性和回弹效果
     * @param {Object} scrollData - 滚动数据 {velocity, position}
     * @returns {Promise<Object>} 最终滚动位置
     */
    async handleScrollInertia(scrollData) {
        try {
            const { velocity, position } = scrollData;

            console.log('处理滚动惯性:', { velocity, position });

            // 计算惯性滚动的目标位置
            const inertiaDistance = velocity * 0.3; // 惯性系数
            const targetX = position.x + inertiaDistance;

            // 计算边界限制
            const stackCards = this.getStackCards();
            const layout = this.calculateStackLayout(stackCards);

            const minX = 0;
            const maxX = Math.max(0, layout.totalWidth - 750); // 屏幕宽度

            // 应用边界限制
            let finalX = Math.max(minX, Math.min(maxX, targetX));

            // 如果超出边界，应用回弹效果
            let bounceBack = false;
            if (targetX < minX || targetX > maxX) {
                bounceBack = true;
                console.log('触发回弹效果');
            }

            // 执行惯性滚动动画
            const inertiaAnimationData = {
                type: 'inertia',
                startTime: Date.now(),
                duration: bounceBack ? 400 : 600, // 回弹时间更短
                targetPosition: { x: finalX, y: position.y },
                onComplete: () => {
                    this.onInertiaAnimationComplete(finalX);
                }
            };

            await this.executeAnimation(inertiaAnimationData);

            return { x: finalX, y: position.y };

        } catch (error) {
            console.error('处理滚动惯性失败:', error);
            return scrollData.position;
        }
    }

    /**
     * 惯性滚动动画完成回调
     * @param {number} finalX - 最终X位置
     */
    onInertiaAnimationComplete(finalX) {
        try {
            console.log(`惯性滚动完成，最终位置: ${finalX}`);

            // 触发惯性滚动完成事件
            this.emitCardEvent('inertiaComplete', {
                finalPosition: finalX,
                timestamp: Date.now()
            });

        } catch (error) {
            console.error('惯性滚动完成回调失败:', error);
        }
    }

    /**
     * 自动聚焦最近的卡片
     * @param {Object} currentPosition - 当前滚动位置
     * @returns {Promise<string|null>} 聚焦的卡片ID
     */
    async autoFocusNearestCard(currentPosition) {
        try {
            const stackCards = this.getStackCards();
            if (stackCards.length === 0) {
                return null;
            }

            // 计算每个卡片与当前位置的距离
            const layout = this.calculateStackLayout(stackCards);
            let nearestCard = null;
            let minDistance = Infinity;

            stackCards.forEach((card, index) => {
                const cardPosition = layout.positions[index];
                const distance = Math.abs(cardPosition.x - currentPosition.x);

                if (distance < minDistance) {
                    minDistance = distance;
                    nearestCard = card;
                }
            });

            if (nearestCard && minDistance < 100) { // 距离阈值
                console.log(`自动聚焦最近的卡片: ${nearestCard.id}`);
                await this.focusCard(nearestCard.id);
                return nearestCard.id;
            }

            return null;

        } catch (error) {
            console.error('自动聚焦最近卡片失败:', error);
            return null;
        }
    }

    /**
     * 获取卡片管理器状态信息（用于调试）
     * @returns {Object} 状态信息
     */
    getDebugInfo() {
        return {
            totalCards: this.cardStates.size,
            focusedCardId: this.focusedCardId,
            isAnimating: this.isAnimating,
            animationQueueLength: this.animationQueue.length,
            stackCards: this.getStackCards().length,
            cardStates: Array.from(this.cardStates.entries()).map(([id, state]) => ({
                id,
                isFocused: state.isFocused,
                isInStack: state.isInStack,
                isAnimating: state.isAnimating,
                position: state.position,
                scale: state.scale
            }))
        };
    }
}