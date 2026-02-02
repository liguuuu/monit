<template>
  <div class="temp-chart-container">
    <h3 class="chart-title">温度热力图</h3>
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

// 计算所有连接器的温度平均值
const calculateAverageTemperature = () => {
  if (!props.connectors || props.connectors.length === 0) {
    return [];
  }
  return props.connectors.map((connector, index) => {
    const envB = connector.environmentB || {};
    const temps = [
      envB.temperature1,
      envB.temperature2,
      envB.temperature3,
      envB.temperature4,
      envB.temperature5,
      envB.temperature6
    ]
      .map(t => {
        // 尝试转为数字
        const num = typeof t === 'string' ? parseFloat(t) : t;
        return typeof num === 'number' && !isNaN(num) ? num : null;
      })
      .filter(t => t !== null);

    const avgTemp = temps.length > 0 
      ? temps.reduce((sum, t) => sum + t, 0) / temps.length 
      : 0;

    return {
      name: connector.displayName || connector.name || `连接器${index + 1}`,
      value: avgTemp // 确保是 number
    };
  });
};

// 初始化热力图
const initChart = () => {
  if (!chartContainer.value) return

  chartInstance = echarts.init(chartContainer.value)

  setTimeout(()=>{
    if (chartInstance){
      const data = calculateAverageTemperature()
      const maxValue = Math.max(...data.map(d => d.value), 1)
      const minValue = Math.min(...data.map(d => d.value), 0)
      const option = {
        backgroundColor: 'transparent',
        tooltip: {
          trigger: 'item',
          backgroundColor: 'rgba(0, 0, 0, 0.8)',
          borderColor: '#40e0d0',
          borderWidth: 1,
          textStyle: {
            color: '#fff'
          },
          formatter: (params) => {
            const rawValue = Array.isArray(params.value)
              ? params.value[2]
              : params.value;

            const displayValue =
              typeof rawValue === 'number' && !isNaN(rawValue)
                ? rawValue.toFixed(2)
                : '--';

            return `${params.name}<br/>平均温度: ${displayValue}°C`;
          }
        },
        visualMap: {
          min: minValue,
          max: maxValue,
          calculable: true,
          orient: 'vertical',
          left: 'left',
          top: 'center',
          inRange: {
            color: ['#313695', '#4575b4', '#74add1', '#abd9e9', '#e0f3f8', '#ffffcc', '#fee090', '#fdae61', '#f46d43', '#d73027', '#a50026']
          },
          textStyle: {
            color: '#fff'
          }
        },
        xAxis: {
          type: 'category',
          data: data.map((_, i) => i), 
          show: false 
        },
        yAxis: {
          type: 'category',
          data: [''], // 因为你只有一行数据（y=0）
          show: false
        },
        series: [{
          name: '温度',
          type: 'heatmap',
          animation: false,
          animationDurationUpdate: 0,
          animationEasingUpdate: 'linear',
          data: data.map((item, index) => ({
            value: [index, 0, item.value],
            name: item.name
          })),
          label: {
            show: true,
            formatter: '{b}',
            color: '#fff',
            fontSize: 12
          },
          emphasis: {
            itemStyle: {
              shadowBlur: 10,
              shadowColor: 'rgba(0, 0, 0, 0.5)'
            }
          }
        }]
      }
      chartInstance.setOption(option)
    }
  }, 0)
  window.addEventListener('resize', handleResize)
}

// 更新数据
const updateData = () => {
  if (!chartInstance) return

  // 使用 nextTick 确保不在当前同步任务中执行
  nextTick(() => {
    const data = calculateAverageTemperature()
    const maxValue = Math.max(...data.map(d => d.value), 1)
    const minValue = Math.min(...data.map(d => d.value), 0)

    chartInstance.setOption(
      {
        visualMap: {
          min: minValue,
          max: maxValue
        },
        series: [
          {
            animation: false,
            data: data.map((item, index) => ({
              value: [index, 0, item.value],
              name: item.name
            }))
          }
        ]
      },
      false // notMerge = false，平滑更新
    )
  })
}

// 响应式调整
const handleResize = () => {
  if (chartInstance) {
    chartInstance.resize()
  }
}

// 监听connectors变化
watch(() => props.connectors, () => {
  updateData()
}, { deep: true })

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
.temp-chart-container {
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
