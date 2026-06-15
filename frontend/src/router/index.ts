/**
 * router/index.ts - 路由配置文件
 * 
 * ============================================
 * 文件作用
 * ============================================
 * 
 * 这个文件定义了应用的所有页面地址（路由）
 * 
 * 什么是路由？
 * 就像网站的"地址簿"：
 * - /login → 显示登录页面
 * - /chat → 显示聊天页面
 * - /settings → 显示设置页面
 * 
 * 用户访问不同的URL，显示不同的页面
 * 但不会重新加载整个页面（单页应用SPA）
 * 
 * ============================================
 * 核心概念
 * ============================================
 * 
 * 1. 路由表（routes）
 *    定义URL和组件的映射关系
 *    比如：/login 对应 LoginView.vue
 * 
 * 2. 路由守卫（beforeEach）
 *    在每次路由跳转前执行
 *    用于检查登录状态
 * 
 * 3. 懒加载（lazy loading）
 *    用 () => import(...) 语法
 *    页面组件在需要时才加载，提高首屏速度
 */

import { createRouter, createWebHistory } from 'vue-router'

/**
 * createRouter：创建路由实例
 * 
 * 参数：配置对象
 * - history：路由模式
 * - routes：路由表
 */
const router = createRouter({
  /**
   * createWebHistory：HTML5 History模式
   * 
   * URL格式：http://localhost:3000/login
   * 
   * 为什么不用Hash模式？
   * Hash模式URL格式：http://localhost:3000/#/login
   * History模式更美观，更像传统网站
   */
  history: createWebHistory(),
  
  /**
   * 路由表
   * 
   * 每个路由对象包含：
   * - path：URL地址
   * - name：路由名称（可选，用于编程式导航）
   * - component：对应的Vue组件
   * - meta：元信息（可选，自定义数据）
   * - redirect：重定向（可选）
   */
  routes: [
    {
      /**
       * 根路径 / → 重定向到 /login
       * 
       * 用户访问 http://localhost:3000/ 时
       * 自动跳转到 http://localhost:3000/login
       */
      path: '/',
      redirect: '/login'
    },
    {
      /**
       * 登录页面
       * 
       * path: '/login'：URL地址
       * name: 'Login'：路由名称（用于 router.push({ name: 'Login' })）
       * component: () => import(...)：懒加载LoginView组件
       */
      path: '/login',
      name: 'Login',
      /**
       * 懒加载语法
       * 
       * () => import('../views/LoginView.vue')
       * 
       * 作用：
       * - LoginView.vue 只有在访问 /login 时才会加载
       * - 不会打包到主包里，减小首屏加载体积
       * 
       * 对比：
       * - import LoginView from '../views/LoginView.vue'（顶部导入）
       *   → 所有页面组件会打包在一起，首屏加载慢
       */
      component: () => import('../views/LoginView.vue')
    },
    {
      /**
       * 聊天页面
       * 
       * meta: { requiresAuth: true }
       * 表示这个页面需要登录才能访问
       * 路由守卫会检查这个标志
       */
      path: '/chat',
      name: 'Chat',
      component: () => import('../views/ChatView.vue'),
      meta: { requiresAuth: true }
    }
  ]
})

/**
 * 路由守卫（全局前置守卫）
 * 
 * beforeEach：在每次路由跳转前执行
 * 
 * 参数：
 * - to：即将进入的路由（目标页面）
 * - from：即将离开的路由（当前页面）
 * - next：放行函数（必须调用）
 * 
 * 执行流程：
 * 1. 用户点击链接或调用 router.push()
 * 2. beforeEach 被触发
 * 3. 检查登录状态
 * 4. 决定放行、跳转登录页、或跳转聊天页
 */
router.beforeEach((to, from, next) => {
  /**
   * 获取token
   * 
   * localStorage：浏览器本地存储
   * - 关闭浏览器后数据仍在
   * - 登录时保存，退出时删除
   */
  const token = localStorage.getItem('token')
  
  /**
   * 检查是否需要登录
   * 
   * to.meta.requiresAuth：目标页面是否需要认证
   * 如果为true，检查是否有token
   */
  if (to.meta.requiresAuth && !token) {
    /**
     * 需要登录但没有token
     * 跳转到登录页
     */
    next('/login')
    
  } else if (to.path === '/login' && token) {
    /**
     * 已登录但访问登录页
     * 跳转到聊天页（不需要重复登录）
     */
    next('/chat')
    
  } else {
    /**
     * 其他情况：正常放行
     * 
     * next()：不带参数表示放行
     * next('/other')：带参数表示跳转到指定页面
     */
    next()
  }
})

export default router
