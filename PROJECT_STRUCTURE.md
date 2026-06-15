# AIChatWebApp 项目结构详解

> 本文档详细描述项目的每个文件和目录，帮助理解整个项目的架构。
> 定期更新，保持与代码同步。

---

## 一、项目目录树

```
AIChatWebApp/
├── 必读.md                    # 必读的学习规则（每次开发前先看）
├── PROGRESS.md                # 开发进度记录
├── PROJECT_MEMORY.md          # 跨会话的项目记忆
├── PROJECT_STRUCTURE.md       # ⭐ 本文档：项目结构详解
├── NOTES.md                   # 开发笔记
├── 前端页面UI样式规则.md        # 前端样式规范
│
├── backend/                   # 后端代码目录
│   ├── .gitignore             # Git忽略文件配置
│   ├── package.json           # 项目依赖配置
│   ├── package-lock.json      # 依赖版本锁定（自动生成）
│   ├── node_modules/          # 依赖包目录（自动生成）
│   │
│   ├── app.js                 # ⭐ 服务器主文件（入口）
│   │
│   ├── config/                # 配置文件目录
│   │   ├── database.js        # 数据库连接配置
│   │   ├── init.sql           # 数据库初始化脚本（建表SQL）
│   │   ├── jwt.js             # JWT认证配置
│   │   └── xiaomi-ai.js       # 小米AI API配置
│   │
│   ├── controllers/           # 控制器目录（业务逻辑）
│   │   ├── userController.js  # 用户相关业务（注册/登录/获取信息）
│   │   ├── chatController.js  # 聊天相关业务（会话管理/消息管理）
│   │   └── aiController.js    # AI相关业务（调用小米AI API）
│   │
│   ├── middlewares/           # 中间件目录（拦截器）
│   │   └── auth.js            # Token验证中间件
│   │
│   └── routes/                # 路由目录（接口地址定义）
│       ├── user.js            # 用户相关接口地址
│       ├── chat.js            # 聊天相关接口地址
│       └── ai.js              # AI相关接口地址
│
└── frontend/                  # 前端代码目录（Vue3）
    ├── package.json           # 前端依赖配置
    ├── package-lock.json      # 依赖版本锁定（自动生成）
    ├── node_modules/          # 依赖包目录（自动生成）
    ├── index.html             # HTML入口文件
    ├── vite.config.ts         # ⭐ Vite配置（构建工具）
    ├── tailwind.config.js     # TailwindCSS配置
    ├── postcss.config.js      # PostCSS配置
    ├── tsconfig.json          # TypeScript配置
    │
    └── src/                   # 源代码目录
        ├── main.ts            # ⭐ 应用入口（创建Vue实例）
        ├── App.vue            # 根组件
        ├── style.css          # ⭐ 全局样式（Apple风格主题）
        │
        ├── router/            # 路由目录
        │   └── index.ts       # 路由配置（定义页面地址）
        │
        ├── views/             # 页面组件目录
        │   ├── LoginView.vue  # 登录/注册页面
        │   └── ChatView.vue   # 聊天主页面
        │
        ├── components/        # 公共组件目录（预留）
        └── assets/            # 静态资源目录（图片等）
```

---

## 二、根目录文件详解

### 必读.md
- **作用**：记录学习规则和开发规范
- **内容**：详细注释要求、教学模式、数据流图等
- **重要**：每次开发前必须先看，确保代码风格一致
- **是否修改**：由用户决定

### PROGRESS.md
- **作用**：记录开发进度，当前做到哪一步
- **内容**：7个阶段的进度表，每完成一步就更新
- **何时更新**：每完成一个阶段后更新

### PROJECT_MEMORY.md
- **作用**：跨会话的项目记忆，记录重要的决策和发现
- **内容**：架构决策、技术选型原因、已知问题等
- **何时更新**：每次会话结束时，提取关键信息写入

---

## 三、backend/ 目录详解

