# EatLater 项目结构说明

## 项目概述

EatLater 是一款专注于即时干预冲动性饮食行为的微信小程序，采用 MVVM 架构模式。

## 目录结构

```
eatlater_mini260120/
├── .kiro/                          # Kiro 配置目录
│   ├── specs/                      # 规格文档
│   │   └── impulse-eating-intervention/
│   │       ├── requirements.md     # 需求文档
│   │       ├── design.md          # 设计文档
│   │       └── tasks.md           # 任务列表
│   └── steering/                   # 指导文件
├── models/                         # 数据模型层
│   ├── FoodInput.js               # 食物输入数据类
│   ├── InterventionContent.js     # 干预内容数据类
│   └── InterventionState.js       # 应用状态管理
├── interfaces/                     # 接口层
│   ├── ImageLibrary.js            # 图片库接口
│   ├── TextLibrary.js             # 文案库接口
│   └── InterventionRepository.js  # 数据仓库接口
├── viewmodels/                     # ViewModel 层（待实现）
├── pages/                          # 页面组件
│   └── index/                     # 主页面
│       └── index.vue              # 主页面组件
├── static/                         # 静态资源
│   ├── images/                    # 图片资源目录
│   └── logo.png                   # 应用图标
├── tests/                          # 测试文件
│   ├── models/                    # 模型测试
│   │   ├── FoodInput.test.js
│   │   ├── InterventionContent.test.js
│   │   └── InterventionState.test.js
│   ├── interfaces/                # 接口测试
│   │   ├── ImageLibrary.test.js
│   │   ├── TextLibrary.test.js
│   │   └── InterventionRepository.test.js
│   └── setup.js                   # 测试环境设置
├── package.json                    # 项目配置
├── jest.config.js                 # Jest 测试配置
├── babel.config.js                # Babel 配置
├── manifest.json                  # 小程序配置
├── pages.json                     # 页面配置
├── App.vue                        # 应用入口
└── main.js                        # 主入口文件
```

## 架构说明

### MVVM 架构层次

1. **Model 层** (`models/`)
   - `FoodInput`: 食物输入数据封装
   - `InterventionContent`: 干预内容数据封装
   - `InterventionState`: 应用状态管理

2. **View 层** (`pages/`)
   - `index.vue`: 主界面组件

3. **ViewModel 层** (`viewmodels/`)
   - 待实现：业务逻辑处理层

4. **Interface 层** (`interfaces/`)
   - `ImageLibrary`: 图片资源管理
   - `TextLibrary`: 文案资源管理
   - `InterventionRepository`: 数据访问统一接口

## 测试框架

- **测试工具**: Jest
- **测试覆盖**: 94 个测试用例全部通过
- **测试类型**: 单元测试 + 属性测试（待实现）
- **测试环境**: Node.js 环境，模拟微信小程序 API

## 核心功能模块

### 1. 数据模型 (Models)
- 食物输入验证和处理
- 干预内容数据结构
- 应用状态转换管理

### 2. 资源管理 (Interfaces)
- 图片库：食物到反差视觉图片的映射
- 文案库：暂停引导文案管理
- 数据仓库：统一的数据访问接口

### 3. 测试覆盖
- 完整的单元测试覆盖
- 边界条件和错误处理测试
- 模拟微信小程序环境

## 开发规范

### 代码规范
- 使用 ES6+ 语法
- 采用模块化导入/导出
- 完整的 JSDoc 注释
- 中文注释和文档

### 测试规范
- 每个模块都有对应的测试文件
- 测试用例使用中文描述
- 覆盖正常流程和异常情况
- 使用 Jest 的 mock 功能模拟外部依赖

### 文件命名
- 模型文件：PascalCase (如 FoodInput.js)
- 测试文件：模块名.test.js
- 配置文件：kebab-case

## 下一步开发

根据 `tasks.md` 中的任务列表，接下来需要：

1. 实现数据层组件（图片库管理器、文案库管理器）
2. 创建数据仓库层
3. 实现 ViewModel 层
4. 重构主页面 UI 组件
5. 实现核心交互逻辑

## 运行命令

```bash
# 安装依赖
npm install

# 运行测试
npm test

# 运行测试并生成覆盖率报告
npm run test:coverage

# 监听模式运行测试
npm run test:watch

# 构建小程序
npm run build:mp-weixin
```