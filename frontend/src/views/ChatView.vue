<script setup lang="ts">
/**
 * ChatView.vue - 聊天主页面
 * 
 * ============================================
 * 页面功能
 * ============================================
 * 
 * 这是应用的核心页面，提供AI聊天功能：
 * 1. 左侧：会话列表（创建、切换、删除对话）
 * 2. 中间：聊天区域（显示消息、发送消息）
 * 3. 右侧：设置面板（模型选择、参数调整）
 * 
 * ============================================
 * 设计思路
 * ============================================
 * 
 * Apple风格设计原则：
 * 
 * 1. 三栏布局
 *    - 左侧会话列表：类似微信但更简洁
 *    - 中间聊天区：像高级阅读器，不是微信聊天框
 *    - 右侧设置：可选面板
 * 
 * 2. 消息样式
 *    - 用户消息：右对齐，蓝色高亮，更小更聚焦
 *    - AI消息：左对齐，更宽，更像文档，留白更多
 * 
 * 3. 视觉层次
 *    - 背景色：深色（#0f1115）
 *    - 侧边栏：稍亮（#151821）
 *    - 卡片/输入框：半透明（rgba(255,255,255,0.04)）
 * 
 * ============================================
 * 技术实现
 * ============================================
 * 
 * - Vue3 Composition API
 * - vue-router：页面跳转
 * - axios：HTTP请求
 * - Lucide Icons：图标
 * - CSS变量：设计系统
 */

