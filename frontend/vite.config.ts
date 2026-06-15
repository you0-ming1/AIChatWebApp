/**
 * vite.config.ts - Vite构建工具配置
 * 
 * ============================================
 * 文件作用
 * ============================================
 * 
 * Vite是Vue官方推荐的构建工具
 * 这个文件配置Vite的行为：
 * 1. 插件配置（Vue支持、TailwindCSS）
 * 2. 开发服务器配置（端口、代理）
 * 3. 构建配置（打包选项）
 * 
 * ============================================
 * 为什么需要代理？
 * ============================================
 * 
 * 问题：
 * - 前端运行在 http://localhost:3000
 * - 后端运行在 http://localhost:5000
 * - 浏览器会阻止跨域请求（不同端口=不同源）
 * 
 * 解决方案：
 * - 在Vite中配置代理
 * - 所以/api开头的请求，转发到后端
 * - 前端和后端看起来像是同一个端口
 * 
 * 流程：
 * 前端请求 /api/user/login
 *   ↓
 * Vite代理转发到 http://localhost:5000/api/user/login
 *   ↓
 * 后端处理请求
 *   ↓
 * Vite把响应返回给前端
 */

import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

// https://vite.dev/config/
export default defineConfig({
  /**
   * plugins：插件列表
   * 
   * vue()：Vue3支持插件
   * - 支持.vue文件
   * - 支持JSX/TSX
   * - 支持热更新（HMR）
   */
  plugins: [
    vue(),
  ],
  
  /**
   * server：开发服务器配置
   */
  server: {
    /**
     * port：前端运行端口
     * 
     * 默认是5173
     * 改成3000，更常用
     */
    port: 3000,
    
    /**
     * proxy：API代理配置
     * 
     * 解决跨域问题
     * 
     * '/api'：匹配所有以/api开头的请求
     * 
     * target：转发目标地址
     * 你的后端服务器地址
     * 
     * changeOrigin：修改请求头中的Host
     * 改为后端服务器的Host
     */
    proxy: {
      '/api': {
        target: 'http://localhost:5000',
        changeOrigin: true,
      }
    }
  }
})
