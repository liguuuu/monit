<template>
  <div class="min-h-screen flex flex-col bg-gradient-to-br from-blue-50 to-indigo-100">
    <!-- 顶部导航栏（与App.vue一致） -->
    <header class="bg-gradient-to-r from-blue-600 to-indigo-700 text-white shadow-lg py-4 px-6">
      <div class="flex items-center">
        <i class="fas fa-plug text-2xl mr-3"></i>
        <h1 class="text-2xl font-bold">中矽科技 连接器监控系统</h1>
      </div>
    </header>

    <!-- 登录表单区域 -->
    <div class="flex-1 flex items-center justify-center">
      <div class="w-full max-w-md">
      <!-- 登录表单 -->
      <div v-if="!isRegister" class="bg-white rounded-2xl shadow-xl p-8">
        <div class="text-center mb-8">
          <h2 class="text-3xl font-bold text-gray-800 mb-2">登录</h2>
          <p class="text-gray-600">欢迎回来</p>
        </div>

        <form @submit.prevent="handleLogin" class="space-y-6">
          <div>
            <label for="login-username" class="block text-sm font-medium text-gray-700 mb-2">
              用户名
            </label>
            <input
              id="login-username"
              v-model="loginForm.username"
              type="text"
              required
              class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition"
              placeholder="请输入用户名"
            />
          </div>

          <div>
            <label for="login-password" class="block text-sm font-medium text-gray-700 mb-2">
              密码
            </label>
            <input
              id="login-password"
              v-model="loginForm.password" 
              type="password"
              required
              class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition"
              placeholder="请输入密码"
            />
          </div>

          <div class="flex items-center">
            <input
              id="remember-me"
              v-model="loginForm.rememberMe"
              type="checkbox"
              class="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 focus:ring-2"
            />
            <label for="remember-me" class="ml-2 text-sm text-gray-700">
              记住我（7天内免登录）
            </label>
          </div>

          <div v-if="loginError" class="text-red-500 text-sm text-center">
            {{ loginError }}
          </div>

          <button
            type="submit"
            :disabled="isLoading"
            class="w-full bg-gradient-to-r from-blue-600 to-indigo-600 text-white py-3 rounded-lg font-semibold hover:from-blue-700 hover:to-indigo-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {{ isLoading ? '登录中...' : '登录' }}
          </button>
        </form>

        <div class="mt-6 text-center">
          <span class="text-gray-600">还没有账号？</span>
          <button
            @click="switchToRegister"
            class="text-blue-600 hover:text-blue-700 font-semibold ml-1"
          >
            立即注册
          </button>
        </div>
      </div>

      <!-- 注册表单 -->
      <div v-else class="bg-white rounded-2xl shadow-xl p-8">
        <div class="text-center mb-8">
          <h2 class="text-3xl font-bold text-gray-800 mb-2">注册</h2>
          <p class="text-gray-600">创建新账号</p>
        </div>

        <form @submit.prevent="handleRegister" class="space-y-6">
          <div>
            <label for="register-username" class="block text-sm font-medium text-gray-700 mb-2">
              用户名
            </label>
            <input
              id="register-username"
              v-model="registerForm.username"
              type="text"
              required
              class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition"
              placeholder="请输入用户名"
            />
          </div>

          <div>
            <label for="register-password" class="block text-sm font-medium text-gray-700 mb-2">
              密码
            </label>
            <input
              id="register-password"
              v-model="registerForm.password"
              type="password"
              required
              class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition"
              placeholder="请输入密码"
            />
          </div>

          <div>
            <label for="register-confirm-password" class="block text-sm font-medium text-gray-700 mb-2">
              确认密码
            </label>
            <input
              id="register-confirm-password"
              v-model="registerForm.confirmPassword"
              type="password"
              required
              class="w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition"
              :class="passwordMismatch ? 'border-red-500' : 'border-gray-300'"
              placeholder="请再次输入密码"
            />
            <p v-if="passwordMismatch" class="text-red-500 text-sm mt-1">
              两次输入的密码不一致
            </p>
          </div>

          <div v-if="registerError" class="text-red-500 text-sm text-center">
            {{ registerError }}
          </div>

          <div v-if="registerSuccess" class="text-green-500 text-sm text-center">
            {{ registerSuccess }}
          </div>

          <button
            type="submit"
            :disabled="isLoading || passwordMismatch"
            class="w-full bg-gradient-to-r from-blue-600 to-indigo-600 text-white py-3 rounded-lg font-semibold hover:from-blue-700 hover:to-indigo-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {{ isLoading ? '注册中...' : '注册' }}
          </button>
        </form>

        <div class="mt-6 text-center">
          <span class="text-gray-600">已有账号？</span>
          <button
            @click="switchToLogin"
            class="text-blue-600 hover:text-blue-700 font-semibold ml-1"
          >
            立即登录
          </button>
        </div>
      </div>
    </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import md5 from 'js-md5'
