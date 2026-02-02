<template>
  <div class="current-chart-container">
    <h3 class="chart-title">电流数据</h3>
    <div ref="chartContainer" class="chart-wrapper"></div>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted, nextTick } from 'vue'
import echarts from '../../utils/echarts'

const chartContainer = ref(null)
let chartInstance = null
const maxDataPoints = 100 // 最多保留100个数据点

// 数据存储
const timeData = ref([])
const current1Data = ref([])
const current2Data = ref([])
const current3Data = ref([])

// 初始化图表
const initChart = () => {
  if (!chartContainer.value) return

  chartInstance = echarts.init(chartContainer.value)

  const option = {
    backgroundColor: 'transparent',
    tooltip: {
      trigger: 'axis',
      axisPointer: {
        type: 'cross'
      },
      backgroundColor: 'rgba(0, 0, 0, 0.8)',
      borderColor: '#40e0d0',
      borderWidth: 1,
      textStyle: {
        color: '#fff'
      }
    },
    legend: {
      data: ['电流1', '电流2', '电流3'],
      textStyle: {
        color: '#fff'
      },
      top: 0
    },
    grid: {
      left: '8%',
      right: '4%',
      bottom: '20%',
      top: '15%',
      containLabel: false
    },
    xAxis: {
      type: 'category',
      boundaryGap: false,
      data: timeData.value,
      axisLine: {
        lineStyle: {
          color: '#40e0d0'
        }
      },
      axisLabel: {
        color: '#fff',
        rotate: 45
      }
    },
    yAxis: {
      type: 'value',
      name: '电流值(A)',
      nameTextStyle: {
        color: '#fff'
      },
      axisLine: {
        lineStyle: {
          color: '#40e0d0'
        }
      },
      axisLabel: {
        color: '#fff'
      },
      splitLine: {
        lineStyle: {
          color: 'rgba(64, 224, 208, 0.2)'
        }
      }
    },
    series: [
      {
        name: '电流1',
        type: 'line',
        // stack: 'Total',
        smooth: true,
        data: current1Data.value,
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
              { offset: 1, color: 'rgba(64, 224, 208, 0.1)' }
            ]
          }
        },
        emphasis: { focus: 'series' },
        showSymbol: false
      },
      {
        name: '电流2',
        type: 'line',
        // stack: 'Total',
        smooth: true,
        data: current2Data.value,
        itemStyle: {
          color: '#ff8c00'
        },
        areaStyle: {
          color: {
            type: 'linear',
            x: 0,
            y: 0,
            x2: 0,
            y2: 1,
            colorStops: [
              { offset: 0, color: 'rgba(255, 140, 0, 0.3)' },
              { offset: 1, color: 'rgba(255, 140, 0, 0.1)' }
            ]
          }
        },
        emphasis: { focus: 'series' },
        showSymbol: false
      },
      {
        name: '电流3',
        type: 'line',
        // stack: 'Total',
        smooth: true,
        data: current3Data.value,
        itemStyle: {
          color: '#ff6b9d'
        },
        areaStyle: {
          color: {
            type: 'linear',
            x: 0,
            y: 0,
            x2: 0,
            y2: 1,
            colorStops: [
              { offset: 0, color: 'rgba(255, 107, 157, 0.3)' },
              { offset: 1, color: 'rgba(255, 107, 157, 0.1)' }
            ]
          }
        },
        emphasis: { focus: 'series' },
        showSymbol: false
      }
    ]
  }

  chartInstance.setOption(option)

  // 响应式调整
  window.addEventListener('resize', handleResize)
}

// 更新数据
const updateData = (data) => {
  if (!chartInstance) return

  const now = new Date()
  const timeStr = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}:${String(now.getSeconds()).padStart(2, '0')}`

  // 添加新数据
  timeData.value.push(timeStr)
  current1Data.value.push(data.current1 || 0)
  current2Data.value.push(data.current2 || 0)
  current3Data.value.push(data.current3 || 0)

  // 限制数据点数量
  if (timeData.value.length > maxDataPoints) {
    timeData.value.shift()
    current1Data.value.shift()
    current2Data.value.shift()
    current3Data.value.shift()
  }

  // 更新图表
  chartInstance.setOption({
    xAxis: {
      data: timeData.value
    },
    series: [
      {
        data: current1Data.value
      },
      {
        data: current2Data.value
      },
      {
        data: current3Data.value
      }
    ]
  })
}

// 响应式调整
const handleResize = () => {
  if (chartInstance) {
    chartInstance.resize()
  }
}

onMounted(() => {
  nextTick(() => {
    initChart()
  })
})

onUnmounted(() => {
  window.removeEventListener('resize', handleResize)
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
.current-chart-container {
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


