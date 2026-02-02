<template>
  <div class="bg-white rounded-xl shadow-md overflow-hidden card-hover h-full">
    <!-- 卡片头部 -->
    <div class="p-4 border-b border-gray-100">
      <div class="flex justify-between items-center mb-2">
        <h3 class="font-semibold text-lg">{{ connector.displayName || connector.name }}</h3>
        <div class="flex items-center gap-2">
          <span :class="`status-indicator status-${connector.status}`"></span>
          <button 
            @click="toggleView" 
            class="switch-view-btn"
            :title="isChartView ? '切换到列表视图' : '切换到图表视图'"
          >
            <i :class="isChartView ? 'fas fa-list' : 'fas fa-chart-line'"></i>
          </button>
        </div>
      </div>
      <p class="text-gray-500 text-sm">{{ connector.location }}</p>
    </div>

    <!-- 列表视图 -->
    <div v-if="!isChartView" class="p-4 space-y-4 max-h-96 overflow-y-auto">
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
            <span class="text-gray-600">电流1:</span>
            <span :class="getCurrentClass(connector.environmentA.current1)">{{ connector.environmentA.current1 }}A</span>
          </div>
          <div class="flex justify-between">
            <span class="text-gray-600">电压2:</span>
            <span :class="getVoltageClass(connector.environmentA.voltage2)">{{ connector.environmentA.voltage2 }}V</span>
          </div>
          <div class="flex justify-between">
            <span class="text-gray-600">电流2:</span>
            <span :class="getCurrentClass(connector.environmentA.current2)">{{ connector.environmentA.current2 }}A</span>
          </div>
          <div class="flex justify-between">
            <span class="text-gray-600">电压3:</span>
            <span :class="getVoltageClass(connector.environmentA.voltage3)">{{ connector.environmentA.voltage3 }}V</span>
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
            <span class="text-gray-600">气压1:</span>
            <span>{{ connector.environmentB.atmosphericPressure1 }}hPa</span>
          </div>
          <div class="flex justify-between">
            <span class="text-gray-600">湿度2:</span>
            <span>{{ connector.environmentB.humidity2 }}%</span>
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
            <span class="text-gray-600">温度:</span>
            <span>{{ connector.environmentC.temperature }}°C</span>
          </div>
          <div class="flex justify-between">
            <span class="text-gray-600">CH4:</span>
            <span :class="getGasClass('ch4', connector.environmentC.ch4)">{{ connector.environmentC.ch4 }}%LEL</span>
          </div>
          <div class="flex justify-between">
            <span class="text-gray-600">湿度:</span>
            <span>{{ connector.environmentC.humidity }}%</span>
          </div>
          <div class="flex justify-between">
            <span class="text-gray-600">O2:</span>
            <span :class="getO2Class(connector.environmentC.o2)">{{ connector.environmentC.o2 }}%</span>
          </div>
        </div>
      </div>

      <!-- 环境编号D：位置信息 -->
      <div class="border rounded-lg p-3">
        <h4 class="font-medium text-orange-600 mb-2 flex items-center">
          <i class="fas fa-map-marker-alt mr-2"></i>环境D - 位置信息
        </h4>
        <div class="text-center">
          <div :class="getPositionStatusClass(connector.environmentD)" class="text-lg font-bold py-2">
            {{ getPositionStatus(connector.environmentD) }}
          </div>
        </div>
      </div>
    </div>

    <!-- 折线图视图 -->
    <div v-else class="p-4">
      <!-- Tabs标签页 -->
      <div class="flex border-b border-gray-200 mb-4">
        <button
          v-for="tab in tabs"
          :key="tab.value"
          @click="activeTab = tab.value"
          :class="[
            'px-4 py-2 text-sm font-medium transition-colors border-b-2',
            activeTab === tab.value
              ? 'text-blue-600 border-blue-600'
              : 'text-gray-500 border-transparent hover:text-gray-700 hover:border-gray-300'
          ]"
        >
          {{ tab.label }}
        </button>
      </div>

      <!-- 图表容器 -->
      <div 
        v-for="tab in tabs"
        :key="tab.value">
        <div
          v-if="activeTab === tab.value"
          :ref="el => setChartRef(el, tab.value)"
          class="chart-container"
          :style="{ height: '300px' }"
        ></div>
      </div>
    </div>

    <!-- 卡片底部 -->
    <div class="p-4 border-t border-gray-100 bg-gray-50">
      <div class="flex justify-between items-center">
        <span class="text-xs text-gray-500">最后更新: {{ formattedLastUpdate }}</span>
        <router-link 
          :to="getReturnPath()" 
          class="text-blue-500 hover:text-blue-700 text-sm font-medium flex items-center"
        >
          历史数据 <i class="fas fa-arrow-right ml-1 text-xs"></i>
        </router-link>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed, onMounted, onUnmounted, ref, watch, nextTick } from 'vue'
