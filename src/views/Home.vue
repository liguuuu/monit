<template>
  <el-main>
    <!-- 统计概览 -->
    <el-row class="mb-6" gutter="20">
      <el-col :span="6" v-for="item in stats" :key="item.title">
        <el-card :body-style="{ padding: '20px' }" class="card-hover">
          <div class="flex justify-between">
            <div>
              <p class="text-gray-500 text-sm">{{ item.title }}</p>
              <p class="text-2xl font-bold">{{ item.value }}</p>
            </div>
            <div :class="item.iconClass">
              <i :class="item.iconClass"></i>
            </div>
          </div>
        </el-card>
      </el-col>
    </el-row>

    <!-- 连接器监控卡片 -->
    <el-row gutter="20">
      <el-col :span="6" v-for="connector in connectors" :key="connector.id">
        <el-card class="card-hover">
          <div class="p-4">
            <div class="flex justify-between">
              <h3 class="font-semibold text-lg">{{ connector.name }}</h3>
              <el-tag :type="connector.statusType">{{ connector.status }}</el-tag>
            </div>
            <p class="text-gray-500 text-sm">{{ connector.location }}</p>
          </div>
          <div class="p-4">
            <div class="flex justify-between">
              <span class="text-gray-500">温度</span>
              <span class="font-medium">{{ connector.temperature }}°C</span>
            </div>
            <div class="flex justify-between">
              <span class="text-gray-500">电压</span>
              <span class="font-medium">{{ connector.voltage }}V</span>
            </div>
            <div class="flex justify-between">
              <span class="text-gray-500">电流</span>
              <span class="font-medium">{{ connector.current }}A</span>
            </div>
            <div class="flex justify-between items-center mt-4">
              <span class="text-xs text-gray-500">最后更新: {{ connector.lastUpdate }}</span>
              <el-button type="text" size="small">历史数据</el-button>
            </div>
          </div>
        </el-card>
      </el-col>
    </el-row>
  </el-main>
</template>

<script setup>
import { ref } from 'vue'

const stats = ref([
  { title: '总连接器数', value: 128, iconClass: 'el-icon-plug' },
  { title: '正常运行', value: 112, iconClass: 'el-icon-check' },
  { title: '警告状态', value: 10, iconClass: 'el-icon-warning' },
  { title: '异常状态', value: 6, iconClass: 'el-icon-error' },
])

const connectors = ref([
  { id: 'A001', name: '连接器 #A001', status: '正常', statusType: 'success', location: '生产区域A', temperature: 42, voltage: 12.3, current: 3.2, lastUpdate: '2分钟前' },
  { id: 'A002', name: '连接器 #A002', status: '警告', statusType: 'warning', location: '生产区域A', temperature: 58, voltage: 11.8, current: 3.5, lastUpdate: '5分钟前' },
  { id: 'B001', name: '连接器 #B001', status: '正常', statusType: 'success', location: '生产区域B', temperature: 39, voltage: 12.5, current: 2.9, lastUpdate: '1分钟前' },
  { id: 'B002', name: '连接器 #B002', status: '异常', statusType: 'danger', location: '生产区域B', temperature: 67, voltage: 9.2, current: 4.1, lastUpdate: '10分钟前' },
  { id: 'C001', name: '连接器 #C001', status: '正常', statusType: 'success', location: '生产区域C', temperature: 41, voltage: 12.4, current: 3.0, lastUpdate: '3分钟前' },
  { id: 'C002', name: '连接器 #C002', status: '警告', statusType: 'warning', location: '生产区域C', temperature: 55, voltage: 11.9, current: 3.4, lastUpdate: '4分钟前' }
])
</script>

<style scoped>
.card-hover {
  transition: all 0.3s ease;
}
.card-hover:hover {
  transform: translateY(-5px);
  box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
}
</style>
