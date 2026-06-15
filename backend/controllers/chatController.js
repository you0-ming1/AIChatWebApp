/**
 * controllers/chatController.js - 聊天控制器
 *
 * 这个文件负责处理聊天相关的业务逻辑
 *
 * 聊天系统包含两个核心功能：
 * 1. 会话管理：创建、删除、获取会话列表
 * 2. 消息管理：发送消息、获取消息历史
 *
 * 为什么需要控制器？
 * 因为聊天逻辑比较复杂，需要操作多张表
 * 拆分出来代码更清晰，更容易维护
 */

// ============================================
// 导入依赖
// ============================================

/**
 * 导入数据库连接池
 * pool：用于执行SQL查询
 * 聊天系统需要查询conversations表和messages表
 */
const { pool } = require('../config/database');

/**
 * 导入AI控制器
 * getAIReply：调用小米AI API获取真实AI回复
 * getAIReplyStream：调用小米AI API获取流式回复
 * 替换原来的模拟回复
 */
const { getAIReply, getAIReplyStream } = require('./aiController');

// ============================================
// 会话管理函数
// ============================================

/**
 * createConversation：创建新会话
 *
 * 流程：
 * 1. 获取当前用户ID（从token中解析）
 * 2. 在conversations表插入新记录
 * 3. 返回新会话的ID
 *
 * @param {Object} req - 请求对象
 * @param {Object} res - 响应对象
 */
async function createConversation(req, res) {
  try {
    // ----------------------------------------
    // 第1步：获取当前用户ID
    // ----------------------------------------

    /**
     * req.user：从token中解析出的用户信息
     * 是auth中间件在验证token后放进去的
     */
    const userId = req.user.id;

    /**
     * 可选：获取前端传来的会话标题
     * 如果没有传，默认用"新会话"
     */
    const { title = '新会话' } = req.body;

    // ----------------------------------------
    // 第2步：插入新会话到数据库
    // ----------------------------------------

    /**
     * INSERT INTO conversations (user_id, title) VALUES (?, ?)
     *
     * 为什么不需要传id？因为id是AUTO_INCREMENT，自动生成
     * 为什么不需要传created_at和updated_at？因为有默认值CURRENT_TIMESTAMP
     */
    const [result] = await pool.query(
      'INSERT INTO conversations (user_id, title) VALUES (?, ?)',
      [userId, title]
    );

    /**
     * result.insertId：新插入会话的ID
     * 这个ID很重要，后续发送消息时需要用到
     */
    console.log('新会话ID：', result.insertId);

    // ----------------------------------------
    // 第3步：返回成功信息
    // ----------------------------------------

    res.status(201).json({
      success: true,
      message: '会话创建成功！',
      data: {
        id: result.insertId,
        title: title
      }
    });

  } catch (error) {
    console.error('创建会话失败：', error.message);
    res.status(500).json({
      success: false,
      message: '创建会话失败，请稍后重试'
    });
  }
}

/**
 * getConversations：获取当前用户的所有会话列表
 *
 * 流程：
 * 1. 获取当前用户ID
 * 2. 查询该用户的所有会话
 * 3. 按更新时间降序排列（最近的会话排在前面）
 * 4. 返回会话列表
 *
 * @param {Object} req - 请求对象
 * @param {Object} res - 响应对象
 */
async function getConversations(req, res) {
  try {
    // ----------------------------------------
    // 第1步：获取当前用户ID
    // ----------------------------------------
    const userId = req.user.id;

    // ----------------------------------------
    // 第2步：查询该用户的所有会话
    // ----------------------------------------

    /**
     * SELECT * FROM conversations WHERE user_id = ? ORDER BY updated_at DESC
     *
     * WHERE user_id = ?：只查询当前用户的会话
     * ORDER BY updated_at DESC：按更新时间降序排列
     * 为什么按updated_at而不是created_at？
     * 因为用户最常用最近更新的会话，这样排序更符合使用习惯
     */
    const [conversations] = await pool.query(
      'SELECT * FROM conversations WHERE user_id = ? ORDER BY updated_at DESC',
      [userId]
    );

    // ----------------------------------------
    // 第3步：返回会话列表
    // ----------------------------------------

    res.json({
      success: true,
      message: '获取会话列表成功！',
      data: {
        conversations: conversations,
        count: conversations.length
      }
    });

  } catch (error) {
    console.error('获取会话列表失败：', error.message);
    res.status(500).json({
      success: false,
      message: '获取会话列表失败'
    });
  }
}