import { useRoute } from 'vue-router'
import echarts from '../utils/echarts'
import { initWebSocket, getWebSocketClient } from '../utils/websocket'
 

const route = useRoute()
const props = defineProps({
  connector: { type: Object, required: true },
  currentTab: {type: String, default: 'all' },
  initialIsChart: {type: Boolean, default: false },
  savedHistory: {type: Array, default: () => [] } //接受保存的历史
})

const emit = defineEmits(['update-view', 'update-history'])

// 视图状态
const isChartView = ref(props.initialIsChart)
const activeTab = ref('environmentA')

// 历史数据存储（5分钟内）
const historyData = ref([...props.savedHistory])

const MAX_HISTORY_TIME = 5 * 60 * 1000 // 5分钟

// 图表实例
const chartRefs = ref({})
const chartInstances = {}

// Tabs配置
const tabs = [
  { label: '环境A', value: 'environmentA' },
  { label: '环境B', value: 'environmentB' },
  { label: '环境C', value: 'environmentC' }
]

const legendStatus = ref({
  environmentA: {},
  environmentB: {},
  environmentC: {}
})

// 当前时间，用于实时更新显示
const currentTime = ref(Date.now())

// 定时器ID
let updateTimer = null
let dataCollectionTimer = null
let wsClient = null

// 设置图表引用
const setChartRef = (el, key) => {
  if (el) {
    chartRefs.value[key] = el
  }
}

// 获取返回路径
const getReturnPath = () => {
  const deviceNo = props.connector.device_no ?? props.connector.id
  return `/history/${deviceNo}?fromArea=${props.currentTab}`
}

// 获取连接器的最后更新时间戳
const getLastUpdateTime = () => {
  if (props.connector.lastUpdateTime) {
    return props.connector.lastUpdateTime
  }
  return Date.now()
}

// 格式化时间差
const formatTimeAgo = (timestamp) => {
  const now = currentTime.value
  const diff = Math.floor((now - timestamp) / 1000)
  
  if (diff < 0) {
    return '刚刚'
  }
  
  if (diff < 60) {
    return `${diff}秒前`
  }
  
  const hours = Math.floor(diff / 3600)
  const minutes = Math.floor((diff % 3600) / 60)
  const seconds = diff % 60
  
  if (hours > 0) {
    return `${hours}小时${minutes}分钟${seconds}秒前`
  } else {
    return `${minutes}分钟${seconds}秒前`
  }
}

// 计算属性：格式化的最后更新时间
const formattedLastUpdate = computed(() => {
  const lastUpdateTime = getLastUpdateTime()
  return formatTimeAgo(lastUpdateTime)
})

// 切换视图
const toggleView = () => {
  isChartView.value = !isChartView.value
  emit('update-view', isChartView.value)
  if (isChartView.value) {
    nextTick(() => {
      initCharts()
    })
  } else {
    disposeCharts()
  }
}

