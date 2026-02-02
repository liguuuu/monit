<template>
  <div class="bg-white rounded-xl shadow-md overflow-hidden card-hover h-full">
    <!-- 卡片头部 -->
    <div class="p-4 border-b border-gray-100">
      <div class="flex justify-between items-center mb-2">
        <h3 class="font-semibold text-lg">{{ connector.name }}</h3>
        <span :class="`status-indicator status-${connector.status}`"></span>
      </div>
      <p class="text-gray-500 text-sm">{{ connector.location }}</p>
    </div>

    <!-- 环境数据展示 -->
    <div class="p-4 space-y-4 max-h-96 overflow-y-auto">
      <!-- 环境编号A：电压电流 -->
      <div class="border rounded-lg p-3">
        <h4 class="font-medium text-blue-600 mb-2 flex items-center">
          <i class="fas fa-bolt mr-2"></i>环境A - 电压电流监测
        </h4>
        <div class="grid grid-cols-2 gap-2 text-sm">
          <div class="flex justify-between">
            <span class="text-gray-600">电压1:</span>
            <span :class="getVoltageClass(connector.environmentA.voltage1)">{{ connector.environmentA.voltage1 }}V</span>
          </div>
          <div class="flex justify-between">
            <span class="text-gray-600">电压2:</span>
            <span :class="getVoltageClass(connector.environmentA.voltage2)">{{ connector.environmentA.voltage2 }}V</span>
          </div>
          <div class="flex justify-between">
            <span class="text-gray-600">电压3:</span>
            <span :class="getVoltageClass(connector.environmentA.voltage3)">{{ connector.environmentA.voltage3 }}V</span>
          </div>
          <div class="flex justify-between">
            <span class="text-gray-600">电流1:</span>
            <span :class="getCurrentClass(connector.environmentA.current1)">{{ connector.environmentA.current1 }}A</span>
          </div>
          <div class="flex justify-between">
            <span class="text-gray-600">电流2:</span>
            <span :class="getCurrentClass(connector.environmentA.current2)">{{ connector.environmentA.current2 }}A</span>
          </div>
          <div class="flex justify-between">
            <span class="text-gray-600">电流3:</span>
            <span :class="getCurrentClass(connector.environmentA.current3)">{{ connector.environmentA.current3 }}A</span>
          </div>
        </div>
      </div>

      <!-- 环境编号B：温湿度气压 -->
      <div class="border rounded-lg p-3">
        <h4 class="font-medium text-green-600 mb-2 flex items-center">
          <i class="fas fa-thermometer-half mr-2"></i>环境B - 温湿度气压
        </h4>
        <div class="grid grid-cols-2 gap-2 text-sm">
          <div v-for="(temp, index) in getTemperatures(connector.environmentB)" :key="index" class="flex justify-between">
            <span class="text-gray-600">温度{{ index + 1 }}:</span>
            <span :class="getTemperatureClass(temp)">{{ temp }}°C</span>
          </div>
          <div class="flex justify-between">
            <span class="text-gray-600">湿度1:</span>
            <span>{{ connector.environmentB.humidity1 }}%</span>
          </div>
          <div class="flex justify-between">
            <span class="text-gray-600">湿度2:</span>
            <span>{{ connector.environmentB.humidity2 }}%</span>
          </div>
          <div class="flex justify-between">
            <span class="text-gray-600">气压1:</span>
            <span>{{ connector.environmentB.atmosphericPressure1 }}hPa</span>
          </div>
          <div class="flex justify-between">
            <span class="text-gray-600">气压2:</span>
            <span>{{ connector.environmentB.atmosphericPressure2 }}hPa</span>
          </div>
        </div>
      </div>

      <!-- 环境编号C：气体监测 -->
      <div class="border rounded-lg p-3">
        <h4 class="font-medium text-purple-600 mb-2 flex items-center">
          <i class="fas fa-wind mr-2"></i>环境C - 气体监测
        </h4>
        <div class="grid grid-cols-2 gap-2 text-sm">
          <div class="flex justify-between">
            <span class="text-gray-600">CO:</span>
            <span :class="getGasClass('co', connector.environmentC.co)">{{ connector.environmentC.co }}ppm</span>
          </div>
          <div class="flex justify-between">
            <span class="text-gray-600">CH4:</span>
            <span :class="getGasClass('ch4', connector.environmentC.ch4)">{{ connector.environmentC.ch4 }}%LEL</span>
          </div>
          <div class="flex justify-between">
            <span class="text-gray-600">O2:</span>
            <span :class="getO2Class(connector.environmentC.o2)">{{ connector.environmentC.o2 }}%</span>
          </div>
          <div class="flex justify-between">
            <span class="text-gray-600">温度:</span>
            <span>{{ connector.environmentC.temperature }}°C</span>
          </div>
          <div class="flex justify-between">
            <span class="text-gray-600">湿度:</span>
            <span>{{ connector.environmentC.humidity }}%</span>
          </div>
        </div>
      </div>

      <!-- 环境编号D：三轴加速度 -->
      <div class="border rounded-lg p-3">
        <h4 class="font-medium text-orange-600 mb-2 flex items-center">
          <i class="fas fa-arrows-alt mr-2"></i>环境D - 三轴加速度
        </h4>
        <div class="grid grid-cols-3 gap-2 text-sm">

          <div class="text-center">
            <div class="font-medium">X轴</div>
            <div v-if="connector.environmentD && connector.environmentD.d_x" :class="getAxisClass(connector.environmentD.d_x.value)">
              {{ connector.environmentD.d_x.positive ? '+' : '-' }}{{ connector.environmentD.d_x.value }}g
            </div>
            <div v-else>
              数据缺失
            </div>
          </div>

        <div class="text-center">
          <div class="font-medium">Y轴</div>
          <div v-if="connector.environmentD && connector.environmentD.d_y" :class="getAxisClass(connector.environmentD.d_y.value)">
            {{ connector.environmentD.d_y.positive ? '+' : '-' }}{{ connector.environmentD.d_y.value }}g
          </div>
          <div v-else>
            数据缺失
          </div>
        </div>

        <div class="text-center">
          <div class="font-medium">Z轴</div>
          <div v-if="connector.environmentD && connector.environmentD.d_z" :class="getAxisClass(connector.environmentD.d_z.value)">
            {{ connector.environmentD.d_z.positive ? '+' : '-' }}{{ connector.environmentD.d_z.value }}g
          </div>
          <div v-else>
            数据缺失
          </div>
        </div> 
          
        </div>
      </div>
    </div>

    <!-- 卡片底部 -->
    <div class="p-4 border-t border-gray-100 bg-gray-50">
      <div class="flex justify-between items-center">
        <span class="text-xs text-gray-500">最后更新: {{ connector.lastUpdate }}</span>
        <router-link 
          :to="`/history/${connector.device_no}`" 
          class="text-blue-500 hover:text-blue-700 text-sm font-medium flex items-center"
        >
          历史数据 <i class="fas fa-arrow-right ml-1 text-xs"></i>
        </router-link>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed ,onMounted } from 'vue'

