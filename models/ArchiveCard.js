/**
 * 存档卡片数据模型
 * 用于表示会话期间存档的干预内容卡片
 */
export class ArchiveCard {
    /**
     * 构造函数
     * @param {import('./InterventionContent.js').InterventionContent} interventionContent - 干预内容对象
     */
    constructor(interventionContent) {
        if (!interventionContent) {
            throw new Error('创建存档卡片需要提供干预内容');
        }

        // 基础信息
        this.id = this.generateCardId();
        this.foodName = interventionContent.foodName;
        this.imageResource = interventionContent.imageResource;
        this.guidanceText = interventionContent.guidanceText;
        this.timestamp = interventionContent.createdAt || Date.now();

        // 卡片元数据
        this.metadata = {
            cardType: 'intervention',
            version: '1.0',
            createdAt: Date.now(),
            sessionId: this.generateSessionId(),
            originalContentId: interventionContent.id || null
        };

        // 缩略图处理
        this.thumbnailResource = this.generateThumbnail(interventionContent.imageResource);

        // 显示配置
        this.displayConfig = {
            showThumbnail: true,
            showFoodName: true,
            showTimestamp: false,
            cardSize: 'medium'
        };

        // 交互状态
        this.interactionState = {
            isFocused: false,
            isSelected: false,
            lastViewedAt: null,
            viewCount: 0
        };

        console.log(`创建存档卡片: ${this.id} (食物: ${this.foodName})`);
    }

    /**
     * 生成唯一的卡片ID
     * @returns {string} 卡片ID
     */
    generateCardId() {
        const timestamp = Date.now();
        const random = Math.random().toString(36).substr(2, 9);
        return `card_${timestamp}_${random}`;
    }

    /**
     * 生成会话ID
     * @returns {string} 会话ID
     */
    generateSessionId() {
        // 使用当前时间的小时作为会话标识的一部分
        const now = new Date();
        const sessionBase = `${now.getFullYear()}${(now.getMonth() + 1).toString().padStart(2, '0')}${now.getDate().toString().padStart(2, '0')}_${now.getHours()}`;
        return `session_${sessionBase}`;
    }

    /**
     * 生成缩略图资源路径
     * @param {string} imageResource - 原始图片资源路径
     * @returns {string} 缩略图资源路径
     */
    generateThumbnail(imageResource) {
        try {
            if (!imageResource) {
                return '/static/images/default_thumbnail.jpg';
            }

            // 如果已经是缩略图，直接返回
            if (imageResource.includes('thumbnail') || imageResource.includes('thumb')) {
                return imageResource;
            }

            // 生成缩略图路径
            // 例如: /static/images/pizza.jpg -> /static/images/thumbnails/pizza_thumb.jpg
            const pathParts = imageResource.split('/');
            const fileName = pathParts[pathParts.length - 1];
            const fileNameWithoutExt = fileName.split('.')[0];
            const fileExt = fileName.split('.')[1] || 'jpg';

            // 构建缩略图路径
            const thumbnailDir = pathParts.slice(0, -1).join('/') + '/thumbnails';
            const thumbnailFileName = `${fileNameWithoutExt}_thumb.${fileExt}`;
            const thumbnailPath = `${thumbnailDir}/${thumbnailFileName}`;

            // 如果缩略图目录不存在，使用原图
            return thumbnailPath;

        } catch (error) {
            console.warn('生成缩略图路径失败，使用原图:', error);
            return imageResource || '/static/images/default_thumbnail.jpg';
        }
    }

    /**
     * 获取卡片的显示数据
     * @returns {Object} 显示数据对象
     */
    getDisplayData() {
        return {
            id: this.id,
            foodName: this.foodName,
            image: this.displayConfig.showThumbnail ? this.thumbnailResource : this.imageResource,
            guidanceText: this.guidanceText,
            timestamp: this.timestamp,
            formattedTime: this.getFormattedTime(),
            metadata: {
                cardType: this.metadata.cardType,
                sessionId: this.metadata.sessionId
            }
        };
    }

    /**
     * 获取格式化的时间字符串
     * @returns {string} 格式化的时间
     */
    getFormattedTime() {
        try {
            const date = new Date(this.timestamp);
            const now = new Date();
            const diffMs = now - date;
            const diffMins = Math.floor(diffMs / (1000 * 60));

            if (diffMins < 1) {
                return '刚刚';
            } else if (diffMins < 60) {
                return `${diffMins}分钟前`;
            } else if (diffMins < 1440) { // 24小时
                const hours = Math.floor(diffMins / 60);
                return `${hours}小时前`;
            } else {
                return date.toLocaleDateString('zh-CN', {
                    month: 'short',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                });
            }
        } catch (error) {
            console.warn('格式化时间失败:', error);
            return '未知时间';
        }
    }