### backend/.gitignore
- **作用**：告诉Git哪些文件不要提交到版本库
- **内容**：
  - `node_modules/` - 依赖包太大，不要提交
  - `.env` - 环境变量，包含密码等敏感信息
  - 其他临时文件
- **为什么需要**：避免把密码和依赖包提交到GitHub

### backend/package.json
- **作用**：项目的"身份证"，记录项目信息和依赖
- **内容**：
  ```json
  {
    "name": "ai-chat-backend",      // 项目名称
    "version": "1.0.0",             // 版本号
    "main": "app.js",              // 入口文件
    "scripts": {
      "start": "node app.js",       // 生产环境启动命令
      "dev": "nodemon app.js"       // 开发环境启动命令（自动重启）
    },
    "dependencies": {               // 运行时依赖（上线也要用）
      "express": "^4.18.2",        // Web框架
      "cors": "^2.8.5",            // 跨域处理
      "mysql2": "^3.22.5",         // MySQL数据库驱动
      "bcryptjs": "...",           // 密码加密
      "jsonwebtoken": "..."        // JWT认证
    },
    "devDependencies": {            // 开发时依赖（上线不需要）
      "nodemon": "^3.0.2"          // 自动重启服务器
    }
  }
  ```
- **何时修改**：安装新依赖时自动更新，不要手动改

### backend/package-lock.json
- **作用**：锁定所有依赖包的精确版本
- **何时生成**：`npm install` 时自动生成
- **是否修改**：不要手动修改

---

## 四、app.js - 服务器主文件（最重要！）

### 文件作用
整个后端的**入口点**，所有请求都从这里进入，然后分发到对应的处理函数。

### 执行流程
```
用户请求 → app.js接收 → 中间件处理 → 路由匹配 → 控制器处理 → 返回响应
```

### 代码结构（按顺序）
```javascript
// 第1部分：导入依赖
const express = require('express');      // Web框架
const cors = require('cors');            // 跨域处理
const { pool, testConnection } = require('./config/database');  // 数据库
const userRoutes = require('./routes/user');  // 用户路由
const chatRoutes = require('./routes/chat'); // 聊天路由
const aiRoutes = require('./routes/ai');     // AI路由

// 第2部分：创建应用实例
const app = express();

// 第3部分：配置中间件
app.use(express.json());    // 解析JSON请求体
app.use(cors());            // 处理跨域请求

// 第4部分：挂载路由
app.use('/api/user', userRoutes);   // 用户相关接口
app.use('/api/chat', chatRoutes);   // 聊天相关接口
app.use('/api/ai', aiRoutes);       // AI相关接口

// 第5部分：定义测试接口
app.get('/api/test', ...);    // 测试服务器状态
app.post('/api/test', ...);   // 测试接收POST数据
app.get('/api/test-db', ...); // 测试数据库查询

// 第6部分：启动服务器
app.listen(5000, () => {
  console.log('服务器启动成功！');
  testConnection();           // 启动时测试数据库连接
});
```

### 关键概念：中间件执行顺序
```
请求进入
  ↓
app.use(express.json())    → 解析请求体
  ↓
app.use(cors())            → 处理跨域头
  ↓
app.use('/api/user', ...)  → 匹配路由
  ↓
匹配到的路由处理函数        → 执行业务逻辑
  ↓
返回响应
```

---

## 五、config/ 目录详解

### config/database.js - 数据库配置

**作用**：管理MySQL数据库的连接配置

**核心内容**：
```javascript
// 数据库配置对象
const dbConfig = {
  host: 'localhost',      // 数据库服务器地址
  port: 3306,             // 端口号
  user: 'root',           // 用户名
  password: 'root',       // 密码
  database: 'ai_chat_db'  // 数据库名
};

// 创建连接池
const pool = mysql.createPool({
  ...dbConfig,
  connectionLimit: 10     // 最多10个连接
});

// 测试连接函数
async function testConnection() {
  const connection = await pool.getConnection();
  console.log('✅ 数据库连接成功！');
  connection.release();    // 释放连接
}
```