import { ref, nextTick, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { 
  Plus,           // 新建图标
  MessageSquare,  // 消息图标
  Settings,       // 设置图标
  Send,           // 发送图标
  Sparkles,       // AI图标
  LogOut,         // 退出图标
  ChevronDown,    // 下拉箭头
  Trash2,         // 删除图标
  Copy,           // 复制图标
  Check           // 完成图标
} from 'lucide-vue-next'
import axios from 'axios'

// ============================================
// API配置
// ============================================

/**
 * apiClient：axios实例，用于调用后端API
 *
 * 为什么创建axios实例而不是直接用axios？
 * 1. 可以统一配置baseURL（后端地址）
 * 2. 可以添加请求拦截器（自动带上token）
 * 3. 可以添加响应拦截器（统一处理错误）
 */
const apiClient = axios.create({
  baseURL: '/api',  // 基础URL，会自动拼接路径
  timeout: 10000,    // 超时时间：10秒
  headers: {
    'Content-Type': 'application/json'
  }
})

/**
 * 请求拦截器：每个请求发送前自动执行
 *
 * 作用：自动在请求头中添加token
 * 为什么需要？因为所有聊天接口都需要token验证
 */
apiClient.interceptors.request.use(
  (config) => {
    // 从本地存储获取token
    const token = localStorage.getItem('token')
    if (token) {
      // 添加到请求头
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => {
    return Promise.reject(error)
  }
)

/**
 * 响应拦截器：每个响应收到后自动执行
 *
 * 作用：统一处理错误
 * 比如：token过期时自动跳转到登录页
 */
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    // 如果是401错误（未授权），可能是token过期
    if (error.response && error.response.status === 401) {
      // 清除本地存储
      localStorage.removeItem('token')
      localStorage.removeItem('user')
      // 跳转到登录页
      window.location.href = '/login'
    }
    return Promise.reject(error)
  }
)

// ============================================
// 路由实例
// ============================================
const router = useRouter()

// ============================================
// 用户信息
// ============================================

/**
 * user：当前登录用户的信息
 * 包含 id、username、email、role 等
 */
const user = ref<any>(null)

/**
 * token：JWT认证令牌
 * 用于后续请求的Authorization头
 */
const token = ref('')

// ============================================
// 会话管理
// ============================================

/**
 * conversations：会话列表
 * 
 * 数据结构：
 * [
 *   { id: 1, title: "对话1", messages: [...] },
 *   { id: 2, title: "对话2", messages: [...] },
 *   ...
 * ]
 * 
 * 为什么用数组？
 * 因为会话有顺序（最新的在前面）
 */
const conversations = ref<Array<{id: number, title: string, messages: any[]}>>([])

/**
 * currentConversationId：当前选中的会话ID
 * 为null时表示没有选中任何会话
 */
const currentConversationId = ref<number | null>(null)

// ============================================
// 消息相关
// ============================================

/**
 * inputMessage：输入框的内容
 * 绑定到 textarea 的 v-model
 */
const inputMessage = ref('')

/**
 * messages：当前会话的消息列表
 * 
 * 数据结构：
 * [
 *   { role: "user", content: "你好" },
 *   { role: "assistant", content: "你好！有什么可以帮你的？" },
 *   ...
 * ]
 * 
 * role的值：
 * - "user"：用户发送的消息
 * - "assistant"：AI回复的消息
 */
const messages = ref<Array<{role: string, content: string}>>([])

/**
 * isLoading：是否正在等待AI回复
 * 用于：
 * 1. 禁用输入框和发送按钮
 * 2. 显示加载动画
 */
const isLoading = ref(false)

/**
 * eventSource：SSE连接引用
 * 用于管理流式连接的生命周期
 */
let eventSource: EventSource | null = null

/**
 * messagesContainer：消息列表容器的DOM引用
 * 用于自动滚动到底部
 */
const messagesContainer = ref<HTMLElement | null>(null)

// ============================================
// 复制功能
// ============================================

/**
 * copiedIndex：当前复制成功的消息索引
 * 用于显示"复制成功"的✓图标
 */
const copiedIndex = ref<number | null>(null)

/**
 * copyMessage：复制消息内容到剪贴板
 * 
 * @param content 要复制的内容
 * @param index 消息索引（用于显示复制成功状态）
 */
const copyMessage = async (content: string, index: number) => {
  try {
    /**
     * navigator.clipboard.writeText()：现代浏览器的剪贴板API
     * 返回Promise，需要await
     */
    await navigator.clipboard.writeText(content)
    
    /**
     * 复制成功：显示✓图标
     * 1.5秒后恢复为复制图标
     */
    copiedIndex.value = index
    setTimeout(() => {
      copiedIndex.value = null
    }, 1500)
  } catch (error) {
    console.error('复制失败：', error)
  }
}

// ============================================
// 生命周期
// ============================================

/**
 * onMounted：组件挂载完成后执行
 * 
 * 执行顺序：
 * 1. 页面加载
 * 2. Vue创建组件
 * 3. onMounted执行
 * 4. 页面显示
 * 
 * 这里做的事情：
 * 1. 检查用户是否已登录
 * 2. 如果未登录，跳转到登录页
 * 3. 如果已登录，加载用户信息
 * 4. 创建默认会话
 */
onMounted(async () => {
  // 从本地存储获取token
  token.value = localStorage.getItem('token') || ''
  
  // 从本地存储获取用户信息
  const userStr = localStorage.getItem('user')
  
  /**
   * 验证登录状态
   * 如果没有token或用户信息，说明未登录
   */
  if (!token.value || !userStr) {
    router.push('/login')  // 跳转到登录页
    return
  }
  
  /**
   * 解析用户信息
   * localStorage存储的是字符串，需要JSON.parse转为对象
   */
  user.value = JSON.parse(userStr)
  
  /**
   * 加载会话列表
   * 从后端API获取该用户的所有会话
   */
  try {
    const response = await apiClient.get('/chat/conversation')
    const data = response.data
    
    if (data.success) {
      /**
       * 转换数据格式
       * 后端返回的会话格式：{ id, title, created_at, updated_at, user_id }
       * 前端需要的格式：{ id, title, messages: [] }
       * 因为消息是单独加载的，所以先初始化为空数组
       */
      conversations.value = data.data.conversations.map((conv: any) => ({
        id: conv.id,
        title: conv.title,
        messages: []  // 先初始化为空，选择会话时再加载
      }))
      
      /**
       * 如果有会话，自动选择第一个
       * 如果没有会话，创建新会话
       */
      if (conversations.value.length > 0) {
        selectConversation(conversations.value[0].id)
      } else {
        createNewConversation()
      }
    }
  } catch (error) {
    console.error('加载会话列表失败：', error)
    // 加载失败时，创建默认会话
    createNewConversation()
  }
})

// ============================================
// 会话管理函数
// ============================================

/**
 * createNewConversation：创建新会话
 * 
 * 点击"新建对话"按钮时调用
 * 
 * 流程：
 * 1. 创建会话对象
 * 2. 添加到会话列表开头
 * 3. 选中新会话
 * 4. 清空消息列表
 */
const createNewConversation = async () => {
  /**
   * 创建新会话
   * 
   * 流程：
   * 1. 调用后端API创建会话
   * 2. 获取新会话的ID
   * 3. 添加到会话列表开头
   * 4. 选中新会话
   * 5. 清空消息列表
   */
  try {
    // 调用后端API创建会话
    const response = await apiClient.post('/chat/conversation', {
      title: '新对话'
    })
    
    const data = response.data
    
    if (data.success) {
      /**
       * 新会话对象
       * 
       * id：使用后端返回的数据库ID
       * title：使用后端返回的标题
       * messages：空数组（新会话没有消息）
       */
      const newConversation = {
        id: data.data.id,
        title: data.data.title,
        messages: []
      }
      
      /**
       * unshift()：添加到数组开头
       * 
       * 为什么不用push()？
       * 因为最新的会话应该显示在最上面
       * unshift添加到开头，push添加到末尾
       */
      conversations.value.unshift(newConversation)
      
      // 选中新会话
      currentConversationId.value = newConversation.id
      
      // 清空消息列表（新会话没有消息）
      messages.value = []
    }
  } catch (error) {
    console.error('创建会话失败：', error)
    // 创建失败时，使用本地模拟
    const newConversation = {
      id: Date.now(),
      title: '新对话',
      messages: []
    }
    conversations.value.unshift(newConversation)
    currentConversationId.value = newConversation.id
    messages.value = []
  }
}

/**
 * selectConversation：选择会话
 * 
 * 点击会话列表中的某个会话时调用
 * 
 * @param id 会话ID
 */
const selectConversation = async (id: number) => {
  // 设置当前选中的会话ID
  currentConversationId.value = id
  
  /**
   * 查找会话对象
   * 
   * find()：在数组中查找满足条件的第一个元素
   * c.id === id：查找id等于参数id的会话
   */
  const conversation = conversations.value.find(c => c.id === id)
  
  if (conversation) {
    /**
     * 如果会话的消息列表为空，需要从后端加载
     * 因为我们在初始化时只加载了会话列表，没有加载消息
     */
    if (conversation.messages.length === 0) {
      try {
        // 调用后端API获取消息列表
        const response = await apiClient.get(`/chat/message/${id}`)
        const data = response.data
        
        if (data.success) {
          /**
           * 转换消息格式
           * 后端返回的消息格式：{ id, conversation_id, role, content, created_at }
           * 前端需要的格式：{ role, content }
           */
          conversation.messages = data.data.messages.map((msg: any) => ({
            role: msg.role,
            content: msg.content
          }))
        }
      } catch (error) {
        console.error('加载消息列表失败：', error)
      }
    }
    
    /**
     * 更新消息列表
     * 
     * 为什么用conversation.messages而不是直接赋值？
     * 因为需要保持响应式
     * 直接赋值会丢失响应式
     */
    messages.value = conversation.messages

    /**
     * 滚动到消息列表底部
     * 
     * 为什么需要？
     * 切换会话后，应该显示最新消息
     * 所以自动滚动到底部
     */
    await nextTick()
    scrollToBottom()
  }
}

/**
 * deleteConversation：删除会话
 * 
 * 点击会话项的删除按钮时调用
 * 
 * @param id 会话ID
 * @param event 事件对象（用于阻止冒泡）
 */
const deleteConversation = async (id: number, event: Event) => {
  /**
   * stopPropagation()：阻止事件冒泡
   * 
   * 为什么要阻止？
   * 因为删除按钮在会话项内部
   * 点击删除时，事件会冒泡到会话项
   * 触发selectConversation
   * 
   * 阻止冒泡后，点击删除只执行删除，不会切换会话
   */
  event.stopPropagation()
  
  /**
   * 确认删除
   * 为什么需要确认？防止误操作
   */
  if (!confirm('确定要删除这个会话吗？')) {
    return
  }
  
  try {
    // 调用后端API删除会话
    await apiClient.delete(`/chat/conversation/${id}`)
    
    /**
     * 从本地列表中删除
     * splice()：删除数组元素
     */
    const index = conversations.value.findIndex(c => c.id === id)
    if (index > -1) {
      conversations.value.splice(index, 1)
      
      /**
       * 如果删除的是当前选中的会话
       */
      if (currentConversationId.value === id) {
        if (conversations.value.length > 0) {
          // 还有其他会话：切换到第一个
          selectConversation(conversations.value[0].id)
        } else {
          // 没有会话了：创建新的
          createNewConversation()
        }
      }
    }
  } catch (error) {
    console.error('删除会话失败：', error)
    alert('删除会话失败，请稍后重试')
  }
}

// ============================================
// 消息发送
// ============================================

/**
 * sendMessage：发送消息（流式输出）
 * 
 * 点击发送按钮或按Enter键时调用
 * 
 * 流程：
 * 1. 验证输入
 * 2. 添加用户消息到列表
 * 3. 更新会话标题
 * 4. 自动滚动到底部
 * 5. 建立SSE连接，接收流式AI回复
 * 6. 逐字显示AI回复
 */
const sendMessage = async () => {
  /**
   * 获取并清理输入内容
   * 
   * trim()：去除首尾空格
   * 为什么？用户可能不小心多按了空格
   */
  const message = inputMessage.value.trim()
  
  /**
   * 验证：
   * 1. 消息不能为空
   * 2. 不能在加载时重复发送
   * 3. 必须有选中的会话
   */
  if (!message || isLoading.value || !currentConversationId.value) return
  
  /**
   * 清空输入框
   * 
   * 为什么在这里清空，而不是在最后？
   * 因为可能在加载过程中用户想输入新消息
   * 先清空，用户可以继续输入
   */
  inputMessage.value = ''
  
  /**
   * 添加用户消息到列表
   * 
   * push()：添加到数组末尾
   * 
   * 为什么不是unshift？
   * 因为消息是按时间顺序显示的
   * 新消息应该在下面，所以用push
   */
  messages.value.push({
    role: 'user',
    content: message
  })
  
  /**
   * 更新会话标题
   * 
   * 如果是新对话（标题还是"新对话"）
   * 自动更新为消息的前20个字符
   */
  const conversation = conversations.value.find(c => c.id === currentConversationId.value)
  if (conversation && conversation.title === '新对话') {
    /**
     * slice(0, 20)：截取前20个字符
     * 三元运算符：超过20个字符就加"..."
     */
    conversation.title = message.slice(0, 20) + (message.length > 20 ? '...' : '')
  }
  
  /**
   * 自动滚动到底部
   * 
   * 为什么要用nextTick？
   * 因为Vue是异步更新DOM的
   * 消息添加后，DOM还没更新
   * nextTick等待DOM更新后再滚动
   */
  await nextTick()
  scrollToBottom()
  
  /**
   * 开始加载
   * - 禁用输入框
   * - 显示加载动画
   */
  isLoading.value = true
  
  /**
   * 添加AI消息占位符
   * 
   * 先添加一个空的AI消息
   * 等待流式数据填充内容
   */
  const aiMessageIndex = messages.value.length
  messages.value.push({
    role: 'assistant',
    content: ''
  })
  
  /**
   * 滚动到底部，显示加载动画
   */
  await nextTick()
  scrollToBottom()
  
  try {
    /**
     * 建立SSE连接
     * 
     * 使用EventSource接收流式数据
     * 为什么不用axios？
     * 因为axios不支持SSE
     * EventSource是浏览器原生API
     */
    const token = localStorage.getItem('token')
    const url = `/api/chat/message/stream`
    
    /**
     * 创建SSE连接
     * 
     * 注意：EventSource只支持GET请求
     * 所以我们需要用fetch API发送POST请求
     * 然后用ReadableStream读取流式数据
     */
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({
        conversationId: currentConversationId.value,
        content: message
      })
    })
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }
    
    /**
     * 获取响应流
     * 
     * response.body是一个ReadableStream
     * 我们需要读取这个流
     */
    const reader = response.body?.getReader()
    if (!reader) {
      throw new Error('无法获取响应流')
    }
    
    const decoder = new TextDecoder()
    let aiContent = ''
    
    /**
     * 读取流式数据
     * 
     * while循环：持续读取，直到流结束
     * reader.read()：读取一段数据
     * done：是否读取完毕
     * value：读取到的数据（Uint8Array）
     */
    while (true) {
      const { done, value } = await reader.read()
      if (done) break
      
      /**
       * 解码数据
       * 
       * Uint8Array → 字符串
       */
      const chunk = decoder.decode(value)
      /**
       * 解析SSE数据
       * 
       * SSE格式：
       * data: {"type": "chunk", "content": "你"}
       * data: {"type": "done", "fullContent": "你好！"}
       * 
       * 需要按行分割，然后解析每行
       */
      const lines = chunk.split('\n')
      
      for (const line of lines) {
        if (line.startsWith('data: ')) {
          try {
            const data = JSON.parse(line.slice(6))
            
            switch (data.type) {
              case 'start':
                // AI开始生成
                console.log('AI开始生成，消息ID：', data.messageId)
                break
                
              case 'chunk':
                // 收到一小段内容
                aiContent += data.content
                
                /**
                 * 更新AI消息内容
                 * 
                 * 为什么要创建新对象？
                 * 因为Vue的响应式系统需要检测到变化
                 * 直接修改数组元素可能不会触发更新
                 */
                messages.value[aiMessageIndex] = {
                  role: 'assistant',
                  content: aiContent
                }
                
                /**
                 * 滚动到底部
                 * 
                 * 为什么每次都要滚动？
                 * 因为内容在不断增加
                 * 需要保持最新内容可见
                 */
                await nextTick()
                scrollToBottom()
                break
                
              case 'done':
                // 生成完成
                console.log('AI生成完成，总长度：', data.fullContent.length)
                aiContent = data.fullContent
                
                // 最终更新AI消息内容
                messages.value[aiMessageIndex] = {
                  role: 'assistant',
                  content: aiContent
                }
                break
                
              case 'error':
                // 出错
                console.error('AI生成错误：', data.message)
                messages.value[aiMessageIndex] = {
                  role: 'assistant',
                  content: `抱歉，AI服务暂时不可用：${data.message}`
                }
                break
            }
          } catch (parseError) {
            // 解析错误，忽略这行
            console.warn('解析SSE数据失败：', line)
          }
        }
      }
    }
    
  } catch (error) {
    /**
     * 请求失败
     * 
     * 可能的原因：
     * 1. 网络断开
     * 2. 后端服务器挂了
     * 3. token过期
     * 4. 后端处理出错
     */
    console.error('发送消息失败：', error)
    
    /**
     * 更新AI消息为错误提示
     * 
     * 注意：我们已经在aiMessageIndex位置添加了占位符
     * 现在只需要更新内容即可
     */
    messages.value[aiMessageIndex] = {
      role: 'assistant',
      content: '抱歉，发送消息失败，请稍后重试。'
    }
    
  } finally {
    /**
     * 无论成功或失败，都要执行
     * 
     * 关闭加载状态：
     * - 恢复输入框可编辑
     * - 隐藏加载动画
     */
    isLoading.value = false
    
    /**
     * 滚动到底部，显示最终结果
     */
    await nextTick()
    scrollToBottom()
  }
}

