<template>
  <div class="status-chart-container">
    <h3 class="chart-title">异常情况分布</h3>
    <div ref="chartContainer" class="chart-wrapper"></div>
  </div>
</template>

<script setup>
import { onMounted, onUnmounted, ref } from 'vue'
import echarts from '../../utils/echarts'
import { getWarningSummary } from '../../api/api'

const chartContainer = ref(null)
let chartInstance = null
const chartData = ref([])

const initChart = () => {
  if (!chartContainer.value) return
  chartInstance = echarts.init(chartContainer.value)
  renderChart()
  window.addEventListener('resize', handleResize)
}

const renderChart = () => {
  if (!chartInstance) return
  chartInstance.setOption({
    backgroundColor: 'transparent',
    tooltip: {
      trigger: 'item',
      formatter: '{b}: {c} ({d}%)'
    },
    legend: {
      top: '2%',
      textStyle: { color: '#fff' }
    },
    series: [
      {
        name: '异常类型',
        type: 'pie',
        radius: ['40%', '65%'],
        center: ['50%', '57%'], // 水平居中，垂直方向向下移动（默认约为50%）
        avoidLabelOverlap: false,
        itemStyle: {
          borderRadius: 6,
          borderColor: '#0b1a2a',
          borderWidth: 2
        },
        label: {
          color: '#e5e7eb'
        },
        labelLine: {
          length: 14,
          length2: 10
        },
        data: chartData.value
      }
    ]
  })
}

const loadSummary = async () => {
  try {
    const res = await getWarningSummary()
    const raw = res.data?.data || res.data || {}
    const entries = Object.entries(raw)
      .filter(([, value]) => typeof value === 'number' && value > 0)
      .map(([name, value]) => ({ name, value }))
    chartData.value = entries.length ? entries : [{ name: '暂无异常', value: 1 }]
    renderChart()
  } catch (error) {
    console.error('获取异常分布失败', error)
    chartData.value = [{ name: '数据加载失败', value: 1 }]
    renderChart()
  }
}

const handleResize = () => {
  if (chartInstance) {
    chartInstance.resize()
  }
}

onMounted(() => {
  initChart()
  loadSummary()
})

onUnmounted(() => {
  window.removeEventListener('resize', handleResize)
  if (chartInstance) {
    chartInstance.dispose()
    chartInstance = null
  }
})
</script>

<style scoped>
.status-chart-container {
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
