<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { User, Lock, ArrowRight, Sparkles } from 'lucide-vue-next'
import axios from 'axios'

const router = useRouter()

const isLogin = ref(true)
const username = ref('')
const password = ref('')
const email = ref('')
const loading = ref(false)
const errorMsg = ref('')

const toggleMode = () => {
  isLogin.value = !isLogin.value
  errorMsg.value = ''
}

const handleSubmit = async () => {
  errorMsg.value = ''

  if (!username.value || !password.value) {
    errorMsg.value = '请填写用户名和密码'
    return
  }

  if (!isLogin.value && password.value.length < 6) {
    errorMsg.value = '密码至少需要6个字符'
    return
  }

  loading.value = true

  try {
    const endpoint = isLogin.value ? '/api/user/login' : '/api/user/register'
    const payload: any = { username: username.value, password: password.value }
    if (!isLogin.value && email.value) payload.email = email.value

    const response = await axios.post(endpoint, payload)

    if (response.data.success) {
      if (isLogin.value) {
        localStorage.setItem('token', response.data.data.token)
        localStorage.setItem('user', JSON.stringify(response.data.data.user))
        router.push('/chat')
      } else {
        isLogin.value = true
        errorMsg.value = ''
        alert('注册成功！请登录')
      }
    } else {
      errorMsg.value = response.data.message || '操作失败'
    }
  } catch (error: any) {
    errorMsg.value = error.response?.data?.message || '网络错误，请稍后重试'
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <div class="login-page">
    <div class="login-card">
      <div class="card-logo">
        <div class="logo-icon">
          <Sparkles :size="28" />
        </div>
      </div>

      <h1 class="card-title">{{ isLogin ? '欢迎回来' : '创建账号' }}</h1>
      <p class="card-sub">{{ isLogin ? '登录以继续使用 AI Chat' : '注册新账号开始对话' }}</p>

      <form @submit.prevent="handleSubmit" class="card-form">
        <div class="field">
          <label class="field-label">用户名</label>
          <div class="field-box">
            <User :size="18" class="field-icon" />
            <input
              v-model="username"
              type="text"
              placeholder="请输入用户名"
              class="field-input"
              autocomplete="username"
            />
          </div>
        </div>

        <div v-if="!isLogin" class="field">
          <label class="field-label">邮箱</label>
          <div class="field-box">
            <input
              v-model="email"
              type="email"
              placeholder="请输入邮箱（选填）"
              class="field-input field-input--no-icon"
              autocomplete="email"
            />
          </div>
        </div>

        <div class="field">
          <label class="field-label">密码</label>
          <div class="field-box">
            <Lock :size="18" class="field-icon" />
            <input
              v-model="password"
              type="password"
              placeholder="请输入密码"
              class="field-input"
              autocomplete="current-password"
            />
          </div>
        </div>

        <div v-if="errorMsg" class="field-error">
          {{ errorMsg }}
        </div>

        <button type="submit" class="btn-submit" :disabled="loading">
          <span v-if="loading" class="btn-loader"></span>
          <span v-else>{{ isLogin ? '登录' : '注册' }}</span>
        </button>
      </form>

      <div class="card-footer">
        <span class="footer-text">{{ isLogin ? '还没有账号？' : '已有账号？' }}</span>
        <button @click="toggleMode" class="footer-link">
          {{ isLogin ? '立即注册' : '返回登录' }}
        </button>
      </div>
    </div>

    <p class="copyright">Powered by MiMo</p>
  </div>
</template>

<style scoped>
.login-page {
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  min-height: 100dvh;
  padding: 24px;
  background: var(--bg);
}

.login-card {
  width: 100%;
  max-width: 360px;
  padding: 40px 32px 32px;
  background: var(--surface);
  border: 1px solid var(--outline);
  border-radius: var(--radius-xl);
  box-shadow: var(--shadow-md);
}

.card-logo {
  display: flex;
  justify-content: center;
  margin-bottom: 24px;
}

.logo-icon {
  width: 56px;
  height: 56px;
  border-radius: 50%;
  background: var(--primary);
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--on-primary);
  box-shadow: var(--shadow-sm);
}

.card-title {
  text-align: center;
  font-size: 22px;
  font-weight: 500;
  color: var(--on-surface);
  margin-bottom: 6px;
}

.card-sub {
  text-align: center;
  font-size: 14px;
  color: var(--on-surface-variant);
  margin-bottom: 32px;
}

.card-form {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.field {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.field-label {
  font-size: 12px;
  font-weight: 500;
  color: var(--on-surface-variant);
  padding-left: 2px;
}

.field-box {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 0 14px;
  height: 48px;
  background: var(--bg);
  border: 1px solid var(--outline);
  border-radius: var(--radius-sm);
  transition: border-color var(--transition-fast), box-shadow var(--transition-fast);
}

.field-box:focus-within {
  border-color: var(--primary);
  box-shadow: 0 0 0 1px var(--primary);
}

.field-icon {
  color: var(--on-surface-dim);
  flex-shrink: 0;
}

.field-input {
  flex: 1;
  background: none;
  border: none;
  outline: none;
  font-size: 14px;
  color: var(--on-surface);
  font-family: inherit;
}

.field-input--no-icon {
  padding-left: 0;
}

.field-input::placeholder {
  color: var(--on-surface-dim);
}

.field-error {
  padding: 10px 14px;
  background: var(--error-container);
  border-radius: var(--radius-sm);
  color: var(--error);
  font-size: 13px;
  text-align: center;
}

.btn-submit {
  width: 100%;
  height: 44px;
  margin-top: 4px;
  background: var(--primary);
  color: var(--on-primary);
  font-size: 14px;
  font-weight: 500;
  font-family: inherit;
  border: none;
  border-radius: var(--radius-full);
  cursor: pointer;
  transition: background var(--transition-fast), box-shadow var(--transition-fast);
}

.btn-submit:hover:not(:disabled) {
  background: var(--primary-hover);
  box-shadow: var(--shadow-sm);
}

.btn-submit:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.btn-loader {
  width: 18px;
  height: 18px;
  border: 2px solid rgba(255, 255, 255, 0.3);
  border-top-color: white;
  border-radius: 50%;
  animation: spin 0.7s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.card-footer {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 6px;
  margin-top: 24px;
}

.footer-text {
  font-size: 13px;
  color: var(--on-surface-variant);
}

.footer-link {
  background: none;
  border: none;
  color: var(--primary);
  font-size: 13px;
  font-weight: 500;
  font-family: inherit;
  cursor: pointer;
}

.footer-link:hover {
  text-decoration: underline;
}

.copyright {
  position: absolute;
  bottom: 20px;
  font-size: 12px;
  color: var(--on-surface-dim);
}
</style>
