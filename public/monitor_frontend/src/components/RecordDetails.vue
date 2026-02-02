<template>
  <div class="space-y-6">
    <!-- 环境A：电压电流数据 -->
    <div class="border rounded-lg p-4">
      <h4 class="font-bold text-lg text-blue-600 mb-4 flex items-center">
        <i class="fas fa-bolt mr-2"></i>环境A - 电压电流监测
      </h4>
      <div class="grid grid-cols-2 md:grid-cols-3 gap-4">
        <div class="text-center p-3 bg-blue-50 rounded-lg">
          <div class="text-sm text-gray-600">电压1</div>
          <div :class="getVoltageClass(record.environmentA.voltage1)" class="text-xl font-bold">
            {{ record.environmentA.voltage1 }}V
          </div>
        </div>
        <div class="text-center p-3 bg-blue-50 rounded-lg">
          <div class="text-sm text-gray-600">电压2</div>
          <div :class="getVoltageClass(record.environmentA.voltage2)" class="text-xl font-bold">
            {{ record.environmentA.voltage2 }}V
          </div>
        </div>
        <div class="text-center p-3 bg-blue-50 rounded-lg">
          <div class="text-sm text-gray-600">电压3</div>
          <div :class="getVoltageClass(record.environmentA.voltage3)" class="text-xl font-bold">
            {{ record.environmentA.voltage3 }}V
          </div>
        </div>
        <div class="text-center p-3 bg-blue-50 rounded-lg">
          <div class="text-sm text-gray-600">电流1</div>
          <div :class="getCurrentClass(record.environmentA.current1)" class="text-xl font-bold">
            {{ record.environmentA.current1 }}A
          </div>
        </div>
        <div class="text-center p-3 bg-blue-50 rounded-lg">
          <div class="text-sm text-gray-600">电流2</div>
          <div :class="getCurrentClass(record.environmentA.current2)" class="text-xl font-bold">
            {{ record.environmentA.current2 }}A
          </div>
        </div>
        <div class="text-center p-3 bg-blue-50 rounded-lg">
          <div class="text-sm text-gray-600">电流3</div>
          <div :class="getCurrentClass(record.environmentA.current3)" class="text-xl font-bold">
            {{ record.environmentA.current3 }}A
          </div>
        </div>
      </div>
    </div>

    <!-- 环境B：温湿度气压数据 -->
    <div class="border rounded-lg p-4">
      <h4 class="font-bold text-lg text-green-600 mb-4 flex items-center">
        <i class="fas fa-thermometer-half mr-2"></i>环境B - 温湿度气压监测
      </h4>
      <div class="grid grid-cols-2 md:grid-cols-3 gap-4">
        <div v-for="(temp, index) in getTemperatures(record.environmentB)" :key="index" 
             class="text-center p-3 bg-green-50 rounded-lg">
          <div class="text-sm text-gray-600">温度{{ index + 1 }}</div>
          <div :class="getTemperatureClass(temp)" class="text-xl font-bold">
            {{ temp }}°C
          </div>
        </div>
        <div class="text-center p-3 bg-green-50 rounded-lg">
          <div class="text-sm text-gray-600">湿度1</div>
          <div class="text-xl font-bold text-blue-600">{{ record.environmentB.humidity1 }}%</div>
        </div>
        <div class="text-center p-3 bg-green-50 rounded-lg">
          <div class="text-sm text-gray-600">湿度2</div>
          <div class="text-xl font-bold text-blue-600">{{ record.environmentB.humidity2 }}%</div>
        </div>
        <div class="text-center p-3 bg-green-50 rounded-lg">
          <div class="text-sm text-gray-600">气压1</div>
          <div class="text-xl font-bold text-purple-600">{{ record.environmentB.atmosphericPressure1 }}hPa</div>
        </div>
        <div class="text-center p-3 bg-green-50 rounded-lg">
          <div class="text-sm text-gray-600">气压2</div>
          <div class="text-xl font-bold text-purple-600">{{ record.environmentB.atmosphericPressure2 }}hPa</div>
        </div>
      </div>
    </div>

    <!-- 环境C：气体监测数据 -->
    <div class="border rounded-lg p-4">
      <h4 class="font-bold text-lg text-purple-600 mb-4 flex items-center">
        <i class="fas fa-wind mr-2"></i>环境C - 气体监测
      </h4>
      <div class="grid grid-cols-2 md:grid-cols-3 gap-4">
        <div class="text-center p-3 bg-purple-50 rounded-lg">
          <div class="text-sm text-gray-600">CO浓度</div>
          <div :class="getGasClass('co', record.environmentC.co)" class="text-xl font-bold">
            {{ record.environmentC.co }}ppm
          </div>
        </div>
        <div class="text-center p-3 bg-purple-50 rounded-lg">
          <div class="text-sm text-gray-600">CH4浓度</div>
          <div :class="getGasClass('ch4', record.environmentC.ch4)" class="text-xl font-bold">
            {{ record.environmentC.ch4 }}%LEL
          </div>
        </div>
        <div class="text-center p-3 bg-purple-50 rounded-lg">
          <div class="text-sm text-gray-600">氧气浓度</div>
          <div :class="getO2Class(record.environmentC.o2)" class="text-xl font-bold">
            {{ record.environmentC.o2 }}%
          </div>
        </div>
        <div class="text-center p-3 bg-purple-50 rounded-lg">
          <div class="text-sm text-gray-600">环境温度</div>
          <div class="text-xl font-bold text-orange-600">{{ record.environmentC.temperature }}°C</div>
        </div>
        <div class="text-center p-3 bg-purple-50 rounded-lg">
          <div class="text-sm text-gray-600">环境湿度</div>
          <div class="text-xl font-bold text-blue-600">{{ record.environmentC.humidity }}%</div>
        </div>
      </div>
    </div>

    <!-- 环境D：三轴加速度数据 -->
    <div class="border rounded-lg p-4">
      <h4 class="font-bold text-lg text-orange-600 mb-4 flex items-center">
        <i class="fas fa-arrows-alt mr-2"></i>环境D - 三轴加速度
      </h4>
      <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div class="text-center p-4 bg-orange-50 rounded-lg">
          <div class="text-lg font-medium text-gray-700 mb-2">X轴加速度</div>
          <div :class="getAxisClass(record.environmentD.xAxis.value)" class="text-2xl font-bold">
            {{ record.environmentD.xAxis.positive ? '+' : '-' }}{{ record.environmentD.xAxis.value }}g
          </div>
          <div class="text-sm text-gray-500 mt-2">
            方向: {{ record.environmentD.xAxis.positive ? '正向' : '负向' }}
          </div>
        </div>
        <div class="text-center p-4 bg-orange-50 rounded-lg">
          <div class="text-lg font-medium text-gray-700 mb-2">Y轴加速度</div>
          <div :class="getAxisClass(record.environmentD.yAxis.value)" class="text-2xl font-bold">
            {{ record.environmentD.yAxis.positive ? '+' : '-' }}{{ record.environmentD.yAxis.value }}g
          </div>
          <div class="text-sm text-gray-500 mt-2">
            方向: {{ record.environmentD.yAxis.positive ? '正向' : '负向' }}
          </div>
        </div>
        <div class="text-center p-4 bg-orange-50 rounded-lg">
          <div class="text-lg font-medium text-gray-700 mb-2">Z轴加速度</div>
          <div :class="getAxisClass(record.environmentD.zAxis.value)" class="text-2xl font-bold">
            {{ record.environmentD.zAxis.positive ? '+' : '-' }}{{ record.environmentD.zAxis.value }}g
          </div>
          <div class="text-sm text-gray-500 mt-2">
            方向: {{ record.environmentD.zAxis.positive ? '正向' : '负向' }}
          </div>
        </div>
      </div>
    </div>

    <!-- 状态总结 -->
    <div class="border rounded-lg p-4 bg-gray-50">
      <h4 class="font-bold text-lg text-gray-700 mb-4">状态总结</h4>
      <div class="flex items-center justify-between">
        <div class="flex items-center">
          <span :class="`status-indicator status-${record.status} mr-3`"></span>
          <span :class="getStatusTextClass(record.status)" class="text-lg font-bold">
            {{ getStatusText(record.status) }}
          </span>
        </div>
        <div class="text-sm text-gray-500">
          记录时间: {{ record.date }} {{ record.time }}
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  record: {
    type: Object,
    required: true
  }
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

