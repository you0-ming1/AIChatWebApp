<script setup lang="ts">
import { ref, nextTick, onMounted, computed } from 'vue'
import { useRouter } from 'vue-router'
import {
  Plus,
  MessageSquare,
  Send,
  Sparkles,
  LogOut,
  Trash2,
  Copy,
  Check,
  Pencil,
  PanelLeftClose,
  PanelLeftOpen
} from 'lucide-vue-next'
import axios from 'axios'

const apiClient = axios.create({
  baseURL: '/api',
  timeout: 10000,
  headers: { 'Content-Type': 'application/json' }
})

apiClient.interceptors.request.use((config) => {
  const t = localStorage.getItem('token')
  if (t) config.headers.Authorization = `Bearer ${t}`
  return config
}, (e) => Promise.reject(e))

apiClient.interceptors.response.use(
  (r) => r,
  (e) => {
    if (e.response?.status === 401) {
      localStorage.removeItem('token')
      localStorage.removeItem('user')
      window.location.href = '/login'
    }
    return Promise.reject(e)
  }
)

const router = useRouter()

const user = ref<any>(null)
const conversations = ref<Array<{ id: number, title: string, messages: any[] }>>([])
const currentConversationId = ref<number | null>(null)
const inputMessage = ref('')
const messages = ref<Array<{ role: string, content: string }>>([])
const isLoading = ref(false)
const messagesContainer = ref<HTMLElement | null>(null)
const copiedIndex = ref<number | null>(null)
const editingTitle = ref<number | null>(null)
const editTitleValue = ref('')
const sidebarOpen = ref(true)
const hoveredConv = ref<number | null>(null)
const justSent = ref(false)

const currentTitle = computed(() => {
  return conversations.value.find(c => c.id === currentConversationId.value)?.title || ''
})

const copyMessage = async (content: string, index: number) => {
  try {
    await navigator.clipboard.writeText(content)
    copiedIndex.value = index
    setTimeout(() => { copiedIndex.value = null }, 1500)
  } catch (e) {
    console.error('复制失败', e)
  }
}

const startEditTitle = (conv: any) => {
  editingTitle.value = conv.id
  editTitleValue.value = conv.title
}

const saveEditTitle = async () => {
  if (editingTitle.value === null) return
  const conv = conversations.value.find(c => c.id === editingTitle.value)
  if (conv && editTitleValue.value.trim()) {
    conv.title = editTitleValue.value.trim()
  }
  editingTitle.value = null
}

onMounted(async () => {
  const t = localStorage.getItem('token')
  const u = localStorage.getItem('user')

  if (!t || !u) {
    router.push('/login')
    return
  }

  user.value = JSON.parse(u)

  try {
    const res = await apiClient.get('/chat/conversation')
    if (res.data.success) {
      conversations.value = res.data.data.conversations.map((c: any) => ({
        id: c.id, title: c.title, messages: []
      }))
      if (conversations.value.length > 0) {
        selectConversation(conversations.value[0].id)
      } else {
        createNewConversation()
      }
    }
  } catch (e) {
    createNewConversation()
  }
})

const createNewConversation = async () => {
  try {
    const res = await apiClient.post('/chat/conversation', { title: '新对话' })
    if (res.data.success) {
      const c = { id: res.data.data.id, title: res.data.data.title, messages: [] }
      conversations.value.unshift(c)
      currentConversationId.value = c.id
      messages.value = []
    }
  } catch (e) {
    const c = { id: Date.now(), title: '新对话', messages: [] }
    conversations.value.unshift(c)
    currentConversationId.value = c.id
    messages.value = []
  }
}

const selectConversation = async (id: number) => {
  currentConversationId.value = id
  const conv = conversations.value.find(c => c.id === id)
  if (!conv) return

  if (conv.messages.length === 0) {
    try {
      const res = await apiClient.get(`/chat/message/${id}`)
      if (res.data.success) {
        conv.messages = res.data.data.messages.map((m: any) => ({
          role: m.role, content: m.content
        }))
      }
    } catch (e) {
      console.error('加载消息失败', e)
    }
  }

  messages.value = conv.messages
  await nextTick()
  scrollToBottom()
}

