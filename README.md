# NarrativeEngine / 叙事引擎 - Noir

> **黑客松项目**：将线性小说秒变为沉浸式互动 Galgame 的 AI 驱动引擎。

## 🌟 项目愿景
NarrativeEngine 旨在打破文学与交互游戏的边界。通过通义千问 (Qwen-Plus) 的深度理解能力，系统能自动将枯燥的线性文本重构为带有分支选项、角色演出、背景渲染的视觉小说（Galgame），并针对配音需求实现了严格的旁白与对话分离。

## 🏗️ 项目架构

项目采用现代 Web 技术栈，结合 AI 逻辑层实现高度动态的剧本生成。

```text
hackson-noevl/
├── App.tsx             # 应用入口，管理分析态、游戏态与全局错误捕获
├── components/         # 核心渲染组件
│   ├── GameEngine.tsx  # 游戏运行引擎（支持打字机效果、分支逻辑、历史日志）
│   ├── InputStage.tsx  # 初始输入界面（支持文件上传、例加载）
│   └── Icons.tsx       # 响应式 SVG 图标库
├── services/           # 后端服务逻辑
│   └── aliyunService.ts# AI 核心控制器（提示词工程、数据标准化、自愈逻辑）
├── types.ts            # 全局类型定义（定义了剧本、节点、选项的拓扑结构）
├── index.html          # 系统宿主页面
└── vite.config.ts      # 工程化配置
```

## 🚀 核心特性

### 1. 导演级剧本拆分 (Director-grade Splitting)
AI 不再只是简单的文本转换，而是扮演“视觉小说导演”的角色：
- **纯粹台词**: 对话节点被剥离了所有引导语（如“他说道”）和动作描写，仅保留最纯粹的台词，为后续的高品质配音铺路。
- **旁白分离**: 环境、心理、动作被独立拆分为旁白节点，确保演出的节奏感。

### 2. 交互自愈逻辑 (Auto-Link)
为了解决 AI 生成不稳定导致的“卡死”问题：
- **自愈系统**: 后端 normalization 阶段会自动检测缺失选项的非结局节点，并自动建立到后继节点的链接，确保玩家流程 100% 连贯。
- **防御性渲染**: 前端对渲染逻辑进行了深度加固，使用可选链和全局切片式打字机效果，防止数据异常导致红屏。

### 3. 长文本性能优化 (Qwen-Plus Optimization)
针对《诡秘之主》等超长篇幅小说的专项优化：
- **模型提速**: 使用 `qwen-plus` 配合优化的提示词规则，响应速度提升 50%。
- **Token 扩容**: 开启 3000 Token 上限支持，确保复杂剧本 JSON 不被截断。

## 🛠️ 技术栈
- **Frontend**: React 19 + TypeScript + TailwindCSS
- **Bundler**: Vite
- **AI Engine**: Aliyun Qwen API (Model: `qwen-plus`)
- **Animation**: CSS3 Keyframes + Framer-motion style transitions

## 📦 快速开始

1. **配置环境**:
   在根目录创建 `.env.local` 文件，配置你的 API KEY。
   ```env
   VITE_ALIYUN_API_KEY=你的apikey
   ```

2. **安装依赖**:
   ```bash
   npm install
   ```

3. **启动开发服务器**:
   ```bash
   npm run dev
   ```

---
*Developed with ❤️ during the AI Hackathon.*