**为什么用连接池？**
- 每次创建新连接很慢
- 连接池预创建10个连接，用完归还，循环使用
- 提高性能，节省资源

### config/init.sql - 数据库初始化脚本

**作用**：包含创建数据库和表的SQL语句

**执行方式**：
- 在DBeaver中执行
- 或在MySQL命令行中执行

**包含内容**：
```sql
-- 1. 创建数据库
CREATE DATABASE IF NOT EXISTS ai_chat_db;

-- 2. 切换到该数据库
USE ai_chat_db;

-- 3. 创建users表
CREATE TABLE IF NOT EXISTS users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  username VARCHAR(50) NOT NULL UNIQUE,
  password VARCHAR(255) NOT NULL,
  email VARCHAR(100) UNIQUE,
  role ENUM('user', 'admin') DEFAULT 'user',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- 4. 插入测试数据
INSERT IGNORE INTO users ...;

-- 5. 创建conversations会话表
CREATE TABLE IF NOT EXISTS conversations (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  title VARCHAR(100) DEFAULT '新会话',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- 6. 创建messages消息表
CREATE TABLE IF NOT EXISTS messages (
  id INT AUTO_INCREMENT PRIMARY KEY,
  conversation_id INT NOT NULL,
  role ENUM('user', 'assistant') NOT NULL,
  content TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (conversation_id) REFERENCES conversations(id) ON DELETE CASCADE
);
```

**为什么单独放SQL文件？**
- 方便查看数据库结构
- 方便迁移数据库
- 方便团队协作

### config/jwt.js - JWT认证配置

**作用**：管理JWT的密钥和过期时间

**内容**：
```javascript
const jwtSecret = 'ai-chat-jwt-secret-key-2026';  // 签名密钥
const jwtExpiresIn = '24h';                        // 过期时间
```

**为什么单独放？**
- 密钥可能被多个文件使用
- 修改时只需要改一个地方
- 生产环境密钥应该放在环境变量里

### config/xiaomi-ai.js - 小米AI配置

**作用**：管理小米AI API的密钥、模型名称和调用参数

**内容**：
```javascript
const xiaomiAIConfig = {
  apiKey: 'tp-cepfy2f...',               // 小米AI API密钥
  baseURL: 'https://token-plan-cn.xiaomimimo.com/v1',  // API地址
  model: 'mimo-v2.5-pro',               // 模型名称
  maxTokens: 32768,                      // 最大输出token数
  temperature: 0.2,                      // 创造性参数
  topP: 0.1,                             // 创造性参数
  systemPrompt: '你是专业代码助手...'      // 系统提示词
};
```

**为什么单独放？**
- API密钥敏感信息集中管理
- 方便切换不同模型
- 方便切换不同AI服务商

---

## 六、controllers/ 目录详解

### controllers/userController.js - 用户控制器

**作用**：处理用户相关的所有业务逻辑

**类比**：控制器 = 餐厅的"厨师"
- 路由 = 服务员（接收点单）
- 控制器 = 厨师（处理业务）
- 数据库 = 食材仓库（存储数据）

**包含的函数**：

#### 1. register（注册）
流程：获取数据 → 验证 → 检查用户名 → bcrypt加密 → 插入数据库 → 返回成功

#### 2. login（登录）
流程：获取数据 → 查找用户 → bcrypt比对密码 → 生成JWT → 返回token+用户信息

#### 3. getProfile（获取用户信息）
流程：从token获取用户ID → 查数据库 → 返回用户信息（不含密码）

### controllers/chatController.js - 聊天控制器

**作用**：处理聊天相关的业务逻辑

**包含的函数**：

#### 1. createConversation（创建会话）
流程：获取用户ID → 插入conversations表 → 返回新会话ID

