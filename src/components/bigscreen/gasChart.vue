<template>
  <div class="gas-chart-container">
    <h3 class="chart-title">气体浓度数据</h3>
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
const coData = ref([])
const ch4Data = ref([])
const o2Data = ref([])

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
      },
      formatter: (params) => {
        let result = `<div style="margin-bottom: 5px;">${params[0].axisValue}</div>`
        params.forEach(param => {
          let unit = ''
          if (param.seriesName === 'CO') unit = 'ppm'
          else if (param.seriesName === 'CH4') unit = '%LEL'
          else if (param.seriesName === 'O2') unit = '%'
          result += `<div>${param.marker} ${param.seriesName}: ${param.value}${unit}</div>`
        })
        return result
      }
    },
    legend: {
      data: ['CO', 'CH4', 'O2'],
      textStyle: {
        color: '#fff'
      },
      top: 0
    },
    grid: {
      left: '3%',
      right: '4%',
      bottom: '3%',
      top: '15%',
      containLabel: true
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
      name: '气体浓度',
      nameTextStyle: {
        color: '#fff',
      },

      // min: 0,
      // max: 100, // 根据你的气体浓度范围调整，比如CO可能0-1000ppm

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
        name: 'CO',
        type: 'line',
        stack: 'Total',
        smooth: true,
        areaStyle: {},
        data: coData.value,
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
              { offset: 0, color: 'rgba(64, 224, 208, 0.5)' },
              { offset: 1, color: 'rgba(64, 224, 208, 0.1)' }
            ]
          }
        }
      },
      {
        name: 'CH4',
        type: 'line',
        stack: 'Total',
        smooth: true,
        areaStyle: {},
        data: ch4Data.value,
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
              { offset: 0, color: 'rgba(255, 140, 0, 0.5)' },
              { offset: 1, color: 'rgba(255, 140, 0, 0.1)' }
            ]
          }
        }
      },
      {
        name: 'O2',
        type: 'line',
        stack: 'Total',
        smooth: true,
        areaStyle: {},
        data: o2Data.value,
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
              { offset: 0, color: 'rgba(255, 107, 157, 0.5)' },
              { offset: 1, color: 'rgba(255, 107, 157, 0.1)' }
            ]
          }
        }
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
  coData.value.push(data.co || 0)
  ch4Data.value.push(data.ch4 || 0)
  o2Data.value.push(data.o2 || 0)

  // 限制数据点数量
  if (timeData.value.length > maxDataPoints) {
    timeData.value.shift()
    coData.value.shift()
    ch4Data.value.shift()
    o2Data.value.shift()
  }

  // 更新图表
  chartInstance.setOption({
    xAxis: {
      data: timeData.value
    },
    series: [
      {
        data: coData.value
      },
      {
        data: ch4Data.value
      },
      {
        data: o2Data.value
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
.gas-chart-container {
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