/**
 * deleteConversation：删除会话
 *
 * 流程：
 * 1. 获取会话ID和当前用户ID
 * 2. 检查会话是否属于当前用户
 * 3. 删除会话（会级联删除该会话的所有消息）
 * 4. 返回成功信息
 *
 * @param {Object} req - 请求对象
 * @param {Object} res - 响应对象
 */
async function deleteConversation(req, res) {
  try {
    // ----------------------------------------
    // 第1步：获取参数
    // ----------------------------------------

    /**
     * req.params.id：URL路径参数
     * 比如DELETE /api/chat/conversation/123
     * req.params.id就是'123'
     */
    const conversationId = req.params.id;
    const userId = req.user.id;

    // ----------------------------------------
    // 第2步：检查会话是否存在且属于当前用户
    // ----------------------------------------

    /**
     * 为什么需要检查？
     * 因为用户只能删除自己的会话，不能删除别人的
     * 这是安全考虑，防止恶意删除
     */
    const [conversations] = await pool.query(
      'SELECT * FROM conversations WHERE id = ? AND user_id = ?',
      [conversationId, userId]
    );

    if (conversations.length === 0) {
      return res.status(404).json({
        success: false,
        message: '会话不存在或无权删除'
      });
    }

    // ----------------------------------------
    // 第3步：删除会话
    // ----------------------------------------

    /**
     * DELETE FROM conversations WHERE id = ?
     *
     * 为什么删除会话时，消息也会被删除？
     * 因为messages表有外键约束：ON DELETE CASCADE
     * 删除会话时，MySQL会自动删除该会话的所有消息
     */
    await pool.query('DELETE FROM conversations WHERE id = ?', [conversationId]);

    console.log('会话已删除，ID：', conversationId);

    // ----------------------------------------
    // 第4步：返回成功信息
    // ----------------------------------------

    res.json({
      success: true,
      message: '会话删除成功！'
    });

  } catch (error) {
    console.error('删除会话失败：', error.message);
    res.status(500).json({
      success: false,
      message: '删除会话失败'
    });
  }
}

// ============================================
// 消息管理函数
// ============================================

/**
 * sendMessage：发送消息
 *
 * 这个函数比较复杂，需要做两件事：
 * 1. 保存用户消息到数据库
 * 2. 获取AI回复（暂时用模拟数据，第五阶段实现真实AI接口）
 *
 * 流程：
 * 1. 获取会话ID和消息内容
 * 2. 检查会话是否存在且属于当前用户
 * 3. 保存用户消息到messages表
 * 4. 获取AI回复（暂时模拟）
 * 5. 保存AI回复到messages表
 * 6. 返回AI回复给前端
 *
 * @param {Object} req - 请求对象
 * @param {Object} res - 响应对象
 */