/**
 * scrollToBottom：滚动到消息列表底部
 * 
 * 为什么需要这个？
 * 因为消息越来越多时，列表会超出容器高度
 * 需要滚动才能看到最新消息
 * 
 * 实现原理：
 * 设置scrollTop = scrollHeight
 * scrollTop：当前滚动位置
 * scrollHeight：内容总高度
 */
const scrollToBottom = () => {
  if (messagesContainer.value) {
    /**
     * scrollTo()：滚动到指定位置
     * 
     * 参数：
     * - top：垂直滚动位置
     * - behavior: 'smooth'：平滑滚动（不是瞬间跳转）
     */
    messagesContainer.value.scrollTo({
      top: messagesContainer.value.scrollHeight,
      behavior: 'smooth'
    })
  }
}

/**
 * handleKeydown：处理键盘事件
 * 
 * Enter：发送消息
 * Shift+Enter：换行（不发送）
 * 
 * @param e 键盘事件对象
 */
const handleKeydown = (e: KeyboardEvent) => {
  /**
   * e.key === 'Enter'：按下了Enter键
   * !e.shiftKey：没有按住Shift键
   * 
   * 两个条件都满足才发送
   * 如果按住了Shift，就换行
   */
  if (e.key === 'Enter' && !e.shiftKey) {
    e.preventDefault()  // 阻止默认行为（textarea的换行）
    sendMessage()
  }
}

