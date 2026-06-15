# AI Chat Web App 项目记忆

## 项目概述

这是一个AI全栈学习项目，目标是让只会Vue前端的开发者成长为能独立开发全栈项目的开发者。

**核心目标**：理解整个全栈系统如何运作，而不是背代码。

## 技术栈

- **前端**：Vue3、TypeScript、Vite、Pinia、Vue Router、Axios、Element Plus、TailwindCSS
- **后端**：Node.js + Express（第一阶段），NestJS（第二阶段）
- **数据库**：MySQL

## 开发顺序（7个阶段）

1. **搭建后端基础环境** - Express项目、基础服务器
2. **连接MySQL** - 数据库驱动、users表、SQL基础
3. **用户系统** - 注册、登录、JWT鉴权
4. **聊天系统** - 会话、消息、历史记录
5. **AI接口** - Node调用AI API、API Key安全
6. **流式输出** - SSE、stream、逐字输出
7. **前端开发** - Vue3项目、组件、状态管理

## AI编码规则（必须遵守）

1. **所有代码必须超详细注释** - 每行、每个变量、每个函数都要解释
2. **所有代码必须教学化** - 一步一步讲，从零开始
3. **生成代码前必须先解释思路** - 为什么这样设计、数据流是什么
4. **所有项目结构必须解释** - 每个目录为什么存在
5. **禁止默认我懂** - 假设我是后端新手、数据库新手

## 重要原则

- **先讲思路，再讲结构，最后写代码**
- **每次开发先画数据流图**
- **解释为什么不用别的方法**
- **教工程思维**（为什么拆文件、分层、封装）
- **教如何提问**（AI时代核心能力）

## 当前状态

- **第一阶段完成**：搭建后端基础环境 ✅
- **第二阶段完成**：连接MySQL ✅
- **第三阶段完成**：用户系统 ✅
- **第四阶段完成**：聊天系统 ✅
- **第五阶段完成**：AI接口（接入小米AI） ✅
- **第六阶段完成**：流式输出（逐字显示） ✅
- **第七阶段完成**：前端开发（前后端联调成功） ✅
- **总进度**：🎉 全部7个阶段已完成

**已完成文件（后端）：**
- `backend/app.js` - Express服务器主文件
- `backend/package.json` - 项目配置
- `backend/config/database.js` - 数据库配置
- `backend/config/init.sql` - 数据库初始化脚本
- `backend/config/jwt.js` - JWT认证配置
- `backend/config/xiaomi-ai.js` - 小米AI配置
- `backend/controllers/userController.js` - 用户控制器
- `backend/controllers/chatController.js` - 聊天控制器
- `backend/controllers/aiController.js` - AI控制器
- `backend/routes/user.js` - 用户路由
- `backend/routes/chat.js` - 聊天路由
- `backend/routes/ai.js` - AI路由
- `backend/middlewares/auth.js` - Token验证中间件
- `backend/.gitignore` - Git忽略配置

**已完成文件（前端）：**
- `frontend/package.json` - 前端依赖配置
- `frontend/vite.config.ts` - Vite配置
- `frontend/tailwind.config.js` - TailwindCSS配置
- `frontend/postcss.config.js` - PostCSS配置
- `frontend/tsconfig.json` - TypeScript配置
- `frontend/index.html` - HTML入口
- `frontend/src/main.ts` - 应用入口
- `frontend/src/App.vue` - 根组件
- `frontend/src/style.css` - 全局样式（Apple风格）
- `frontend/src/router/index.ts` - 路由配置
- `frontend/src/views/LoginView.vue` - 登录/注册页面
- `frontend/src/views/ChatView.vue` - 聊天主页面

**数据库表：**
- `users`表 - 用户信息
- `conversations`表 - 会话信息
- `messages`表 - 消息记录

**API接口总览：**
- POST /api/user/register - 注册
- POST /api/user/login - 登录
- GET /api/user/profile - 获取用户信息
- POST /api/chat/conversation - 创建会话
- GET /api/chat/conversation - 获取会话列表
- DELETE /api/chat/conversation/:id - 删除会话
- POST /api/chat/message - 发送消息
- POST /api/chat/message/stream - 流式发送消息
- GET /api/chat/message/:conversationId - 获取消息列表
- POST /api/ai/test - 测试AI接口
- GET /api/ai/info - 获取AI模型信息

## 用户额外要求

- 启动服务器后不要卡住，告诉用户命令让用户手动启动
- 创建进度文件（PROGRESS.md）记录当前步骤
- 代码注释中补充常用API说明（如pool.query、pool.execute等）
- 创建笔记文件（NOTES.md）记录不方便写在代码里的知识点
- 已将这些规则补充到必读.md
- 前端的HTML和CSS部分的注释可以少量，因为用户懂前端

## 学习重点

- 理解后端如何工作
- 理解前后端交互流程
- 理解数据库操作
- 理解token鉴权机制
- 理解API设计
- 培养Debug能力

## 用户需求

- 用户是Vue前端开发者，后端/数据库/Node.js是新手
- 需要大白话解释，避免行业黑话
- 需要完整数据流图
- 需要解释"为什么这样做"而不仅仅是"怎么做"

---

**最后更新**：2026-06-15
**项目阶段**：🎉 全部7个阶段已完成，项目开发完成