// 收集历史数据
const addHistoryData = () => {
  const now = Date.now()
  const envA = props.connector.environmentA || {}
  const envB = props.connector.environmentB || {}
  const envC = props.connector.environmentC || {}
  
  // 计算平均值
  const voltageAvg = [
    envA.voltage1, envA.voltage2, envA.voltage3
  ].filter(v => typeof v === 'number' && !isNaN(v))
  const voltage = voltageAvg.length > 0 
    ? voltageAvg.reduce((sum, v) => sum + v, 0) / voltageAvg.length
    : null
  
  const currentAvg = [
    envA.current1, envA.current2, envA.current3
  ].filter(c => typeof c === 'number' && !isNaN(c))
  const current = currentAvg.length > 0
    ? currentAvg.reduce((sum, c) => sum + c, 0) / currentAvg.length
    : null
  
  const tempBAvg = [
    envB.temperature1, envB.temperature2, envB.temperature3,
    envB.temperature4, envB.temperature5, envB.temperature6
  ].filter(t => typeof t === 'number' && !isNaN(t))
  const temperatureB = tempBAvg.length > 0
    ? Number((tempBAvg.reduce((sum, t) => sum + t, 0) / tempBAvg.length).toFixed(2))
    : null
  
  const humidityBAvg = [envB.humidity1, envB.humidity2]
    .filter(h => typeof h === 'number' && !isNaN(h))
  const humidityB = humidityBAvg.length > 0
    ? Number((humidityBAvg.reduce((sum, h) => sum + h, 0) / humidityBAvg.length).toFixed(2))
    : null
  
  const pressureBAvg = [envB.atmosphericPressure1, envB.atmosphericPressure2]
    .filter(p => typeof p === 'number' && !isNaN(p))
  const pressureB = pressureBAvg.length > 0
    ? pressureBAvg.reduce((sum, p) => sum + p, 0) / pressureBAvg.length
    : null
  
  historyData.value.push({
    time: now,
    voltage,
    current,
    temperatureB,
    humidityB,
    pressureB,
    co: envC.co,
    ch4: envC.ch4,
    o2: envC.o2,
    temperatureC: envC.temperature,
    humidityC: envC.humidity
  })
  
  // 只保留最近5分钟的数据
  const fiveMinutesAgo = now - MAX_HISTORY_TIME
  historyData.value = historyData.value.filter(item => item.time >= fiveMinutesAgo)

  emit('update-history', [...historyData.value])
}

// 计算Y轴范围（动态缩放）
const calculateYAxisRange = (data, paddingPercent = 0.1) => {
  const validData = data.filter(v => v !== null && v !== undefined && !isNaN(v))
  // 如果没有有效数据，返回默认整数范围
  if (validData.length === 0) return [0, 100]
  
  const min = Math.min(...validData)
  const max = Math.max(...validData)
  const range = max - min
  
  let padding

  if(range == 0){
    padding = Math.abs(min) * 0.2 || 1
  }else {
    padding = range * 0.3
  }
  // 即使 range 为 0（数据全是同一个值），也给一个默认偏移量
  // const padding = range * paddingPercent || (Math.abs(max) * 0.1) || 1
  
  // 使用 Math.floor 确保下限为整数，Math.ceil 确保上限为整数
  return [
    Math.floor(min - padding), 
    Math.ceil(max + padding)
  ]
}

// 初始化图表
const initCharts = () => {
  // 仅初始化当前活动的 Tab，其他的在切换时再初始化
  initSingleChart(activeTab.value)
}

// 销毁图表
const disposeCharts = () => {
  Object.keys(chartInstances).forEach(key => {
    if (chartInstances[key]) {
      chartInstances[key].dispose()
      chartInstances[key] = null // 显式置空
    }
  })
}

// 更新所有图表
const updateAllCharts = () => {
  if (isChartView.value) {
    updateChart(activeTab.value) // 只更新当前激活的，其他的等切换时再更新
  }
}

const updateActiveChart = () => {
  if (isChartView.value && chartInstances[activeTab.value]) {
    // 只更新当前看得到的图表
    updateChart(activeTab.value)
  }
}

