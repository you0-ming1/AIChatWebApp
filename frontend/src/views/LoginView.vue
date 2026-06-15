<script setup lang="ts">
/**
 * LoginView.vue - 登录/注册页面
 * 
 * ============================================
 * 页面功能
 * ============================================
 * 
 * 这个页面提供两个功能：
 * 1. 登录：输入用户名和密码，验证身份后进入聊天页面
 * 2. 注册：创建新账号，然后自动切换到登录模式
 * 
 * ============================================
 * 设计思路
 * ============================================
 * 
 * Apple风格设计原则：
 * - 极简：页面只有一个卡片，没有多余元素
 * - 克制：颜色柔和，不刺眼
 * - 留白：元素之间有呼吸感
 * - 圆润：所有圆角统一（28px）
 * - 丝滑：动效柔和（0.2s ease）
 * 
 * 页面结构：
 * - 背景装饰（渐变圆形，增加层次感）
 * - 登录卡片（半透明玻璃效果）
 *   - Logo区域（图标+标题+副标题）
 *   - 表单区域（用户名、邮箱、密码）
 *   - 提交按钮
 *   - 切换登录/注册
 * 
 * ============================================
 * 技术实现
 * ============================================
 * 
 * - Vue3 Composition API（setup语法糖）
 * - axios 发送HTTP请求
 * - vue-router 页面跳转
 * - Lucide Icons 图标库
 */

import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { Mail, Lock, ArrowRight, Sparkles } from 'lucide-vue-next'
import axios from 'axios'

// ============================================
// 路由实例
// ============================================
/**
 * useRouter：获取路由实例
 * 用于页面跳转，比如登录成功后跳转到聊天页面
 */
const router = useRouter()

// ============================================
// 表单数据（响应式变量）
// ============================================

/**
 * isLogin：控制当前是登录模式还是注册模式
 * - true = 登录模式（只显示用户名+密码）
 * - false = 注册模式（显示用户名+邮箱+密码）
 * 
 * 为什么用ref？
 * 因为Vue3的响应式系统需要ref来追踪数据变化
 * 当isLogin变化时，页面会自动更新
 */
const isLogin = ref(true)

/**
 * username：用户名输入框的值
 * 绑定到 input 的 v-model
 */
const username = ref('')

/**
 * password：密码输入框的值
 * 绑定到 input 的 v-model
 */
const password = ref('')

/**
 * email：邮箱输入框的值（仅注册模式显示）
 * 绑定到 input 的 v-model
 */
const email = ref('')

/**
 * loading：是否正在提交表单
 * 用于禁用按钮和显示加载动画
 */
const loading = ref(false)

/**
 * errorMsg：错误提示信息
 * 当提交失败时显示，成功时清空
 */
const errorMsg = ref('')

// ============================================
// 业务函数
// ============================================

/**
 * toggleMode：切换登录/注册模式
 * 
 * 点击"立即注册"或"返回登录"时调用
 * 同时清空错误信息
 */
const toggleMode = () => {
  isLogin.value = !isLogin.value
  errorMsg.value = ''
}

/**
 * handleSubmit：提交表单（登录或注册）
 * 
 * 执行流程：
 * 1. 验证表单数据
 * 2. 发送HTTP请求到后端
 * 3. 根据响应结果处理：
 *    - 登录成功：保存token，跳转到聊天页面
 *    - 注册成功：切换到登录模式
 *    - 失败：显示错误信息
 */
