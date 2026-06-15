/**
 * controllers/userController.js - 用户控制器
 *
 * 这个文件负责处理用户相关的业务逻辑
 *
 * 什么是控制器？
 * 就像餐厅的"厨师"：
 * - 路由 = 服务员（接收顾客点单）
 * - 控制师 = 厨师（处理具体业务）
 * - 数据库 = 食材仓库（存储数据）
 *
 * 控制器负责：
 * 1. 接收请求数据
 * 2. 处理业务逻辑
 * 3. 操作数据库
 * 4. 返回响应
 */

// ============================================
// 导入依赖
// ============================================

/**
 * bcryptjs：密码加密库
 *
 * 什么是bcrypt？
 * 一种密码哈希算法，专门用于密码存储
 *
 * 为什么用bcrypt而不是MD5/SHA256？
 * 1. 速度慢：故意设计得慢，防止暴力破解
 * 2. 加盐：自动加"盐"（随机字符串），相同密码加密结果不同
 * 3. 安全：即使数据库泄露，也很难还原密码
 *
 * 示例：
 * 原始密码：'123456'
 * bcrypt加密后：'$2b$10$N9qo8uLOickgx2ZMRZoMye...（很长的字符串）'
 */
const bcrypt = require('bcryptjs');

/**
 * jsonwebtoken：JWT生成和验证库
 *
 * 什么是JWT？
 * JSON Web Token，一种身份认证令牌
 *
 * JWT结构：header.payload.signature
 * - header：算法类型
 * - payload：用户信息（如用户ID、角色）
 * - signature：签名（防伪造）
 */
const jwt = require('jsonwebtoken');

/**
 * 导入数据库连接池
 * pool：用于执行SQL查询
 */
const { pool } = require('../config/database');

/**
 * 导入JWT配置
 * jwtSecret：签名密钥
 * jwtExpiresIn：过期时间
 */ 
const { jwtSecret, jwtExpiresIn } = require('../config/jwt');

// ============================================
// 用户注册
// ============================================

/**
 * register：用户注册函数
 *
 * 流程：
 * 1. 接收前端发来的用户名和密码
 * 2. 验证数据是否合法
 * 3. 检查用户名是否已存在
 * 4. 加密密码
 * 5. 存入数据库
 * 6. 返回成功信息
 *
 * @param {Object} req - 请求对象
 * @param {Object} res - 响应对象
 */
