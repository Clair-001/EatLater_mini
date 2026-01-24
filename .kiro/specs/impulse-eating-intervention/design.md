# 设计文档

## 概述

EatLater 是一款专注于即时干预冲动性饮食行为的微信小程序。本设计采用极简主义的卡片式架构，通过预置图片库、本地数据处理和存档历史功能，确保在关键的1-3分钟干预窗口内提供快速响应。应用遵循微信小程序设计规范，采用柔和冷色调配色方案，提供平静、情感中立的用户体验。

### 核心设计理念

- **极简主义**: 大量留白，微妙深度的扁平化设计
- **情感中立**: 柔和的冷色调配色（蓝色、灰色、去饱和色调）
- **卡片式交互**: 流畅的卡片动画和水平滚动历史记录
- **短暂使用**: 专为5-15秒的极短使用时长设计
- **非惩罚性**: 避免"禁止"或评判性语言，营造"短暂静默"的感觉

## 架构

### 整体架构

小程序采用 MVVM (Model-View-ViewModel) 架构模式，基于微信小程序框架，新增存档管理和历史记录功能：

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   index.vue     │◄──►│ InterventionVM  │◄──►│ InterventionRepo│
│   (View Layer)  │    │  (ViewModel)    │    │ (Model Layer)   │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                       │                       │
         ▼                       ▼                       ▼
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   UI Components │    │  Business Logic │    │   Data Sources  │
│   - InputView   │    │  - Validation   │    │  - ImageLibrary │
│   - ImageView   │    │  - ImageSelect  │    │  - TextLibrary  │
│   - CardView    │    │  - TextSelect   │    │  - ArchiveStore │
│   - ArchiveView │    │  - CardArchive  │    │  - Storage      │
│   - ButtonView  │    │  - HistoryMgmt  │    │                 │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

### 核心组件

1. **index.vue**: 主页面组件，管理用户交互和界面状态转换
2. **InterventionViewModel**: 业务逻辑处理，连接视图和数据层，新增存档管理
3. **InterventionRepository**: 数据访问层，管理图片库、文案库和存档数据
4. **ImageLibrary**: 预置反差视觉图片管理
5. **TextLibrary**: 暂停引导文案管理
6. **ArchiveStore**: 存档数据管理，支持卡片历史记录
7. **CardManager**: 卡片动画和交互管理

## 组件和接口

### 数据传输对象

```javascript
// 食物输入数据
class FoodInput {
  constructor(name) {
    this.name = name;
    this.timestamp = Date.now();
    this.id = this.generateId();
  }
  
  generateId() {
    return `food_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}

// 干预内容数据
class InterventionContent {
  constructor(imageResource, guidanceText, foodName) {
    this.imageResource = imageResource;
    this.guidanceText = guidanceText;
    this.foodName = foodName;
    this.timestamp = Date.now();
    this.id = this.generateId();
  }
  
