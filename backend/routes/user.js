/**
 * routes/user.js - 用户路由文件
 *
 * 这个文件负责定义用户相关的API接口地址
 *
 * 什么是路由？
 * 就像餐厅的"菜单"：
 * - GET /api/user/profile = 查看个人信息
 * - POST /api/user/register = 注册新账号
 * - POST /api/user/login = 登录
 *
 * 路由 = 接口地址 + 处理函数
 *
 * 为什么单独拆出来？
 * 因为用户相关接口可能有很多，全写在app.js里会很乱
 * 拆出来后，代码结构更清晰
 */

// ============================================
// 导入依赖
// ============================================

/**
 * express.Router：路由容器
 *
 * 什么是Router？
 * 就像一个"子菜单"，可以把相关的接口放在一起
 *
 * 用Router的好处：
 * 1. 代码组织更清晰
 * 2. 可以给一组路由添加公共中间件
 * 3. 路径前缀统一管理
 */
const express = require('express');
const router = express.Router();

/**
 * 导入控制器函数
 * 控制器 = 处理具体业务逻辑的函数
 */
const { register, login, getProfile } = require('../controllers/userController');

/**
 * 导入认证中间件
 * 用于验证token
 */
const { authenticateToken } = require('../middlewares/auth');

// ============================================
// 定义路由
// ============================================

/**
 * POST /api/user/register
 * 作用：用户注册
 *
 * router.post()：定义POST请求的接口
 * 为什么用POST而不是GET？
 * - GET：获取数据，参数在URL里，不安全
 * - POST：提交数据，参数在请求体里，更安全
 * - 密码这种敏感数据，必须用POST
 *
 * 请求格式（前端发送）：
 * {
 *   "username": "张三",
 *   "password": "123456"
 * }
 *
 * 注意：router.post('/register') 会和 app.use('/api/user', router) 组合
 * 最终路径 = /api/user + /register = /api/user/register
 */
router.post('/register', register);

/**
 * POST /api/user/login
 * 作用：用户登录
 *
 * 前端发送：{ "username": "张三", "password": "123456" }
 * 后端返回：{ "token": "eyJhbG...", "user": {...} }
 */
router.post('/login', login);

/**
 * GET /api/user/profile
 * 作用：获取当前用户信息
 *
 * 注意：这个接口需要token验证！
 * authenticateToken：中间件，先验证token
 * getProfile：验证通过后，执行这个函数
 *
 * 执行顺序：请求 → authenticateToken → getProfile
 *
 * 前端发送（带token）：
 * 请求头: Authorization: Bearer eyJhbGciOiJIUzI1NiIs...
 *
 * 后端返回：
 * { "user": { "id": 1, "username": "张三", "email": "...", "role": "user" } }
 */
router.get('/profile', authenticateToken, getProfile);

// ============================================
// 导出路由
// ============================================

/**
 * 导出路由容器
 *
 * 在app.js中这样使用：
 * const userRoutes = require('./routes/user');
 * app.use('/api/user', userRoutes);
 *
 * 这样所有用户相关接口都以 /api/user 开头
 */
module.exports = router;
