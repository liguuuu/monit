<template>
  <div class="temp-humidity-chart-container">
    <h3 class="chart-title">温湿度信息</h3>
    <div class="charts-wrapper">
      <div ref="tempChartContainer" class="chart-item"></div>
      <div ref="humidityChartContainer" class="chart-item"></div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted, nextTick } from 'vue'
import echarts from '../../utils/echarts'

const tempChartContainer = ref(null)
const humidityChartContainer = ref(null)
let tempChartInstance = null
let humidityChartInstance = null

// 初始化温度仪表盘
const initTempChart = () => {
  if (!tempChartContainer.value) return

  tempChartInstance = echarts.init(tempChartContainer.value)

  const option = {
    backgroundColor: 'transparent',
    series: [
      {
        name: '温度',
        type: 'gauge',
        progress: {
          show: true,
          width: 18
        },
        axisLine: {
          lineStyle: {
            width: 18
          }
        },
        axisTick: {
          show: false
        },
        splitLine: {
          length: 15,
          lineStyle: {
            width: 2,
            color: '#999'
          }
        },
        axisLabel: {
          distance: 25,
          color: '#fff',
          fontSize: 12
        },
        anchor: {
          show: true,
          showAbove: true,
          size: 25,
          itemStyle: {
            borderWidth: 10
          }
        },
        title: {
          show: false
        },
        detail: {
          valueAnimation: true,
          fontSize: 30,
          offsetCenter: [0, '70%'],
          color: '#fff',
          formatter: '{value}°C'
        },
        data: [
          {
            value: 0,
            name: '温度'
          }
        ],
        min: -20,
        max: 80
      }
    ]
  }

  tempChartInstance.setOption(option)
  window.addEventListener('resize', handleResize)
}

// 初始化湿度仪表盘
const initHumidityChart = () => {
  if (!humidityChartContainer.value) return

  humidityChartInstance = echarts.init(humidityChartContainer.value)

  const option = {
    backgroundColor: 'transparent',
    series: [
      {
        name: '湿度',
        type: 'gauge',
        progress: {
          show: true,
          width: 18
        },
        axisLine: {
          lineStyle: {
            width: 18
          }
        },
        axisTick: {
          show: false
        },
        splitLine: {
          length: 15,
          lineStyle: {
            width: 2,
            color: '#999'
          }
        },
        axisLabel: {
          distance: 25,
          color: '#fff',
          fontSize: 12
        },
        anchor: {
          show: true,
          showAbove: true,
          size: 25,
          itemStyle: {
            borderWidth: 10
          }
        },
        title: {
          show: false
        },
        detail: {
          valueAnimation: true,
          fontSize: 30,
          offsetCenter: [0, '70%'],
          color: '#fff',
          formatter: '{value}%'
        },
        data: [
          {
            value: 0,
            name: '湿度'
          }
        ],
        min: 0,
        max: 100
      }
    ]
  }

  humidityChartInstance.setOption(option)
  window.addEventListener('resize', handleResize)
}

// 更新数据
const updateData = (data) => {
  if (tempChartInstance && data.temperature !== undefined) {
    tempChartInstance.setOption({
      series: [
        {
          data: [
            {
              value: data.temperature || 0,
              name: '温度'
            }
          ]
        }
      ]
    })
  }

  if (humidityChartInstance && data.humidity !== undefined) {
    humidityChartInstance.setOption({
      series: [
        {
          data: [
            {
              value: data.humidity || 0,
              name: '湿度'
            }
          ]
        }
      ]
    })
  }
}

// 响应式调整
const handleResize = () => {
  if (tempChartInstance) {
    tempChartInstance.resize()
  }
  if (humidityChartInstance) {
    humidityChartInstance.resize()
  }
}

onMounted(() => {
  nextTick(() => {
    initTempChart()
    initHumidityChart()
  })
})

onUnmounted(() => {
  window.removeEventListener('resize', handleResize)
  if (tempChartInstance) {
    tempChartInstance.dispose()
    tempChartInstance = null
  }
  if (humidityChartInstance) {
    humidityChartInstance.dispose()
    humidityChartInstance = null
  }
})

// 暴露方法供父组件调用
defineExpose({
  updateData
})
</script>

<style scoped>
.temp-humidity-chart-container {
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

.charts-wrapper {
  flex: 1;
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 20px;
  width: 100%;
  min-height: 0;
}

.chart-item {
  width: 100%;
  height: 100%;
  min-height: 200px;
}
</style>