async function register(req, res) {
  try {
    // ----------------------------------------
    // 第1步：获取并验证请求数据
    // ----------------------------------------

    /**
     * req.body：前端发送的JSON数据
     * 前端发送格式：{ "username": "张三", "password": "123456" }
     */
    const { username, password } = req.body;

    /**
     * 验证：用户名和密码不能为空
     * 为什么验证？防止前端发空数据
     */
    if (!username || !password) {
      return res.status(400).json({
        success: false,
        message: '用户名和密码不能为空'
      });
    }

    /**
     * 验证：用户名长度
     * 为什么？太短容易重名，太长不好记
     */
    if (username.length < 3 || username.length > 20) {
      return res.status(400).json({
        success: false,
        message: '用户名长度需要3-20个字符'
      });
    }

    /**
     * 验证：密码长度
     * 为什么？太短不安全，太长记不住
     */
    if (password.length < 6) {
      return res.status(400).json({
        success: false,
        message: '密码至少需要6个字符'
      });
    }

    // ----------------------------------------
    // 第2步：检查用户名是否已存在
    // ----------------------------------------

    /**
     * 执行SQL查询：查找相同用户名的用户
     * SELECT * FROM users WHERE username = ?
     *
     * 为什么用 ? 而不是直接拼接字符串？
     * 因为直接拼接会有SQL注入风险！
     * 例如：username = "'; DROP TABLE users; --"
     * 如果直接拼接，会执行删除表的恶意SQL！
     * 用 ? 占位符，mysql2会自动处理，防止注入
     */
    const [existingUsers] = await pool.query(
      'SELECT id FROM users WHERE username = ?',
      [username]
    );
    /**
     * 如果查询结果不为空，说明用户名已存在
     */
    if (existingUsers.length > 0) {
      return res.status(400).json({
        success: false,
        message: '用户名已被注册'
      });
    }

    // ----------------------------------------
    // 第3步：加密密码
    // ----------------------------------------

    /**
     * bcrypt.hash()：加密密码
     * 参数1：原始密码
     * 参数2：加密轮数（10轮）
     *
     * 什么是加密轮数？
     * 数字越大越安全，但越慢
     * 10轮是推荐值，安全性和性能平衡
     *
     * 加密过程（简化）：
     * 原始密码 '123456'
     * → 加盐 + 第1轮哈希
     * → 加盐 + 第2轮哈希
     * → ... 重复10轮
     * → 最终得到加密后的密码
     */
    const salt = await bcrypt.genSalt(10);
    console.log('salt:', salt)
    const hashedPassword = await bcrypt.hash(password, salt);

    /**
     * 打印看看加密后的密码长什么样
     * 你会发现：每次加密同一个密码，结果都不一样（因为加了随机盐）
     */
    console.log('原始密码：', password);
    console.log('加密后：', hashedPassword);

    // ----------------------------------------
    // 第4步：存入数据库
    // ----------------------------------------

    /**
     * INSERT INTO：插入新用户
     * id不需要传，因为AUTO_INCREMENT会自动生成
     * role不需要传，默认是'user'
     * created_at和updated_at也不需要传，默认是当前时间
     */
    const [result] = await pool.query(
      'INSERT INTO users (username, password) VALUES (?, ?)',
      [username, hashedPassword]
    );

    /**
     * result.insertId：新插入行的ID
     * 因为id是AUTO_INCREMENT，MySQL会自动分配一个ID
     */
    console.log('新用户ID：', result.insertId);

    // ----------------------------------------
    // 第5步：返回成功信息
    // ----------------------------------------

    /**
     * 状态码201：表示"已创建"（Created）
     * 为什么不是200？
     * 200=成功，201=成功且创建了新资源
     * RESTful API规范：创建资源用201
     */
    res.status(201).json({
      success: true,
      message: '注册成功！',
      data: {
        id: result.insertId,
        username: username
      }
    });

  } catch (error) {
    /**
     * catch：捕获错误
     * 如果任何步骤出错（比如数据库连接断了），会进入这里
     * 不要返回详细的错误信息给前端！因为可能暴露安全漏洞
     */
    console.error('注册失败：', error.message);
    res.status(500).json({
      success: false,
      message: '注册失败，请稍后重试'
    });
  }
}

// ============================================
// 用户登录
// ============================================

/**
 * login：用户登录函数
 *
 * 流程：
 * 1. 接收用户名和密码
 * 2. 查数据库找这个用户
 * 3. 比对密码是否正确
 * 4. 生成JWT token
 * 5. 返回token给前端
 */