/**
 * logout：退出登录
 * 
 * 清除本地存储，跳转到登录页
 */
const logout = () => {
  localStorage.removeItem('token')
  localStorage.removeItem('user')
  router.push('/login')
}

/**
 * handleInput：处理输入框内容变化
 * 
 * 实现多行输入：
 * - 输入内容增多时，自动增加高度
 * - 最大高度200px，超过就显示滚动条
 * 
 * @param e 输入事件对象
 */
const handleInput = (e: Event) => {
  const textarea = e.target as HTMLTextAreaElement
  
  /**
   * 自动调整高度
   * 
   * 先设置height: auto，让浏览器重新计算
   * 然后设置为scrollHeight（内容的实际高度）
   * 
   * Math.min()：限制最大高度为200px
   */
  textarea.style.height = 'auto'
  textarea.style.height = Math.min(textarea.scrollHeight, 200) + 'px'
}
</script>

<template>
  <!-- ============================================
       聊天页面主容器
       ============================================ -->
  <!-- 
    三栏布局容器
    - display: flex：弹性布局
    - height: 100vh：占满整个屏幕
    - overflow: hidden：禁止整体滚动
  -->
  <div class="chat-container">
    
    <!-- ============================================
         左侧边栏：会话列表
         ============================================ -->
    <!-- 
      侧边栏固定宽度260px
      - 垂直flex布局
      - 背景比主区域稍亮
      - 右侧边框分隔
    -->
    <aside class="sidebar">
      
      <!-- 顶部：新建按钮 -->
      <div class="sidebar-header">
        <!-- 
          新建对话按钮
          - 全宽
          - 半透明背景
          - hover时变亮
        -->
        <button @click="createNewConversation" class="new-chat-button">
          <Plus :size="18" />
          <span>新建对话</span>
        </button>
      </div>
      
      <!-- 中间：会话列表 -->
      <!-- 
        overflow-y: auto：垂直方向可滚动
        当会话很多时，可以滚动查看
      -->
      <div class="conversations-list">
        
        <!-- 
          v-for：循环渲染会话列表
          
          语法：v-for="item in array" :key="uniqueKey"
          - item：当前项
          - array：数组
          - :key：唯一标识（必须有，提高性能）
          
          这里每个会话就是一个div
        -->
        <!-- 
          动态class：根据是否选中添加active类
          当currentConversationId === conversation.id时
          添加active类，应用选中样式
        -->
        <div 
          v-for="conversation in conversations" 
          :key="conversation.id"
          class="conversation-item"
          :class="{ active: currentConversationId === conversation.id }"
          @click="selectConversation(conversation.id)"
        >
          <MessageSquare :size="16" class="conversation-icon" />
          <span class="conversation-title">{{ conversation.title }}</span>
          <!-- 
            删除按钮
            - 默认隐藏（opacity: 0）
            - 鼠标悬停在会话项时显示
          -->
          <button 
            @click="deleteConversation(conversation.id, $event)"
            class="delete-button"
            title="删除对话"
          >
            <Trash2 :size="14" />
          </button>
        </div>
      </div>
      
      <!-- 底部：用户信息和退出 -->
      <div class="sidebar-footer">
        <!-- 用户信息 -->
        <div class="user-info">
          <!-- 
            用户头像
            - 显示用户名首字母
            - 渐变背景
          -->
          <div class="user-avatar">
            {{ user?.username?.charAt(0).toUpperCase() || 'U' }}
          </div>
          <span class="user-name">{{ user?.username || '用户' }}</span>
        </div>
        <!-- 退出按钮 -->
        <button @click="logout" class="logout-button" title="退出登录">
          <LogOut :size="18" />
        </button>
      </div>
    </aside>
    
    <!-- ============================================
         中间：聊天区域
         ============================================ -->
    <main class="chat-main">
      
      <!-- 消息列表容器 -->
      <div class="messages-container" ref="messagesContainer">
        
        <!-- 
          空状态：没有消息时显示
          - 居中显示
          - AI图标
          - 提示文字
        -->
        <div v-if="messages.length === 0" class="empty-state">
          <div class="empty-icon">
            <Sparkles :size="48" />
          </div>
          <h2 class="empty-title">开始新的对话</h2>
          <p class="empty-subtitle">输入任何问题，AI将为你解答</p>
        </div>
        
        <!-- 消息列表 -->
        <div v-else class="messages-list">
          
          <!-- 
            循环渲染每条消息
            
            :class="message.role"：
            - 如果role是"user"，添加user类
            - 如果role是"assistant"，添加assistant类
            - 不同类有不同的样式（对齐方式、颜色等）
          -->
          <div 
            v-for="(message, index) in messages" 
            :key="index"
            class="message-item"
            :class="message.role"
          >
            <!-- 消息内容 -->
            <div class="message-content">
              
              <!-- AI回复：显示内容或加载动画 -->
              <div v-if="message.role === 'assistant'" class="message-text assistant-text">
                <!-- 如果内容为空，显示加载动画 -->
                <div v-if="!message.content" class="loading">
                  <span class="loading-dot"></span>
                  <span class="loading-dot"></span>
                  <span class="loading-dot"></span>
                </div>
                <!-- 如果内容不为空，渲染markdown -->
                <div v-else v-html="formatMessage(message.content)"></div>
              </div>
              
              <!-- 用户消息：纯文本 -->
              <div v-else class="message-text user-text">
                {{ message.content }}
              </div>
            </div>
            
            <!-- 消息操作按钮 -->
            <!-- 
              透明度从0变为1
              - 默认隐藏
              - 鼠标悬停在消息上时显示
            -->
            <div class="message-actions">
              <!-- 复制按钮（仅AI回复显示） -->
              <button 
                v-if="message.role === 'assistant'"
                @click="copyMessage(message.content, index)"
                class="action-button"
                title="复制"
              >
                <!-- 
                  复制成功时显示✓图标
                  否则显示复制图标
                -->
                <Check v-if="copiedIndex === index" :size="14" class="copied-icon" />
                <Copy v-else :size="14" />
              </button>
            </div>
          </div>
          
        </div>
      </div>
      
      <!-- 输入区域 -->
      <div class="input-area">
        <div class="input-wrapper">
          <!-- 
            textarea：多行输入框
            - rows="1"：默认1行高度
            - 自动增长（通过handleInput函数）
            - max-height: 200px（通过CSS）
          -->
          <textarea
            v-model="inputMessage"
            @keydown="handleKeydown"
            @input="handleInput"
            placeholder="输入消息..."
            class="message-input"
            rows="1"
            :disabled="isLoading"
          ></textarea>
          
          <!-- 发送按钮 -->
          <!-- 
            禁用条件：
            1. 输入为空（!inputMessage.trim()）
            2. 正在加载（isLoading）
          -->
          <button 
            @click="sendMessage"
            class="send-button"
            :disabled="!inputMessage.trim() || isLoading"
            title="发送消息"
          >
            <Send :size="18" />
          </button>
        </div>
        
        <!-- 底部提示 -->
        <div class="input-hint">
          按 Enter 发送，Shift + Enter 换行
        </div>
      </div>
    </main>
    
    <!-- ============================================
         右侧边栏：设置（可选）
         ============================================ -->
    <aside class="settings-sidebar">
      <div class="settings-header">
        <Settings :size="18" />
        <span>设置</span>
      </div>
      
      <div class="settings-content">
        <!-- 模型选择 -->
        <div class="setting-group">
          <label class="setting-label">AI 模型</label>
          <div class="select-wrapper">
            <select class="setting-select">
              <option value="gpt-4">GPT-4</option>
              <option value="gpt-3.5">GPT-3.5</option>
            </select>
            <ChevronDown :size="16" class="select-icon" />
          </div>
        </div>
        
        <!-- 温度设置 -->
        <div class="setting-group">
          <label class="setting-label">创意程度</label>
          <div class="slider-wrapper">
            <input type="range" min="0" max="100" value="70" class="setting-slider" />
            <span class="slider-value">0.7</span>
          </div>
        </div>
      </div>
    </aside>
  </div>