const handleSubmit = async () => {
  // 清空之前的错误信息
  errorMsg.value = ''
  
  // ----------------------------------------
  // 第1步：验证表单数据
  // ----------------------------------------
  
  /**
   * 验证用户名和密码是否为空
   * 如果为空，显示错误信息，阻止提交
   */
  if (!username.value || !password.value) {
    errorMsg.value = '请填写用户名和密码'
    return
  }
  
  /**
   * 注册模式下，验证密码长度
   * 密码至少6个字符，否则不安全
   */
  if (!isLogin.value && password.value.length < 6) {
    errorMsg.value = '密码至少需要6个字符'
    return
  }
  
  // ----------------------------------------
  // 第2步：发送HTTP请求
  // ----------------------------------------
  
  /**
   * 设置loading状态为true
   * - 按钮变为禁用状态
   * - 显示加载动画
   */
  loading.value = true
  
  try {
    /**
     * 根据模式选择不同的接口地址
     * - 登录：POST /api/user/login
     * - 注册：POST /api/user/register
     */
    const endpoint = isLogin.value ? '/api/user/login' : '/api/user/register'
    
    /**
     * 构建请求体
     * axios会自动将对象转换为JSON字符串
     */
    const payload: any = {
      username: username.value,
      password: password.value
    }
    
    /**
     * 注册模式下，如果有邮箱，添加到请求体
     */
    if (!isLogin.value && email.value) {
      payload.email = email.value
    }
    
    /**
     * 发送POST请求
     * 
     * axios.post() 返回一个Promise
     * await 等待请求完成
     * 
     * 注意：这里用的是相对路径 /api/user/login
     * Vite会自动代理到 http://localhost:5000/api/user/login
     * （配置在 vite.config.ts 的 proxy 中）
     */
    const response = await axios.post(endpoint, payload)
    
    // ----------------------------------------
    // 第3步：处理响应
    // ----------------------------------------
    
    /**
     * 检查后端返回的success字段
     * 后端格式：{ success: true/false, message: "...", data: {...} }
     */
    if (response.data.success) {
      if (isLogin.value) {
        // ========================================
        // 登录成功
        // ========================================
        
        /**
         * 保存token到本地存储
         * 
         * 为什么要保存？
         * 因为后续每次请求都需要带上token
         * 浏览器刷新后token会丢失，所以要持久化存储
         * 
         * localStorage：浏览器本地存储
         * - 关闭浏览器后数据仍在
         * - 同源页面可以共享
         */
        localStorage.setItem('token', response.data.data.token)
        
        /**
         * 保存用户信息到本地存储
         * 用于在聊天页面显示用户名、头像等
         */
        localStorage.setItem('user', JSON.stringify(response.data.data.user))
        
        /**
         * 跳转到聊天页面
         * router.push() 类似于 <a href="/chat">
         * 但它是前端路由，不会重新加载页面
         */
        router.push('/chat')
        
      } else {
        // ========================================
        // 注册成功
        // ========================================
        
        /**
         * 注册成功后：
         * 1. 切换到登录模式
         * 2. 提示用户去登录
         * 
         * 为什么不自动登录？
         * 因为注册和登录是分开的流程
         * 注册后让用户手动登录，更符合安全规范
         */
        isLogin.value = true
        errorMsg.value = ''
        alert('注册成功！请登录')
      }
    } else {
      // ========================================
      // 请求成功但业务失败
      // ========================================
      
      /**
       * 后端返回 success: false
       * 比如：用户名已存在、密码错误等
       * 显示后端返回的错误信息
       */
      errorMsg.value = response.data.message || '操作失败'
    }
    
  } catch (error: any) {
    // ========================================
    // 请求失败（网络错误、服务器错误等）
    // ========================================
    
    /**
     * error.response：后端返回的错误响应
     * error.response.data.message：后端返回的错误信息
     * 
       * 如果没有response（比如网络断开），显示通用错误信息
       */
    errorMsg.value = error.response?.data?.message || '网络错误，请稍后重试'
    
  } finally {
    // ========================================
    // 无论成功或失败，都要执行
    // ========================================
    
    /**
     * 关闭loading状态
     * - 恢复按钮可点击状态
     * - 隐藏加载动画
     * 
     * finally：不管try里的代码是否报错，都会执行
     */
    loading.value = false
  }
}
</script>

