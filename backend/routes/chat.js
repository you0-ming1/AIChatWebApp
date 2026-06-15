/**
 * routes/chat.js - 聊天路由文件
 *
 * 这个文件负责定义聊天相关的API接口地址
 *
 * 聊天相关接口：
 * - POST /api/chat/conversation - 创建新会话
 * - GET /api/chat/conversation - 获取会话列表
 * - DELETE /api/chat/conversation/:id - 删除会话
 * - POST /api/chat/message - 发送消息
 * - GET /api/chat/message/:conversationId - 获取消息列表
 *
 * 所有聊天接口都需要token验证
 * 因为聊天数据是私人的，必须知道是谁在聊天
 */

// ============================================
// 导入依赖
// ============================================

/**
 * express.Router：路由容器
 */
const express = require('express');
const router = express.Router();

/**
 * 导入控制器函数
 * 控制器 = 处理具体业务逻辑的函数
 */
const {
  createConversation,
  getConversations,
  deleteConversation,
  sendMessage,
  getMessages,
  sendMessageStream
} = require('../controllers/chatController');

/**
 * 导入认证中间件
 * 用于验证token
 */
const { authenticateToken } = require('../middlewares/auth');

// ============================================
// 定义路由
// ============================================

/**
 * POST /api/chat/conversation
 * 作用：创建新会话
 *
 * 请求格式（前端发送）：
 * {
 *   "title": "新会话"  // 可选，会话标题
 * }
 *
 * 注意：router.post('/conversation') 会和 app.use('/api/chat', router) 组合
 * 最终路径 = /api/chat + /conversation = /api/chat/conversation
 *
 * 需要token验证：是（authenticateToken中间件）
 * 执行顺序：请求 → authenticateToken → createConversation
 */
router.post('/conversation', authenticateToken, createConversation);

/**
 * GET /api/chat/conversation
 * 作用：获取当前用户的所有会话列表
 *
 * 需要token验证：是
 * 执行顺序：请求 → authenticateToken → getConversations
 */
router.get('/conversation', authenticateToken, getConversations);

/**
 * DELETE /api/chat/conversation/:id
 * 作用：删除指定会话
 *
 * :id：URL路径参数，表示要删除的会话ID
 * 比如：DELETE /api/chat/conversation/123
 * req.params.id 就是 '123'
 *
 * 需要token验证：是
 * 执行顺序：请求 → authenticateToken → deleteConversation
 */
router.delete('/conversation/:id', authenticateToken, deleteConversation);

/**
 * POST /api/chat/message
 * 作用：发送消息（保存用户消息 + 获取AI回复）
 *
 * 请求格式（前端发送）：
 * {
 *   "conversationId": 123,  // 会话ID
 *   "content": "你好"        // 消息内容
 * }
 *
 * 需要token验证：是
 * 执行顺序：请求 → authenticateToken → sendMessage
 */
router.post('/message', authenticateToken, sendMessage);

/**
 * GET /api/chat/message/:conversationId
 * 作用：获取指定会话的所有消息
 *
 * :conversationId：URL路径参数，表示会话ID
 * 比如：GET /api/chat/message/123
 * req.params.conversationId 就是 '123'
 *
 * 需要token验证：是
 * 执行顺序：请求 → authenticateToken → getMessages
 */
router.get('/message/:conversationId', authenticateToken, getMessages);

/**
 * POST /api/chat/message/stream
 * 作用：发送消息（流式输出，像ChatGPT一样逐字显示）
 *
 * 请求格式（前端发送）：
 * {
 *   "conversationId": 123,  // 会话ID
 *   "content": "你好"        // 消息内容
 * }
 *
 * 响应格式（SSE流）：
 * data: {"type": "start", "messageId": 1}
 * data: {"type": "chunk", "content": "你"}
 * data: {"type": "chunk", "content": "好"}
 * data: {"type": "done", "fullContent": "你好！"}
 *
 * 需要token验证：是
 * 执行顺序：请求 → authenticateToken → sendMessageStream
 */
router.post('/message/stream', authenticateToken, sendMessageStream);

// ============================================
// 导出路由
// ============================================

/**
 * 导出路由容器
 *
 * 在app.js中这样使用：
 * const chatRoutes = require('./routes/chat');
 * app.use('/api/chat', chatRoutes);
 *
 * 这样所有聊天相关接口都以 /api/chat 开头
 */
module.exports = router;