</template>

<script lang="ts">
/**
 * 组件选项（非setup部分）
 * 
 * 用于定义方法，需要在模板中调用
 * 
 * 为什么不在setup里定义？
 * 因为v-html需要调用方法
 * setup里定义的方法需要return才能在模板中使用
 * 用options API更简单
 */
export default {
  methods: {
    /**
     * formatMessage：格式化消息内容
     * 
     * 简单的markdown渲染：
     * - 代码块：```language\ncode``` → <pre><code>code</code></pre>
     * - 换行：\n → <br>
     * 
     * @param content 原始内容
     * @returns 格式化后的HTML字符串
     */
    formatMessage(content: string): string {
      if (!content) return ''
      
      /**
       * 正则表达式匹配代码块
       * 
       * /```(\w+)?\n([\s\S]*?)```/g 解释：
       * - ```：三个反引号（代码块标记）
       * - (\w+)?：可选的语言名称（如javascript、python）
       * - \n：换行
       * - ([\s\S]*?)：代码内容（非贪婪匹配）
       * - ```：结束标记
       * - g：全局匹配（匹配所有）
       */
      let formatted = content.replace(
        /```(\w+)?\n([\s\S]*?)```/g,
        '<pre class="code-block"><code>$2</code></pre>'
      )
      
      /**
       * 换行符转换为<br>标签
       * 
       * 为什么需要？
       * 因为HTML不会自动渲染换行符
       * 需要用<br>标签才能换行
       */
      formatted = formatted.replace(/\n/g, '<br>')
      
      return formatted
    }
  }
}
</script>

