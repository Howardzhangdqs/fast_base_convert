# Fast Base Convert - 前端项目重构文档

## 项目结构优化

该项目已从 **单文件臃肿模式** 重构为 **模块化架构**，提高了代码可维护性和可扩展性。

### 目录结构

```
www/src/
├── main.ts                 # 应用入口，导入所有样式和启动应用
├── styles/                 # 样式文件夹（模块化CSS）
│   ├── base.css           # 基础样式和重置
│   ├── layout.css         # 布局和栅栏系统
│   ├── components.css     # 组件样式（按钮、卡片、表格等）
│   └── themes.css         # 主题和工具类
└── modules/               # TypeScript 模块
    ├── app.ts            # 主应用类，管理标签页和生命周期
    ├── benchmark.ts      # 基准测试模块
    ├── converter.ts      # 基数转换模块
    ├── visualizer.ts     # 数字表示可视化模块
    └── utils.ts          # 共享工具函数
```

## 重构前后对比

### 重构前
- **index.html**: 2000+ 行（HTML + 内联样式）
- **main.ts**: 1000+ 行单一巨型类
- 所有逻辑混在一起，难以修改和测试

### 重构后
- **index.html**: 200+ 行（仅 HTML 结构）
- **CSS 模块化**: 4个专门的样式文件，关注点分离
- **TypeScript 模块化**: 5个专门的模块文件，每个负责一项功能

## 模块说明

### 1. `modules/utils.ts` - 工具函数库
提供所有功能模块共享的工具：
- `ConversionUtils` 类：进制转换、数字解析、策略判断等

### 2. `modules/converter.ts` - 基数转换模块
处理数字基数转换功能：
- 初始化转换器UI事件
- 执行转换操作
- 更新进制提示信息
- 应用预设值

### 3. `modules/benchmark.ts` - 基准测试模块
运行性能基准测试：
- 初始化WASM
- 顺序运行基准测试
- 生成测试结果表格
- 显示性能摘要

### 4. `modules/visualizer.ts` - 可视化器模块
可视化数字的不同格式表示：
- 整数格式（INT4、INT8、INT16、INT32、INT64、UINT8）
- 浮点格式（FP16、FP32、FP64）
- Q格式（定点格式）
- 十六进制表示

### 5. `modules/app.ts` - 主应用模块
应用入口和标签页管理：
- 初始化所有模块
- 管理标签页切换
- 协调模块间的交互

## CSS 模块说明

### `styles/base.css`
- 全局重置和基础样式
- 字体和颜色定义
- 容器和布局基础

### `styles/layout.css`
- 栅栏系统（Grid）
- 控制组容器
- 响应式设计

### `styles/components.css`
- 按钮样式（主按钮、预设按钮、标签按钮）
- 转换器组件样式
- 信息卡片和状态消息
- 加载和动画效果

### `styles/themes.css`
- 标签页导航样式
- 表格样式
- 格式卡片样式
- 数字表示样式
- 工具类和响应式调整

## 使用指南

### 开发
```bash
npm run dev
```

### 构建
```bash
npm run build
```

### 添加新功能
1. 在 `modules/` 中创建新模块
2. 如果需要特定样式，在 `styles/` 中添加或更新相关CSS文件
3. 在 `modules/app.ts` 中初始化新模块
4. 导入必要的工具函数

### 示例：添加新模块

```typescript
// modules/myfeature.ts
export class MyFeature {
  constructor() {
    this.initializeEventListeners();
  }

  private initializeEventListeners() {
    // 事件处理
  }
}

// modules/app.ts
import { MyFeature } from './myfeature';

export class BenchmarkApp {
  constructor() {
    new MyFeature(); // 初始化新模块
    // ...
  }
}
```

## 优势

✅ **代码组织**: 功能清晰分离，易于定位和修改  
✅ **可维护性**: 每个模块职责单一，便于维护  
✅ **可测试性**: 模块化结构便于单元测试  
✅ **可扩展性**: 添加新功能无需修改现有代码  
✅ **样式管理**: CSS 按功能分组，便于管理和更新  
✅ **性能**: 支持代码分割和按需加载  

## 性能优化

- CSS 文件会被 Vite 自动合并和压缩
- 使用 ES 模块，支持 Tree-shaking
- TypeScript 编译为优化的 JavaScript
- 响应式设计确保移动设备性能

## 浏览器兼容性

- Chrome/Edge: 最新版本
- Firefox: 最新版本
- Safari: 最新版本
- 支持 WebAssembly