const props = defineProps({
  connector: {
    type: Object,
    required: true
  }
})

onMounted(() => {
  console.log('Received connector data:', props.connector)
})

// 获取温度数组
const getTemperatures = (envB) => {
  return [
    envB.temperature1,
    envB.temperature2, 
    envB.temperature3,
    envB.temperature4,
    envB.temperature5,
    envB.temperature6
  ]
}

// 电压状态判断
const getVoltageClass = (voltage) => {
  if (voltage < 11.5) return 'text-red-600 font-medium'
  if (voltage < 11.8) return 'text-yellow-600 font-medium'
  return 'text-green-600 font-medium'
}

// 电流状态判断
const getCurrentClass = (current) => {
  if (current > 3.5) return 'text-red-600 font-medium'
  if (current > 3.3) return 'text-yellow-600 font-medium'
  return 'text-green-600 font-medium'
}

// 温度状态判断
const getTemperatureClass = (temp) => {
  if (temp > 50) return 'text-red-600 font-medium'
  if (temp > 40) return 'text-yellow-600 font-medium'
  return 'text-green-600 font-medium'
}

// 气体状态判断
const getGasClass = (type, value) => {
  if (type === 'co') {
    if (value > 20) return 'text-red-600 font-medium'
    if (value > 15) return 'text-yellow-600 font-medium'
  } else if (type === 'ch4') {
    if (value > 1.0) return 'text-red-600 font-medium'
    if (value > 0.8) return 'text-yellow-600 font-medium'
  }
  return 'text-green-600 font-medium'
}

// 氧气状态判断
const getO2Class = (o2) => {
  if (o2 < 19.5 || o2 > 23.5) return 'text-red-600 font-medium'
  return 'text-green-600 font-medium'
}

// 加速度状态判断
const getAxisClass = (value) => {
  if (Math.abs(value) > 2.0) return 'text-red-600 font-medium'
  if (Math.abs(value) > 1.5) return 'text-yellow-600 font-medium'
  return 'text-green-600 font-medium'
}
</script>

<style scoped>
.card-hover {
  transition: all 0.3s ease;
}
.card-hover:hover {
  transform: translateY(-5px);
  box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
}
.status-indicator {
  width: 10px;
  height: 10px;
  border-radius: 50%;
  display: inline-block;
}
.status-normal {
  background-color: #10b981;
}
.status-warning {
  background-color: #f59e0b;
}
.status-error {
  background-color: #ef4444;
}
</style>