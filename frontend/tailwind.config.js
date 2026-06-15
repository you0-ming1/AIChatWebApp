/**
 * tailwind.config.js - TailwindCSS配置
 * 
 * ============================================
 * 文件作用
 * ============================================
 * 
 * TailwindCSS是一个CSS框架
 * 提供大量工具类，快速写样式
 * 
 * 比如：
 * - flex → display: flex
 * - text-center → text-align: center
 * - p-4 → padding: 1rem
 * - bg-blue-500 → background: blue
 * 
 * 这个文件配置Tailwind的行为：
 * 1. 内容扫描路径（哪些文件用到了Tailwind类）
 * 2. 主题配置（颜色、字体、间距等）
 * 3. 插件配置
 * 
 * ============================================
 * 为什么需要content配置？
 * ============================================
 * 
 * Tailwind会扫描content中指定的文件
 * 找到所有使用的工具类
 * 只打包用到的CSS，减小体积
 * 
 * 如果不配置，Tailwind不知道扫描哪些文件
 * 就不会生成任何样式
 */

export default {
  /**
   * content：内容扫描路径
   * 
   * 告诉Tailwind扫描这些文件
   * 查找所有使用的Tailwind类
   */
  content: [
    // index.html文件
    "./index.html",
    // src目录下所有.vue/.js/.ts/.jsx/.tsx文件
    "./src/**/*.{vue,js,ts,jsx,tsx}",
  ],
  
  /**
   * theme：主题配置
   * 
   * 可以自定义颜色、字体、间距等
   * 这里用默认配置
   */
  theme: {
    extend: {},
  },
  
  /**
   * plugins：插件列表
   * 
   * 可以添加官方或第三方插件
   * 比如：
   * - @tailwindcss/forms：表单样式重置
   * - @tailwindcss/typography：排版样式
   * - tailwind-scrollbar：滚动条美化
   */
  plugins: [],
}
