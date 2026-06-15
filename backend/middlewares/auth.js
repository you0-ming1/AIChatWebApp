/**
 * middlewares/auth.js - Token验证中间件
 *
 * 这个文件负责验证用户身份
 *
 * 什么是中间件？
 * 就像餐厅门口的"保安"：
 * - 顾客进门前 → 保安先检查有没有预约
 * - 有预约 → 放行
 * - 没预约 → 拒绝
 *
 * 在这里：
 * - 前端发请求 → 中间件先检查token
 * - token有效 → 放行，继续执行后面的代码
 * - token无效 → 拒绝，返回401未授权
 */

// ============================================
// 导入依赖
// ============================================

/**
 * jsonwebtoken：JWT验证库
 * 用于验证token是否有效
 */
const jwt = require('jsonwebtoken');

/**
 * 导入JWT密钥
 * 验证token时需要用同一个密钥
 */
const { jwtSecret } = require('../config/jwt');

// ============================================
// Token验证中间件函数
// ============================================

/**
 * authenticateToken：验证token的中间件
 *
 * 这个函数会在每个需要登录的接口之前执行
 *
 * 执行流程：
 * 1. 从请求头获取token
 * 2. 如果没有token → 拒绝
 * 3. 验证token是否有效
 * 4. 有效 → 把用户信息放到req.user，放行
 * 5. 无效 → 拒绝
 *
 * @param {Object} req - 请求对象
 * @param {Object} res - 响应对象
 * @param {Function} next - 下一个函数（放行用）
 */
function authenticateToken(req, res, next) {
  // ----------------------------------------
  // 第1步：从请求头获取token
  // ----------------------------------------

  /**
   * req.headers.authorization：请求头中的Authorization字段
   *
   * 前端发送token的方式：
   * 请求头: Authorization: Bearer eyJhbGciOiJIUzI1NiIs...
   *
   * "Bearer"是什么？
   * 是一种token格式标准，表示"持有者token"
   * 就像入场券上写着"持券人入场"
   */
  const authHeader = req.headers.authorization;

  /**
   * 如果没有Authorization头，说明用户没登录
   */
  if (!authHeader) {
    return res.status(401).json({
      success: false,
      message: '请先登录'
    });
  }

  // ----------------------------------------
  // 第2步：提取token
  // ----------------------------------------

  /**
   * token格式：Bearer eyJhbGciOiJIUzI1NiIs...
   * 我们只需要后面的部分（eyJhbGci...）
   * 所以用split(' ')[1]分割，取第二部分
   */
  const token = authHeader.split(' ')[1];

  /**
   * 如果token格式不对（比如没有Bearer前缀）
   */
  if (!token) {
    return res.status(401).json({
      success: false,
      message: 'token格式错误'
    });
  }

  // ----------------------------------------
  // 第3步：验证token
  // ----------------------------------------

  try {
    /**
     * jwt.verify()：验证token
     * 参数1：token字符串
     * 参数2：密钥
     *
     * 验证过程：
     * 1. 检查签名是否正确（用密钥验证）
     * 2. 检查是否过期（查看exp字段）
     * 3. 解析出payload（用户信息）
     *
     * 如果验证失败，会抛出异常：
     * - TokenExpiredError：token过期
     * - JsonWebTokenError：token无效
     */
    const decoded = jwt.verify(token, jwtSecret);

    /**
     * decoded：token中解析出的数据
     * 就是登录时jwt.sign()传入的payload：
     * { id: 1, username: 'admin', role: 'admin', iat: ..., exp: ... }
     *
     * iat：签发时间（issued at）
     * exp：过期时间（expiration）
     *
     * 把用户信息放到req.user
     * 后续的控制器函数可以通过req.user访问
     */
    req.user = decoded;

    /**
     * next()：放行
     * 执行下一个中间件或路由处理函数
     * 如果没有next()，请求会卡在这里，永远不会返回响应
     */
    next();

  } catch (error) {
    // ----------------------------------------
    // 第4步：处理验证失败的情况
    // ----------------------------------------

    /**
     * 根据错误类型，返回不同的错误信息
     */
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        message: '登录已过期，请重新登录'
      });
    }

    /**
     * 其他错误（比如token被篡改）
     */
    return res.status(401).json({
      success: false,
      message: '无效的登录凭证'
    });
  }
}

// ============================================
// 导出中间件
// ============================================

/**
 * module.exports：导出中间件函数
 *
 * 其他文件这样使用：
 * const { authenticateToken } = require('../middlewares/auth');
 *
 * 在路由中使用：
 * app.get('/api/profile', authenticateToken, getProfile);
 *
 * 执行顺序：
 * 1. authenticateToken（验证token）
 * 2. 如果通过，执行getProfile（获取用户信息）
 */
module.exports = {
  authenticateToken
};
