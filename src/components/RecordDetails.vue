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

    <!-- 环境D：位置信息 -->
    <div class="border rounded-lg p-4">
      <h4 class="font-bold text-lg text-orange-600 mb-4 flex items-center">
        <i class="fas fa-map-marker-alt mr-2"></i>环境D - 位置信息
      </h4>
      <div class="text-center p-4 bg-orange-50 rounded-lg">
        <div :class="getPositionStatusClass(record.environmentD)" class="text-2xl font-bold">
          {{ getPositionStatus(record.environmentD) }}
        </div>
      </div>
    </div>

    <!-- 状态总结 -->
    <div class="border rounded-lg p-4 bg-gray-50">
      <h4 class="font-bold text-lg text-gray-700 mb-4">状态总结</h4>
      <div class="flex items-center justify-between mb-3">
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
      <!-- 状态信息（仅异常或警告数据显示） -->
      <div v-if="record.status === 'error' || record.status === 'warning'" class="mt-3 pt-3 border-t border-gray-200">
        <div class="flex items-center justify-between">
          <span class="text-sm font-medium text-gray-700">处理状态：</span>
          <span :class="getWarningStateClass(record.warningState)" class="text-sm font-bold">
            {{ record.warningState || '未解决' }}
          </span>
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
  if (value === undefined || value === null) return 'text-gray-400'; // 防止传入 undefined
  if (Math.abs(value) > 2.0) return 'text-red-600';
  if (Math.abs(value) > 1.5) return 'text-yellow-600';
  return 'text-green-600';
}

// 判断位置是否发生变化
// 如果X、Y、Z的值都在[-1.5, 1.5]区间内，则位置未发生变化
// 否则位置发生变化
const isPositionChanged = (envD) => {
  if (!envD) return false
  
  const x = envD.d_x?.value ?? 0
  const y = envD.d_y?.value ?? 0
  const z = envD.d_z?.value ?? 0
  
  const threshold = 1.5
  const xInRange = Math.abs(x) <= threshold
  const yInRange = Math.abs(y) <= threshold
  const zInRange = Math.abs(z) <= threshold
  
  // 如果X、Y、Z都在区间内，位置未发生变化
  return !(xInRange && yInRange && zInRange)
}

// 获取位置状态文本
const getPositionStatus = (envD) => {
  if (!envD) return '数据缺失'
  return isPositionChanged(envD) ? '位置发生变化' : '位置未发生变化'
}

// 获取位置状态样式
const getPositionStatusClass = (envD) => {
  if (!envD) return 'text-gray-400'
  return isPositionChanged(envD) ? 'text-red-600' : 'text-green-600'
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

// 获取warning状态样式
const getWarningStateClass = (state) => {
  if (state === '已解除') return 'text-green-600'
  return 'text-red-600'
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