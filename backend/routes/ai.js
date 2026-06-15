/**
 * routes/ai.js - AI路由文件
 *
 * 这个文件负责定义AI相关的API接口地址
 *
 * 当前主要功能：
 * - 测试AI接口是否正常工作
 *
 * 后续可能添加的功能：
 * - 流式输出接口
 * - AI模型信息查询
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
 * 导入AI控制器
 */
const { getAIReply } = require('../controllers/aiController');

/**
 * 导入认证中间件
 * 所有AI接口都需要token验证
 */
const { authenticateToken } = require('../middlewares/auth');

// ============================================
// 定义路由
// ============================================

/**
 * POST /api/ai/test
 * 作用：测试AI接口是否正常工作
 *
 * 请求格式（前端发送）：
 * {
 *   "message": "你好"  // 测试消息
 * }
 *
 * 需要token验证：是
 * 执行顺序：请求 → authenticateToken → 测试函数
 */
router.post('/test', authenticateToken, async (req, res) => {
  try {
    const { message } = req.body;

    // 验证数据
    if (!message) {
      return res.status(400).json({
        success: false,
        message: '测试消息不能为空'
      });
    }

    console.log('测试AI接口，消息：', message);

    /**
     * 构建消息数组
     * 测试时只需要一条用户消息
     */
    const messages = [
      { role: 'user', content: message }
    ];

    /**
     * 调用AI接口
     */
    const aiReply = await getAIReply(messages);

    /**
     * 返回AI回复
     */
    res.json({
      success: true,
      message: 'AI接口测试成功！',
      data: {
        userMessage: message,
        aiReply: aiReply
      }
    });

  } catch (error) {
    console.error('AI接口测试失败：', error.message);
    res.status(500).json({
      success: false,
      message: 'AI接口测试失败',
      error: error.message
    });
  }
});

/**
 * GET /api/ai/info
 * 作用：获取AI模型信息
 *
 * 返回当前使用的AI模型配置
 */
router.get('/info', authenticateToken, (req, res) => {
  /**
   * 导入AI配置
   */
  const { model, maxTokens, temperature, topP } = require('../config/xiaomi-ai');

  res.json({
    success: true,
    message: '获取AI信息成功！',
    data: {
      model: model,
      maxTokens: maxTokens,
      temperature: temperature,
      topP: topP,
      description: '小米AI大模型，使用OpenAI兼容格式'
    }
  });
});

// ============================================
// 导出路由
// ============================================

/**
 * 导出路由容器
 *
 * 在app.js中这样使用：
 * const aiRoutes = require('./routes/ai');
 * app.use('/api/ai', aiRoutes);
 */
module.exports = router;