import { login, register } from '../api/api'
import { useAuthStore } from '../stores/auth'

const router = useRouter()
const authStore = useAuthStore()

const isRegister = ref(false)
const isLoading = ref(false)
const loginError = ref('')
const registerError = ref('')
const registerSuccess = ref('')

const loginForm = ref({
  username: '',
  password: '',
  rememberMe: false
})

const registerForm = ref({
  username: '',
  password: '',
  confirmPassword: ''
})

const passwordMismatch = computed(() => {
  if (!registerForm.value.confirmPassword) return false
  return registerForm.value.password !== registerForm.value.confirmPassword
})

const switchToRegister = () => {
  isRegister.value = true
  loginError.value = ''
  registerError.value = ''
  registerSuccess.value = ''
}

const switchToLogin = () => {
  isRegister.value = false
  registerForm.value = {
    username: '',
    password: '',
    confirmPassword: ''
  }
  registerError.value = ''
  registerSuccess.value = ''
}

const handleLogin = async () => {
  loginError.value = ''
  isLoading.value = true

  try {
    // 使用MD5加密密码
    const encryptedPassword = md5(loginForm.value.password)
    
    const response = await login({
      username: loginForm.value.username,
      password: encryptedPassword
    })

    if (response.data.success) {
      // 保存登录状态，根据"记住我"选项决定是否保存到 localStorage
      authStore.setUser({
        username: loginForm.value.username,
        token: response.data.token || 'mock-token'
      }, loginForm.value.rememberMe)
      
      // 跳转到主界面
      router.push('/')
    } else {
      loginError.value = response.data.message || '登录失败，请检查用户名和密码'
    }
  } catch (error) {
    console.error('登录错误:', error)
    //loginError.value = error.response?.data?.message || '登录失败，请稍后重试'
    // 更详细的错误信息
    if (error.code === 'ECONNABORTED' || error.message?.includes('timeout')) {
      loginError.value = '连接超时，请检查网络连接或后端服务是否启动'
    } else if (error.code === 'ERR_NETWORK' || error.message?.includes('Network Error')) {
      loginError.value = '网络错误，无法连接到服务器，请检查后端服务是否运行在 http://120.46.133.240:32888'
    } else if (error.response) {
      // 服务器返回了响应，但状态码不是 2xx
      loginError.value = error.response.data?.message || `登录失败：${error.response.status} ${error.response.statusText}`
    } else {
      loginError.value = error.message || '登录失败，请稍后重试'
    }
  } finally {
    isLoading.value = false
  }
}

const handleRegister = async () => {
  registerError.value = ''
  registerSuccess.value = ''

  // 验证密码是否一致
  if (registerForm.value.password !== registerForm.value.confirmPassword) {
    registerError.value = '两次输入的密码不一致'
    return
  }

  isLoading.value = true

  try {
    // 使用MD5加密密码
    const encryptedPassword = md5(registerForm.value.password)
    
    const response = await register({
      username: registerForm.value.username,
      password: encryptedPassword
    })

    if (response.data.success) {
      registerSuccess.value = '注册成功！正在跳转到登录页面...'
      
      // 清空注册表单
      registerForm.value = {
        username: '',
        password: '',
        confirmPassword: ''
      }
      
      // 2秒后切换到登录界面
      setTimeout(() => {
        switchToLogin()
      }, 2000)
    } else {
      registerError.value = response.data.message || '注册失败，请稍后重试'
    }
  } catch (error) {
    console.error('注册错误:', error)
    //registerError.value = error.response?.data?.message || '注册失败，请稍后重试'
    // 更详细的错误信息
    if (error.code === 'ECONNABORTED' || error.message?.includes('timeout')) {
      registerError.value = '连接超时，请检查网络连接或后端服务是否启动'
    } else if (error.code === 'ERR_NETWORK' || error.message?.includes('Network Error')) {
      registerError.value = '网络错误，无法连接到服务器，请检查后端服务是否运行在 http://120.46.133.240:32888'
    } else if (error.response) {
      // 服务器返回了响应，但状态码不是 2xx
      registerError.value = error.response.data?.message || `注册失败：${error.response.status} ${error.response.statusText}`
    } else {
      registerError.value = error.message || '注册失败，请稍后重试'
    }
  } finally {
    isLoading.value = false
  }
}
</script>

<style scoped>
/* 自定义样式已通过Tailwind CSS实现 */
</style>

