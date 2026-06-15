/**
 * controllers/aiController.js - AI控制器
 *
 * 这个文件负责调用小米AI API，获取AI回复
 *
 * 为什么单独拆出来？
 * 1. AI调用逻辑比较复杂
 * 2. 方便后续切换不同的AI服务商
 * 3. 方便统一管理错误处理
 *
 * 小米AI API特点：
 * - 使用OpenAI兼容格式
 * - API地址：https://token-plan-cn.xiaomimimo.com/v1
 * - 支持流式输出（SSE）
 */

// ============================================
// 导入依赖
// ============================================

/**
 * OpenAI：用于调用小米AI API的库
 *
 * 为什么用OpenAI库？
 * 因为小米AI API兼容OpenAI格式
 * 所以可以直接用OpenAI库，只需要改一下baseURL和apiKey
 */
const OpenAI = require('openai');

/**
 * 导入小米AI配置
 */
const { apiKey, baseURL, model, maxTokens, temperature, topP, systemPrompt } = require('../config/xiaomi-ai');

// ============================================
// 创建OpenAI客户端
// ============================================

/**
 * openaiClient：OpenAI客户端实例
 *
 * 配置：
 * - apiKey：小米AI的API密钥
 * - baseURL：小米AI的API地址（替换OpenAI默认地址）
 *
 * 这样配置后，所有请求都会发送到小米AI服务器
 */
const openaiClient = new OpenAI({
  apiKey: apiKey,
  baseURL: baseURL
});

// ============================================
// AI调用函数
// ============================================

/**
 * getAIReply：获取AI回复
 *
 * 流程：
 * 1. 构建消息数组（系统提示 + 历史消息 + 用户新消息）
 * 2. 调用小米AI API
 * 3. 返回AI回复
 *
 * @param {Array} messages - 消息数组，格式：[{ role: 'user', content: '...' }, ...]
 * @returns {string} AI回复内容
 */
async function getAIReply(messages) {
  /**
   * 重试配置
   *
   * 为什么需要重试？
   * 网络请求可能因为临时问题失败（如网络波动、服务器暂时不可用）
   * 重试可以提高成功率
   */
  const MAX_RETRIES = 3;        // 最大重试次数
  const RETRY_DELAY = 1000;     // 重试间隔：1秒

  /**
   * 重试循环
   *
   * for循环：最多尝试MAX_RETRIES次
   * 如果成功，直接返回结果
   * 如果失败，等待一段时间后重试
   */
  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    try {
      /**
       * 构建请求消息
       *
       * messages格式：
       * [
       *   { role: 'system', content: '你是...' },  // 系统提示（可选）
       *   { role: 'user', content: '你好' },        // 用户消息
       *   { role: 'assistant', content: '你好！' }, // AI回复
       *   { role: 'user', content: '今天天气怎么样' }  // 用户新消息
       * ]
       *
       * 为什么需要这种格式？
       * 小米AI API要求这种格式
       * 每条消息都要有role和content
       */
      const requestMessages = [
        /**
         * 系统提示词
         * 告诉AI它的角色和行为
         */
        { role: 'system', content: systemPrompt },
        /**
         * 历史消息 + 新消息
         */
        ...messages
      ];

      console.log(`调用小米AI API... (第${attempt}次尝试)`);
      console.log('模型：', model);
      console.log('消息数量：', requestMessages.length);
      console.log('API地址：', baseURL);

      /**
       * 调用小米AI API
       *
       * openaiClient.chat.completions.create()：
       * 这是OpenAI库的标准方法
       * 小米AI兼容这个格式
       *
       * 参数：
       * - model：使用哪个模型
       * - messages：消息数组
       * - max_tokens：最大输出token数
       * - temperature：创造性参数
       * - top_p：另一个创造性参数
       */
      const response = await openaiClient.chat.completions.create({
        model: model,
        messages: requestMessages,
        max_tokens: maxTokens,
        temperature: temperature,
        top_p: topP
      });

      console.log('小米AI API调用成功！');

      /**
       * 提取AI回复
       *
       * response结构：
       * {
       *   id: 'chatcmpl-xxx',
       *   object: 'chat.completion',
       *   choices: [
       *     {
       *       index: 0,
       *       message: {
       *         role: 'assistant',
       *         content: 'AI的回复内容'
       *       },
       *       finish_reason: 'stop'
       *     }
       *   ],
       *   usage: { ... }
       * }
       *
       * 我们需要的是 choices[0].message.content
       */
      const aiReply = response.choices[0].message.content;

      console.log('AI回复：', aiReply.substring(0, 50) + '...'); // 只打印前50个字符

      return aiReply;

    } catch (error) {
      /**
       * 错误处理
       *
       * 记录详细的错误信息，帮助调试
       */
      console.error(`第${attempt}次尝试失败：`, error.message);
      console.error('错误类型：', error.constructor.name);
      
      /**
       * 打印更详细的错误信息
       */
      if (error.response) {
        // 服务器返回了错误状态码
        console.error('HTTP状态码：', error.response.status);
        console.error('响应数据：', JSON.stringify(error.response.data));
      } else if (error.request) {
        // 请求已发出但没有收到响应
        console.error('请求已发出但无响应');
      } else {
        // 其他错误
        console.error('错误堆栈：', error.stack);
      }

      /**
       * 如果是最后一次尝试，抛出错误
       */
      if (attempt === MAX_RETRIES) {
        console.error(`已重试${MAX_RETRIES}次，仍然失败`);
        
        /**
         * 根据错误类型返回不同的提示
         */
        if (error.message.includes('API key') || error.message.includes('401')) {
          throw new Error('API密钥无效，请检查配置');
        } else if (error.message.includes('network') || error.message.includes('ECONNREFUSED')) {
          throw new Error('网络连接失败，请检查网络连接和API地址');
        } else if (error.message.includes('model') || error.message.includes('404')) {
          throw new Error('模型不存在，请检查模型名称');
        } else if (error.message.includes('timeout') || error.message.includes('ETIMEDOUT')) {
          throw new Error('请求超时，请稍后重试');
        } else if (error.message.includes('429')) {
          throw new Error('请求过于频繁，请稍后重试');
        } else if (error.message.includes('500') || error.message.includes('502') || error.message.includes('503')) {
          throw new Error('AI服务器暂时不可用，请稍后重试');
        } else {
          throw new Error(`AI服务暂时不可用：${error.message}`);
        }
      }

      /**
       * 等待一段时间后重试
       *
       * 为什么需要等待？
       * 如果是临时问题，等待后可能恢复
       * 如果是服务器过载，立即重试会加重负担
       */
      console.log(`等待${RETRY_DELAY}ms后重试...`);
      await new Promise(resolve => setTimeout(resolve, RETRY_DELAY));
    }
  }
}

