// 简单的用户认证状态管理
import { ref } from 'vue'

const user = ref(null)
const isAuthenticated = ref(false)

// 记住我的过期时间（天数）
const REMEMBER_ME_EXPIRY_DAYS = 7

// 从localStorage恢复登录状态（用于"记住我"功能）
const initAuth = () => {
  const savedUser = localStorage.getItem('user')
  const savedToken = localStorage.getItem('token')
  const savedExpiry = localStorage.getItem('authExpiry')
  
  // 检查是否有保存的登录信息
  if (savedUser && savedToken && savedExpiry) {
    const expiryTime = parseInt(savedExpiry, 10)
    const now = Date.now()
    
    // 检查是否过期
    if (now < expiryTime) {
      // 未过期，恢复登录状态
      user.value = JSON.parse(savedUser)
      isAuthenticated.value = true
      console.log('已恢复登录状态（记住我）')
    } else {
      // 已过期，清除登录信息
      console.log('登录状态已过期，需要重新登录')
      localStorage.removeItem('user')
      localStorage.removeItem('token')
      localStorage.removeItem('authExpiry')
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
    
    // 只有在勾选"记住我"时才保存到 localStorage
    if (rememberMe) {
      localStorage.setItem('user', JSON.stringify(userData))
      localStorage.setItem('token', userData.token || '')
      
      // 设置过期时间（当前时间 + 7天）
      const expiryTime = Date.now() + (REMEMBER_ME_EXPIRY_DAYS * 24 * 60 * 60 * 1000)
      localStorage.setItem('authExpiry', expiryTime.toString())
      console.log(`已保存登录状态，将在 ${REMEMBER_ME_EXPIRY_DAYS} 天后过期`)
    } else {
      // 不记住我，只保存在内存中，不保存到 localStorage
      // 清除可能存在的旧数据
      localStorage.removeItem('user')
      localStorage.removeItem('token')
      localStorage.removeItem('authExpiry')
    }
  }

  const clearUser = () => {
    user.value = null
    isAuthenticated.value = false
    localStorage.removeItem('user')
    localStorage.removeItem('token')
    localStorage.removeItem('authExpiry')
  }

  return {
    user,
    isAuthenticated,
    setUser,
    clearUser
  }
}

