<template>
  <div class="status-box">
    <h3 class="chart-title">连接器故障排序</h3>
    <div class="chart-wrapper">
      <div ref="chartRef" class="chart-container"></div>
    </div>
  </div>
</template>

<script setup>
import { onMounted, onUnmounted, ref, nextTick } from 'vue'
import echarts from '../../utils/echarts'
import { getWarningList } from '../../api/api'
import { initWebSocket } from '../../utils/websocket'

const chartRef = ref(null)
let chartInstance = null
let wsClient = null
let warningSubscription = null

// 存储每个连接器的故障次数（异常和警告次数之和）
const deviceFaultCountMap = new Map()
const seenWarningIds = new Set()

const normalizeDeviceNo = (raw) => {
  if (raw === null || raw === undefined) return null
  const num = Number(raw)
  return Number.isFinite(num) ? num : null
}

// 应用警告记录
const applyWarningRecord = (warning) => {
  if (!warning) return
  const warningId = warning.id ?? warning.warningId
  if (warningId !== undefined && warningId !== null && seenWarningIds.has(warningId)) {
    return
  }
  if (warningId !== undefined && warningId !== null) {
    seenWarningIds.add(warningId)
  }

  const deviceNo = normalizeDeviceNo(warning.deviceNo ?? warning.device_no ?? warning.deviceId)
  if (deviceNo === null) return

  // 统计异常和警告状态（不管state是未解决还是已解除）
  const count = deviceFaultCountMap.get(deviceNo) || 0
  deviceFaultCountMap.set(deviceNo, count + 1)
}

// 构建柱状图数据（只显示前10名）
const buildChartData = () => {
  if (!chartInstance) return

  // 转换为数组并按故障次数排序
  const dataArray = Array.from(deviceFaultCountMap.entries())
    .map(([deviceNo, count]) => ({
      deviceNo,
      count
    }))
    .sort((a, b) => b.count - a.count) // 降序排序
    .slice(0, 10) // 只取前10名

  if (dataArray.length === 0) {
    chartInstance.setOption({
      backgroundColor: 'transparent',
      tooltip: {
        trigger: 'axis',
        axisPointer: {
          type: 'shadow'
        },
        formatter: '暂无数据'
      },
      grid: {
        left: '20%',
        right: '10%',
        top: '12%',
        bottom: '10%'
      },
      xAxis: {
        type: 'value',
        // name: '异常和警告发生次数之和',
        nameTextStyle: {
          color: '#fff'
        },
        axisLabel: {
          color: '#fff'
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
      yAxis: {
        type: 'category',
        data: [],
        // name: '连接器编号',
        nameTextStyle: {
          color: '#fff'
        },
        axisLabel: {
          color: '#fff'
        },
        axisLine: {
          lineStyle: {
            color: '#40e0d0'
          }
        }
      },
      series: []
    })
    return
  }

  // 提取Y轴数据（连接器编号）和X轴数据（故障次数）
  const yAxisData = dataArray.map(item => `连接器${item.deviceNo}`)
  const xAxisData = dataArray.map(item => item.count)

  chartInstance.setOption({
    backgroundColor: 'transparent',
    tooltip: {
      trigger: 'axis',
      axisPointer: {
        type: 'shadow'
      },
      borderColor: '#40e0d0',
      backgroundColor: 'rgba(0, 0, 0, 0.8)',
      textStyle: {
        color: '#fff',
        fontSize: 14
      },
      formatter: (params) => {
        const param = params[0]
        return `${param.name}<br/>异常和警告发生次数之和：${param.value} 次`
      }
    },
    grid: {
      left: '5%',
      right: '10%',
      top: '4%',
      bottom: '30%',
      containLabel: true 
    },
    xAxis: {
      type: 'value',
      // name: '异常和警告发生次数之和',
      nameTextStyle: {
        color: '#fff'
      },
      axisLabel: {
        color: '#fff'
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
    yAxis: {
      type: 'category',
      data: yAxisData,
      // name: '连接器编号',
      nameTextStyle: {
        color: '#fff'
      },
      axisLabel: {
        color: '#fff',
        margin: 10
      },
      axisLine: {
        lineStyle: {
          color: '#40e0d0'
        }
      },
      axisTick: {
        show: false
      },
      inverse: true, // 将Y轴反转，使排名第一的在最上方
      boundaryGap: true
    },
    series: [
      {
        name: '故障次数',
        type: 'bar',
        barWidth: '50%',
        data: xAxisData,
        itemStyle: {
          color: {
            type: 'linear',
            x: 0,
            y: 0,
            x2: 1,
            y2: 0,
            colorStops: [
              { offset: 0, color: '#0bc9ff' },
              { offset: 1, color: '#045d9f' }
            ]
          }
        },
        label: {
          show: true,
          position: 'right',
          color: '#fff',
          formatter: '{c}'
        }
      }
    ]
  })
}

const handleResize = () => {
  if (chartInstance) {
    chartInstance.resize()
  }
}

const initChart = () => {
  if (!chartRef.value) return
  chartInstance = echarts.init(chartRef.value)
  buildChartData()
  window.addEventListener('resize', handleResize)
}

const loadInitialWarnings = async () => {
  try {
    const res = await getWarningList({})
    const list = Array.isArray(res.data) ? res.data : res.data?.data || []
    list.forEach(applyWarningRecord)
    buildChartData()
  } catch (error) {
    console.error('加载报警列表失败', error)
    buildChartData()
  }
}

const handleWarningUpdate = (payload) => {
  if (Array.isArray(payload)) {
    payload.forEach(applyWarningRecord)
  } else {
    applyWarningRecord(payload)
  }
  buildChartData()
}

const subscribeWarningTopic = () => {
  if (!wsClient || !wsClient.getConnectionState()) return
  warningSubscription = wsClient.subscribe('/topic/warning/update', (message) => {
    try {
      const data = JSON.parse(message.body)
      handleWarningUpdate(data)
    } catch (error) {
      console.error('解析故障推送失败', error)
    }
  })
}

onMounted(() => {
  initChart()
  loadInitialWarnings()
  try {
    wsClient = initWebSocket()
    subscribeWarningTopic()
    wsClient.on('connected', subscribeWarningTopic)
  } catch (error) {
    console.error('初始化故障柱状图 WebSocket 失败', error)
  }
})

onUnmounted(() => {
  window.removeEventListener('resize', handleResize)
  if (warningSubscription?.unsubscribe) {
    warningSubscription.unsubscribe()
  }
  if (wsClient) {
    wsClient.off('connected', subscribeWarningTopic)
  }
  if (chartInstance) {
    chartInstance.dispose()
    chartInstance = null
  }
})
</script>

<style scoped>
.status-box {
  display: flex;
  flex-direction: column;
  gap: 12px;
  width: 100%;
  height: 100%;
}
.chart-title {
  font-size: 18px;
  font-weight: bold;
  color: #40e0d0;
  text-align: center;
  text-shadow: 0 0 10px rgba(64, 224, 208, 0.5);
}
.chart-wrapper {
  flex: 1;
  min-height: 0;
  background: transparent;
  border: none;
  border-radius: 0;
  padding: 0;
}
.chart-container {
  width: 100%;
  height: 100%;
  min-height: 300px;
}
</style>