// 更新图表
const updateChart = (tabValue) => {
  const instance = chartInstances[tabValue]
  if (!instance) return
  
  // 再次确保尺寸正确
  instance.resize()

  // 准备时间数据
  const timeData = historyData.value.map(item => {
    const date = new Date(item.time)
    const minutes = String(date.getMinutes()).padStart(2, '0')
    const seconds = String(date.getSeconds()).padStart(2, '0')
    return `${minutes}:${seconds}`
  })
  
  let option = {}
  const currentSavedStatus = legendStatus.value[tabValue]
  
  if (tabValue === 'environmentA') {
    // 环境A：电压和电流的双Y轴折线图
    const voltageData = historyData.value.map(item => item.voltage)
    const currentData = historyData.value.map(item => item.current)
    
    const voltageRange = calculateYAxisRange(voltageData)
    const currentRange = calculateYAxisRange(currentData)
    
    option = {
      backgroundColor: 'transparent',
      tooltip: {
        trigger: 'axis',
        axisPointer: {
          type: 'cross'
        },
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        borderColor: '#40e0d0',
        textStyle: { color: '#fff' },

        formatter: function (params) {
          let result = params[0].axisValue + '<br/>'
          params.forEach(item => {
            const value = item.value != null ? Math.round(item.value) : '-'
            result += `
              <span style="display:inline-block;margin-right:5px;
              border-radius:10px;width:9px;height:9px;
              background-color:${item.color}"></span>
              ${item.seriesName}: ${value}<br/>
            `
          })
          return result
        }
      },
      legend: {
        data: ['电压平均值', '电流平均值'],
        textStyle: { color: '#333' },
        selected: currentSavedStatus
      },
      grid: {
        left: '3%', 
        right: '5%',
        bottom: '3%',
        top: '20%',
        containLabel: true
      },
      xAxis: {
        type: 'category',
        boundaryGap: false,
        data: timeData,
        axisLine: { 
          onZero: false,
          lineStyle: { color: '#666' } 
        },
        axisLabel: { color: '#666', rotate: 45 }
      },
      yAxis: [
        {
          type: 'value',
          name: '电压(V)',
          position: 'left',
          min: voltageRange[0],
          max: voltageRange[1],
          minInterval: 1,
          axisLine: { lineStyle: { color: '#5470c6' } },
          axisLabel: { color: '#666', formatter: '{value}' },
          splitLine: { show: false }
        },
        {
          type: 'value',
          name: '电流(A)',
          position: 'right',
          min: currentRange[0],
          max: currentRange[1],
          minInterval: 1,
          axisLine: { lineStyle: { color: '#91cc75' } },
          axisLabel: { color: '#666', formatter: '{value}' },
          splitLine: { show: false }
        }
      ],
      series: [
        {
          name: '电压平均值',
          type: 'line',
          yAxisIndex: 0,
          smooth: true,
          data: voltageData,
          itemStyle: { color: '#5470c6' },
          lineStyle: { width: 2 },
          emphasis: { focus: 'series' },
          showSymbol: false
        },
        {
          name: '电流平均值',
          type: 'line',
          yAxisIndex: 1,
          smooth: true,
          data: currentData,
          itemStyle: { color: '#91cc75' },
          lineStyle: { width: 2 },
          emphasis: { focus: 'series' },
          showSymbol: false
        }
      ]
    }   
  } else if (tabValue === 'environmentB') {
    // 环境B：温度、湿度、气压的多Y轴折线图
    const temperatureData = historyData.value.map(item => item.temperatureB)
    const humidityData = historyData.value.map(item => item.humidityB)
    const pressureData = historyData.value.map(item => item.pressureB)
    
    const tempRange = calculateYAxisRange(temperatureData)
    const humidityRange = calculateYAxisRange(humidityData)
    const pressureRange = calculateYAxisRange(pressureData)
    
    option = {
      backgroundColor: 'transparent',
      tooltip: {
        trigger: 'axis',
        axisPointer: { type: 'cross' },
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        borderColor: '#40e0d0',
        textStyle: { color: '#fff' }
      },
      legend: {
        data: ['温度平均值', '湿度平均值', '气压平均值'],
        textStyle: { color: '#333' },
        selected: currentSavedStatus
      },
      grid: {
        left: '3%',
        right: '10%',
        bottom: '3%',
        top: '20%',
        containLabel: true
      },
      xAxis: {
        type: 'category',
        boundaryGap: false,
        data: timeData,
        axisLine: { 
          onZero: false,
          lineStyle: { color: '#666' } },
        axisLabel: { color: '#666', rotate: 45 }
      },
      yAxis: [
        {
          type: 'value',
          name: '温度(°C)',
          position: 'left',
          min: tempRange[0],
          max: tempRange[1],
          minInterval: 1,
          axisLine: { lineStyle: { color: '#fac858' } },
          axisLabel: { color: '#666', formatter: '{value}' },
          splitLine: { show: false }
        },
        {
          type: 'value',
          name: '湿度(%)',
          position: 'right',
          offset: 0,
          min: humidityRange[0],
          max: humidityRange[1],
          minInterval: 1,
          axisLine: { lineStyle: { color: '#73c0de' } },
          axisLabel: { color: '#666', formatter: '{value}' },
          splitLine: { show: false }
        },
        {
          type: 'value',
          name: '气压(hPa)',
          position: 'right',
          offset: 50,
          min: pressureRange[0],
          max: pressureRange[1],
          minInterval: 1,
          axisLine: { lineStyle: { color: '#3ba272' } },
          axisLabel: { color: '#666', formatter: '{value}' },
          splitLine: { show: false }
        }
      ],
      series: [
        {
          name: '温度平均值',
          type: 'line',
          yAxisIndex: 0,
          smooth: true,
          data: temperatureData,
          itemStyle: { color: '#fac858' },
          lineStyle: { width: 2 },
          emphasis: { focus: 'series' },
          showSymbol: false
        },
        {
          name: '湿度平均值',
          type: 'line',
          yAxisIndex: 1,
          smooth: true,
          data: humidityData,
          itemStyle: { color: '#73c0de' },
          lineStyle: { width: 2 },
          emphasis: { focus: 'series' },
          showSymbol: false
        },
        {
          name: '气压平均值',
          type: 'line',
          yAxisIndex: 2,
          smooth: true,
          data: pressureData,
          itemStyle: { color: '#3ba272' },
          lineStyle: { width: 2 },
          emphasis: { focus: 'series' },
          showSymbol: false
        }
      ]
    }
  } else if (tabValue === 'environmentC') {
    // 环境C：CO、CH4、O2、温度、湿度的多Y轴折线图
    const coData = historyData.value.map(item => item.co)
    const ch4Data = historyData.value.map(item => item.ch4)
    const o2Data = historyData.value.map(item => item.o2)
    const temperatureCData = historyData.value.map(item => item.temperatureC)
    const humidityCData = historyData.value.map(item => item.humidityC)
    
    const coRange = calculateYAxisRange(coData)
    const ch4Range = calculateYAxisRange(ch4Data)
    const o2Range = calculateYAxisRange(o2Data)
    const tempCRange = calculateYAxisRange(temperatureCData)
    const humidityCRange = calculateYAxisRange(humidityCData)
    
    option = {
      backgroundColor: 'transparent',
      tooltip: {
        trigger: 'axis',
        axisPointer: { type: 'cross' },
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        borderColor: '#40e0d0',
        textStyle: { color: '#fff' }
      },
      legend: {
        data: ['CO', 'CH4', 'O2', '温度', '湿度'],
        textStyle: { color: '#333' },
        selected: currentSavedStatus
      },
      grid: {
        left: '3%',
        right: '15%',
        bottom: '3%',
        top: '20%',
        containLabel: true
      },
      xAxis: {
        type: 'category',
        boundaryGap: false,
        data: timeData,
        axisLine: { 
          onZero: false,
          lineStyle: { color: '#666' } },
        axisLabel: { color: '#666', rotate: 45 }
      },
      yAxis: [
        {
          type: 'value',
          name: 'CO(ppm)',
          position: 'left',
          min: coRange[0],
          max: coRange[1],
          minInterval: 1,
          axisLine: { lineStyle: { color: '#ee6666' } },
          axisLabel: { color: '#666', formatter: '{value}' },
          splitLine: { show: false }
        },
        {
          type: 'value',
          name: 'CH4(%LEL)',
          position: 'right',
          offset: 0,
          min: ch4Range[0],
          max: ch4Range[1],
          minInterval: 1,
          axisLine: { lineStyle: { color: '#fc8452' } },
          axisLabel: { color: '#666', formatter: '{value}' },
          splitLine: { show: false }
        },
        {
          type: 'value',
          name: 'O2(%)',
          position: 'right',
          offset: 50,
          min: o2Range[0],
          max: o2Range[1],
          minInterval: 1,
          axisLine: { lineStyle: { color: '#9a60b4' } },
          axisLabel: { color: '#666', formatter: '{value}' },
          splitLine: { show: false }
        },
        {
          type: 'value',
          name: '温度(°C)',
          position: 'right',
          offset: 100,
          min: tempCRange[0],
          max: tempCRange[1],
          minInterval: 1,
          axisLine: { lineStyle: { color: '#fac858' } },
          axisLabel: { color: '#666', formatter: '{value}' },
          splitLine: { show: false }
        },
        {
          type: 'value',
          name: '湿度(%)',
          position: 'right',
          offset: 150,
          min: humidityCRange[0],
          max: humidityCRange[1],
          minInterval: 1,
          axisLine: { lineStyle: { color: '#73c0de' } },
          axisLabel: { color: '#666', formatter: '{value}' },
          splitLine: { show: false }
        }
      ],
      series: [
        {
          name: 'CO',
          type: 'line',
          yAxisIndex: 0,
          smooth: true,
          data: coData,
          itemStyle: { color: '#ee6666' },
          lineStyle: { width: 2 },
          emphasis: { focus: 'series' },
          showSymbol: false
        },
        {
          name: 'CH4',
          type: 'line',
          yAxisIndex: 1,
          smooth: true,
          data: ch4Data,
          itemStyle: { color: '#fc8452' },
          lineStyle: { width: 2 },
          emphasis: { focus: 'series' },
          showSymbol: false
        },
        {
          name: 'O2',
          type: 'line',
          yAxisIndex: 2,
          smooth: true,
          data: o2Data,
          itemStyle: { color: '#9a60b4' },
          lineStyle: { width: 2 },
          emphasis: { focus: 'series' },
          showSymbol: false
        },
        {
          name: '温度',
          type: 'line',
          yAxisIndex: 3,
          smooth: true,
          data: temperatureCData,
          itemStyle: { color: '#fac858' },
          lineStyle: { width: 2 },
          emphasis: { focus: 'series' },
          showSymbol: false
        },
        {
          name: '湿度',
          type: 'line',
          yAxisIndex: 4,
          smooth: true,
          data: humidityCData,
          itemStyle: { color: '#73c0de' },
          lineStyle: { width: 2 },
          emphasis: { focus: 'series' },
          showSymbol: false
        }
      ]
    }
  }
  // 根据保存的状态初始化 Y 轴显示
  if (currentSavedStatus && Object.keys(currentSavedStatus).length > 0) {
    option.yAxis = option.yAxis.map((axis, index) => {
      // 检查是否有属于该 Y 轴的 series 处于“未被关闭”状态
      const isVisible = option.series.some(s => 
        (s.yAxisIndex || 0) === index && currentSavedStatus[s.name] !== false
      );
      return { ...axis, show: isVisible };
    });
  }
  // 监听图例点击事件，实现开启/关闭曲线
  instance.off('legendselectchanged'); 
  instance.on('legendselectchanged', (params) => {
    // 1. 持久化保存状态
    legendStatus.value[tabValue] = params.selected;
    
    // 2. 实时刷新图例对应的 Y 轴显示，无需等待下一次数据轮询
    const currentOpt = instance.getOption();
    const newYAxis = currentOpt.yAxis.map((axis, index) => {
      const isVisible = currentOpt.series.some(s => 
        (s.yAxisIndex || 0) === index && params.selected[s.name] !== false
      );
      return { ...axis, show: isVisible };
    });

    instance.setOption({ 
      legend: { selected: params.selected },
      yAxis: newYAxis 
    })
  })
  // 公共 UI 配置
  option.dataZoom = [
  {
    type: 'inside',
    xAxisIndex: 0,
    orient: 'horizontal',
    zoomOnMouseWheel: true,
    moveOnMouseMove: true,
    moveOnMouseWheel: false,
    filterMode: 'none',
    // 滚轮缩放速度，越小越平滑
    zoomLock: false, 
    throttle: 10 // 只有在拖动停止后才触发的高频控制
  }
]

  option.animation = false

  instance.setOption(option, { notMerge: false })

  instance.resize()
  
  // 监听窗口大小变化
  // window.addEventListener('resize', () => {
  //   if (instance) instance.resize()
  // })
}