async function login(req, res) {
  try {
    // ----------------------------------------
    // 第1步：获取并验证请求数据
    // ----------------------------------------

    const { username, password } = req.body;
    if (!username || !password) {
      return res.status(400).json({
        success: false,
        message: '用户名和密码不能为空'
      });
    }

    // ----------------------------------------
    // 第2步：查找用户
    // ----------------------------------------

    /**
     * 查找用户名
     * 注意：这里查的是*所有字段（*），包括密码
     * 因为需要比对密码
     */
    const [users] = await pool.query(
      'SELECT * FROM users WHERE username = ?',
      [username]
    );

    /**
     * 用户不存在
     * 注意：不要告诉前端"用户名不存在"
     * 因为这样会暴露"这个用户名没被注册"
     * 安全做法：统一说"用户名或密码错误"
     */
    if (users.length === 0) {
      return res.status(401).json({
        success: false,
        message: '用户名或密码错误'
      });
    }

    /**
     * 获取用户数据
     * 因为查询结果是数组，取第一个
     */
    const user = users[0];

    // ----------------------------------------
    // 第3步：比对密码
    // ----------------------------------------

    /**
     * bcrypt.compare()：比对密码
     * 参数1：用户输入的明文密码
     * 参数2：数据库里存的加密密码
     *
     * 比对过程：
     * 1. 从加密密码中提取"盐"
     * 2. 用这个"盐"加密用户输入的密码
     * 3. 比较两个加密结果是否相同
     *
     * 返回值：
     * - true：密码正确
     * - false：密码错误
     */
    const isPasswordValid = await bcrypt.compare(password, user.password);

    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        message: '用户名或密码错误'
      });
    }

    // ----------------------------------------
    // 第4步：生成JWT token
    // ----------------------------------------

    /**
     * jwt.sign()：生成JWT token
     *
     * 参数1：payload（载荷）- 要保存到token里的数据
     * 参数2：密钥 - 用于签名
     * 参数3：配置 - 过期时间等
     *
     * payload里放什么？
     * - id：用户ID（最重要，后续查用户用）
     * - username：用户名（方便显示）
     * - role：用户角色（判断权限）
     *
     * 为什么不放password？
     * 因为token会被发送到前端，密码绝对不能暴露！
     */
    const token = jwt.sign(
      {
        id: user.id,
        username: user.username,
        role: user.role
      },
      jwtSecret,
      { expiresIn: jwtExpiresIn }
    );

    console.log('登录成功，生成token');

    // ----------------------------------------
    // 第5步：返回token和用户信息
    // ----------------------------------------

    /**
     * 返回的数据：
     * - token：前端需要保存这个token，后续请求带上
     * - user：用户基本信息（不包含密码！）
     */
    res.json({
      success: true,
      message: '登录成功！',
      data: {
        token: token,
        user: {
          id: user.id,
          username: user.username,
          email: user.email,
          role: user.role
        }
      }
    });

  } catch (error) {
    console.error('登录失败：', error.message);
    res.status(500).json({
      success: false,
      message: '登录失败，请稍后重试'
    });
  }
}

// ============================================
// 获取当前用户信息
// ============================================

/**
 * getProfile：获取当前登录用户的信息
 *
 * 这个接口需要验证token才能访问
 * token验证通过后，req.user里会有用户信息
 * （中间件会把token里的用户信息放到req.user）
 */
async function getProfile(req, res) {
  try {
    /**
     * req.user：从token中解析出的用户信息
     * 是auth中间件在验证token后放进去的
     *
     * req.user的内容：
     * { id: 1, username: 'admin', role: 'admin' }
     */
    const userId = req.user.id;

    /**
     * 从数据库查询最新的用户信息
     * 为什么不用token里的信息？
     * 因为token里的信息可能是旧的（比如用户刚改了邮箱）
     * 每次都查数据库，保证数据最新
     */
    const [users] = await pool.query(
      'SELECT id, username, email, role, created_at, updated_at FROM users WHERE id = ?',
      [userId]
    );

    if (users.length === 0) {
      return res.status(404).json({
        success: false,
        message: '用户不存在'
      });
    }

    /**
     * 注意：SQL查询时就不要SELECT * 了
     * 因为不需要返回密码字段
     * 这样更安全
     */
    res.json({
      success: true,
      message: '获取用户信息成功！',
      data: {
        user: users[0]
      }
    });

  } catch (error) {
    console.error('获取用户信息失败：', error.message);
    res.status(500).json({
      success: false,
      message: '获取用户信息失败'
    });
  }
}

// ============================================
// 导出控制器函数
// ============================================

/**
 * module.exports：导出供路由使用
 *
 * 其他文件这样使用：
 * const { register, login, getProfile } = require('../controllers/userController');
 */
module.exports = {
  register,
  login,
  getProfile
};
