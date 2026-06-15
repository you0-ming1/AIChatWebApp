/**
 * main.ts - 应用入口文件
 * 
 * ============================================
 * 文件作用
 * ============================================
 * 
 * 这是整个前端应用的入口点
 * 
 * 执行流程：
 * 1. 浏览器加载 index.html
 * 2. index.html 引入 main.ts
 * 3. main.ts 创建Vue应用实例
 * 4. 挂载到 #app 元素
 * 5. 页面显示
 * 
 * ============================================
 * 做了什么
 * ============================================
 * 
 * 1. 创建Vue应用实例
 * 2. 引入全局样式（style.css）
 * 3. 引入路由（router）
 * 4. 挂载应用到DOM
 */

import { createApp } from 'vue'
import './style.css'
import App from './App.vue'
import router from './router'

/**
 * createApp：创建Vue应用实例
 * 
 * 参数：根组件（App.vue）
 * 
 * 返回：应用实例（app对象）
 * 
 * 对比Vue2：
 * - Vue2：new Vue({ router, render: h => h(App) }).$mount('#app')
 * - Vue3：createApp(App).use(router).mount('#app')
 * - Vue3更简洁
 */
const app = createApp(App)

/**
 * app.use(router)：注册路由插件
 * 
 * 作用：
 * 1. 在所有组件中注入 $router 和 $route
 * 2. 使 <router-view> 和 <router-link> 可用
 * 3. 启用路由守卫
 */
app.use(router)

/**
 * app.mount('#app')：挂载应用
 * 
 * 参数：DOM选择器
 * 
 * 作用：
 * 1. 将Vue应用渲染到 #app 元素
 * 2. 替换 #app 的内容
 * 
 * 对应 index.html 中的：
 * <div id="app"></div>
 */
app.mount('#app')
