import { createRouter, createWebHistory } from 'vue-router'
import Dashboard from '../views/Dashboard.vue'
import History from '../views/History.vue'
import Login from '../views/Login.vue'
import Bigscreen from '../views/Bigscreen.vue'
import { useAuthStore } from '../stores/auth'

const routes = [
  {
    path: '/login',
    name: 'Login',
    component: Login
  },
  {
    path: '/',
    name: 'Dashboard',
    component: Dashboard,
    meta: { requiresAuth: true }
  },
  {
    path: '/history/:id',
    name: 'History',
    component: History,
    props: true,
    meta: { requiresAuth: true }
  },
  {
    path: '/bigscreen',
    name: 'Bigscreen',
    component: Bigscreen,
    meta: { requiresAuth: true }
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

// 路由守卫
router.beforeEach((to, from, next) => {
  const authStore = useAuthStore()
  
  // 如果访问登录页
  if (to.path === '/login') {
    // 如果已登录，跳转到主页
    if (authStore.isAuthenticated.value) {
      next('/')
    } else {
      // 未登录，允许访问登录页
      next()
    }
  }
  // 如果访问需要认证的路由
  else if (to.meta.requiresAuth) {
    // 检查是否已登录
    if (authStore.isAuthenticated.value) {
      // 已登录，允许访问
      next()
    } else {
      // 未登录，跳转到登录页
      next('/login')
    }
  }
  // 其他情况，允许访问
  else {
    next()
  }
})

export default router