<style scoped>
/* ============================================
   聊天页面主容器
   ============================================ */
.chat-container {
  /* 
   * 三栏布局
   * display: flex：弹性布局
   * 子元素默认水平排列
   */
  display: flex;
  
  /* 占满整个屏幕高度 */
  height: 100vh;
  
  /* 深色背景 */
  background: var(--bg-primary);
  
  /* 禁止整体滚动 */
  overflow: hidden;
}

/* ============================================
   左侧边栏
   ============================================ */
.sidebar {
  /* 
   * 固定宽度260px
   * flex-shrink: 0：不允许缩小
   * 即使中间区域内容很多，侧边栏宽度也不变
   */
  width: 260px;
  flex-shrink: 0;
  
  /* 垂直flex布局 */
  display: flex;
  flex-direction: column;
  
  /* 背景：比主区域稍亮 */
  background: var(--bg-secondary);
  
  /* 右侧边框 */
  border-right: 1px solid var(--glass-border);
}

/* 侧边栏顶部：新建按钮 */
.sidebar-header {
  padding: 16px;
  border-bottom: 1px solid var(--glass-border);
}

/* 新建对话按钮 */
.new-chat-button {
  /* 水平居中 */
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  
  /* 全宽，固定高度 */
  width: 100%;
  height: 44px;
  
  /* 半透明背景 */
  background: var(--glass-bg);
  border: 1px solid var(--glass-border);
  
  /* 文字 */
  color: var(--text-primary);
  font-size: 14px;
  font-weight: 500;
  
  /* 圆角16px */
  border-radius: var(--radius-md);
  
  transition: var(--transition-fast);
  cursor: pointer;
}

/* 新建按钮悬停效果 */
.new-chat-button:hover {
  background: var(--glass-bg-hover);
  border-color: rgba(255, 255, 255, 0.12);
}

/* 会话列表区域 */
.conversations-list {
  /* 占满剩余空间 */
  flex: 1;
  
  /* 垂直可滚动 */
  overflow-y: auto;
  
  padding: 8px;
}

/* 单个会话项 */
.conversation-item {
  display: flex;
  align-items: center;
  gap: 10px;
  
  padding: 12px 14px;
  
  /* 圆角10px */
  border-radius: var(--radius-sm);
  
  cursor: pointer;
  
  transition: var(--transition-fast);
}

/* 会话项悬停效果 */
.conversation-item:hover {
  background: var(--glass-bg-hover);
}

/* 
 * 会话项选中状态
 * 
 * 蓝色背景 + 蓝色边框
 * 表示"当前正在看这个会话"
 */
.conversation-item.active {
  background: rgba(74, 158, 255, 0.1);
  border: 1px solid rgba(74, 158, 255, 0.2);
}

/* 会话图标 */
.conversation-icon {
  color: var(--text-secondary);
  flex-shrink: 0;
}

/* 
 * 会话标题
 * 
 * 超长文本截断
 * white-space: nowrap：不换行
 * overflow: hidden：隐藏超出部分
 * text-overflow: ellipsis：显示省略号(...)
 */