async function sendMessage(req, res) {
  try {
    // ----------------------------------------
    // 第1步：获取请求数据
    // ----------------------------------------

    const { conversationId, content } = req.body;
    const userId = req.user.id;

    // 验证数据
    if (!conversationId || !content) {
      return res.status(400).json({
        success: false,
        message: '会话ID和消息内容不能为空'
      });
    }

    // ----------------------------------------
    // 第2步：检查会话是否存在且属于当前用户
    // ----------------------------------------

    const [conversations] = await pool.query(
      'SELECT * FROM conversations WHERE id = ? AND user_id = ?',
      [conversationId, userId]
    );

    if (conversations.length === 0) {
      return res.status(404).json({
        success: false,
        message: '会话不存在或无权访问'
      });
    }

    // ----------------------------------------
    // 第3步：保存用户消息
    // ----------------------------------------

    /**
     * 保存用户消息到messages表
     * role：'user'表示这是用户发送的消息
     */
    const [userMessageResult] = await pool.query(
      'INSERT INTO messages (conversation_id, role, content) VALUES (?, ?, ?)',
      [conversationId, 'user', content]
    );

    console.log('用户消息已保存，ID：', userMessageResult.insertId);

    // ----------------------------------------
    // 第4步：获取AI回复（调用小米AI API）
    // ----------------------------------------

    /**
     * 获取该会话的历史消息
     *
     * 为什么需要历史消息？
     * 因为AI需要知道之前的对话内容
     * 这样AI才能理解上下文，给出连贯的回复
     *
     * 查询该会话的所有消息，按时间升序排列
     */
    const [historyMessages] = await pool.query(
      'SELECT role, content FROM messages WHERE conversation_id = ? ORDER BY created_at ASC',
      [conversationId]
    );

    console.log('历史消息数量：', historyMessages.length);

    /**
     * 构建AI请求的消息数组
     *
     * 格式：[{ role: 'user', content: '...' }, { role: 'assistant', content: '...' }, ...]
     *
     * 注意：不需要传system提示词，因为aiController里已经配置了
     */
    const messagesForAI = historyMessages.map(msg => ({
      role: msg.role,
      content: msg.content
    }));
    console.log(messagesForAI,'--该回话的全部消息')
    /**
     * 调用小米AI API获取回复
     *
     * getAIReply函数会：
     * 1. 构建请求（添加系统提示词）
     * 2. 调用小米AI API
     * 3. 返回AI回复
     */
    let aiReply = '';
    try {
      aiReply = await getAIReply(messagesForAI);
      console.log('AI回复：', aiReply.substring(0, 50) + '...');
    } catch (aiError) {
      /**
       * AI调用失败时的处理
       *
       * 可能的原因：
       * 1. API密钥无效
       * 2. 网络连接失败
       * 3. 模型不存在
       * 4. 请求超时
       *
       * 为了不让整个请求失败，我们返回一个友好的错误提示
       */
      console.error('AI调用失败：', aiError.message);
      aiReply = `抱歉，AI服务暂时不可用。错误信息：${aiError.message}`;
    }

    // ----------------------------------------
    // 第5步：保存AI回复
    // ----------------------------------------

    /**
     * 保存AI回复到messages表
     * role：'assistant'表示这是AI助手的回复
     */
    const [aiMessageResult] = await pool.query(
      'INSERT INTO messages (conversation_id, role, content) VALUES (?, ?, ?)',
      [conversationId, 'assistant', aiReply]
    );

    console.log('AI回复已保存，ID：', aiMessageResult.insertId);

    // ----------------------------------------
    // 第6步：更新会话的updated_at时间
    // ----------------------------------------

    /**
     * 更新会话的更新时间
     * 为什么需要？因为会话列表按updated_at排序
     * 发送新消息后，这个会话应该排在最前面
     */
    await pool.query(
      'UPDATE conversations SET updated_at = CURRENT_TIMESTAMP WHERE id = ?',
      [conversationId]
    );

    // ----------------------------------------
    // 第7步：返回AI回复
    // ----------------------------------------

    res.json({
      success: true,
      message: '消息发送成功！',
      data: {
        userMessage: {
          id: userMessageResult.insertId,
          role: 'user',
          content: content
        },
        aiMessage: {
          id: aiMessageResult.insertId,
          role: 'assistant',
          content: aiReply
        }
      }
    });

  } catch (error) {
    console.error('发送消息失败：', error.message);
    res.status(500).json({
      success: false,
      message: '发送消息失败'
    });
  }
}