#### 2. getConversations（获取会话列表）
流程：查询该用户所有会话 → 按updated_at降序排列 → 返回列表

#### 3. deleteConversation（删除会话）
流程：检查会话归属 → 删除（级联删除消息） → 返回成功

#### 4. sendMessage（发送消息-非流式）
流程：保存用户消息 → 调用AI接口 → 保存AI回复 → 更新会话时间 → 返回

#### 5. sendMessageStream（发送消息-流式）
流程：设置SSE头 → 保存用户消息 → 调用流式AI → 逐段发送 → 保存完整回复

#### 6. getMessages（获取消息历史）
流程：检查会话归属 → 查询messages表 → 按created_at升序 → 返回

### controllers/aiController.js - AI控制器

**作用**：调用小米AI API获取回复

**包含的函数**：

#### 1. getAIReply（获取普通回复）
流程：构建消息数组（含system提示） → 调用小米AI API → 返回回复内容
- 含重试机制：最多3次，间隔1秒

#### 2. getAIReplyStream（获取流式回复）
流程：构建消息数组 → 开启stream模式 → 逐段回调 → 完成后回调

**为什么需要控制器？**
- 把业务逻辑从路由中分离
- 代码更清晰，更容易维护
- 方便测试和复用

---

## 七、middlewares/ 目录详解

### middlewares/auth.js - Token验证中间件

**作用**：在需要登录的接口前，验证用户的token是否有效

**类比**：中间件 = 餐厅门口的"保安"
- 顾客进门 → 保安检查预约
- 有预约 → 放行
- 没预约 → 拒绝

**执行流程**：
```
请求进入
  ↓
从请求头获取token
  ↓
token不存在？ → 返回401"请先登录"
  ↓
验证token是否有效（jwt.verify）
  ↓
无效？ → 返回401"token无效或已过期"
  ↓
有效？ → 把用户信息放到req.user
  ↓
调用next() → 放行给下一个处理函数
```

**使用方式**：
```javascript
// 在路由中使用
router.get('/profile', authenticateToken, getProfile);
// 执行顺序：请求 → authenticateToken → getProfile
```

---

## 八、routes/ 目录详解

### routes/user.js - 用户路由

**作用**：定义用户相关接口的地址

**定义的路由**：
```javascript
router.post('/register', register);                    // POST /api/user/register
router.post('/login', login);                          // POST /api/user/login
router.get('/profile', authenticateToken, getProfile); // GET /api/user/profile
```

### routes/chat.js - 聊天路由

**作用**：定义聊天相关接口的地址

**定义的路由**：
```javascript
router.post('/conversation', authenticateToken, createConversation);     // POST /api/chat/conversation
router.get('/conversation', authenticateToken, getConversations);        // GET /api/chat/conversation
router.delete('/conversation/:id', authenticateToken, deleteConversation); // DELETE /api/chat/conversation/:id
router.post('/message', authenticateToken, sendMessage);                 // POST /api/chat/message
router.post('/message/stream', authenticateToken, sendMessageStream);    // POST /api/chat/message/stream
router.get('/message/:conversationId', authenticateToken, getMessages);  // GET /api/chat/message/:id
```

### routes/ai.js - AI路由

**作用**：定义AI相关接口的地址

**定义的路由**：
```javascript
router.post('/test', authenticateToken, ...);  // POST /api/ai/test - 测试AI接口
router.get('/info', authenticateToken, ...);   // GET /api/ai/info - 获取模型信息
```

**路径组合规则**：
- `app.use('/api/chat', router)` + `router.post('/conversation')`
- 最终路径 = `/api/chat/conversation`

**为什么单独放路由？**
- 路由只负责"地址映射"，不处理业务逻辑
- 业务逻辑在控制器里
- 代码更清晰，职责分离

---

## 九、请求流程图解