// 状态判断方法
const getVoltageClass = (voltage) => {
  if (voltage < 11.5) return 'text-red-600'
  if (voltage < 11.8) return 'text-yellow-600'
  return 'text-green-600'
}

const getCurrentClass = (current) => {
  if (current > 3.5) return 'text-red-600'
  if (current > 3.3) return 'text-yellow-600'
  return 'text-green-600'
}

const getTemperatureClass = (temp) => {
  if (temp > 50) return 'text-red-600'
  if (temp > 40) return 'text-yellow-600'
  return 'text-green-600'
}

const getGasClass = (type, value) => {
  if (type === 'co') {
    if (value > 20) return 'text-red-600'
    if (value > 15) return 'text-yellow-600'
  } else if (type === 'ch4') {
    if (value > 1.0) return 'text-red-600'
    if (value > 0.8) return 'text-yellow-600'
  }
  return 'text-green-600'
}

const getO2Class = (o2) => {
  if (o2 < 19.5 || o2 > 23.5) return 'text-red-600'
  return 'text-green-600'
}

const getAxisClass = (value) => {
  if (Math.abs(value) > 2.0) return 'text-red-600'
  if (Math.abs(value) > 1.5) return 'text-yellow-600'
  return 'text-green-600'
}

const getStatusText = (status) => {
  const statusMap = {
    normal: '正常',
    warning: '警告', 
    error: '异常'
  }
  return statusMap[status] || '未知'
}

const getStatusTextClass = (status) => {
  const classMap = {
    normal: 'text-green-600',
    warning: 'text-yellow-600',
    error: 'text-red-600'
  }
  return classMap[status] || 'text-gray-600'
}
</script>

<style scoped>
.status-indicator {
  width: 12px;
  height: 12px;
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