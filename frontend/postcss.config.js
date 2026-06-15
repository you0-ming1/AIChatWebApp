/**
 * postcss.config.js - PostCSS配置
 * 
 * ============================================
 * 文件作用
 * ============================================
 * 
 * PostCSS是一个CSS处理工具
 * 可以在CSS编译过程中进行转换
 * 
 * 这里配置了两个插件：
 * 1. tailwindcss：处理TailwindCSS的工具类
 * 2. autoprefixer：自动添加CSS前缀
 * 
 * ============================================
 * 处理流程
 * ============================================
 * 
 * .css文件
 *   ↓
 * tailwindcss：展开@tailwind指令，生成工具类
 *   ↓
 * autoprefixer：根据browserslist添加前缀
 *   ↓
 * 最终CSS
 * 
 * ============================================
 * 为什么需要autoprefixer？
 * ============================================
 * 
 * 不同浏览器对CSS的支持不同
 * 比如flex布局：
 * - Chrome/Safari：display: flex
 * - 老版本IE：display: -webkit-box
 * 
 * autoprefixer会自动添加这些前缀
 * 让CSS兼容更多浏览器
 */

export default {
  plugins: {
    // TailwindCSS插件
    // 处理@tailwind指令和工具类
    tailwindcss: {},
    
    // 自动前缀插件
    // 根据browserslist配置添加浏览器前缀
    autoprefixer: {},
  },
}