### 注册请求流程
```
前端发送 POST /api/user/register
  ↓
{ "username": "张三", "password": "123456" }
  ↓
app.js → 匹配 /api/user → 转给 userRoutes
  ↓
routes/user.js → 匹配 /register → 转给 register 函数
  ↓
controllers/userController.js → register函数执行
  ↓
1. 验证数据
2. 检查用户名是否存在（查数据库）
3. 加密密码（bcrypt）
4. 插入数据库
5. 返回成功
  ↓
前端收到 { "success": true, "message": "注册成功！" }
```

### 登录请求流程
```
前端发送 POST /api/user/login
  ↓
{ "username": "张三", "password": "123456" }
  ↓
app.js → 匹配 /api/user → 转给 userRoutes
  ↓
routes/user.js → 匹配 /login → 转给 login 函数
  ↓
controllers/userController.js → login函数执行
  ↓
1. 查找用户（查数据库）
2. 比对密码（bcrypt.compare）
3. 生成JWT token
4. 返回token和用户信息
  ↓
前端收到 { "token": "eyJhbG...", "user": {...} }
```

### 需要登录的请求流程
```
前端发送 GET /api/user/profile
  ↓
请求头: Authorization: Bearer eyJhbG...
  ↓
app.js → 匹配 /api/user → 转给 userRoutes
  ↓
routes/user.js → 匹配 /profile
  ↓
先执行 authenticateToken 中间件
  ↓
1. 从请求头提取token
2. 验证token是否有效
3. 有效 → 解析出用户信息，放到req.user
  ↓
执行 getProfile 函数
  ↓
1. 从req.user获取用户ID
2. 查数据库获取最新用户信息
3. 返回用户信息
```

---

## 十、常见问题解答

### Q1: 为什么 app.js 里看不到 login 函数？
A: 因为路由是分层的。app.js 只引入 routes/user.js，routes/user.js 再引入 controllers/userController.js。这样代码更清晰。

### Q2: 为什么浏览器访问 /api/user/login 报 "Cannot GET"？
A: 浏览器地址栏发的是 GET 请求，但 login 接口只接受 POST 请求。需要用 Postman 或 curl 测试。

### Q3: 修改代码后需要重启服务器吗？
A: 如果用 `npm run dev`（nodemon）启动，会自动重启。如果用 `npm start`（node），需要手动重启。

### Q4: 为什么密码要加密存储？
A: 明文存密码 = 裸奔！数据库泄露后，所有用户密码都暴露了。bcrypt加密后，即使泄露也看不到原始密码。

### Q5: JWT token 过期了怎么办？
A: 前端检测到401响应后，跳转到登录页，让用户重新登录获取新token。

---

## 十一、前端项目详解

### frontend/package.json
- **作用**：前端项目的依赖配置
- **核心依赖**：
  - `vue`：Vue3框架
  - `vue-router`：页面路由管理
  - `axios`：HTTP请求库（调用后端接口）
  - `lucide-vue-next`：图标库（Apple风格图标）
  - `tailwindcss`：CSS框架（快速写样式）
  - `vite`：构建工具（开发服务器+打包）

### frontend/vite.config.ts
- **作用**：Vite构建工具配置
- **关键配置**：
  ```typescript
  server: {
    port: 3000,           // 前端运行在3000端口
    proxy: {
      '/api': {           // 所以/api开头的请求
        target: 'http://localhost:5000',  // 转发到后端5000端口
        changeOrigin: true
      }
    }
  }
  ```
- **为什么需要代理？** 前端(3000)和后端(5000)端口不同，浏览器会阻止跨域请求。代理让它们看起来是同一个端口。

### frontend/src/style.css
- **作用**：全局样式，定义Apple风格的深色主题
- **核心内容**：
  - CSS变量：定义颜色、圆角、阴影、动效等设计系统
  - 滚动条美化：超细、半透明
  - 字体：Inter（英文）+ 系统字体（中文）