  generateId() {
    return `content_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}

// 存档卡片数据
class ArchiveCard {
  constructor(interventionContent) {
    this.id = interventionContent.id;
    this.foodName = interventionContent.foodName;
    this.imageResource = interventionContent.imageResource;
    this.guidanceText = interventionContent.guidanceText;
    this.timestamp = interventionContent.timestamp;
    this.thumbnailResource = this.generateThumbnail(interventionContent.imageResource);
  }
  
  generateThumbnail(imageResource) {
    // 生成缩略图路径或使用原图
    return imageResource;
  }
}

// 应用状态
const InterventionState = {
  LOADING: 'loading',
  INPUT_READY: 'inputReady',
  CONTENT_DISPLAYED: 'contentDisplayed',
  ARCHIVE_VIEW: 'archiveView',
  CARD_FOCUSED: 'cardFocused',
  COMPLETED: 'completed'
};

// UI 状态
const UIState = {
  MAIN_SCREEN: 'mainScreen',        // 主屏幕（输入状态）
  ARCHIVE_SCREEN: 'archiveScreen',  // 存档屏幕
  CARD_STACK: 'cardStack'           // 卡片堆叠状态
};
```

### 核心接口

```javascript
// 图片库接口
class ImageLibrary {
  getImageForFood(foodName) {
    // 返回图片路径
  }
  
  getDefaultImage() {
    // 返回默认图片路径
  }
  
  isImageAvailable(foodName) {
    // 检查图片是否可用
  }
}

// 文案库接口
class TextLibrary {
  getRandomGuidanceText() {
    // 返回随机引导文案
  }
  
  getAllGuidanceTexts() {
    // 返回所有引导文案
  }
}

// 存档管理接口
class ArchiveStore {
  saveCard(archiveCard) {
    // 保存存档卡片
  }
  
  getAllCards() {
    // 获取所有存档卡片
  }
  
  getCardById(id) {
    // 根据ID获取特定卡片
  }
  
  clearAllCards() {
    // 清空所有存档
  }
  
  getRecentCards(limit = 10) {
    // 获取最近的卡片
  }
}

// 数据仓库接口
class InterventionRepository {
  async getInterventionContent(foodInput) {
    // 返回干预内容
  }
  
  getQuickSelectFoods() {
    // 返回快捷选择食物列表
  }
  
  async archiveContent(interventionContent) {
    // 存档干预内容
  }
  
  async getArchiveHistory() {
    // 获取存档历史
  }
}
```

### UI 组件接口

```javascript
// 主界面接口
class InterventionView {
  showInputInterface() {
    // 显示输入界面（主屏幕）
  }
  
  showInterventionContent(content) {
    // 显示干预内容（存档屏幕）
  }
  
  showArchiveView(cards) {
    // 显示存档视图
  }
  
  showLoading() {
    // 显示加载状态
  }
  
  enableExit() {
    // 启用退出功能
  }
  
  switchToMainScreen() {
    // 切换到主屏幕
  }
  
  switchToArchiveScreen() {
    // 切换到存档屏幕
  }
}

// 输入组件接口
class FoodInputView {
  setQuickSelectButtons(foods) {
    // 设置快捷选择按钮
  }
  
  getCurrentInput() {
    // 获取当前输入
  }
  
  clearInput() {
    // 清空输入
  }
  
  setInputEnabled(enabled) {
    // 设置输入是否可用
  }
}

// 卡片管理接口
class CardManager {
  createCard(interventionContent) {
    // 创建新卡片
  }
  
  animateCardToStack(card) {
    // 卡片动画到底部堆叠
  }
  
  focusCard(cardId) {
    // 聚焦特定卡片
  }
  
  scrollToCard(cardId) {
    // 滚动到特定卡片
  }
  
  renderCardStack(cards) {
    // 渲染卡片堆叠
  }
}

// 导航接口
class NavigationManager {
  showBackArrow() {
    // 显示返回箭头（左上角）
  }
  
  showHistoryIcon() {
    // 显示历史图标（右上角）
  }
  
  hideNavigationIcons() {
    // 隐藏导航图标
  }
}
```

## UI设计规范

### 视觉设计原则

#### 配色方案
- **主色调**: 柔和的冷色调
  - 主蓝色: #E3F2FD (浅蓝)
  - 次蓝色: #BBDEFB (中蓝)
  - 深蓝色: #90CAF9 (深蓝)
- **中性色**:
  - 浅灰: #F5F7FA
  - 中灰: #E1E8ED
  - 深灰: #8899A6
- **文字色**:
  - 主文字: #2C3E50 (深蓝灰)
  - 次文字: #7F8C8D (中灰)
  - 提示文字: #95A5A6 (浅灰)

#### 设计元素
- **圆角**: 统一使用 12rpx 圆角
- **阴影**: 柔和阴影 `0 4rpx 12rpx rgba(0,0,0,0.1)`
- **间距**: 基础间距单位 20rpx，常用倍数 40rpx, 60rpx, 80rpx
- **字体**: 
  - 标题: 48rpx, 粗体
  - 正文: 32rpx, 常规
  - 辅助: 28rpx, 常规
  - 提示: 24rpx, 常规

### 界面状态设计

#### 主屏幕布局（初始状态）
```
┌─────────────────────────────────┐
│ ≡                               │  ← 设置图标（左上角）
│                                 │
│                                 │
│        输入你现在想吃的食物        │  ← 输入框（屏幕中央）
│     ┌─────────────────────┐     │
│     │                     │     │
│     └─────────────────────┘     │
│                                 │
│   [披萨] [炸鸡] [奶茶] [蛋糕]    │  ← 快捷按钮
│                                 │
│                                 │
│                                 │
└─────────────────────────────────┘
```

#### 存档屏幕布局（显示干预内容后）
```
┌─────────────────────────────────┐
│ ←                           🕐  │  ← 返回箭头 & 历史图标
│                                 │
│     ┌─────────────────────┐     │
│     │                     │     │  ← 大图片（视觉焦点）
│     │    反差视觉图片      │     │
│     │                     │     │
│     └─────────────────────┘     │
│                                 │
│      详细描述性文字内容          │  ← 引导文案
│                                 │
│                                 │
│ ┌─┐ ┌─┐ ┌─┐ ┌─┐ ┌─┐ ┌─┐ ┌─┐   │  ← 底部卡片堆叠
└─────────────────────────────────┘
```

#### 卡片交互设计

**卡片状态**:
1. **缩略图状态**: 小卡片，显示食物缩略图
2. **聚焦状态**: 卡片放大到屏幕中央，显示完整内容
3. **堆叠状态**: 水平排列在底部

**动画效果**:
- **存档动画**: 大图片 → 缩小成卡片 → 滑动到底部堆叠
- **聚焦动画**: 卡片 → 放大到中央 → 显示完整内容
- **滚动动画**: 水平滚动，带有惯性和回弹效果

### 交互流程设计

#### 核心交互流程
1. **输入阶段**: 用户在主屏幕输入食物
2. **干预阶段**: 显示反差图片和引导文案
3. **存档阶段**: 内容自动转换为卡片并存档
4. **浏览阶段**: 用户可以浏览历史卡片

#### 导航逻辑
- **主屏幕 → 存档屏幕**: 输入食物后自动切换
- **存档屏幕 → 主屏幕**: 点击左上角返回箭头
- **任意屏幕 → 存档屏幕**: 点击右上角历史图标

#### 手势交互
- **向下滑动**: 在存档屏幕向下滑动触发存档动画
- **水平滑动**: 在卡片区域水平滑动浏览历史
- **点击卡片**: 聚焦选中的卡片
- **松开手指**: 自动聚焦当前位置的卡片

## 数据模型

### 图片库数据结构

```javascript
// 图片映射配置
class ImageMapping {
  constructor(foodKeywords, imageResource, category) {
    this.foodKeywords = foodKeywords;
    this.imageResource = imageResource;
    this.category = category;
  }
}

const FoodCategory = {
  FAST_FOOD: 'fastFood',      // 快餐类
  DESSERT: 'dessert',         // 甜品类
  BEVERAGE: 'beverage',       // 饮品类
  SNACK: 'snack',            // 零食类
  DEFAULT: 'default'          // 默认类别
};

// 图片库配置
const ImageLibraryConfig = {
  mappings: [
    new ImageMapping(
      ['披萨', 'pizza', '比萨'],
      '/static/images/pizza_unappetizing.jpg',
      FoodCategory.FAST_FOOD
    ),
    new ImageMapping(
      ['炸鸡', '鸡腿', '肯德基', '麦当劳'],
      '/static/images/chicken_unappetizing.jpg',
      FoodCategory.FAST_FOOD
    ),
    // ... 更多映射
  ]
};
```

### 文案库数据结构

```javascript
// 引导文案配置
const TextLibraryConfig = {
  guidanceTexts: [
    '先缓一缓，现在不急，晚点再决定',
    '深呼吸一下，给自己一点时间思考',
    '也许过一会儿就不那么想吃了',
    '现在暂停一下，听听身体真正的需要',
    '等等再说，先做点别的事情'
  ]
};
```

### 用户偏好数据

```javascript
// 用户偏好设置
class UserPreferences {
  constructor() {
    this.quickSelectFoods = ['披萨', '炸鸡', '奶茶', '蛋糕', '薯条'];
    this.displayDuration = 5000; // 显示时长（毫秒）
    this.enableVibration = false;
    this.enableSessionArchive = true;  // 启用会话存档功能
    this.maxSessionCards = 10;         // 单次会话最大存档卡片数
    this.autoArchive = true;           // 自动存档
  }
  
  static get defaultQuickSelectFoods() {
    return ['披萨', '炸鸡', '奶茶', '蛋糕', '薯条'];
  }
}
```

### 会话存档数据结构

```javascript
// 会话存档管理配置
class SessionArchiveConfig {
  constructor() {
    this.maxCards = 10;               // 单次会话最大卡片数量
    this.cardAnimationDuration = 800; // 卡片动画时长（毫秒）
    this.scrollSensitivity = 0.8;     // 滚动敏感度
    this.sessionOnly = true;          // 仅会话期间保留数据
  }
}

// 会话存档存储管理
class SessionArchiveStorage {
  constructor() {
    this.sessionCards = [];           // 内存中的会话卡片
    this.maxSessionCards = 10;        // 单次会话最大卡片数
    this.sessionOnly = true;          // 仅会话期间保留
  }
  
  addSessionCard(card) {
    // 添加卡片到会话存储（内存中）
    this.sessionCards.push(card);
    if (this.sessionCards.length > this.maxSessionCards) {
      this.sessionCards.shift(); // 移除最旧的卡片
    }
  }
  
  getSessionCards() {
    // 获取当前会话的所有卡片
    return [...this.sessionCards];
  }
  
  getCardById(id) {
    // 根据ID获取特定卡片
    return this.sessionCards.find(card => card.id === id);
  }
  
  clearSessionCards() {
    // 清空会话存储的所有卡片
    this.sessionCards = [];
  }
  
  getSessionUsage() {
    // 获取当前会话存储使用情况
    return {
      currentCount: this.sessionCards.length,
      maxCount: this.maxSessionCards,
      memoryUsage: JSON.stringify(this.sessionCards).length
    };
  }
}

// 卡片动画配置
class CardAnimation {
  constructor() {
    this.archiveAnimation = {
      duration: 800,
      easing: 'cubic-bezier(0.4, 0.0, 0.2, 1)',
      steps: [
        { transform: 'scale(1)', offset: 0 },
        { transform: 'scale(0.8)', offset: 0.3 },
        { transform: 'scale(0.6) translateY(200px)', offset: 0.7 },
        { transform: 'scale(0.4) translateY(400px)', offset: 1 }
      ]
    };
    
    this.focusAnimation = {
      duration: 600,
      easing: 'cubic-bezier(0.4, 0.0, 0.2, 1)',
      steps: [
        { transform: 'scale(0.4) translateY(400px)', offset: 0 },
        { transform: 'scale(0.8) translateY(200px)', offset: 0.4 },
        { transform: 'scale(1) translateY(0)', offset: 1 }
      ]
    };
  }
}
```

## 正确性属性

*属性是一个特征或行为，应该在系统的所有有效执行中保持为真——本质上是关于系统应该做什么的正式声明。属性作为人类可读规范和机器可验证正确性保证之间的桥梁。*

基于需求分析，以下是可测试的正确性属性：

### 属性 1: 快捷按钮输入填充
*对于任何*快捷按钮，当用户点击时，对应的食物名称应该被自动填充到输入框中
**验证需求: 需求 1.4**

### 属性 2: 输入验证和图片选择
*对于任何*有效的食物输入，系统应该返回一个对应的图片资源；对于空输入，系统应该阻止继续操作
**验证需求: 需求 1.5, 2.1**

### 属性 3: 默认图片回退
*对于任何*不在预设食物列表中的输入，系统应该返回默认的反差视觉图片
**验证需求: 需求 2.3**

### 属性 4: UI组件同步显示
*对于任何*有效的干预内容，图片和引导文案应该同时显示在界面上
**验证需求: 需求 3.1**

### 属性 5: 文案选择有效性
*对于任何*干预显示，系统选择的引导文案应该来自预设的文案库，不应为空或无效
**验证需求: 需求 3.2**

### 属性 6: 用户流程自由退出
*对于任何*应用状态，用户都应该能够自由退出而不被强制进行后续操作
**验证需求: 需求 4.4**

### 属性 7: 会话数据清理
*对于任何*用户退出操作，当前会话的所有临时数据都应该被清除
**验证需求: 需求 4.5**

### 属性 8: 应用性能响应
*对于任何*启动或恢复操作，系统应该在合理时间内（3秒）完成加载并显示主界面
**验证需求: 需求 5.1, 5.3**

### 属性 9: 离线功能完整性
*对于任何*网络状态（包括断网），系统的核心功能都应该正常工作，使用本地资源
**验证需求: 需求 5.5**

### 新增存档相关属性

### 属性 10: 会话存档卡片创建
*对于任何*有效的干预内容，系统应该能够创建对应的存档卡片并保存到会话内存中
**验证需求: 需求 6.1**

### 属性 11: 会话卡片历史记录完整性
*对于任何*在当前会话中已存档的卡片，用户应该能够在历史记录中找到并重新查看
**验证需求: 需求 6.3**

### 属性 12: 卡片动画流畅性
*对于任何*卡片存档或聚焦操作，动画应该在指定时间内完成且不出现卡顿
**验证需求: 需求 6.2**

### 属性 13: 导航状态一致性
*对于任何*界面状态，导航图标（返回箭头、历史图标）应该与当前状态保持一致
**验证需求: 需求 7.5**

### 属性 14: 会话数据临时性
*对于任何*应用退出操作，所有会话存档数据都应该被完全清除，不进行持久化存储
**验证需求: 需求 6.5**

## 错误处理

### 输入错误处理

1. **空输入处理**: 当用户尝试提交空的食物名称时，显示温和提示"请输入您想吃的食物"
2. **特殊字符处理**: 自动过滤或转换特殊字符，确保输入的安全性
3. **长度限制**: 限制输入长度在50个字符以内，超出时自动截断

### 资源加载错误处理

1. **图片加载失败**: 当特定图片无法加载时，自动回退到默认图片
2. **文案库为空**: 当文案库出现问题时，使用硬编码的默认文案
3. **存储空间不足**: 当设备存储空间不足时，清理临时缓存

### 系统错误处理

1. **内存不足**: 实现内存管理，及时释放不需要的资源
2. **应用崩溃**: 实现崩溃恢复机制，保存用户当前状态
3. **权限问题**: 优雅处理权限拒绝，提供替代方案

## 测试策略

### 双重测试方法

本项目采用单元测试和基于属性的测试相结合的方法：

- **单元测试**: 验证特定示例、边界情况和错误条件
- **属性测试**: 验证跨所有输入的通用属性
- 两种测试方法互补，提供全面覆盖

### 单元测试重点

单元测试专注于：
- 特定示例，展示正确行为
- 组件间的集成点
- 边界情况和错误条件
- UI组件的存在性和可见性验证

### 基于属性的测试配置

- **测试框架**: 使用 Jest 和自定义属性测试工具进行 JavaScript 属性测试
- **最小迭代次数**: 每个属性测试至少运行 100 次迭代
- **测试标记格式**: **功能: impulse-eating-intervention, 属性 {编号}: {属性文本}**
- **需求追溯**: 每个属性测试必须引用其设计文档属性

### 测试数据生成策略

1. **食物名称生成器**: 生成各种长度和字符组合的食物名称
2. **边界值生成器**: 生成空字符串、超长字符串、特殊字符等边界情况
3. **UI状态生成器**: 生成各种应用状态组合进行状态转换测试
4. **网络状态模拟器**: 模拟各种网络连接状态

### 测试环境配置

1. **本地测试**: 使用 Jest 进行单元测试
2. **UI测试**: 使用微信开发者工具进行小程序 UI 测试
3. **集成测试**: 使用真实的图片库和文案库进行端到端测试
4. **性能测试**: 使用微信开发者工具监控启动时间和内存使用