<template>
  <!-- ============================================
       页面容器
       ============================================ -->
  <!-- 
    登录页面的最外层容器
    - flex布局：垂直居中
    - min-height: 100vh：占满整个屏幕高度
    - position: relative：为背景装饰提供定位参考
    - overflow: hidden：隐藏超出屏幕的装饰元素
  -->
  <div class="login-container">
    
    <!-- ============================================
         背景装饰
         ============================================ -->
    <!--
      背景装饰圆形
      - 作用：增加页面层次感和高级感
      - 实现：两个半透明渐变圆形，放在右上角和左下角
      - pointer-events: none：不阻挡用户点击
    -->
    <div class="bg-decoration"></div>
    <div class="bg-gradient"></div>
    
    <!-- ============================================
         登录卡片
         ============================================ -->
    <!--
      登录卡片是页面的核心
      - 半透明玻璃效果（backdrop-filter: blur）
      - 大圆角（28px）
      - 微弱边框和阴影
      - hover时轻微上浮（translateY(-2px)）
    -->
    <div class="login-card">
      
      <!-- Logo区域 -->
      <div class="logo-section">
        <!-- Logo图标：渐变背景 + 阴影 -->
        <div class="logo-icon">
          <Sparkles :size="32" />
        </div>
        <!-- 标题：大字体、粗体 -->
        <h1 class="logo-title">AI Chat</h1>
        <!-- 副标题：小字体、柔和颜色 -->
        <p class="logo-subtitle">智能对话，无限可能</p>
      </div>
      
      <!-- 表单区域 -->
      <!-- @submit.prevent：阻止表单默认提交行为（页面刷新） -->
      <form @submit.prevent="handleSubmit" class="form-section">
        
        <!-- 用户名输入框 -->
        <div class="input-group">
          <div class="input-wrapper">
            <!-- 图标：邮件图标（虽然用户名不是邮箱，但样式统一） -->
            <Mail :size="18" class="input-icon" />
            <!-- 输入框 -->
            <!-- v-model：双向绑定，输入时自动更新username变量 -->
            <!-- autocomplete="username"：浏览器自动填充提示 -->
            <input
              v-model="username"
              type="text"
              placeholder="用户名"
              class="input-field"
              autocomplete="username"
            />
          </div>
        </div>
        
        <!-- 邮箱输入框（仅注册模式显示） -->
        <!-- v-if="!isLogin"：条件渲染，登录模式下不显示 -->
        <div v-if="!isLogin" class="input-group">
          <div class="input-wrapper">
            <Mail :size="18" class="input-icon" />
            <input
              v-model="email"
              type="email"
              placeholder="邮箱（选填）"
              class="input-field"
              autocomplete="email"
            />
          </div>
        </div>
        
        <!-- 密码输入框 -->
        <div class="input-group">
          <div class="input-wrapper">
            <!-- 锁图标：表示这是密码 -->
            <Lock :size="18" class="input-icon" />
            <!-- type="password"：输入内容显示为圆点 -->
            <input
              v-model="password"
              type="password"
              placeholder="密码"
              class="input-field"
              autocomplete="current-password"
            />
          </div>
        </div>
        
        <!-- 错误提示 -->
        <!-- v-if="errorMsg"：只有 errorMsg 不为空时才显示 -->
        <div v-if="errorMsg" class="error-message">
          {{ errorMsg }}
        </div>
        
        <!-- 提交按钮 -->
        <button 
          type="submit" 
          class="submit-button"
          :disabled="loading"
        >
          <!-- 加载动画（三个跳动的点） -->
          <span v-if="loading" class="loading-spinner"></span>
          <!-- 按钮文字 -->
          <span v-else>{{ isLogin ? '登录' : '注册' }}</span>
          <!-- 箭头图标（加载时隐藏） -->
          <ArrowRight v-if="!loading" :size="18" class="button-icon" />
        </button>
      </form>
      
      <!-- 切换登录/注册 -->
      <div class="switch-section">
        <span class="switch-text">
          {{ isLogin ? '还没有账号？' : '已有账号？' }}
        </span>
        <button @click="toggleMode" class="switch-button">
          {{ isLogin ? '立即注册' : '返回登录' }}
        </button>
      </div>
      
      <!-- 底部装饰线：渐变蓝色线条 -->
      <div class="bottom-decoration"></div>
    </div>
    
    <!-- 版权信息 -->
    <div class="copyright">
      © 2026 AI Chat · Powered by MiMo
    </div>
  </div>
