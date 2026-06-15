/**
 * config/database.js - 数据库配置文件
 *
 * 这个文件专门负责数据库连接配置
 * 为什么单独拆出来？
 * 因为数据库配置可能会被多个地方使用
 * 如果写死在app.js里，修改时要找半天
 * 拆出来方便管理，也好切换开发/生产环境
 */

// ============================================
// 导入依赖
// ============================================

/**
 * mysql2：Node.js连接MySQL的驱动（工具）
 * 为什么用mysql2而不是mysql？
 * 因为mysql2支持Promise，可以使用async/await语法
 * 写起来更简洁，更好理解
 */
const mysql = require('mysql2/promise');

// ============================================
// 数据库连接配置
// ============================================

/**
 * dbConfig：数据库连接配置对象
 *
 * 每个字段的含义：
 * - host：数据库服务器地址（本机就是localhost）
 * - port：数据库端口号（MySQL默认3306）
 * - user：数据库用户名（默认root）
 * - password：数据库密码（需要你自己设置的）
 * - database：要连接的数据库名称
 */
const dbConfig = {
  host: 'localhost',        // 数据库服务器地址
  port: 3333,               // MySQL默认端口
  user: 'root',             // 数据库用户名
  password: '123456',         // 数据库密码（请改成你自己的密码）
  database: 'ai_chat_db'    // 要连接的数据库名
};

// ============================================
// 创建连接池
// ============================================

/**
 * pool：数据库连接池
 *
 * 什么是连接池？
 * 想象一个"连接停车场"：
 * - 程序启动时，预先创建好10个连接停在那里
 * - 有请求来了，直接从停车场"借"一个连接用
 * - 用完后，把连接"还"回停车场（不是关闭）
 * - 下次请求来了，再"借"一个
 *
 * 为什么要用连接池？
 * 1. 快：不用每次都创建和关闭连接
 * 2. 省资源：控制连接数量，不会把数据库搞崩
 * 3. 自动管理：连接断了会自动重连
 *
 * mysql2.createPool()参数：
 * - connectionLimit：最大连接数（默认10）
 * - waitForConnections：没有可用连接时是否等待（true=等）
 * - queueLimit：等待队列的最大长度（0=不限制）
 */
const pool = mysql.createPool({
  ...dbConfig,              // 展开数据库配置
  connectionLimit: 10,      // 最多同时10个连接
  waitForConnections: true, // 没有可用连接时排队等待
  queueLimit: 0             // 等待队列不限制
});

// ============================================
// 测试数据库连接
// ============================================

/**
 * testConnection()：测试数据库连接是否正常
 *
 * async/await是什么？
 * async = 声明这个函数是"异步函数"
 * await = 等待一个异步操作完成
 *
 * 为什么需要async/await？
 * 因为数据库操作需要时间（可能几十毫秒）
 * 如果不用async/await，代码会"卡住"或"出错"
 *
 * try/catch是什么？
 * try：尝试执行代码
 * catch：如果出错了，执行catch里的代码
 * 为什么需要？因为数据库可能连接失败（密码错误、服务没启动等）
 */
async function testConnection() {
  try {
    // 从连接池获取一个连接
    const connection = await pool.getConnection();
    console.log('✅ 数据库连接成功！');
    // 测试查询：执行一条简单的SQL
    const [rows] = await connection.query('SELECT NOW() as currentTime');
    
    console.log('📅 当前数据库时间：', rows[0].currentTime);
    
    // 用完后必须释放连接，放回连接池
    // 如果不释放，连接会被"占着"，其他人用不了
    connection.release();
    
    return true;
  } catch (error) {
    console.error('❌ 数据库连接失败：', error.message);
    return false;
  }
}

// ============================================
// 导出
// ============================================

/**
 * module.exports：导出给其他文件使用
 *
 * 导出了两个东西：
 * 1. pool：连接池，用于执行SQL查询
 * 2. testConnection：测试连接的函数
 *
 * 其他文件这样使用：
 * const { pool } = require('./config/database');
 * const [rows] = await pool.query('SELECT * FROM users');
 */