/**
 * getMessages：获取会话的所有消息
 *
 * 流程：
 * 1. 获取会话ID
 * 2. 检查会话是否存在且属于当前用户
 * 3. 查询该会话的所有消息
 * 4. 按创建时间升序排列（最早的消息排在前面）
 * 5. 返回消息列表
 *
 * @param {Object} req - 请求对象
 * @param {Object} res - 响应对象
 */
async function getMessages(req, res) {
  try {
    // ----------------------------------------
    // 第1步：获取参数
    // ----------------------------------------

    const conversationId = req.params.conversationId;
    const userId = req.user.id;

    // ----------------------------------------
    // 第2步：检查会话是否存在且属于当前用户
    // ----------------------------------------

    const [conversations] = await pool.query(
      'SELECT * FROM conversations WHERE id = ? AND user_id = ?',
      [conversationId, userId]
    );

    if (conversations.length === 0) {
      return res.status(404).json({
        success: false,
        message: '会话不存在或无权访问'
      });
    }

    // ----------------------------------------
    // 第3步：查询该会话的所有消息
    // ----------------------------------------

    /**
     * SELECT * FROM messages WHERE conversation_id = ? ORDER BY created_at ASC
     *
     * ORDER BY created_at ASC：按创建时间升序排列
     * 为什么升序？因为聊天记录应该从旧到新显示
     * 最早的消息在最上面，最新的消息在最下面
     */
    const [messages] = await pool.query(
      'SELECT * FROM messages WHERE conversation_id = ? ORDER BY created_at ASC',
      [conversationId]
    );

    // ----------------------------------------
    // 第4步：返回消息列表
    // ----------------------------------------

    res.json({
      success: true,
      message: '获取消息列表成功！',
      data: {
        messages: messages,
        count: messages.length,
        conversation: conversations[0]
      }
    });

  } catch (error) {
    console.error('获取消息列表失败：', error.message);
    res.status(500).json({
      success: false,
      message: '获取消息列表失败'
    });
  }
}

// ============================================
// 流式消息函数
// ============================================

/**
 * sendMessageStream：发送消息（流式输出）
 *
 * 这个函数用于实现流式输出（像ChatGPT一样逐字显示）
 *
 * 流程：
 * 1. 设置SSE响应头
 * 2. 获取用户消息
 * 3. 保存用户消息到数据库
 * 4. 获取历史消息
 * 5. 调用getAIReplyStream函数
 * 6. 通过SSE发送数据给前端
 * 7. 保存完整AI回复到数据库
 *
 * @param {Object} req - 请求对象
 * @param {Object} res - 响应对象
 */
