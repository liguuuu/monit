<template>
  <div class="humidity-chart-container">
    <h3 class="chart-title">甲烷最高浓度点</h3>
    <div ref="chartContainer" class="chart-wrapper"></div>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted, nextTick, watch } from 'vue'
import echarts from '../../utils/echarts'

const props = defineProps({
  connectors: {
    type: Array,
    default: () => []
  }
})

const chartContainer = ref(null)
let chartInstance = null

// 存储最近5分钟的数据点 (时间戳, { maxCh4, connectorNo })
const dataHistory = ref([])
const MAX_DATA_POINTS = 60 // 5分钟，假设每5秒更新一次

// 获取所有连接器的CH4最大值及对应的连接器编号
const getMaxCh4 = () => {
  if (!props.connectors || props.connectors.length === 0) {
    return { maxCh4: null, connectorNo: null }
  }
  
  let maxCh4 = null
  let maxConnectorNo = null
  
  props.connectors.forEach((connector) => {
    const envC = connector.environmentC || {}
    const ch4 = envC.ch4
    const deviceNo = connector.device_no ?? connector.id
    
    if (typeof ch4 === 'number' && !isNaN(ch4)) {
      if (maxCh4 === null || ch4 > maxCh4) {
        maxCh4 = ch4
        maxConnectorNo = deviceNo
      }
    }
  })
  
  return { maxCh4, connectorNo: maxConnectorNo }
}

// 添加数据点到历史记录
const addDataPoint = () => {
  const { maxCh4, connectorNo } = getMaxCh4()
  
  if (maxCh4 !== null && connectorNo !== null) {
    const now = Date.now()
    dataHistory.value.push({
      time: now,
      maxCh4,
      connectorNo
    })
    
    // 只保留最近5分钟的数据（300000毫秒）
    const fiveMinutesAgo = now - 300000
    dataHistory.value = dataHistory.value.filter(item => item.time >= fiveMinutesAgo)
    
    // 限制数据点数量，避免过多
    if (dataHistory.value.length > MAX_DATA_POINTS) {
      dataHistory.value = dataHistory.value.slice(-MAX_DATA_POINTS)
    }
  }
}

// 格式化时间
const formatTime = (timestamp) => {
  const date = new Date(timestamp)
  const hours = String(date.getHours()).padStart(2, '0')
  const minutes = String(date.getMinutes()).padStart(2, '0')
  const seconds = String(date.getSeconds()).padStart(2, '0')
  return `${hours}:${minutes}:${seconds}`
}

// 初始化折线图
const initChart = () => {
  if (!chartContainer.value) return

  chartInstance = echarts.init(chartContainer.value)
  updateData()
  window.addEventListener('resize', handleResize)
}

// 更新图表
const updateData = () => {
  if (!chartInstance) return
  nextTick(() =>{  
    // 准备数据
    const timeData = dataHistory.value.map(item => formatTime(item.time))
    const valueData = dataHistory.value.map(item => ({
      value: item.maxCh4,
      connectorNo: item.connectorNo
    }))

    const option = {
      backgroundColor: 'transparent',
      tooltip: {
        trigger: 'axis',
        borderColor: '#40e0d0',
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        textStyle: {
          color: '#fff',
          fontSize: 14
        },
        formatter: (params) => {
          const param = params[0]
          const dataIndex = param.dataIndex
          const dataItem = dataHistory.value[dataIndex]
          if (dataItem) {
            return `时间: ${param.name}<br/>连接器${dataItem.connectorNo}，CH4浓度为${dataItem.maxCh4}%`
          }
          return `${param.name}<br/>CH4浓度: ${param.value}%`
        }
      },
      grid: {
        left: '10%',
        right: '8%',
        top: '15%',
        bottom: '20%'
      },
      xAxis: {
        type: 'category',
        data: timeData,
        name: '时间',
        nameTextStyle: {
          color: '#fff'
        },
        axisLabel: {
          color: '#fff',
          rotate: 45
        },
        axisLine: {
          lineStyle: {
            color: '#40e0d0'
          }
        },
        splitLine: {
          show: false
        }
      },
      yAxis: {
        type: 'value',
        name: 'CH4浓度 (%)',
        nameTextStyle: {
          color: '#fff'
        },
        axisLabel: {
          color: '#fff',
          formatter: '{value}%'
        },
        axisLine: {
          lineStyle: {
            color: '#40e0d0'
          }
        },
        splitLine: {
          lineStyle: {
            color: 'rgba(64, 224, 208, 0.2)'
          }
        }
      },
      series: [
        {
          name: 'CH4最高浓度',
          type: 'line',
          data: valueData,
          smooth: true,
          symbol: 'circle',
          symbolSize: 6,
          lineStyle: {
            color: '#40e0d0',
            width: 2
          },
          itemStyle: {
            color: '#40e0d0'
          },
          areaStyle: {
            color: {
              type: 'linear',
              x: 0,
              y: 0,
              x2: 0,
              y2: 1,
              colorStops: [
                { offset: 0, color: 'rgba(64, 224, 208, 0.3)' },
                { offset: 1, color: 'rgba(64, 224, 208, 0.05)' }
              ]
            }
          },
          emphasis: { focus: 'series' },
          showSymbol: false
        }
      ]
    }

    chartInstance.setOption(option)
  })
}

// 响应式调整
const handleResize = () => {
  if (chartInstance) {
    chartInstance.resize()
  }
}

let updateTimer = null

// 监听connectors变化
watch(() => props.connectors, () => {
  addDataPoint()
  updateData()
}, { deep: true })

onMounted(() => {
  nextTick(() => {
    initChart()
    // 初始化时添加第一个数据点
    addDataPoint()
    updateData()
    
    // 每5秒更新一次数据
    updateTimer = setInterval(() => {
      addDataPoint()
      updateData()
    }, 5000)
  })
})

onUnmounted(() => {
  window.removeEventListener('resize', handleResize)
  if (updateTimer) {
    clearInterval(updateTimer)
    updateTimer = null
  }
  if (chartInstance) {
    chartInstance.dispose()
    chartInstance = null
  }
})

// 暴露方法供父组件调用
defineExpose({
  updateData
})
</script>

<style scoped>
.humidity-chart-container {
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
}

.chart-title {
  font-size: 18px;
  font-weight: bold;
  color: #40e0d0;
  margin-bottom: 10px;
  text-align: center;
  text-shadow: 0 0 10px rgba(64, 224, 208, 0.5);
}

.chart-wrapper {
  flex: 1;
  width: 100%;
  min-height: 0;
}
</style>