// 监听connector变化，收集数据
watch(() => props.connector, () => {
  if (isChartView.value) {
    addHistoryData()
    updateActiveChart()
  }
}, { deep: true })

// 监听activeTab变化，更新当前图表
watch(activeTab, async (newTab) => {
  if (isChartView.value) {
    // 等待 DOM 更新（v-if 创建新元素）
    await nextTick()
    await nextTick() // 双重 nextTick 更保险，确保浏览器 layout 完成

    const el = chartRefs.value[newTab]
    if (!el) return

    // 销毁旧实例（虽然 v-if 已销毁 DOM，但保险起见）
    if (chartInstances[newTab]) {
      chartInstances[newTab].dispose()
    }

    // 初始化新实例
    chartInstances[newTab] = echarts.init(el)
    updateChart(newTab)
  }
})

// 2. 抽取单个图表的初始化函数
const initSingleChart = (tabValue) => {
  const el = chartRefs.value[tabValue]
  if (el && el.clientWidth > 0 && !chartInstances[tabValue]){
    chartInstances[tabValue] = echarts.init(el)
    updateChart(tabValue)
  } else if (el && chartInstances[tabValue]) {
    chartInstances[tabValue].resize()
    updateChart(tabValue)
  }
}

onMounted(() => {
  // 每秒更新一次当前时间
  updateTimer = setInterval(() => {
    currentTime.value = Date.now()
  }, 1000)

  if (isChartView.value){
    nextTick(() => {
      initCharts()
    })
  }
  
  // 开始收集历史数据（每5秒收集一次）
  addHistoryData() // 立即收集一次
  dataCollectionTimer = setInterval(() => {
    if (isChartView.value) {
      addHistoryData()
      updateAllCharts()
    }
  }, 5000)
})

onUnmounted(() => {
  for (const key in chartInstances) {
    if (chartInstances[key]) {
      chartInstances[key].dispose()
      delete chartInstances[key]
    }
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

// 判断位置是否发生变化
const isPositionChanged = (envD) => {
  if (!envD) return false
  
  const x = envD.d_x?.value ?? 0
  const y = envD.d_y?.value ?? 0
  const z = envD.d_z?.value ?? 0
  
  const threshold = 1.5
  const xInRange = Math.abs(x) <= threshold
  const yInRange = Math.abs(y) <= threshold
  const zInRange = Math.abs(z) <= threshold
  
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

.switch-view-btn {
  padding: 4px 8px;
  background: #f3f4f6;
  border: 1px solid #d1d5db;
  border-radius: 4px;
  cursor: pointer;
  color: #6b7280;
  font-size: 14px;
  transition: all 0.2s; 
  display: flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
}

.switch-view-btn:hover {
  background: #e5e7eb;
  border-color: #9ca3af;
  color: #374151;
}

.chart-container {
  width: 100%;
  height: 300px;
  min-height: 300px;
}
</style>