// ============================================
// pool 对象常用方法速查（必看！）
// ============================================

/**
 * 【pool.query()】执行SQL查询
 * 用途：最常用的方法，执行SELECT/INSERT/UPDATE/DELETE等SQL
 * 返回：[rows, fields] - rows是查询结果，fields是字段信息
 *
 * 示例：
 * const [rows] = await pool.query('SELECT * FROM users WHERE id = ?', [1]);
 * const [result] = await pool.query('INSERT INTO users (username) VALUES (?)', ['张三']);
 * const [result] = await pool.query('UPDATE users SET username = ? WHERE id = ?', ['李四', 1]);
 * const [result] = await pool.query('DELETE FROM users WHERE id = ?', [1]);
 *
 * 注意：result.insertId 是新插入行的ID，result.affectedRows 是影响的行数
 */
// pool.query(sql, values)

/**
 * 【pool.execute()】预处理SQL查询（更安全！）
 * 用途：和query类似，但使用预处理语句，防止SQL注入
 * 返回：[rows, fields]
 *
 * 示例：
 * const [rows] = await pool.execute('SELECT * FROM users WHERE id = ?', [1]);
 *
 * 与query的区别：
 * - execute会预编译SQL，性能更好
 * - execute参数必须是数组
 * - 推荐在生产环境使用execute代替query
 */
// pool.execute(sql, values)

/**
 * 【pool.getConnection()】从连接池获取一个连接
 * 用途：需要在一个连接里执行多条SQL时使用
 * 返回：connection对象
 *
 * 示例：
 * const connection = await pool.getConnection();
 * try {
 *   await connection.beginTransaction();  // 开始事务
 *   await connection.query('INSERT INTO ...');
 *   await connection.query('UPDATE ...');
 *   await connection.commit();            // 提交事务
 * } catch (error) {
 *   await connection.rollback();          // 回滚事务
 *   throw error;
 * } finally {
 *   connection.release();                 // 必须释放连接！
 * }
 */
// const connection = await pool.getConnection()

/**
 * 【pool.end()】关闭连接池
 * 用途：程序退出时关闭所有连接
 * 场景：测试结束、服务器关闭时调用
 * 注意：调用后不能再执行查询
 */
// await pool.end()

// ============================================
// connection 对象常用方法速查（获取连接后使用）
// ============================================

/**
 * 【connection.query()】执行SQL查询（和pool.query一样）
 * 用途：在指定连接上执行SQL
 * 返回：[rows, fields]
 */
// const [rows] = await connection.query('SELECT * FROM users');

/**
 * 【connection.execute()】预处理SQL查询（和pool.execute一样）
 * 用途：在指定连接上执行预处理SQL
 * 返回：[rows, fields]
 */
// const [rows] = await connection.execute('SELECT * FROM users WHERE id = ?', [1]);

/**
 * 【connection.beginTransaction()】开始事务
 * 用途：把多条SQL打包成一个原子操作，要么全成功，要么全失败
 * 场景：转账操作（A扣钱+B加钱，必须同时成功或同时失败）
 */
// await connection.beginTransaction();

/**
 * 【connection.commit()】提交事务
 * 用途：确认事务中的所有操作，数据正式保存到数据库
 * 注意：必须在beginTransaction()后调用
 */
// await connection.commit();

/**
 * 【connection.rollback()】回滚事务
 * 用途：撤销事务中的所有操作，数据恢复到事务开始前的状态
 * 场景：事务中某条SQL出错，需要撤销之前的操作
 */
// await connection.rollback();

/**
 * 【connection.release()】释放连接（放回连接池）
 * 用途：用完连接后必须调用，否则连接会被"占着"
 * 重要：这是必须调用的方法！不释放会导致连接池耗尽
 */
// connection.release();

/**
 * 【connection.destroy()】销毁连接（从连接池中移除）
 * 用途：连接出问题时，销毁它让连接池创建新连接
 * 场景：连接断开、超时等情况
 */
// await connection.destroy();

module.exports = {
  pool,
  testConnection
};