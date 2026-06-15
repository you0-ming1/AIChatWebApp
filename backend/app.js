/**
 * app.js - Express服务器主文件
 *
 * 这个文件是整个后端的入口点
 * 所有请求都会经过这里，然后被分发到对应的处理函数
 *
 * 为什么叫app.js？
 * 因为这是Express应用（Application）的主文件
 */
// ============================================
// 第0步：加载环境变量（必须在最前面！）
// ============================================

/**
 * dotenv：读取 .env 文件中的环境变量
 * 为什么需要？
 * 因为 API Key 等敏感信息写在 .env 里
 * 如果不加载，process.env.XIAOMI_API_KEY 会是 undefined
 * .env 文件已被 .gitignore 忽略，不会上传到 GitHub
 */
require('dotenv').config();

// ============================================
// 第1步：导入需要的工具（依赖）
// ============================================

/**
 * express：帮我们快速搭建HTTP服务器的框架
 * 为什么用express而不是原生Node？
 * 因为原生Node写服务器很麻烦，express帮我们处理了很多底层细节
 */
const express = require('express');

/**
 * cors：处理跨域请求的中间件
 * 什么是跨域？
 * 当前端（比如localhost:3000）请求后端（比如localhost:5000）
 * 浏览器会阻止，因为端口不同
 * cors中间件会自动添加一些响应头，告诉浏览器"允许这个请求"
 */
const cors = require('cors');

/**
 * 导入数据库配置
 * 解构赋值：从module.exports中取出pool和testConnection
 * pool：数据库连接池，后续用来执行SQL查询
 * testConnection：测试数据库连接的函数
 */
const { pool, testConnection } = require('./config/database');

/**
 * 导入用户路由
 * userRoutes：用户相关接口的路由容器
 * 包含：注册、登录、获取用户信息等接口
 */
const userRoutes = require('./routes/user');

/**
 * 导入聊天路由
 * chatRoutes：聊天相关接口的路由容器
 * 包含：创建会话、获取会话列表、删除会话、发送消息、获取消息等接口
 */
const chatRoutes = require('./routes/chat');

/**
 * 导入AI路由
 * aiRoutes：AI相关接口的路由容器
 * 包含：测试AI接口、获取AI信息等接口
 */
const aiRoutes = require('./routes/ai');

// ============================================
// 第2步：创建Express应用实例
// ============================================

/**
 * app：Express应用实例
 * 后面所有的配置、路由、中间件都要挂载到这个app上
 * 你可以把它想象成一个"服务器总管"
 */
const app = express();

// ============================================
// 第3步：配置中间件
// ============================================

/**
 * 中间件（Middleware）= 处理请求的"流水线"
 *
 * 每个请求进来，会依次经过每个中间件
 * 中间件可以：
 * 1. 解析请求数据（比如解析JSON）
 * 2. 验证身份（后续会学）
 * 3. 记录日志
 * 4. 处理错误
 *
 * app.use() = 使用某个中间件
 */

/**
 * express.json()：解析JSON格式的请求体
 * 为什么需要这个？
 * 因为前端发请求时，经常发送JSON格式的数据，比如：
 * {
 *   "username": "张三",
 *   "password": "123456"
 * }
 * 这个中间件会自动把JSON字符串转成JavaScript对象
 */
app.use(express.json());

/**
 * cors()：处理跨域请求
 * 为什么需要这个？
 * 因为前端和后端通常运行在不同的端口上
 * 比如：前端 http://localhost:3000，后端 http://localhost:5000
 * 浏览器默认会阻止这种跨域请求
 * cors中间件会在响应头里添加允许跨域的标识
 */
app.use(cors());

// ============================================
// 第4步：挂载路由
// ============================================

/**
 * app.use('/api/user', userRoutes)：挂载用户路由
 *
 * 这行代码的意思：
 * 所有以 /api/user 开头的请求，都交给 userRoutes 处理
 *
 * 路径组合规则：
 * app.use('/api/user', router) 中的 '/api/user' + router.post('/register')
 * = /api/user/register
 *
 * 为什么用app.use而不是app.get/app.post？
 * 因为userRoutes里有多个接口（GET、POST等）
 * 用app.use可以把整个路由容器挂载上去
 */
app.use('/api/user', userRoutes);

/**
 * 打印已挂载的路由（调试用）
 */
console.log('已挂载用户路由：/api/user/*');

/**
 * app.use('/api/chat', chatRoutes)：挂载聊天路由
 *
 * 所有以 /api/chat 开头的请求，都交给 chatRoutes 处理
 *
 * 路径组合规则：
 * app.use('/api/chat', router) 中的 '/api/chat' + router.post('/conversation')
 * = /api/chat/conversation
 */
app.use('/api/chat', chatRoutes);

/**
 * 打印已挂载的路由（调试用）
 */
console.log('已挂载聊天路由：/api/chat/*');

/**
 * app.use('/api/ai', aiRoutes)：挂载AI路由
 *
 * 所有以 /api/ai 开头的请求，都交给 aiRoutes 处理
 *
 * 路径组合规则：
 * app.use('/api/ai', router) 中的 '/api/ai' + router.post('/test')
 * = /api/ai/test
 */
app.use('/api/ai', aiRoutes);

/**
 * 打印已挂载的路由（调试用）
 */
console.log('已挂载AI路由：/api/ai/*');

// ============================================
// 第5步：定义测试接口（路由）
// ============================================