.conversation-title {
  flex: 1;
  font-size: 14px;
  color: var(--text-primary);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

/* 
 * 删除按钮
 * 
 * 默认隐藏（opacity: 0）
 * 只有鼠标悬停在会话项上时才显示
 */
.delete-button {
  opacity: 0;
  
  display: flex;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 28px;
  
  background: transparent;
  border: none;
  
  color: var(--text-tertiary);
  
  border-radius: 6px;
  
  transition: var(--transition-fast);
  cursor: pointer;
}

/* 
 * 会话项悬停时显示删除按钮
 * 
 * 选择器：.conversation-item:hover .delete-button
 * 表示：当conversation-item被hover时，里面的delete-button
 */
.conversation-item:hover .delete-button {
  opacity: 1;
}

/* 删除按钮悬停效果 */
.delete-button:hover {
  background: rgba(239, 68, 68, 0.1);  /* 红色背景 */
  color: #f87171;  /* 红色文字 */
}

/* 侧边栏底部：用户信息 */
.sidebar-footer {
  padding: 16px;
  border-top: 1px solid var(--glass-border);
  display: flex;
  align-items: center;
  justify-content: space-between;
}

/* 用户信息区域 */
.user-info {
  display: flex;
  align-items: center;
  gap: 10px;
}

/* 
 * 用户头像
 * 
 * 显示用户名首字母
 * 渐变背景（蓝色到紫色）
 * 圆形
 */
.user-avatar {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  background: linear-gradient(135deg, var(--accent) 0%, #8b5cf6 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 14px;
  font-weight: 600;
  color: white;
}

/* 用户名 */
.user-name {
  font-size: 14px;
  color: var(--text-primary);
}

/* 退出按钮 */
.logout-button {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  
  background: transparent;
  border: none;
  
  color: var(--text-tertiary);
  
  border-radius: 8px;
  
  transition: var(--transition-fast);
  cursor: pointer;
}

/* 退出按钮悬停效果 */
.logout-button:hover {
  background: rgba(239, 68, 68, 0.1);
  color: #f87171;
}

/* ============================================
   中间聊天区域
   ============================================ */
.chat-main {
  /* 占满剩余空间 */
  flex: 1;
  
  /* 垂直flex布局 */
  display: flex;
  flex-direction: column;
  
  /* 防止内容溢出 */
  min-width: 0;
}

/* 消息列表容器 */
.messages-container {
  /* 占满剩余空间 */
  flex: 1;
  
  /* 垂直可滚动 */
  overflow-y: auto;
  
  padding: 24px;
}

/* 
 * 空状态
 * 
 * 没有消息时显示
 * 居中显示AI图标和提示文字
 */
.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100%;
  text-align: center;
}

/* 空状态图标 */
.empty-icon {
  width: 80px;
  height: 80px;
  border-radius: 24px;
  background: linear-gradient(135deg, var(--accent) 0%, #8b5cf6 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  margin-bottom: 24px;
}

/* 空状态标题 */
.empty-title {
  font-size: 24px;
  font-weight: 600;
  color: var(--text-primary);
  margin-bottom: 8px;
}

/* 空状态副标题 */
.empty-subtitle {
  font-size: 14px;
  color: var(--text-secondary);
}

/* 消息列表 */
.messages-list {
  /* 最大宽度800px，居中 */
  max-width: 800px;
  margin: 0 auto;
  
  /* 垂直排列 */
  display: flex;
  flex-direction: column;
  
  /* 消息之间的间距 */
  gap: 24px;
}

/* 单条消息 */
.message-item {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

/* 
 * 用户消息：右对齐
 * 方便和一目了然地看到哪个是我发送的消息
 */
.message-item.user {
  align-items: flex-end;
}

/* 
 * AI消息：左对齐
 */
.message-item.assistant {
  align-items: flex-start;
}

/* 
 * 消息内容容器 - 根据内容自适应宽度
 * 
 * 设计思路：
 * - 不设固定width，内容多宽气泡就多宽
 * - max-width: 75% 防止内容太长撑出屏幕
 * - 内容超过75%宽度时自动换行
 */
.message-content {
  max-width: 75%;
}

/* 
 * 用户消息样式
 * 
 * 设计思路：
 * - 蓝色半透明背景
 * - 右下角圆角小（4px），其他角圆角大（16px）
 * - 表示"气泡尾巴"在右下角
 */
.user-text {
  background: rgba(74, 158, 255, 0.1);
  border: 1px solid rgba(74, 158, 255, 0.2);
  padding: 12px 16px;
  border-radius: 16px 16px 4px 16px;
  color: var(--text-primary);
  font-size: 14px;
  line-height: 1.6;
}

/* 
 * AI消息样式
 * 
 * 设计思路：
 * - 半透明背景（更淡）
 * - 左下角圆角小（4px），其他角圆角大（16px）
 * - 表示"气泡尾巴"在左下角
 * - padding更大，留白更多（像文档）
 */
.assistant-text {
  background: var(--glass-bg);
  border: 1px solid var(--glass-border);
  padding: 16px 20px;
  border-radius: 16px 16px 16px 4px;
  color: var(--text-primary);
  font-size: 14px;
  line-height: 1.7;
}

/* 消息操作按钮 */
.message-actions {
  display: flex;
  gap: 4px;
  
  /* 默认隐藏 */
  opacity: 0;
  
  transition: var(--transition-fast);
}

/* 消息悬停时显示操作按钮 */
.message-item:hover .message-actions {
  opacity: 1;
}

/* 操作按钮样式 */
.action-button {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 28px;
  
  background: transparent;
  border: none;
  
  color: var(--text-tertiary);
  
  border-radius: 6px;
  
  transition: var(--transition-fast);
  cursor: pointer;
}

/* 操作按钮悬停效果 */
.action-button:hover {
  background: var(--glass-bg-hover);
  color: var(--text-primary);
}

/* 复制成功图标颜色：绿色 */
.copied-icon {
  color: #10b981;
}

/* 
 * 加载动画
 * 
 * 三个圆点依次跳动
 * 表示"AI正在思考"
 */
.loading {
  display: flex;
  gap: 4px;
  padding: 16px 20px;
}

.loading-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: var(--text-secondary);
  
  /* 
   * bounce动画
   * - 三个点依次跳动
   * - animation-delay：延迟时间，让它们错开
   */
  animation: bounce 1.4s infinite ease-in-out;
}

/* 每个点的延迟时间不同 */
.loading-dot:nth-child(1) { animation-delay: -0.32s; }
.loading-dot:nth-child(2) { animation-delay: -0.16s; }

@keyframes bounce {
  0%, 80%, 100% { transform: scale(0); }    /* 缩小 */
  40% { transform: scale(1); }              /* 放大 */
}

/* ============================================
   输入区域
   ============================================ */
.input-area {
  padding: 16px 24px 24px;
  background: var(--bg-primary);
}

/* 输入框容器 */
.input-wrapper {
  display: flex;
  align-items: flex-end;  /* 底部对齐（多行时） */
  gap: 12px;
  padding: 12px 16px;
  
  background: var(--glass-bg);
  border: 1px solid var(--glass-border);
  
  /* 大圆角24px */
  border-radius: var(--radius-lg);
  
  transition: var(--transition-fast);
}

/* 输入框聚焦效果 */
.input-wrapper:focus-within {
  border-color: var(--accent);
  box-shadow: 0 0 0 3px rgba(74, 158, 255, 0.1);
}

/* 输入框 */
.message-input {
  flex: 1;
  
  background: none;
  border: none;
  outline: none;
  
  font-size: 15px;
  color: var(--text-primary);
  font-family: inherit;
  line-height: 1.5;
  
  /* 允许调整大小（垂直方向） */
  resize: none;
  
  /* 最大高度200px */
  max-height: 200px;
}

/* 占位符颜色 */
.message-input::placeholder {
  color: var(--text-tertiary);
}

/* 
 * 发送按钮
 * 
 * 圆形，渐变背景
 * 和登录页面的按钮风格一致
 */
.send-button {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 40px;
  height: 40px;
  flex-shrink: 0;  /* 不允许缩小 */
  
  background: linear-gradient(135deg, var(--accent) 0%, #6366f1 100%);
  border: none;
  
  color: white;
  
  border-radius: 12px;
  
  box-shadow: 0 2px 8px rgba(74, 158, 255, 0.3);
  
  transition: var(--transition-fast);
  cursor: pointer;
}

/* 发送按钮悬停效果 */
.send-button:hover:not(:disabled) {
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(74, 158, 255, 0.4);
}

/* 发送按钮禁用状态 */
.send-button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
  transform: none;
  box-shadow: none;
}

/* 底部提示 */
.input-hint {
  text-align: center;
  font-size: 12px;
  color: var(--text-tertiary);
  margin-top: 12px;
}

/* ============================================
   右侧设置边栏
   ============================================ */
.settings-sidebar {
  width: 280px;
  flex-shrink: 0;
  
  background: var(--bg-secondary);
  border-left: 1px solid var(--glass-border);
  
  display: flex;
  flex-direction: column;
}

/* 设置标题 */
.settings-header {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 16px;
  border-bottom: 1px solid var(--glass-border);
  font-size: 14px;
  font-weight: 500;
  color: var(--text-primary);
}

/* 设置内容 */
.settings-content {
  padding: 16px;
  display: flex;
  flex-direction: column;
  gap: 20px;
}

/* 设置组 */
.setting-group {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

/* 设置标签 */
.setting-label {
  font-size: 13px;
  color: var(--text-secondary);
}

/* 下拉框容器 */
.select-wrapper {
  position: relative;
}

/* 下拉框样式 */
.setting-select {
  width: 100%;
  height: 40px;
  padding: 0 32px 0 12px;
  
  background: var(--glass-bg);
  border: 1px solid var(--glass-border);
  border-radius: var(--radius-sm);
  
  color: var(--text-primary);
  font-size: 14px;
  font-family: inherit;
  
  /* 隐藏默认下拉箭头 */
  appearance: none;
  cursor: pointer;
  transition: var(--transition-fast);
}

.setting-select:hover {
  border-color: rgba(255, 255, 255, 0.12);
}

/* 自定义下拉箭头 */
.select-icon {
  position: absolute;
  right: 12px;
  top: 50%;
  transform: translateY(-50%);
  color: var(--text-tertiary);
  pointer-events: none;  /* 不阻挡点击 */
}

/* 滑块容器 */
.slider-wrapper {
  display: flex;
  align-items: center;
  gap: 12px;
}

/* 滑块样式 */
.setting-slider {
  flex: 1;
  height: 4px;
  background: var(--glass-bg);
  border-radius: 2px;
  
  /* 隐藏默认样式 */
  appearance: none;
  cursor: pointer;
}

/* 滑块手柄 */
.setting-slider::-webkit-slider-thumb {
  appearance: none;
  width: 16px;
  height: 16px;
  border-radius: 50%;
  background: var(--accent);
  box-shadow: 0 2px 8px rgba(74, 158, 255, 0.3);
}

/* 滑块数值 */
.slider-value {
  font-size: 13px;
  color: var(--text-secondary);
  min-width: 24px;
}

/* ============================================
   代码块样式（用于AI回复中的代码）
   ============================================ */
/* 
 * :deep()：深度选择器
 * 
 * 为什么需要？
 * 因为代码块是通过v-html渲染的
 * 不在当前组件的scoped样式范围内
 * 用:deep()可以穿透scoped样式
 */
:deep(.code-block) {
  background: var(--bg-tertiary);
  border: 1px solid var(--glass-border);
  border-radius: var(--radius-sm);
  padding: 16px;
  margin: 12px 0;
  overflow-x: auto;
  font-family: 'JetBrains Mono', monospace;
  font-size: 13px;
  line-height: 1.5;
}

:deep(.code-block code) {
  color: var(--text-primary);
}
</style>
