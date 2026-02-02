// 简单的用户认证状态管理
import { ref } from 'vue'

const user = ref(null)
const isAuthenticated = ref(false)

// 记住我的过期时间（天数）
const REMEMBER_ME_EXPIRY_DAYS = 7
const SESSION_USER_KEY = 'session_user'
const SESSION_TOKEN_KEY = 'session_token'

const clearRememberMe = () => {
  localStorage.removeItem('user')
  localStorage.removeItem('token')
  localStorage.removeItem('authExpiry')
}

const persistSession = (userData) => {
  sessionStorage.setItem(SESSION_USER_KEY, JSON.stringify(userData))
  sessionStorage.setItem(SESSION_TOKEN_KEY, userData.token || '')
}

const clearSession = () => {
  sessionStorage.removeItem(SESSION_USER_KEY)
  sessionStorage.removeItem(SESSION_TOKEN_KEY)
}

// 从存储恢复登录状态（优先本次会话，其次“记住我”）
const initAuth = () => {
  try {
    const sessionUser = sessionStorage.getItem(SESSION_USER_KEY)
    const sessionToken = sessionStorage.getItem(SESSION_TOKEN_KEY)
    if (sessionUser && sessionToken !== null) {
      user.value = JSON.parse(sessionUser)
      isAuthenticated.value = true
      return
    }
  } catch (err) {
    console.warn('恢复会话登录状态失败', err)
    clearSession()
  }

  const savedUser = localStorage.getItem('user')
  const savedToken = localStorage.getItem('token')
  const savedExpiry = localStorage.getItem('authExpiry')
  
  if (savedUser && savedToken && savedExpiry) {
    const expiryTime = parseInt(savedExpiry, 10)
    const now = Date.now()
    
    if (now < expiryTime) {
      user.value = JSON.parse(savedUser)
      isAuthenticated.value = true
      // 同步一份到 sessionStorage，刷新也保持登录
      persistSession(user.value)
      console.log('已恢复登录状态（记住我）')
    } else {
      console.log('登录状态已过期，需要重新登录')
      clearRememberMe()
    }
  }
}

// 初始化
initAuth()

export const useAuthStore = () => {
  /**
   * 设置用户登录状态
   * @param {Object} userData - 用户数据
   * @param {boolean} rememberMe - 是否记住我
   */
  const setUser = (userData, rememberMe = false) => {
    user.value = userData
    isAuthenticated.value = true

    // 始终为当前会话持久化，刷新页面不丢失
    persistSession(userData)
    
    // 只有在勾选"记住我"时才保存到 localStorage
    if (rememberMe) {
      localStorage.setItem('user', JSON.stringify(userData))
      localStorage.setItem('token', userData.token || '')
      
      // 设置过期时间（当前时间 + 7天）
      const expiryTime = Date.now() + (REMEMBER_ME_EXPIRY_DAYS * 24 * 60 * 60 * 1000)
      localStorage.setItem('authExpiry', expiryTime.toString())
      console.log(`已保存登录状态，将在 ${REMEMBER_ME_EXPIRY_DAYS} 天后过期`)
    } else {
      clearRememberMe()
    }
  }

  const clearUser = () => {
    user.value = null
    isAuthenticated.value = false
    clearSession()
    clearRememberMe()
  }

  return {
    user,
    isAuthenticated,
    setUser,
    clearUser
  }
}