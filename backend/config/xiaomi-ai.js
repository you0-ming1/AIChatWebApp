/**
 * config/xiaomi-ai.js - 小米AI配置文件
 *
 * 这个文件负责管理小米AI API的配置
 *
 * 为什么单独配置？
 * 1. API密钥等敏感信息集中管理
 * 2. 方便切换不同的模型
 * 3. 后续可以添加更多AI服务商
 *
 * 配置信息来源：
 * 用户提供的 models.json 文件
 */

// ============================================
// 小米AI配置
// ============================================

/**
 * xiaomiAIConfig：小米AI配置对象
 *
 * 包含以下配置：
 * - apiKey：API密钥（用于认证）
 * - baseURL：API基础地址
 * - model：模型名称
 * - maxTokens：最大输出token数
 * - temperature：创造性参数（0-1，越高越有创造性）
 * - topP：另一个创造性参数
 * - systemPrompt：系统提示词（AI的角色设定）
 */
const xiaomiAIConfig = {
  /**
   * apiKey：API密钥
   *
   * 这是小米AI API的认证密钥
   * 从环境变量读取，避免硬编码在代码里
   * 如果环境变量没设置，用空字符串兜底
   *
   * 安全提示：
   * 1. 不要提交到Git仓库
   * 2. 不要打印到控制台
   * 3. 不要返回给前端
   */
  apiKey: process.env.XIAOMI_API_KEY ,

  /**
   * baseURL：API基础地址
   *
   * 小米AI API的端点地址
   * 后续所有的API请求都会基于这个地址
   *
   * 例如：
   * - 聊天补全：https://token-plan-cn.xiaomimimo.com/v1/chat/completions
   * - 模型列表：https://token-plan-cn.xiaomimimo.com/v1/models
   */
  baseURL: 'https://token-plan-cn.xiaomimimo.com/v1',

  /**
   * model：模型名称
   *
   * 使用哪个AI模型
   * 小米提供了两个模型：
   * - mimo-v2.5-pro：专业版，更强大
   * - mimo-v2.5：标准版，更快
   *
   * 我们选择mimo-v2.5-pro，因为它是专业版
   */
  model: 'mimo-v2.5-pro',

  /**
   * maxTokens：最大输出token数
   *
   * 限制AI回复的最大长度
   * 1个token大约等于0.75个中文字
   * 32768 tokens ≈ 24576个中文字
   *
   * 为什么需要限制？
   * 防止AI回复过长，浪费资源
   */
  maxTokens: 32768,

  /**
   * temperature：创造性参数（0-1）
   *
   * 控制AI回复的随机性
   * - 0：最保守，每次回复都一样
   * - 1：最有创造性，每次回复可能不同
   *
   * 推荐值：0.2（稍微有创造性，但不会太离谱）
   */
  temperature: 0.7,

  /**
   * topP：另一个创造性参数（0-1）
   *
   * 和temperature类似，但控制方式不同
   * 推荐值：0.1（和temperature=0.2配合使用）
   */
  topP: 0.3,

  /**
   * systemPrompt：系统提示词
   *
   * 定义AI的角色和行为
   * 例如："你是专业代码助手，只回答核心内容，不冗余，不解释多余信息。写代码时注释能加一定要加，每行都要，且注释易懂。"
   *
   * 为什么需要系统提示词？
   * 让AI知道自己的角色，提供更相关的回答
   */
  systemPrompt: '你是个幽默的大模型，梗王'
};

// ============================================
// 导出配置
// ============================================

/**
 * module.exports：导出配置供其他文件使用
 *
 * 其他文件这样使用：
 * const { apiKey, baseURL, model } = require('../config/xiaomi-ai');
 */
module.exports = xiaomiAIConfig;