/**
 * getAIReplyStream：获取AI流式回复（用于第六阶段）
 *
 * 这个函数用于实现流式输出（像ChatGPT一样逐字显示）
 * 第六阶段会用到 
 *
 * @param {Array} messages - 消息数组
 * @param {Function} onChunk - 收到每个chunk时的回调函数
 * @param {Function} onDone - 生成完成时的回调函数
 * @param {Function} onError - 出错时的回调函数
 */
async function getAIReplyStream(messages, onChunk, onDone, onError) {
  /**
   * 重试配置
   */
  const MAX_RETRIES = 2;
  const RETRY_DELAY = 1000;

  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    try {
      const requestMessages = [
        { role: 'system', content: systemPrompt },
        ...messages
      ];

      console.log(`流式调用小米AI API... (第${attempt}次尝试)`);
      console.log('消息数量：', requestMessages.length);

      /**
       * 流式调用小米AI API
       *
       * stream: true 表示开启流式输出
       * AI会一段一段地返回内容，而不是一次性返回
       */
      const stream = await openaiClient.chat.completions.create({
        model: model,
        messages: requestMessages,
        max_tokens: maxTokens,
        temperature: temperature,
        top_p: topP,
        stream: true  // 开启流式输出
      });
      let fullContent = '';

      /**
       * 遍历流式响应
       *
       * for await...of：异步遍历
       * 每次循环处理一个chunk（一小段内容）
       */
      for await (const chunk of stream) {
        /**
         * 提取chunk中的内容
         *
         * chunk结构：
         * {
         *   choices: [
         *     {
         *       delta: { content: '一小段内容' }
         *     }
         *   ]
         * }
         */
        const content = chunk.choices[0]?.delta?.content || '';
        if (content) {
          fullContent += content;
          // 调用回调函数，把这段内容传出去
          onChunk(content);
        }
      }

      console.log('流式输出完成，总长度：', fullContent.length);

      // 调用完成回调
      if (onDone) {
        onDone(fullContent);
      }

      return fullContent;

    } catch (error) {
      console.error(`第${attempt}次流式调用失败：`, error.message);
      
      // 如果是最后一次尝试，调用错误回调
      if (attempt === MAX_RETRIES) {
        console.error(`已重试${MAX_RETRIES}次，仍然失败`);
        if (onError) {
          onError(error.message);
        }
        throw error;
      }

      // 等待后重试
      console.log(`等待${RETRY_DELAY}ms后重试...`);
      await new Promise(resolve => setTimeout(resolve, RETRY_DELAY));
    }
  }
}

// ============================================
// 导出函数
// ============================================

/**
 * module.exports：导出供路由使用
 */
module.exports = {
  getAIReply,
  getAIReplyStream
};