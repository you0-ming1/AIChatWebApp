-- ============================================
-- init.sql - 数据库初始化脚本
-- ============================================
-- 这个文件包含创建数据库和表的SQL语句
-- 可以用MySQL命令行或DBeaver执行

-- ============================================
-- 1. 创建数据库
-- ============================================

-- CREATE DATABASE：创建新数据库
-- IF NOT EXISTS：如果已存在就不创建（避免报错）
-- utf8mb4：支持中文和emoji表情的字符编码
-- COLLATE：排序规则，utf8mb4_general_ci表示不区分大小写
CREATE DATABASE IF NOT EXISTS ai_chat_db
  DEFAULT CHARACTER SET utf8mb4
  DEFAULT COLLATE utf8mb4_general_ci;

-- 切换到ai_chat_db数据库
-- 后续的表都会创建在这个数据库里
USE ai_chat_db;

-- ============================================
-- 2. 创建users表（用户表）
-- ============================================

-- CREATE TABLE：创建新表
-- IF NOT EXISTS：如果已存在就不创建
CREATE TABLE IF NOT EXISTS users (
  -- id字段：用户唯一标识
  -- INT：整数类型
  -- AUTO_INCREMENT：自动递增（1, 2, 3...）
  -- PRIMARY KEY：主键，唯一标识每行数据
  -- 为什么用AUTO_INCREMENT？
  -- 因为每次注册新用户，id自动+1，不需要手动指定
  id INT AUTO_INCREMENT PRIMARY KEY,

  -- username字段：用户名
  -- VARCHAR(50)：可变长度字符串，最多50个字符
  -- NOT NULL：不能为空（必须填）
  -- UNIQUE：不能重复（不能有两个相同用户名）
  -- 为什么不能重复？
  -- 因为登录时用用户名查数据库，重复了就不知道是哪个用户了
  username VARCHAR(50) NOT NULL UNIQUE,

  -- password字段：密码（加密后的）
  -- VARCHAR(255)：最多255个字符
  -- 为什么是255？
  -- 因为bcrypt加密后的密码长度是60个字符左右
  -- 留255是为了以后换其他加密方式
  -- NOT NULL：密码不能为空
  password VARCHAR(255) NOT NULL,

  -- email字段：邮箱
  -- VARCHAR(100)：最多100个字符
  -- UNIQUE：不能重复
  -- 可以为空（注册时不强制填邮箱）
  email VARCHAR(100) UNIQUE,

  -- role字段：用户角色
  -- ENUM：枚举类型，只能是指定的值
  -- 'user'：普通用户
  -- 'admin'：管理员
  -- DEFAULT 'user'：默认是普通用户
  -- 为什么需要角色？
  -- 因为后续有后台管理系统，管理员和普通用户权限不同
  role ENUM('user', 'admin') DEFAULT 'user',

  -- created_at字段：创建时间
  -- TIMESTAMP：时间戳类型
  -- DEFAULT CURRENT_TIMESTAMP：默认值是当前时间
  -- 为什么需要这个？
  -- 因为需要知道用户什么时候注册的
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

  -- updated_at字段：更新时间
  -- ON UPDATE CURRENT_TIMESTAMP：当数据更新时自动更新时间
  -- 比如用户修改了密码，这个时间会自动变成修改时间
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- ============================================
-- 3. 插入测试数据
-- ============================================

-- INSERT INTO：插入新数据
-- IGNORE：如果插入的数据会导致主键冲突，就忽略这条插入
-- 为什么用IGNORE？
-- 因为如果id=1的用户已存在，再插入id=1会报错
-- 用IGNORE可以避免报错
INSERT IGNORE INTO users (id, username, password, email, role) VALUES
  (1, 'admin', '$2b$10$placeholder_password_hash_here', 'admin@aichat.com', 'admin'),
  (2, 'testuser', '$2b$10$placeholder_password_hash_here', 'test@aichat.com', 'user');

-- ============================================
-- 4. 创建conversations表（会话表）
-- ============================================

-- conversations表：存储聊天会话信息
-- 一个会话 = 一个聊天窗口
-- 用户可以创建多个会话，每个会话包含多条消息
CREATE TABLE IF NOT EXISTS conversations (
  -- id字段：会话唯一标识
  -- INT：整数类型
  -- AUTO_INCREMENT：自动递增（1, 2, 3...）
  -- PRIMARY KEY：主键，唯一标识每行数据
  id INT AUTO_INCREMENT PRIMARY KEY,

  -- user_id字段：用户ID，外键
  -- 关联users表的id字段
  -- 为什么需要这个？因为每个会话必须属于某个用户
  -- NOT NULL：不能为空，会话必须有主人
  user_id INT NOT NULL,

  -- title字段：会话标题
  -- VARCHAR(100)：可变长度字符串，最多100个字符
  -- DEFAULT '新会话'：默认标题是"新会话"
  -- 为什么需要标题？方便用户识别不同会话
  -- 后续可以实现AI自动生成标题
  title VARCHAR(100) DEFAULT '新会话',

  -- created_at字段：创建时间
  -- TIMESTAMP：时间戳类型
  -- DEFAULT CURRENT_TIMESTAMP：默认值是当前时间
  -- 为什么需要？方便按时间排序，查看会话何时创建
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

  -- updated_at字段：更新时间
  -- ON UPDATE CURRENT_TIMESTAMP：当数据更新时自动更新时间
  -- 为什么需要？方便按最近更新时间排序，常用的会话排在前面
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

  -- 外键约束：关联users表
  -- FOREIGN KEY：声明这是一个外键
  -- ON DELETE CASCADE：当用户被删除时，自动删除该用户的所有会话
  -- 为什么用CASCADE？保持数据一致性，避免孤立数据
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- ============================================
-- 5. 创建messages表（消息表）
-- ============================================

-- messages表：存储每条聊天消息
-- 每个会话包含多条消息，每条消息属于一个会话
CREATE TABLE IF NOT EXISTS messages (
  -- id字段：消息唯一标识
  id INT AUTO_INCREMENT PRIMARY KEY,

  -- conversation_id字段：会话ID，外键
  -- 关联conversations表的id字段
  -- 为什么需要这个？因为每条消息必须属于某个会话
  -- NOT NULL：不能为空
  conversation_id INT NOT NULL,

  -- role字段：消息角色
  -- ENUM：枚举类型，只能是指定的值
  -- 'user'：用户发送的消息
  -- 'assistant'：AI助手的回复
  -- 为什么需要区分？因为显示样式不同，用户消息在右边，AI消息在左边
  -- 后续可以扩展其他角色，比如'system'系统消息
  role ENUM('user', 'assistant') NOT NULL,

  -- content字段：消息内容
  -- TEXT：文本类型，可以存储很长的文本
  -- 为什么用TEXT不用VARCHAR？因为聊天消息可能很长，TEXT最大65535字符
  -- NOT NULL：不能为空
  content TEXT NOT NULL,

  -- created_at字段：创建时间
  -- 为什么需要？方便按时间顺序显示消息
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

  -- 外键约束：关联conversations表
  -- ON DELETE CASCADE：当会话被删除时，自动删除该会话的所有消息
  -- 为什么用CASCADE？删除会话时，消息也没用了，一起删除
  FOREIGN KEY (conversation_id) REFERENCES conversations(id) ON DELETE CASCADE
);

-- ============================================
-- 6. 查看表结构
-- ============================================

-- DESCRIBE：查看表的结构（有哪些字段、什么类型）
DESCRIBE users;
DESCRIBE conversations;
DESCRIBE messages;

-- SELECT：查看表中的数据
-- * 表示所有字段
SELECT * FROM users;
SELECT * FROM conversations;
SELECT * FROM messages;