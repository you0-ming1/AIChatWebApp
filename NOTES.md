# 学习笔记

> 次要学习材料，主要看项目注释
> 这里只记录代码注释不方便写的东西

---

## 为什么选 Express 不选原生 Node？

原生Node写服务器要手动解析URL、设置响应头，很麻烦。

Express帮你处理底层细节，让你专注业务逻辑。

就像开车不用造轮子。

---

## SQL注入是什么？

攻击者输入恶意SQL，让查询返回所有数据。

比如登录时输入 `' OR '1'='1`，就能绕过密码验证。

**防止方法：** 用参数化查询（`?`占位符），不要直接拼接字符串。

---

## 连接池是什么？

预先创建一批数据库连接，用完放回去复用。

像共享单车，不用每次都新造一辆。

好处：快、省资源、不会打爆数据库。

---

## 前后端联调流程

```
前端发请求 → Express接收 → 中间件处理 → 路由匹配 → Controller执行 → 操作数据库 → 返回JSON → 前端渲染
```

前端只管发请求和显示，后端处理逻辑，数据库存数据。

---

## 小米AI API 为什么用OpenAI库？

小米AI API 是 "兼容OpenAI格式" 的。

这意味着它的请求格式、响应格式、认证方式都和OpenAI一样。

所以可以直接用 `openai` 这个npm包，只需要改两个配置：
- `baseURL`：改成小米的API地址
- `apiKey`：改成小米的API密钥

好处：不用重复造轮子，OpenAI库的错误处理、重试、流式输出功能都能直接用。

---

## SSE（Server-Sent Events）是什么？

SSE = 服务器向浏览器推送数据的技术。

特点：
- **单向**：服务器 → 浏览器（刚好符合AI输出的需求）
- **简单**：浏览器原生支持，不需要额外库
- **实时**：服务器可以持续发送数据

和WebSocket的区别：
- WebSocket：双向通信，适合聊天、游戏等场景
- SSE：单向推送，适合AI输出、通知等场景

SSE数据格式：
```
data: {"type": "chunk", "content": "你"}

data: {"type": "done", "fullContent": "你好！"}

```
每行以 `data:` 开头，后面跟JSON数据，两个换行符 `\n\n` 表示一条消息结束。

---

## ReadableStream 和 TextDecoder

**ReadableStream**：浏览器的流读取接口，可以从网络请求中逐段读取数据。

**TextDecoder**：把二进制数据（Uint8Array）转换成字符串。

为什么需要它们？
- fetch API 的 `response.body` 返回的是一个 ReadableStream
- 流的每个chunk是字节数组（Uint8Array），不是字符串
- 需要用 TextDecoder 把字节转成字符串

完整读取流程：
```
fetch(url) → response.body → ReadableStream
  ↓
reader.read() → { done: false, value: Uint8Array }
  ↓
TextDecoder.decode(value) → "data: {...}\n\n"
  ↓
解析JSON → { type: "chunk", content: "你好" }
```

---

## openai 依赖的安装

后端通过 npm 安装 openai 包来调用小米AI API：
```bash
cd backend
npm install openai
```

安装后，在 `node_modules` 中会多出 openai 相关依赖。

---

**最后更新**：2026-06-15