</template>

<style scoped>
/* ============================================
   登录页面容器
   ============================================ */
.login-container {
  /* 
   * Flex布局：垂直和水平居中
   * flex-direction: column：子元素垂直排列
   * justify-content: center：垂直居中
   * align-items: center：水平居中
   */
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  
  /* 
   * min-height: 100vh
   * vh = viewport height（视口高度）
   * 100vh = 整个浏览器窗口的高度
   * 确保页面至少占满一屏
   */
  min-height: 100vh;
  
  /* 内边距：防止内容贴边 */
  padding: 20px;
  
  /* 定位上下文：为背景装饰提供参考 */
  position: relative;
  
  /* 隐藏超出屏幕的装饰元素 */
  overflow: hidden;
  
  /* 
   * 背景色：深色主题
   * var(--bg-primary)：引用CSS变量
   * 定义在 style.css 的 :root 中
   */
  background: var(--bg-primary);
}

/* 
 * 背景装饰圆形（右上角）
 * 
 * 设计目的：
 * - 增加页面层次感
 * - 打破纯色背景的单调
 * - 营造高级感
 * 
 * 实现原理：
 * - 600px的圆形
 * - radial-gradient：径向渐变，从中心向外渐变
 * - rgba(74, 158, 255, 0.08)：蓝色，8%透明度（很淡）
 * - transparent：渐变到完全透明
 */
.bg-decoration {
  position: absolute;
  width: 600px;
  height: 600px;
  border-radius: 50%;  /* 正圆 */
  background: radial-gradient(circle, rgba(74, 158, 255, 0.08) 0%, transparent 70%);
  top: -200px;  /* 超出屏幕顶部 */
  right: -200px;  /* 超出屏幕右侧 */
  pointer-events: none;  /* 不阻挡用户点击 */
}

/* 背景装饰圆形（左下角） */
.bg-gradient {
  position: absolute;
  width: 500px;
  height: 500px;
  border-radius: 50%;
  background: radial-gradient(circle, rgba(139, 92, 246, 0.06) 0%, transparent 70%);
  bottom: -150px;
  left: -150px;
  pointer-events: none;
}

/* ============================================
   登录卡片
   ============================================ */
.login-card {
  /* 
   * 宽度：最大400px，响应式
   * width: 100%：小屏幕时占满宽度
   * max-width: 400px：大屏幕时最大400px
   */
  width: 100%;
  max-width: 400px;
  
  /* 内边距：上下48px，左右40px */
  padding: 48px 40px;
  
  /* 
   * 半透明玻璃效果
   * 
   * 原理：
   * 1. background: rgba(255,255,255,0.04)：4%透明度的白色背景
   * 2. backdrop-filter: blur(20px)：模糊背后的内容
   * 3. -webkit-...：兼容Safari浏览器
   * 
   * 效果：类似磨砂玻璃，能看到模糊的背景
   */
  background: var(--glass-bg);
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
  
  /* 
   * 圆角：28px（大圆角）
   * Apple风格的标志性设计
   */
  border-radius: var(--radius-xl);
  
  /* 
   * 边框：8%透明度的白色
   * 非常微弱，几乎看不到，但能增加层次感
   */
  border: 1px solid var(--glass-border);
  
  /* 
   * 阴影：很轻的阴影
   * 不是那种很重的黑色阴影
   */
  box-shadow: var(--shadow-lg);
  
  /* 定位层级：在背景装饰之上 */
  position: relative;
  z-index: 1;
  
  /* 
   * 动效：hover时的过渡效果
   * all：所有属性都参与过渡
   * 0.3s：过渡时间300毫秒
   * cubic-bezier(0.4, 0, 0.2, 1)：Apple风格的缓动曲线
   */
  transition: var(--transition-slow);
}