    /**
     * 获取卡片的完整内容数据
     * @returns {Object} 完整内容数据
     */
    getFullContentData() {
        return {
            id: this.id,
            foodName: this.foodName,
            imageResource: this.imageResource,
            thumbnailResource: this.thumbnailResource,
            guidanceText: this.guidanceText,
            timestamp: this.timestamp,
            formattedTime: this.getFormattedTime(),
            metadata: { ...this.metadata },
            displayConfig: { ...this.displayConfig },
            interactionState: { ...this.interactionState }
        };
    }

    /**
     * 设置卡片为聚焦状态
     */
    setFocused() {
        this.interactionState.isFocused = true;
        this.interactionState.lastViewedAt = Date.now();
        this.interactionState.viewCount += 1;
        console.log(`卡片 ${this.id} 已聚焦，查看次数: ${this.interactionState.viewCount}`);
    }

    /**
     * 取消卡片聚焦状态
     */
    clearFocus() {
        this.interactionState.isFocused = false;
        console.log(`卡片 ${this.id} 取消聚焦`);
    }

    /**
     * 设置卡片选中状态
     * @param {boolean} selected - 是否选中
     */
    setSelected(selected = true) {
        this.interactionState.isSelected = selected;
        console.log(`卡片 ${this.id} ${selected ? '已选中' : '取消选中'}`);
    }

    /**
     * 更新显示配置
     * @param {Object} config - 新的显示配置
     */
    updateDisplayConfig(config) {
        if (config && typeof config === 'object') {
            this.displayConfig = { ...this.displayConfig, ...config };
            console.log(`卡片 ${this.id} 显示配置已更新`);
        }
    }

    /**
     * 检查卡片是否有效
     * @returns {boolean} 卡片是否有效
     */
    isValid() {
        return !!(
            this.id &&
            this.foodName &&
            this.imageResource &&
            this.guidanceText &&
            this.timestamp
        );
    }

    /**
     * 获取卡片摘要信息
     * @returns {Object} 卡片摘要
     */
    getSummary() {
        return {
            id: this.id,
            foodName: this.foodName,
            timestamp: this.timestamp,
            formattedTime: this.getFormattedTime(),
            viewCount: this.interactionState.viewCount,
            sessionId: this.metadata.sessionId
        };
    }

    /**
     * 克隆卡片
     * @returns {ArchiveCard} 克隆的卡片
     */
    clone() {
        try {
            // 创建一个临时的干预内容对象用于克隆
            const tempContent = {
                foodName: this.foodName,
                imageResource: this.imageResource,
                guidanceText: this.guidanceText,
                createdAt: this.timestamp
            };

            const clonedCard = new ArchiveCard(tempContent);

            // 复制元数据和状态
            clonedCard.metadata = { ...this.metadata };
            clonedCard.displayConfig = { ...this.displayConfig };
            clonedCard.interactionState = { ...this.interactionState };

            return clonedCard;

        } catch (error) {
            console.error('克隆卡片失败:', error);
            return null;
        }
    }

    /**
     * 转换为JSON字符串
     * @returns {string} JSON字符串
     */
    toJSON() {
        return JSON.stringify(this.getFullContentData());
    }

    /**
     * 从JSON数据创建卡片实例
     * @param {Object} jsonData - JSON数据对象
     * @returns {ArchiveCard|null} 卡片实例或null
     */
    static fromJSON(jsonData) {
        try {
            if (!jsonData || typeof jsonData !== 'object') {
                return null;
            }

            // 创建临时干预内容对象
            const tempContent = {
                foodName: jsonData.foodName,
                imageResource: jsonData.imageResource,
                guidanceText: jsonData.guidanceText,
                createdAt: jsonData.timestamp
            };

            const card = new ArchiveCard(tempContent);

            // 恢复ID和其他属性
            if (jsonData.id) {
                card.id = jsonData.id;
            }

            if (jsonData.metadata) {
                card.metadata = { ...card.metadata, ...jsonData.metadata };
            }

            if (jsonData.displayConfig) {
                card.displayConfig = { ...card.displayConfig, ...jsonData.displayConfig };
            }

            if (jsonData.interactionState) {
                card.interactionState = { ...card.interactionState, ...jsonData.interactionState };
            }

            return card;

        } catch (error) {
            console.error('从JSON创建卡片失败:', error);
            return null;
        }
    }

    /**
     * 获取卡片的调试信息
     * @returns {Object} 调试信息
     */
    getDebugInfo() {
        return {
            id: this.id,
            foodName: this.foodName,
            hasImage: !!this.imageResource,
            hasThumbnail: !!this.thumbnailResource,
            hasGuidanceText: !!this.guidanceText,
            timestamp: this.timestamp,
            age: Date.now() - this.timestamp,
            isValid: this.isValid(),
            metadata: this.metadata,
            displayConfig: this.displayConfig,
            interactionState: this.interactionState
        };
    }
}