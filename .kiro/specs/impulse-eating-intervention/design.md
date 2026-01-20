# 设计文档

## 概述

EatLater 是一款专注于即时干预冲动性饮食行为的微信小程序。本设计采用简洁的单页面架构，通过预置图片库和本地数据处理，确保在关键的1-3分钟干预窗口内提供快速响应。应用遵循微信小程序设计规范，提供直观的用户体验。

## 架构

### 整体架构

小程序采用 MVVM (Model-View-ViewModel) 架构模式，基于微信小程序框架：

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
│   - TextView    │    │  - TextSelect   │    │  - Storage      │
│   - ButtonView  │    └─────────────────┘    └─────────────────┘
└─────────────────┘
```

### 核心组件

1. **index.vue**: 主页面组件，管理用户交互和界面状态
2. **InterventionViewModel**: 业务逻辑处理，连接视图和数据层
3. **InterventionRepository**: 数据访问层，管理图片库和文案库
4. **ImageLibrary**: 预置反差视觉图片管理
5. **TextLibrary**: 暂停引导文案管理

## 组件和接口

### 数据传输对象

```javascript
// 食物输入数据
class FoodInput {
  constructor(name) {
    this.name = name;
    this.timestamp = Date.now();
  }
}

// 干预内容数据
class InterventionContent {
  constructor(imageResource, guidanceText, foodName) {
    this.imageResource = imageResource;
    this.guidanceText = guidanceText;
    this.foodName = foodName;
  }
}

// 应用状态
const InterventionState = {
  LOADING: 'loading',
  INPUT_READY: 'inputReady',
  CONTENT_DISPLAYED: 'contentDisplayed',
  COMPLETED: 'completed'
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

// 数据仓库接口
class InterventionRepository {
  async getInterventionContent(foodInput) {
    // 返回干预内容
  }
  
  getQuickSelectFoods() {
    // 返回快捷选择食物列表
  }
}
```

### UI 组件接口

```javascript
// 主界面接口
class InterventionView {
  showInputInterface() {
    // 显示输入界面
  }
  
  showInterventionContent(content) {
    // 显示干预内容
  }
  
  showLoading() {
    // 显示加载状态
  }
  
  enableExit() {
    // 启用退出功能
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
```

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
  }
  
  static get defaultQuickSelectFoods() {
    return ['披萨', '炸鸡', '奶茶', '蛋糕', '薯条'];
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