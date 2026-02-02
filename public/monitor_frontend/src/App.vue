<template>
  <div id="app">
    <!-- 顶部导航栏（仅在非登录页面显示） -->
    <header v-if="showHeader" class="bg-gradient-to-r from-blue-600 to-indigo-700 text-white shadow-lg py-4 px-6 flex items-center justify-between">
      <div class="flex items-center">
        <i class="fas fa-plug text-2xl mr-3"></i>
        <h1 class="text-2xl font-bold">中矽科技 连接器监控系统</h1>
      </div>
      <div class="flex items-center space-x-4">
        <span class="text-sm bg-blue-500 px-3 py-1 rounded-full">实时监控</span>
        <span class="text-sm">{{ authStore.user?.username || '管理员' }}</span>
        <button
          @click="handleLogout"
          class="text-sm bg-red-500 hover:bg-red-600 px-3 py-1 rounded-full transition"
        >
          退出登录
        </button>
        <i class="fas fa-bell text-xl"></i>
      </div>
    </header>

    <!-- 主体内容区（由路由控制） -->
    <main :class="showHeader ? 'p-6' : ''">
      <router-view />
    </main>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useAuthStore } from './stores/auth'

const route = useRoute()
const router = useRouter()
const authStore = useAuthStore()

// 在登录页面不显示顶部导航栏
const showHeader = computed(() => route.path !== '/login')

const handleLogout = () => {
  authStore.clearUser()
  router.push('/login')
}
</script>