/**
 * 路由（Route）= API接口的地址
 *
 * app.get() = 定义一个GET请求的接口
 * app.post() = 定义一个POST请求的接口
 * app.put() = 定义一个PUT请求的接口
 * app.delete() = 定义一个DELETE请求的接口
 *
 * 参数1：接口地址（路径）
 * 参数2：处理函数（请求进来后执行什么代码）
 */

/**
 * GET /api/test
 * 作用：测试服务器是否正常运行
 * 当前端访问 http://localhost:5000/api/test 时
 * 服务器会返回JSON数据
 *
 * req = request（请求对象）：包含前端发来的所有数据
 *   - req.query：URL查询参数（?key=value）
 *   - req.body：请求体数据（POST请求的数据）
 *   - req.params：URL路径参数（:id）
 *
 * res = response（响应对象）：用来给前端返回数据
 *   - res.json()：返回JSON格式的数据
 *   - res.send()：返回任意格式的数据
 *   - res.status()：设置状态码
 */
app.get('/api/test', (req, res) => {
  /**
   * res.json()：返回JSON格式的响应
   * 前端收到后，可以通过response.data访问这些数据
   *
   * 数据结构：
   * {
   *   success: true/false,  // 表示请求是否成功
   *   message: "提示信息",   // 给用户看的消息
   *   data: {...}           // 具体数据
   * }
   */
  res.json({
    success: true,                          // 请求成功
    message: '服务器运行正常！',             // 提示信息
    data: {
      serverTime: new Date().toISOString(), // 服务器当前时间
      port: PORT                            // 服务器端口号
    }
  });
});

/**
 * POST /api/test
 * 作用：测试接收前端发送的数据
 *
 * 为什么需要POST？
 * GET请求的数据在URL里，不安全，且有长度限制
 * POST请求的数据在请求体里，更安全，可以发送大量数据
 *
 * 比如登录时：
 * {
 *   "username": "张三",
 *   "password": "123456"
 * }
 * 这种数据必须用POST发送
 */
app.post('/api/test', (req, res) => {
  /**
   * req.body：前端发送的请求体数据
   * 必须有express.json()中间件才能解析
   * 否则req.body是undefined
   */
  const receivedData = req.body;

  res.json({
    success: true,
    message: '收到数据了！',
    data: {
      youSent: receivedData,                // 你发送的数据
      timestamp: new Date().toISOString()   // 接收时间
    }
  });
});

/**
 * GET /api/test-db
 * 作用：测试数据库查询是否正常
 *
 * 流程：
 * 1. 前端发起GET请求
 * 2. 后端收到请求
 * 3. 从连接池获取一个数据库连接
 * 4. 执行SQL查询
 * 5. 把结果返回给前端
 */
app.get('/api/test-db', async (req, res) => {
  try {
    // 从连接池获取连接
    const connection = await pool.getConnection();

    // 执行SQL查询
    // pool.query() = 执行SQL语句
    // 返回值是一个数组：[查询结果, 字段信息]
    // 用 [rows, fields] 解构，我们只需要rows（查询结果）
    const [rows] = await connection.query('SELECT * FROM users');

    // 释放连接，放回连接池
    connection.release();

    // 返回查询结果
    res.json({
      success: true,
      message: '数据库查询成功！',
      data: {
        users: rows,                        // 查询到的用户列表
        count: rows.length                  // 用户数量
      }
    });
  } catch (error) {
    // 如果出错，返回错误信息
    res.status(500).json({
      success: false,
      message: '数据库查询失败',
      error: error.message
    });
  }
});

// ============================================
// 第5步：配置服务器端口
// ============================================

/**
 * PORT：服务器监听的端口号
 *
 * 什么是端口？
 * 你的电脑有很多"门"（端口），每个程序占用一个门
 * 前端通过端口号找到对应的程序
 *
 * 为什么用5000？
 * 这是常见的后端开发端口，没有特殊原因
 * 你也可以用3000、8000、8080等
 *
 * process.env.PORT：从环境变量读取端口
 * 如果环境变量没有设置，就用默认值5000
 * 为什么这样写？
 * 因为部署到服务器时，可能会分配不同的端口
 */
const PORT = process.env.PORT || 5000;

// ============================================
// 第6步：启动服务器
// ============================================

/**
 * app.listen()：启动服务器，监听指定端口
 * 
 * 参数1：端口号
 * 参数2：启动成功后的回调函数
 *
 * 服务器启动后，会一直运行，等待前端的请求
 * 直到你手动停止（Ctrl+C）或程序崩溃
 */
app.listen(PORT, async () => {
  console.log('='.repeat(50));
  console.log('AI Chat 后端服务器启动成功！');
  console.log('='.repeat(50));
  console.log(`服务器地址：http://localhost:${PORT}`);
  console.log(`测试接口：http://localhost:${PORT}/api/test`);
  console.log('='.repeat(50));

  // 启动时测试数据库连接
  await testConnection();

  console.log('='.repeat(50));
  console.log('按 Ctrl+C 可以停止服务器');
  console.log('='.repeat(50));
});

// ============================================
// 第7步：导出app（供其他文件使用）
// ============================================

/**
 * module.exports = app：导出app实例
 *
 * 为什么需要导出？
 * 因为后续我们会把路由、控制器等代码拆分到其他文件
 * 其他文件需要访问app来注册路由
 *
 * 比如：
 * // routes/user.js
 * const app = require('../app');
 * app.get('/api/user', ...);
 */
module.exports = app;