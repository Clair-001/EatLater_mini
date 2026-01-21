/**
 * 图片库接口
 * 定义图片库的核心功能
 */
export class ImageLibrary {
    constructor() {
        this.imageMapping = new Map();
        this.defaultImagePath = 'https://ob-assets-open.oss-cn-shanghai.aliyuncs.com/img/202601211107127.jpg';
    }

    /**
     * 根据食物名称获取对应图片
     * @param {string} foodName - 食物名称
     * @returns {string} 图片路径
     */
    getImageForFood(foodName) {
        if (!foodName || typeof foodName !== 'string') {
            return this.getDefaultImage();
        }

        const cleanName = foodName.trim().toLowerCase();

        // 遍历映射查找匹配的关键词
        for (const [keywords, imagePath] of this.imageMapping) {
            if (keywords.some(keyword => cleanName.includes(keyword.toLowerCase()))) {
                return imagePath;
            }
        }

        return this.getDefaultImage();
    }

    /**
     * 获取默认图片
     * @returns {string} 默认图片路径
     */
    getDefaultImage() {
        return this.defaultImagePath;
    }

    /**
     * 检查指定食物是否有对应图片
     * @param {string} foodName - 食物名称
     * @returns {boolean} 是否有对应图片
     */
    isImageAvailable(foodName) {
        if (!foodName || typeof foodName !== 'string') {
            return false;
        }

        const cleanName = foodName.trim().toLowerCase();

        for (const [keywords] of this.imageMapping) {
            if (keywords.some(keyword => cleanName.includes(keyword.toLowerCase()))) {
                return true;
            }
        }

        return false;
    }

    /**
     * 添加图片映射
     * @param {Array<string>} keywords - 关键词数组
     * @param {string} imagePath - 图片路径
     */
    addImageMapping(keywords, imagePath) {
        this.imageMapping.set(keywords, imagePath);
    }

    /**
     * 初始化默认图片映射
     */
    initializeDefaultMappings() {
        // 快餐类
        this.addImageMapping(
            ['披萨', 'pizza', '比萨'],
            'https://ob-assets-open.oss-cn-shanghai.aliyuncs.com/img/202601211107400.jpg'
        );

        this.addImageMapping(
            ['炸鸡', '鸡腿', '肯德基', '麦当劳', 'kfc'],
            'https://ob-assets-open.oss-cn-shanghai.aliyuncs.com/img/202601211107624.jpg'
        );

        // 饮品类
        this.addImageMapping(
            ['奶茶', '珍珠奶茶', '茶饮'],
            'https://ob-assets-open.oss-cn-shanghai.aliyuncs.com/img/202601211107542.jpg'
        );

        // 甜品类
        this.addImageMapping(
            ['蛋糕', 'cake', '甜品', '甜点'],
            'https://ob-assets-open.oss-cn-shanghai.aliyuncs.com/img/202601211102004.jpg'
        );

        // 零食类
        this.addImageMapping(
            ['薯条', '薯片', '炸薯条'],
            'https://ob-assets-open.oss-cn-shanghai.aliyuncs.com/img/202601211107751.jpg'
        );
    }

    /**
     * 清理缓存
     * 清理可能存在的临时缓存数据
     */
    clearCache() {
        try {
            console.log('清理图片库缓存');

            // 清理可能存在的图片缓存
            const cacheKeys = [
                'imageLoadCache',
                'lastSelectedImage',
                'imageSelectionHistory',
                'recentImages'
            ];

            cacheKeys.forEach(key => {
                try {
                    if (typeof uni !== 'undefined' && uni.removeStorageSync) {
                        uni.removeStorageSync(key);
                    }
                } catch (error) {
                    console.warn(`清理图片缓存失败: ${key}`, error);
                }
            });

            console.log('图片库缓存清理完成');

        } catch (error) {
            console.error('清理图片库缓存时发生错误:', error);
        }
    }

    /**
     * 重置图片映射
     */
    resetMappings() {
        this.imageMapping.clear();
        this.initializeDefaultMappings();
    }
}