### frontend/src/router/index.ts
- **作用**：定义页面地址和组件的映射关系
- **路由表**：
  - `/` → 重定向到 `/login`
  - `/login` → LoginView.vue（登录页面）
  - `/chat` → ChatView.vue（聊天页面，需要登录）
- **路由守卫**：未登录时访问 /chat 会自动跳转到 /login

### frontend/src/views/LoginView.vue
- **作用**：登录/注册页面
- **设计特点**：
  - Apple风格深色主题
  - 半透明玻璃效果卡片
  - 柔和动效（hover、focus状态）
  - 支持登录/注册模式切换
- **功能**：
  - 用户名+密码登录
  - 用户名+密码+邮箱注册
  - 调用后端 /api/user/login 和 /api/user/register 接口

### frontend/src/views/ChatView.vue
- **作用**：聊天主页面
- **设计特点**：
  - 三栏布局：左侧会话列表 + 中间聊天区 + 右侧设置
  - 用户消息：右对齐、气泡自适应宽度
  - AI消息：左对齐、气泡自适应宽度
  - 流式输出：像ChatGPT一样逐字显示
  - 加载动画：AI内容为空时显示三个跳动点
- **功能**：
  - 创建/删除会话（调用后端API）
  - 发送消息（调用小米AI接口，流式逐字显示）
  - 复制消息内容
  - 退出登录

---

## 十二、前后端通信流程

### 登录流程
```
前端 (localhost:3000)
  ↓ 发送 POST /api/user/login
  ↓ { "username": "张三", "password": "123456" }
  ↓
Vite代理转发
  ↓ /api → http://localhost:5000
  ↓
后端 (localhost:5000)
  ↓ app.js 匹配 /api/user
  ↓ routes/user.js 匹配 /login
  ↓ controllers/userController.js 执行登录逻辑
  ↓
返回响应
  ↓ { "success": true, "token": "eyJhbG...", "user": {...} }
  ↓
前端保存token
  ↓ localStorage.setItem('token', token)
  ↓ 跳转到 /chat
```

### 聊天流程（已实现）
```
前端发送消息
  ↓ POST /api/chat/message/stream
  ↓ { "conversationId": 1, "content": "你好" }
  ↓
后端处理
  ↓ 用户消息保存到messages表
  ↓ 获取该会话历史消息
  ↓ 调用小米AI API（stream模式）
  ↓ 逐段发送SSE数据到前端
  ↓
前端显示
  ↓ data: {"type":"start","messageId":1}
  ↓ data: {"type":"chunk","content":"你"}
  ↓ data: {"type":"chunk","content":"好"}
  ↓ data: {"type":"done","fullContent":"你好！"}
  ↓ fetch API + ReadableStream → 逐字渲染
```

---

## 十三、项目完成总结

### 🎉 全部7个阶段已完成

| 阶段 | 内容 | 状态 |
|------|------|------|
| 1 | 搭建后端基础环境 | ✅ 完成 |
| 2 | 连接MySQL | ✅ 完成 |
| 3 | 用户系统（注册/登录/JWT） | ✅ 完成 |
| 4 | 聊天系统 | ✅ 完成 |
| 5 | AI接口（接入小米AI） | ✅ 完成 |
| 6 | 流式输出（逐字显示） | ✅ 完成 |
| 7 | 前端开发（前后端联调） | ✅ 完成 |

### 项目功能清单
- ✅ 用户注册/登录（bcrypt加密 + JWT鉴权）
- ✅ 会话管理（创建/获取列表/删除）
- ✅ 消息管理（发送/获取历史）
- ✅ AI回复（接入小米AI，mimo-v2.5-pro模型）
- ✅ 流式输出（SSE + ReadableStream，逐字显示）
- ✅ Apple风格深色UI（三栏布局、毛玻璃效果）
- ✅ Token验证（路由守卫 + 中间件）

---

**最后更新**：2026-06-15（🎉 全部7个阶段已完成，项目开发完成）
