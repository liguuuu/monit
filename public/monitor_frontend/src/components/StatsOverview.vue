<template>
  <div class="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
    <div class="bg-white rounded-xl shadow p-4 flex items-center justify-between">
      <div>
        <p class="text-gray-500 text-sm">总连接器数</p>
        <p class="text-2xl font-bold">{{ stats.total }}</p>
      </div>
      <div class="bg-blue-100 p-3 rounded-lg">
        <i class="fas fa-plug text-blue-500 text-xl"></i>
      </div>
    </div>
    <div class="bg-white rounded-xl shadow p-4 flex items-center justify-between">
      <div>
        <p class="text-gray-500 text-sm">正常运行</p>
        <p class="text-2xl font-bold text-green-600">{{ stats.normal }}</p>
      </div>
      <div class="bg-green-100 p-3 rounded-lg">
        <i class="fas fa-check-circle text-green-500 text-xl"></i>
      </div>
    </div>
    <div class="bg-white rounded-xl shadow p-4 flex items-center justify-between">
      <div>
        <p class="text-gray-500 text-sm">警告状态</p>
        <p class="text-2xl font-bold text-yellow-600">{{ stats.warning }}</p>
      </div>
      <div class="bg-yellow-100 p-3 rounded-lg">
        <i class="fas fa-exclamation-triangle text-yellow-500 text-xl"></i>
      </div>
    </div>
    <div class="bg-white rounded-xl shadow p-4 flex items-center justify-between">
      <div>
        <p class="text-gray-500 text-sm">异常状态</p>
        <p class="text-2xl font-bold text-red-600">{{ stats.error }}</p>
      </div>
      <div class="bg-red-100 p-3 rounded-lg">
        <i class="fas fa-times-circle text-red-500 text-xl"></i>
      </div>
    </div>
  </div>
</template>

<script setup>
defineProps({
  stats: {
    type: Object,
    required: true
  }
})
</script>