/* 
 * 卡片悬停效果
 * 
 * translateY(-2px)：向上移动2像素
 * 产生"悬浮"的感觉
 * 
 * 阴影加深：从shadow-lg变为更重的阴影
 */
.login-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 12px 48px rgba(0, 0, 0, 0.2);
}

/* ============================================
   Logo区域
   ============================================ */
.logo-section {
  text-align: center;  /* 文字居中 */
  margin-bottom: 40px;  /* 与表单的间距 */
}

.logo-icon {
  /* 
   * inline-flex：行内弹性布局
   * 既能设置宽高，又不会独占一行
   */
  display: inline-flex;
  justify-content: center;
  align-items: center;
  
  /* 图标容器大小 */
  width: 64px;
  height: 64px;
  
  /* 圆角：20px */
  border-radius: 20px;
  
  /* 
   * 渐变背景：从蓝色到紫色
   * linear-gradient(135deg, ...): 135度角的线性渐变
   */
  background: linear-gradient(135deg, var(--accent) 0%, #8b5cf6 100%);
  
  /* 阴影：蓝色调的阴影 */
  box-shadow: 0 4px 20px rgba(74, 158, 255, 0.3);
  
  color: white;  /* 图标颜色 */
  
  transition: var(--transition-normal);
}

/* 
 * Logo悬停效果
 * scale(1.05)：放大到105%
 * rotate(5deg)：旋转5度
 * 产生"活泼"的感觉
 */
.logo-icon:hover {
  transform: scale(1.05) rotate(5deg);
}

/* 标题 */
.logo-title {
  font-size: 28px;
  font-weight: 600;  /* 半粗体 */
  color: var(--text-primary);
  margin-top: 20px;
  letter-spacing: -0.5px;  /* 字间距稍微收紧，更紧凑 */
}

/* 副标题 */
.logo-subtitle {
  font-size: 14px;
  color: var(--text-secondary);  /* 柔和的灰色 */
  margin-top: 8px;
}

/* ============================================
   表单区域
   ============================================ */
.form-section {
  display: flex;
  flex-direction: column;  /* 垂直排列 */
  gap: 16px;  /* 每个输入框之间的间距 */
}

.input-group {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

/* 
 * 输入框容器
 * 
 * 设计思路：
 * - 不用传统的input边框
 * - 用一个容器包裹图标和输入框
 * - focus时改变容器的背景和边框
 */
.input-wrapper {
  display: flex;
  align-items: center;  /* 垂直居中 */
  gap: 12px;  /* 图标和输入框的间距 */
  padding: 0 16px;  /* 左右内边距 */
  height: 52px;  /* 固定高度 */
  
  /* 背景：4%透明度的白色 */
  background: rgba(255, 255, 255, 0.04);
  
  /* 圆角：16px */
  border-radius: var(--radius-md);
  
  /* 边框：默认透明 */
  border: 1px solid transparent;
  
  transition: var(--transition-fast);
}

/* 
 * 输入框聚焦状态
 * 
 * :focus-within：当容器内的input获得焦点时
 * 
 * 效果：
 * 1. 背景变亮（6%透明度）
 * 2. 边框变蓝
 * 3. 外发光（box-shadow）
 */
.input-wrapper:focus-within {
  background: rgba(255, 255, 255, 0.06);
  border-color: var(--accent);
  box-shadow: 0 0 0 3px rgba(74, 158, 255, 0.1);
}

/* 图标颜色：柔和的灰色 */
.input-icon {
  color: var(--text-tertiary);
  flex-shrink: 0;  /* 不允许缩小 */
}

/* 
 * 输入框样式
 * 
 * 关键：去掉所有默认样式
 * - background: none：透明背景
 * - border: none：无边框
 * - outline: none：无焦点轮廓
 * 
 * 这样输入框就完全融入容器
 */
.input-field {
  flex: 1;  /* 占满剩余空间 */
  background: none;
  border: none;
  outline: none;
  font-size: 15px;
  color: var(--text-primary);
  font-family: inherit;  /* 继承父元素字体 */
}

/* 占位符颜色：柔和的灰色 */
.input-field::placeholder {
  color: var(--text-tertiary);
}

/* ============================================
   错误提示
   ============================================ */
.error-message {
  /* 背景：红色，10%透明度 */
  padding: 12px 16px;
  background: rgba(239, 68, 68, 0.1);
  border: 1px solid rgba(239, 68, 68, 0.2);
  border-radius: var(--radius-sm);
  color: #f87171;  /* 柔和的红色 */
  font-size: 13px;
  text-align: center;
}

/* ============================================
   提交按钮
   ============================================ */
.submit-button {
  /* 居中显示 */
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 8px;
  width: 100%;  /* 全宽 */
  height: 52px;
  margin-top: 8px;
  
  /* 
   * 渐变背景：蓝色到紫色
   * 和Logo图标一样的渐变，保持一致
   */
  background: linear-gradient(135deg, var(--accent) 0%, #6366f1 100%);
  
  color: white;
  font-size: 15px;
  font-weight: 500;
  
  border-radius: var(--radius-md);
  border: none;
  
  /* 阴影：蓝色调 */
  box-shadow: 0 4px 16px rgba(74, 158, 255, 0.3);
  
  transition: var(--transition-normal);
  cursor: pointer;
}

/* 
 * 按钮悬停效果
 * 
 * translateY(-1px)：向上1像素
 * 阴影加深
 * 
 * :not(:disabled)：只有不禁用时才生效
 */
.submit-button:hover:not(:disabled) {
  transform: translateY(-1px);
  box-shadow: 0 6px 24px rgba(74, 158, 255, 0.4);
}

/* 按钮按下效果 */
.submit-button:active:not(:disabled) {
  transform: translateY(0);
}

/* 禁用状态 */
.submit-button:disabled {
  opacity: 0.7;  /* 半透明 */
  cursor: not-allowed;  /* 禁止点击光标 */
}

/* 箭头图标：hover时向右移动 */
.button-icon {
  transition: var(--transition-fast);
}

.submit-button:hover:not(:disabled) .button-icon {
  transform: translateX(4px);
}

/* 
 * 加载动画
 * 
 * 原理：一个圆圈不断旋转
 * border：只有上边框是白色，其他是半透明
 * animation：每0.8秒旋转一圈
 */
.loading-spinner {
  width: 20px;
  height: 20px;
  border: 2px solid rgba(255, 255, 255, 0.3);
  border-top-color: white;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

/* ============================================
   切换登录/注册
   ============================================ */
.switch-section {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 8px;
  margin-top: 24px;
}

.switch-text {
  font-size: 14px;
  color: var(--text-secondary);
}

/* 切换按钮：无背景、无边框 */
.switch-button {
  background: none;
  border: none;
  color: var(--accent);  /* 蓝色 */
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: var(--transition-fast);
}

.switch-button:hover {
  color: var(--accent-hover);  /* 更亮的蓝色 */
}

/* ============================================
   底部装饰线
   ============================================ */
.bottom-decoration {
  position: absolute;
  bottom: 0;
  left: 50%;
  transform: translateX(-50%);  /* 水平居中 */
  width: 60%;
  height: 2px;
  /* 渐变：从透明到蓝色再到透明 */
  background: linear-gradient(90deg, transparent, rgba(74, 158, 255, 0.3), transparent);
  border-radius: 1px;
}

/* ============================================
   版权信息
   ============================================ */
.copyright {
  position: absolute;
  bottom: 24px;
  font-size: 12px;
  color: var(--text-tertiary);
}
</style>