const deleteConversation = async (id: number, e: Event) => {
  e.stopPropagation()
  if (!confirm('确定删除？')) return

  try {
    await apiClient.delete(`/chat/conversation/${id}`)
    const idx = conversations.value.findIndex(c => c.id === id)
    if (idx > -1) {
      conversations.value.splice(idx, 1)
      if (currentConversationId.value === id) {
        if (conversations.value.length > 0) {
          selectConversation(conversations.value[0].id)
        } else {
          createNewConversation()
        }
      }
    }
  } catch (e) {
    alert('删除失败')
  }
}

const sendMessage = async () => {
  const msg = inputMessage.value.trim()
  if (!msg || isLoading.value || !currentConversationId.value) return

  inputMessage.value = ''
  justSent.value = true
  setTimeout(() => { justSent.value = false }, 300)

  messages.value.push({ role: 'user', content: msg })

  const conv = conversations.value.find(c => c.id === currentConversationId.value)
  if (conv && conv.title === '新对话') {
    conv.title = msg.slice(0, 24) + (msg.length > 24 ? '...' : '')
  }

  await nextTick()
  scrollToBottom()

  isLoading.value = true
  const aiIdx = messages.value.length
  messages.value.push({ role: 'assistant', content: '' })

  await nextTick()
  scrollToBottom()

  try {
    const t = localStorage.getItem('token')
    const res = await fetch('/api/chat/message/stream', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${t}`
      },
      body: JSON.stringify({ conversationId: currentConversationId.value, content: msg })
    })

    if (!res.ok) throw new Error(`HTTP ${res.status}`)

    const reader = res.body?.getReader()
    if (!reader) throw new Error('no stream')

    const dec = new TextDecoder()
    let ai = ''

    while (true) {
      const { done, value } = await reader.read()
      if (done) break

      for (const line of dec.decode(value).split('\n')) {
        if (!line.startsWith('data: ')) continue
        try {
          const d = JSON.parse(line.slice(6))
          if (d.type === 'chunk') {
            ai += d.content
            messages.value[aiIdx] = { role: 'assistant', content: ai }
            await nextTick()
            scrollToBottom()
          } else if (d.type === 'done') {
            messages.value[aiIdx] = { role: 'assistant', content: d.fullContent }
          } else if (d.type === 'error') {
            messages.value[aiIdx] = { role: 'assistant', content: `出错了：${d.message}` }
          }
        } catch {}
      }
    }
  } catch (e) {
    messages.value[aiIdx] = { role: 'assistant', content: '发送失败，请稍后重试。' }
  } finally {
    isLoading.value = false
    await nextTick()
    scrollToBottom()
  }
}

const scrollToBottom = () => {
  if (messagesContainer.value) {
    messagesContainer.value.scrollTo({ top: messagesContainer.value.scrollHeight, behavior: 'smooth' })
  }
}

const handleKeydown = (e: KeyboardEvent) => {
  if (e.key === 'Enter' && !e.shiftKey) {
    e.preventDefault()
    sendMessage()
  }
}

const handleInput = (e: Event) => {
  const el = e.target as HTMLTextAreaElement
  el.style.height = 'auto'
  el.style.height = Math.min(el.scrollHeight, 200) + 'px'
}

const logout = () => {
  localStorage.removeItem('token')
  localStorage.removeItem('user')
  router.push('/login')
}
</script>

<template>
  <div class="app-layout" :class="{ 'sidebar-collapsed': !sidebarOpen }">
    <!-- Sidebar -->
    <aside class="sidebar" :class="{ open: sidebarOpen }">
      <div class="sidebar-header">
        <button @click="createNewConversation" class="btn-new-chat">
          <Plus :size="16" />
          <span>新建对话</span>
        </button>
      </div>

      <nav class="sidebar-nav">
        <TransitionGroup name="list" tag="div">
          <div
            v-for="conv in conversations"
            :key="conv.id"
            class="nav-item"
            :class="{ active: currentConversationId === conv.id }"
            @click="selectConversation(conv.id)"
            @mouseenter="hoveredConv = conv.id"
            @mouseleave="hoveredConv = null"
          >
            <MessageSquare :size="15" class="nav-icon" />

            <div v-if="editingTitle !== conv.id" class="nav-title">{{ conv.title }}</div>
            <input
              v-else
              v-model="editTitleValue"
              @blur="saveEditTitle"
              @keydown.enter.prevent="saveEditTitle"
              @keydown.escape="editingTitle = null"
              class="nav-title-input"
              @click.stop
              autofocus
            />

            <Transition name="fade">
              <div v-if="hoveredConv === conv.id && editingTitle !== conv.id" class="nav-actions">
                <button @click.stop="startEditTitle(conv)" class="nav-action" title="重命名">
                  <Pencil :size="12" />
                </button>
                <button @click="deleteConversation(conv.id, $event)" class="nav-action nav-action--danger" title="删除">
                  <Trash2 :size="12" />
                </button>
              </div>
            </Transition>
          </div>
        </TransitionGroup>
      </nav>

      <div class="sidebar-footer">
        <div class="user-chip">
          <div class="user-avatar">{{ user?.username?.charAt(0).toUpperCase() || 'U' }}</div>
          <span class="user-name">{{ user?.username || '用户' }}</span>
        </div>
        <button @click="logout" class="btn-icon" title="退出">
          <LogOut :size="16" />
        </button>
      </div>
    </aside>

    <!-- Main -->
    <main class="chat-main">
      <header class="topbar">
        <button @click="sidebarOpen = !sidebarOpen" class="btn-icon topbar-toggle" title="切换侧栏">
          <Transition name="rotate" mode="out-in">
            <PanelLeftClose v-if="sidebarOpen" :size="18" />
            <PanelLeftOpen v-else :size="18" />
          </Transition>
        </button>
        <Transition name="slide-up" mode="out-in">
          <h2 class="topbar-title" :key="currentTitle">{{ currentTitle }}</h2>
        </Transition>
      </header>

      <div class="messages-area" ref="messagesContainer">
        <Transition name="fade" mode="out-in">
          <div v-if="messages.length === 0" key="welcome" class="welcome">
            <div class="welcome-icon">
              <Sparkles :size="36" />
            </div>
            <h1 class="welcome-title">你好，{{ user?.username || '用户' }}</h1>
            <p class="welcome-sub">我是 AI 助手，有什么可以帮你的？</p>
          </div>

          <div v-else key="messages" class="messages-list">
            <TransitionGroup name="msg" tag="div">
              <div
                v-for="(msg, idx) in messages"
                :key="idx"
                class="message"
                :class="[msg.role, { 'is-new': idx === messages.length - 1 }]"
              >
                <div class="message-avatar">
                  <template v-if="msg.role === 'user'">
                    {{ user?.username?.charAt(0).toUpperCase() || 'U' }}
                  </template>
                  <Sparkles v-else :size="14" />
                </div>

                <div class="message-body">
                  <div class="message-sender">
                    {{ msg.role === 'user' ? (user?.username || '用户') : 'AI 助手' }}
                  </div>

                  <div v-if="msg.role === 'assistant' && !msg.content" class="typing-indicator">
                    <span class="dot"></span>
                    <span class="dot"></span>
                    <span class="dot"></span>
                    <span class="cursor"></span>
                  </div>
                  <div v-else class="message-text" v-html="formatMessage(msg.content)"></div>

                  <Transition name="fade">
                    <div class="message-toolbar" v-if="msg.content">
                      <button
                        v-if="msg.role === 'assistant'"
                        @click="copyMessage(msg.content, idx)"
                        class="toolbar-btn"
                        title="复制"
                      >
                        <Transition name="scale" mode="out-in">
                          <Check v-if="copiedIndex === idx" :size="13" class="toolbar-check" key="check" />
                          <Copy v-else :size="13" key="copy" />
                        </Transition>
                        <span class="toolbar-label">{{ copiedIndex === idx ? '已复制' : '复制' }}</span>
                      </button>
                    </div>
                  </Transition>
                </div>
              </div>
            </TransitionGroup>
          </div>
        </Transition>
      </div>

      <div class="input-region">
        <div class="input-container" :class="{ focused: inputFocused, sending: justSent }">
          <textarea
            v-model="inputMessage"
            @keydown="handleKeydown"
            @input="handleInput"
            @focus="inputFocused = true"
            @blur="inputFocused = false"
            placeholder="输入消息..."
            class="textarea"
            rows="1"
            :disabled="isLoading"
          ></textarea>
          <button
            @click="sendMessage"
            class="btn-send"
            :disabled="!inputMessage.trim() || isLoading"
            :class="{ active: inputMessage.trim() }"
          >
            <Send :size="18" />
          </button>
        </div>
        <p class="disclaimer">AI 可能会犯错，请核实重要信息</p>
      </div>
    </main>
  </div>
</template>

<script lang="ts">
export default {
  data() {
    return { inputFocused: false }
  },
  methods: {
    formatMessage(content: string): string {
      if (!content) return ''
      let s = content.replace(/```(\w+)?\n([\s\S]*?)```/g, '<pre class="code-block"><code>$2</code></pre>')
      s = s.replace(/\n/g, '<br>')
      return s
    }
  }
}
</script>

<style scoped>
/* ===== Layout ===== */
.app-layout {
  display: flex;
  height: 100dvh;
  background: var(--bg);
}

/* ===== Sidebar ===== */
.sidebar {
  width: 260px;
  flex-shrink: 0;
  display: flex;
  flex-direction: column;
  background: var(--surface-dim);
  border-right: 1px solid var(--outline);
  transition: width 0.3s cubic-bezier(0.4, 0, 0.2, 1), opacity 0.2s;
  overflow: hidden;
}

.sidebar-collapsed .sidebar {
  width: 0;
  opacity: 0;
  border-right: none;
}

.sidebar-header {
  padding: 12px;
  flex-shrink: 0;
}

.btn-new-chat {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  width: 100%;
  height: 42px;
  background: var(--primary);
  border: none;
  border-radius: var(--radius-full);
  color: var(--on-primary);
  font-size: 14px;
  font-weight: 500;
  font-family: inherit;
  cursor: pointer;
  transition: background 0.15s, transform 0.1s, box-shadow 0.15s;
}

.btn-new-chat:hover {
  background: var(--primary-hover);
  box-shadow: 0 2px 8px rgba(26, 115, 232, 0.3);
}

.btn-new-chat:active {
  transform: scale(0.97);
}

.sidebar-nav {
  flex: 1;
  overflow-y: auto;
  overflow-x: hidden;
  padding: 0 8px;
}

.nav-item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 12px;
  border-radius: var(--radius-sm);
  cursor: pointer;
  transition: background 0.15s, transform 0.1s;
  position: relative;
  white-space: nowrap;
}

.nav-item:hover {
  background: var(--bg-hover);
}

.nav-item.active {
  background: var(--primary-container);
}

.nav-item:active {
  transform: scale(0.98);
}

.nav-icon {
  color: var(--on-surface-dim);
  flex-shrink: 0;
  transition: color 0.15s;
}

.nav-item.active .nav-icon {
  color: var(--primary);
}

.nav-title {
  flex: 1;
  font-size: 13px;
  color: var(--on-surface);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.nav-title-input {
  flex: 1;
  background: var(--bg);
  border: 1px solid var(--primary);
  border-radius: 6px;
  padding: 2px 8px;
  font-size: 13px;
  color: var(--on-surface);
  font-family: inherit;
  outline: none;
}

.nav-actions {
  display: flex;
  gap: 2px;
  flex-shrink: 0;
}

.nav-action {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 24px;
  height: 24px;
  background: transparent;
  border: none;
  color: var(--on-surface-dim);
  border-radius: 6px;
  cursor: pointer;
  transition: background 0.1s, color 0.1s, transform 0.1s;
}

.nav-action:hover {
  background: var(--bg-hover);
  color: var(--on-surface);
}

.nav-action:active {
  transform: scale(0.85);
}

.nav-action--danger:hover {
  background: var(--error-container);
  color: var(--error);
}

.sidebar-footer {
  padding: 12px;
  border-top: 1px solid var(--outline);
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-shrink: 0;
}

.user-chip {
  display: flex;
  align-items: center;
  gap: 10px;
}

.user-avatar {
  width: 30px;
  height: 30px;
  border-radius: 50%;
  background: linear-gradient(135deg, var(--primary) 0%, #7c5ce7 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 12px;
  font-weight: 600;
  color: white;
  box-shadow: 0 1px 4px rgba(26, 115, 232, 0.3);
}

.user-name {
  font-size: 13px;
  color: var(--on-surface);
}

.btn-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 34px;
  height: 34px;
  background: transparent;
  border: none;
  color: var(--on-surface-dim);
  border-radius: 50%;
  cursor: pointer;
  transition: background 0.15s, color 0.15s, transform 0.1s;
}

.btn-icon:hover {
  background: var(--bg-hover);
  color: var(--on-surface);
}

.btn-icon:active {
  transform: scale(0.9);
}

/* ===== Main ===== */
.chat-main {
  flex: 1;
  display: flex;
  flex-direction: column;
  min-width: 0;
}

.topbar {
  height: 54px;
  flex-shrink: 0;
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 0 20px;
  border-bottom: 1px solid var(--outline);
}

.topbar-toggle {
  flex-shrink: 0;
}

.topbar-title {
  font-size: 15px;
  font-weight: 500;
  color: var(--on-surface);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.messages-area {
  flex: 1;
  overflow-y: auto;
  padding: 20px 0;
}

.welcome {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100%;
  text-align: center;
  padding: 0 24px;
}

.welcome-icon {
  width: 80px;
  height: 80px;
  border-radius: 50%;
  background: linear-gradient(135deg, var(--primary) 0%, #7c5ce7 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  margin-bottom: 24px;
  box-shadow: 0 4px 20px rgba(26, 115, 232, 0.25);
  animation: float 3s ease-in-out infinite;
}

@keyframes float {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-8px); }
}

.welcome-title {
  font-size: 28px;
  font-weight: 500;
  color: var(--on-surface);
  margin-bottom: 8px;
}

.welcome-sub {
  font-size: 16px;
  color: var(--on-surface-variant);
}

.messages-list {
  max-width: 760px;
  margin: 0 auto;
  padding: 0 24px;
}

.message {
  display: flex;
  gap: 10px;
  padding: 18px;
  border-radius: var(--radius-lg);
  transition: background 0.2s;
  margin-top: 10px;
}

.message.user {
  background: var(--primary-container);
}

.message.assistant {
  background: var(--surface-dim);
}

.message-avatar {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  background: var(--primary);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 13px;
  font-weight: 600;
  color: var(--on-primary);
  flex-shrink: 0;
  transition: transform 0.2s;
}

.message:hover .message-avatar {
  transform: scale(1.06);
}

.message.assistant .message-avatar {
  background: var(--surface-container-high);
  color: var(--primary);
}

.message-body {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.message-sender {
  font-size: 13px;
  font-weight: 600;
  color: var(--on-surface-variant);
}

.message-text {
  font-size: 15px;
  color: var(--on-surface);
  line-height: 1.75;
  word-break: break-word;
}

.message-toolbar {
  display: flex;
  gap: 6px;
  margin-top: 4px;
}

.toolbar-btn {
  display: flex;
  align-items: center;
  gap: 5px;
  padding: 5px 10px;
  background: transparent;
  border: 1px solid var(--outline);
  color: var(--on-surface-dim);
  border-radius: var(--radius-full);
  font-size: 12px;
  font-family: inherit;
  cursor: pointer;
  transition: background 0.15s, color 0.15s, border-color 0.15s, transform 0.1s;
}

.toolbar-btn:hover {
  background: var(--bg-hover);
  color: var(--on-surface);
  border-color: var(--outline-strong);
}

.toolbar-btn:active {
  transform: scale(0.93);
}

.toolbar-check {
  color: var(--primary);
}

.toolbar-label {
  font-size: 12px;
}

/* ===== Typing indicator ===== */
.typing-indicator {
  display: flex;
  align-items: center;
  gap: 3px;
  padding: 8px 0;
}

.dot {
  width: 7px;
  height: 7px;
  border-radius: 50%;
  background: var(--on-surface-dim);
  animation: bounce-dot 1.4s infinite ease-in-out;
}

.dot:nth-child(1) { animation-delay: -0.32s; }
.dot:nth-child(2) { animation-delay: -0.16s; }
.dot:nth-child(3) { animation-delay: 0s; }

@keyframes bounce-dot {
  0%, 80%, 100% { transform: scale(0.5); opacity: 0.3; }
  40% { transform: scale(1); opacity: 1; }
}

.cursor {
  width: 2px;
  height: 16px;
  background: var(--primary);
  border-radius: 1px;
  margin-left: 4px;
  animation: blink 1s step-end infinite;
}

@keyframes blink {
  0%, 100% { opacity: 1; }
  50% { opacity: 0; }
}

/* ===== Input ===== */
.input-region {
  padding: 12px 20px 16px;
  flex-shrink: 0;
}

.input-container {
  display: flex;
  align-items: flex-end;
  gap: 8px;
  padding: 10px 10px 10px 18px;
  background: var(--surface);
  border: 1.5px solid var(--outline);
  border-radius: var(--radius-xl);
  transition: border-color 0.2s, box-shadow 0.25s, transform 0.2s, background 0.15s;
  max-width: 760px;
  margin: 0 auto;
}

.input-container.focused {
  border-color: var(--primary);
  box-shadow: 0 0 0 3px rgba(26, 115, 232, 0.1);
}

.input-container.sending {
  transform: scale(0.985);
}

.textarea {
  flex: 1;
  background: none;
  border: none;
  outline: none;
  font-size: 14.5px;
  color: var(--on-surface);
  font-family: inherit;
  line-height: 1.5;
  resize: none;
  max-height: 200px;
  padding: 4px 0;
}

.textarea::placeholder {
  color: var(--on-surface-dim);
}

.btn-send {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 38px;
  height: 38px;
  flex-shrink: 0;
  background: var(--surface-container-high);
  border: none;
  color: var(--on-surface-dim);
  border-radius: 50%;
  cursor: pointer;
  transition: background 0.2s, color 0.2s, transform 0.15s, box-shadow 0.2s;
}

.btn-send.active {
  background: var(--primary);
  color: var(--on-primary);
  box-shadow: 0 2px 8px rgba(26, 115, 232, 0.3);
}

.btn-send:hover:not(:disabled) {
  transform: scale(1.08);
}

.btn-send:active:not(:disabled) {
  transform: scale(0.92);
}

.btn-send:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

.disclaimer {
  text-align: center;
  font-size: 12px;
  color: var(--on-surface-dim);
  margin-top: 10px;
}

/* ===== Transitions ===== */
.fade-enter-active, .fade-leave-active {
  transition: opacity 0.2s ease;
}
.fade-enter-from, .fade-leave-to {
  opacity: 0;
}

.scale-enter-active, .scale-leave-active {
  transition: transform 0.15s ease, opacity 0.15s ease;
}
.scale-enter-from {
  transform: scale(0.5);
  opacity: 0;
}
.scale-leave-to {
  transform: scale(1.3);
  opacity: 0;
}

.rotate-enter-active, .rotate-leave-active {
  transition: transform 0.2s ease, opacity 0.2s ease;
}
.rotate-enter-from {
  transform: rotate(-90deg) scale(0.5);
  opacity: 0;
}
.rotate-leave-to {
  transform: rotate(90deg) scale(0.5);
  opacity: 0;
}

.slide-up-enter-active, .slide-up-leave-active {
  transition: transform 0.25s ease, opacity 0.25s ease;
}
.slide-up-enter-from {
  transform: translateY(8px);
  opacity: 0;
}
.slide-up-leave-to {
  transform: translateY(-8px);
  opacity: 0;
}

.msg-enter-active {
  transition: transform 0.3s cubic-bezier(0.34, 1.56, 0.64, 1), opacity 0.3s ease;
}
.msg-enter-from {
  transform: translateY(16px);
  opacity: 0;
}

.list-enter-active {
  transition: transform 0.3s cubic-bezier(0.34, 1.56, 0.64, 1), opacity 0.3s ease;
}
.list-leave-active {
  transition: transform 0.2s ease, opacity 0.2s ease;
}
.list-enter-from {
  transform: translateX(-12px);
  opacity: 0;
}
.list-leave-to {
  transform: translateX(12px);
  opacity: 0;
}
</style>