async function sendMessageStream(req, res) {
  try {
    // ----------------------------------------
    // 第1步：设置SSE响应头
    // ----------------------------------------

    /**
     * SSE（Server-Sent Events）响应头
     *
     * Content-Type: text/event-stream：告诉浏览器这是SSE流
     * Cache-Control: no-cache：禁止缓存
     * Connection: keep-alive：保持连接
     * CORS：允许跨域
     */
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Headers', 'Cache-Control');

    /**
     * 禁用响应压缩
     * 为什么？因为SSE需要实时发送数据，压缩会延迟
     */
    res.setHeader('X-Accel-Buffering', 'no');

    // ----------------------------------------
    // 第2步：获取请求数据
    // ----------------------------------------

    const { conversationId, content } = req.body;
    const userId = req.user.id;

    // 验证数据
    if (!conversationId || !content) {
      res.write(`data: ${JSON.stringify({ type: 'error', message: '会话ID和消息内容不能为空' })}\n\n`);
      res.end();
      return;
    }

    // ----------------------------------------
    // 第3步：检查会话是否存在且属于当前用户
    // ----------------------------------------

    const [conversations] = await pool.query(
      'SELECT * FROM conversations WHERE id = ? AND user_id = ?',
      [conversationId, userId]
    );

    if (conversations.length === 0) {
      res.write(`data: ${JSON.stringify({ type: 'error', message: '会话不存在或无权访问' })}\n\n`);
      res.end();
      return;
    }

    // ----------------------------------------
    // 第4步：保存用户消息
    // ----------------------------------------

    const [userMessageResult] = await pool.query(
      'INSERT INTO messages (conversation_id, role, content) VALUES (?, ?, ?)',
      [conversationId, 'user', content]
    );

    console.log('用户消息已保存，ID：', userMessageResult.insertId);

    // 发送开始信号
    res.write(`data: ${JSON.stringify({ type: 'start', messageId: userMessageResult.insertId })}\n\n`);

    // ----------------------------------------
    // 第5步：获取历史消息
    // ----------------------------------------

    const [historyMessages] = await pool.query(
      'SELECT role, content FROM messages WHERE conversation_id = ? ORDER BY created_at ASC',
      [conversationId]
    );

    console.log('历史消息数量：', historyMessages.length);

    /**
     * 构建AI请求的消息数组
     */
    const messagesForAI = historyMessages.map(msg => ({
      role: msg.role,
      content: msg.content
    }));

    // ----------------------------------------
    // 第6步：调用流式AI接口
    // ----------------------------------------

    let fullContent = '';

    try {
      /**
       * 调用getAIReplyStream函数
       *
       * 这个函数会：
       * 1. 调用小米AI API（流式模式）
       * 2. 一边生成，一边调用onChunk回调
       * 3. 生成完成后调用onDone回调
       */
      await getAIReplyStream(
        messagesForAI,
        // onChunk：收到一小段内容时调用
        (chunk) => {
          fullContent += chunk;
          // 通过SSE发送给前端
          res.write(`data: ${JSON.stringify({ type: 'chunk', content: chunk })}\n\n`);
        },
        // onDone：生成完成时调用
        (completedContent) => {
          fullContent = completedContent;
          // 发送完成信号
          res.write(`data: ${JSON.stringify({ type: 'done', fullContent: fullContent })}\n\n`);
          res.end();
        },
        // onError：出错时调用
        (errorMessage) => {
          res.write(`data: ${JSON.stringify({ type: 'error', message: errorMessage })}\n\n`);
          res.end();
        }
      );
    } catch (aiError) {
      console.error('流式AI调用失败：', aiError.message);
      res.write(`data: ${JSON.stringify({ type: 'error', message: `AI服务暂时不可用：${aiError.message}` })}\n\n`);
      res.end();
      return;
    }

    // ----------------------------------------
    // 第7步：保存完整AI回复
    // ----------------------------------------

    /**
     * 注意：这里需要等待流式输出完成
     * 但res.end()已经在onDone回调中调用了
     * 所以这里不需要再调用res.end()
     */

    /**
     * 保存AI回复到数据库
     *
     * 注意：fullContent可能为空（如果流式输出失败）
     * 需要检查
     */
    if (fullContent) {
      const [aiMessageResult] = await pool.query(
        'INSERT INTO messages (conversation_id, role, content) VALUES (?, ?, ?)',
        [conversationId, 'assistant', fullContent]
      );

      console.log('AI回复已保存，ID：', aiMessageResult.insertId);

      // 更新会话的updated_at时间
      await pool.query(
        'UPDATE conversations SET updated_at = CURRENT_TIMESTAMP WHERE id = ?',
        [conversationId]
      );
    }

  } catch (error) {
    console.error('流式消息发送失败：', error.message);
    // 尝试发送错误信息
    try {
      res.write(`data: ${JSON.stringify({ type: 'error', message: '消息发送失败' })}\n\n`);
      res.end();
    } catch (e) {
      // 如果res已经关闭，忽略错误
    }
  }
}

// ============================================
// 导出控制器函数
// ============================================

/**
 * module.exports：导出供路由使用
 *
 * 其他文件这样使用：
 * const { createConversation, getConversations } = require('../controllers/chatController');
 */
module.exports = {
  createConversation,
  getConversations,
  deleteConversation,
  sendMessage,
  getMessages,
  sendMessageStream
};