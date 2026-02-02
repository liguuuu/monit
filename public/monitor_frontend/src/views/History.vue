<template>
  <div class="max-w-7xl mx-auto">
    <div class="flex items-center mb-6">
      <router-link to="/" class="text-blue-500 hover:text-blue-700 mr-4 p-2 rounded-lg hover:bg-blue-50 transition-colors">
        <i class="fas fa-arrow-left"></i>
        <span class="ml-2">返回监控面板</span>
      </router-link>
      <h2 class="text-2xl font-bold text-gray-800">{{ connectorName }} - 历史数据</h2>
    </div>

    <!-- 数据统计概览 -->
    <div class="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
      <div class="bg-white rounded-xl shadow p-4 text-center">
        <p class="text-gray-500 text-sm">数据记录总数</p>
        <p class="text-2xl font-bold text-blue-600">{{ historyData.length }}</p>
      </div>
      <div class="bg-white rounded-xl shadow p-4 text-center">
        <p class="text-gray-500 text-sm">正常状态</p>
        <p class="text-2xl font-bold text-green-600">{{ normalCount }}</p>
      </div>
      <div class="bg-white rounded-xl shadow p-4 text-center">
        <p class="text-gray-500 text-sm">警告状态</p>
        <p class="text-2xl font-bold text-yellow-600">{{ warningCount }}</p>
      </div>
      <div class="bg-white rounded-xl shadow p-4 text-center">
        <p class="text-gray-500 text-sm">异常状态</p>
        <p class="text-2xl font-bold text-red-600">{{ errorCount }}</p>
      </div>
    </div>

    <!-- 数据筛选和搜索 -->
    <div class="bg-white rounded-xl shadow-md p-6 mb-6">
      <div class="flex flex-col md:flex-row gap-4 mb-4">
        <div class="flex-1">
          <label class="block text-sm font-medium text-gray-700 mb-2">时间范围</label>
          <select v-model="timeRange" class="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500">
            <option value="all">全部时间</option>
            <option value="today">今天</option>
            <option value="week">最近一周</option>
            <option value="month">最近一月</option>
          </select>
        </div>
        <div class="flex-1">
          <label class="block text-sm font-medium text-gray-700 mb-2">状态筛选</label>
          <select v-model="statusFilter" class="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500">
            <option value="all">全部状态</option>
            <option value="normal">正常</option>
            <option value="warning">警告</option>
            <option value="error">异常</option>
          </select>
        </div>
        <div class="flex-1">
          <label class="block text-sm font-medium text-gray-700 mb-2">数据筛选</label>
          <select v-model="dataType" class="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500">
            <option value="all">全部数据</option>
            <option value="voltage">电压数据</option>
            <option value="temperature">温度数据</option>
            <option value="gas">气体数据</option>
            <option value="acceleration">加速度数据</option>
          </select>
        </div>
      </div>
      <div class="flex flex-col xl:flex-row justify-between gap-4 items-stretch xl:items-center">
        <div class="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
          <div class="flex flex-col">
            <label class="text-sm font-medium text-gray-700 mb-1">导出格式</label>
            <select 
              v-model="exportFormat" 
              class="p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="excel">Excel 格式</option>
              <option value="csv">CSV 格式</option>
              

            </select>
          </div>
          <button 
            @click="exportData" 
            :disabled="isExporting || !filteredData.length"
            class="bg-green-500 hover:bg-green-600 disabled:bg-green-300 disabled:cursor-not-allowed text-white px-4 py-2 rounded-lg flex items-center justify-center transition-colors"
          >
            <i class="fas fa-download mr-2"></i>
            {{ isExporting ? '导出中...' : '导出数据' }}
          </button>
        </div>
        <div class="text-sm text-gray-500">
          当前筛选结果：{{ filteredData.length }} 条记录
        </div>
      </div>
    </div>

    <!-- 历史数据表格 -->
    <div class="bg-white rounded-xl shadow-md p-6">
      <div class="overflow-x-auto">
        <table class="min-w-full table-auto">
          <thead>
            <tr class="bg-gray-50 border-b">
              <th class="px-4 py-3 text-left text-sm font-medium text-gray-700">时间</th>
              <th class="px-4 py-3 text-left text-sm font-medium text-gray-700">环境A - 电压(V)</th>
              <th class="px-4 py-3 text-left text-sm font-medium text-gray-700">环境A - 电流(A)</th>
              <th class="px-4 py-3 text-left text-sm font-medium text-gray-700">环境B - 温度(°C)</th>
              <th class="px-4 py-3 text-left text-sm font-medium text-gray-700">环境B - 湿度(%)</th>
              <th class="px-4 py-3 text-left text-sm font-medium text-gray-700">环境C - 气体</th>
              <th class="px-4 py-3 text-left text-sm font-medium text-gray-700">环境D - 加速度(g)</th>
              <th class="px-4 py-3 text-left text-sm font-medium text-gray-700">状态</th>
              <th class="px-4 py-3 text-left text-sm font-medium text-gray-700">操作</th>
            </tr>
          </thead>
          <tbody>
            <tr 
              v-for="record in paginatedData" 
              :key="record.id" 
              class="border-b hover:bg-gray-50 transition-colors"
            >
              <td class="px-4 py-3 text-sm">
                <div class="font-medium text-gray-900">{{ record.time }}</div>
                <div class="text-gray-500 text-xs">{{ record.date }}</div>
              </td>
              
              <!-- 环境A数据 -->
              <td class="px-4 py-3 text-sm">
                <div class="space-y-1">
                  <div class="flex justify-between">
                    <span class="text-gray-600">V1:</span>
                    <span :class="getVoltageClass(record.environmentA.voltage1)">{{ record.environmentA.voltage1 }}</span>
                  </div>
                  <div class="flex justify-between">
                    <span class="text-gray-600">V2:</span>
                    <span :class="getVoltageClass(record.environmentA.voltage2)">{{ record.environmentA.voltage2 }}</span>
                  </div>
                  <div class="flex justify-between">
                    <span class="text-gray-600">V3:</span>
                    <span :class="getVoltageClass(record.environmentA.voltage3)">{{ record.environmentA.voltage3 }}</span>
                  </div>
                </div>
              </td>
              
              <td class="px-4 py-3 text-sm">
                <div class="space-y-1">
                  <div class="flex justify-between">
                    <span class="text-gray-600">I1:</span>
                    <span :class="getCurrentClass(record.environmentA.current1)">{{ record.environmentA.current1 }}</span>
                  </div>
                  <div class="flex justify-between">
                    <span class="text-gray-600">I2:</span>
                    <span :class="getCurrentClass(record.environmentA.current2)">{{ record.environmentA.current2 }}</span>
                  </div>
                  <div class="flex justify-between">
                    <span class="text-gray-600">I3:</span>
                    <span :class="getCurrentClass(record.environmentA.current3)">{{ record.environmentA.current3 }}</span>
                  </div>
                </div>
              </td>
              
              <!-- 环境B数据 -->
              <td class="px-4 py-3 text-sm">
                <div class="space-y-1">
                  <div class="flex justify-between">
                    <span class="text-gray-600">T1:</span>
                    <span :class="getTemperatureClass(record.environmentB.temperature1)">{{ record.environmentB.temperature1 }}</span>
                  </div>
                  <div class="flex justify-between">
                    <span class="text-gray-600">T2:</span>
                    <span :class="getTemperatureClass(record.environmentB.temperature2)">{{ record.environmentB.temperature2 }}</span>
                  </div>
                  <div class="flex justify-between">
                    <span class="text-gray-600">T3:</span>
                    <span :class="getTemperatureClass(record.environmentB.temperature3)">{{ record.environmentB.temperature3 }}</span>
                  </div>
                </div>
              </td>
              
              <td class="px-4 py-3 text-sm">
                <div class="space-y-1">
                  <div class="flex justify-between">
                    <span class="text-gray-600">H1:</span>
                    <span>{{ record.environmentB.humidity1 }}%</span>
                  </div>
                  <div class="flex justify-between">
                    <span class="text-gray-600">H2:</span>
                    <span>{{ record.environmentB.humidity2 }}%</span>
                  </div>
                  <div class="flex justify-between">
                    <span class="text-gray-600">气压:</span>
                    <span>{{ record.environmentB.atmosphericPressure1 }}hPa</span>
                  </div>
                </div>
              </td>
              
              <!-- 环境C数据 -->
              <td class="px-4 py-3 text-sm">
                <div class="space-y-1">
                  <div class="flex justify-between">
                    <span class="text-gray-600">CO:</span>
                    <span :class="getGasClass('co', record.environmentC.co)">{{ record.environmentC.co }}ppm</span>
                  </div>
                  <div class="flex justify-between">
                    <span class="text-gray-600">CH4:</span>
                    <span :class="getGasClass('ch4', record.environmentC.ch4)">{{ record.environmentC.ch4 }}%</span>
                  </div>
                  <div class="flex justify-between">
                    <span class="text-gray-600">O2:</span>
                    <span :class="getO2Class(record.environmentC.o2)">{{ record.environmentC.o2 }}%</span>
                  </div>
                </div>
              </td>
              
              <!-- 环境D数据 -->
              <td class="px-4 py-3 text-sm">
                <div class="space-y-1">
                  <div class="flex justify-between">
                    <span class="text-gray-600">X:</span>
                    <span :class="getAxisClass(record.environmentD.d_x.value)">
                      {{ record.environmentD.d_x.positive ? '+' : '-' }}{{ record.environmentD.d_x.value }}
                    </span>
                  </div>
                  <div class="flex justify-between">
                    <span class="text-gray-600">Y:</span>
                    <span :class="getAxisClass(record.environmentD.d_y.value)">
                      {{ record.environmentD.d_y.positive ? '+' : '-' }}{{ record.environmentD.d_y.value }}
                    </span>
                  </div>
                  <div class="flex justify-between">
                    <span class="text-gray-600">Z:</span>
                    <span :class="getAxisClass(record.environmentD.d_z.value)">
                      {{ record.environmentD.d_z.positive ? '+' : '-' }}{{ record.environmentD.d_z.value }}
                    </span>
                  </div>
                </div>
              </td>
              
              <!-- 状态 -->
              <td class="px-4 py-3">
                <div class="flex items-center">
                  <span :class="`status-indicator status-${record.status} mr-2`"></span>
                  <span :class="getStatusTextClass(record.status)">{{ getStatusText(record.status) }}</span>
                </div>
              </td>
              
              <!-- 操作 -->
              <td class="px-4 py-3">
                <button 
                  @click="viewDetails(record)"
                  class="text-blue-500 hover:text-blue-700 text-sm font-medium flex items-center"
                >
                  <i class="fas fa-eye mr-1"></i>
                  详情
                </button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- 分页控件 -->
      <div class="flex justify-between items-center mt-6">
        <div class="text-sm text-gray-500">
          第 {{ currentPage }} 页，共 {{ totalPages }} 页
        </div>
        <div class="flex space-x-2">
          <button 
            @click="prevPage" 
            :disabled="currentPage === 1"
            class="px-3 py-1 border border-gray-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
          >
            上一页
          </button>
          <button 
            @click="nextPage" 
            :disabled="currentPage === totalPages"
            class="px-3 py-1 border border-gray-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
          >
            下一页
          </button>
        </div>
      </div>
    </div>

    <!-- 详情模态框 -->
    <div v-if="selectedRecord" class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div class="bg-white rounded-xl shadow-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <div class="p-6 border-b border-gray-200">
          <div class="flex justify-between items-center">
            <h3 class="text-xl font-bold text-gray-800">数据详情</h3>
            <button @click="selectedRecord = null" class="text-gray-400 hover:text-gray-600">
              <i class="fas fa-times text-xl"></i>
            </button>
          </div>
          <p class="text-gray-600 mt-2">{{ selectedRecord.time }} - {{ connectorName }}</p>
        </div>
        <div class="p-6">
          <RecordDetails :record="selectedRecord" />
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted, watch, nextTick } from 'vue'
import { useRoute } from 'vue-router'
import RecordDetails from '../components/RecordDetails.vue'
import { getConnectorHis } from '../api/api'
import { initWebSocket, getWebSocketClient } from '../utils/websocket'
import * as XLSX from 'xlsx'

const route = useRoute()

// 响应式数据
const historyData = ref([])
const connectorName = ref('')
const timeRange = ref('all')
const statusFilter = ref('all')
const dataType = ref('all')
const currentPage = ref(1)
const selectedRecord = ref(null)
const pageSize = 10
const exportFormat = ref('excel')
const isExporting = ref(false)

// 获取当前设备ID（设备编号）
const connectorId = computed(() => route.params.id)

// 根据设备编号获取连接器名称
const getConnectorName = (deviceNo) => {
  // 直接使用设备编号生成名称，与后端保持一致
  // 后端返回的 name 格式是 "连接器 #" + device_no
  if (deviceNo !== null && deviceNo !== undefined) {
    return `连接器 #${deviceNo}`
  }
  return '未知连接器'
}

// 获取历史数据
const fetchHistoryData = () => {
  const deviceId = connectorId.value
  console.log("获取历史数据，设备ID:", deviceId)
  getConnectorHis(deviceId).then(res => {
    historyData.value = res.data
    connectorName.value = getConnectorName(parseInt(deviceId))
    // 重置到第一页
    currentPage.value = 1
    
    console.log("历史数据加载完成，记录数:", historyData.value.length)
  }).catch(error => {
    console.error("获取历史数据失败:", error)
  })
}

// WebSocket 事件处理函数
const handleDeviceStatusUpdate = (data) => {
  console.log("History.vue 收到设备状态更新:", data)
  if (data && Array.isArray(data)) {
    const currentDeviceId = connectorId.value
    // 检查更新中是否包含当前查看的设备（通过 device_no 匹配）
    const currentDevice = data.find(device => {
      // connectorId 是设备编号（device_no），直接匹配
      return device.device_no && device.device_no.toString() === currentDeviceId
    })
    
    if (currentDevice) {
      console.log("检测到当前设备更新（设备编号:", currentDeviceId, "），重新获取历史数据")
      // 重新获取历史数据
      fetchHistoryData()
    }
  }
}

const handleWebSocketConnected = () => {
  console.log("History.vue WebSocket 连接已建立")
}

const handleWebSocketError = (error) => {
  console.error("History.vue WebSocket 错误:", error)
}

const handleWebSocketDisconnected = () => {
  console.log("History.vue WebSocket 连接已断开")
}

// 计算属性
const filteredData = computed(() => {
  let data = historyData.value
  
  // 状态筛选
  if (statusFilter.value !== 'all') {
    data = data.filter(record => record.status === statusFilter.value)
  }
  
  // 数据类型筛选（这里可以根据具体需求实现更复杂的筛选）
  if (dataType.value !== 'all') {
    data = data.filter(record => {
      // 简化的筛选逻辑，实际可以根据具体字段实现
      return true
    })
  }
  
  return data
})

const paginatedData = computed(() => {
  const start = (currentPage.value - 1) * pageSize
  const end = start + pageSize
  return filteredData.value.slice(start, end)
})

const totalPages = computed(() => {
  return Math.ceil(filteredData.value.length / pageSize)
})

const normalCount = computed(() => {
  return historyData.value.filter(record => record.status === 'normal').length
})

const warningCount = computed(() => {
  return historyData.value.filter(record => record.status === 'warning').length
})

const errorCount = computed(() => {
  return historyData.value.filter(record => record.status === 'error').length
})

// 方法
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
    normal: 'text-green-600 font-medium',
    warning: 'text-yellow-600 font-medium',
    error: 'text-red-600 font-medium'
  }
  return classMap[status] || 'text-gray-600'
}

// 数据状态判断方法
const getVoltageClass = (voltage) => {
  if (voltage < 11.5) return 'text-red-600 font-medium'
  if (voltage < 11.8) return 'text-yellow-600 font-medium'
  return 'text-green-600 font-medium'
}

const getCurrentClass = (current) => {
  if (current > 3.5) return 'text-red-600 font-medium'
  if (current > 3.3) return 'text-yellow-600 font-medium'
  return 'text-green-600 font-medium'
}

const getTemperatureClass = (temp) => {
  if (temp > 50) return 'text-red-600 font-medium'
  if (temp > 40) return 'text-yellow-600 font-medium'
  return 'text-green-600 font-medium'
}

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

const getO2Class = (o2) => {
  if (o2 < 19.5 || o2 > 23.5) return 'text-red-600 font-medium'
  return 'text-green-600 font-medium'
}

const getAxisClass = (value) => {
  if (Math.abs(value) > 2.0) return 'text-red-600 font-medium'
  if (Math.abs(value) > 1.5) return 'text-yellow-600 font-medium'
  return 'text-green-600 font-medium'
}

const viewDetails = (record) => {
  selectedRecord.value = record
}

const buildExportRows = (records) => {
  return records.map(record => ({
    '日期': record.date || '',
    '时间': record.time || '',
    '状态': getStatusText(record.status),
    '电压1(V)': record.environmentA?.voltage1 ?? '',
    '电压2(V)': record.environmentA?.voltage2 ?? '',
    '电压3(V)': record.environmentA?.voltage3 ?? '',
    '电流1(A)': record.environmentA?.current1 ?? '',
    '电流2(A)': record.environmentA?.current2 ?? '',
    '电流3(A)': record.environmentA?.current3 ?? '',
    '温度1(°C)': record.environmentB?.temperature1 ?? '',
    '温度2(°C)': record.environmentB?.temperature2 ?? '',
    '温度3(°C)': record.environmentB?.temperature3 ?? '',
    '湿度1(%)': record.environmentB?.humidity1 ?? '',
    '湿度2(%)': record.environmentB?.humidity2 ?? '',
    '气压1(hPa)': record.environmentB?.atmosphericPressure1 ?? '',
    '气压2(hPa)': record.environmentB?.atmosphericPressure2 ?? '',
    'CO(ppm)': record.environmentC?.co ?? '',
    'CH4(%LEL)': record.environmentC?.ch4 ?? '',
    'O₂(%)': record.environmentC?.o2 ?? '',
    '气体温度(°C)': record.environmentC?.temperature ?? '',
    '气体湿度(%)': record.environmentC?.humidity ?? '',
    'X轴(g)': record.environmentD?.d_x ? `${record.environmentD.d_x.positive ? '+' : '-'}${record.environmentD.d_x.value}` : '',
    'Y轴(g)': record.environmentD?.d_y ? `${record.environmentD.d_y.positive ? '+' : '-'}${record.environmentD.d_y.value}` : '',
    'Z轴(g)': record.environmentD?.d_z ? `${record.environmentD.d_z.positive ? '+' : '-'}${record.environmentD.d_z.value}` : ''
  }))
}

const formatCSVValue = (value) => {
  if (value === null || value === undefined) return ''
  const stringValue = String(value)
  if (/[",\n]/.test(stringValue)) {
    return `"${stringValue.replace(/"/g, '""')}"`
  }
  return stringValue
}

const exportToCSV = (rows, fileName) => {
  const headers = Object.keys(rows[0] || {})
  const csvLines = [
    headers.join(','),
    ...rows.map(row => headers.map(header => formatCSVValue(row[header])).join(','))
  ]
  const blob = new Blob(['\uFEFF' + csvLines.join('\r\n')], { type: 'text/csv;charset=utf-8;' })
  const link = document.createElement('a')
  link.href = URL.createObjectURL(blob)
  link.download = fileName.endsWith('.csv') ? fileName : `${fileName}.csv`
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
}

const exportToExcel = (rows, fileName) => {
  const worksheet = XLSX.utils.json_to_sheet(rows)
  const workbook = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(workbook, worksheet, '历史数据')
  XLSX.writeFile(workbook, fileName.endsWith('.xlsx') ? fileName : `${fileName}.xlsx`)
}

const getExportFileBaseName = () => {
  const deviceLabel = connectorName.value || `connector-${connectorId.value}`
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-')
  return `${deviceLabel}-history-${timestamp}`
}

const exportData = async () => {
  if (!filteredData.value.length) {
    alert('当前没有可导出的数据，请先调整筛选条件。')
    return
  }

  const rows = buildExportRows(filteredData.value)
  const fileBaseName = getExportFileBaseName()

  try {
    isExporting.value = true
    if (exportFormat.value === 'excel') {
      exportToExcel(rows, `${fileBaseName}.xlsx`)
    } else {
      exportToCSV(rows, `${fileBaseName}.csv`)
    }
  } catch (error) {
    console.error('导出数据失败:', error)
    alert('导出失败，请稍后重试。')
  } finally {
    isExporting.value = false
  }
}

const prevPage = () => {
  if (currentPage.value > 1) {
    currentPage.value--
  }
}

const nextPage = () => {
  if (currentPage.value < totalPages.value) {
    currentPage.value++
  }
}

// 监听筛选条件变化重置页码
watch([timeRange, statusFilter, dataType], () => {
  currentPage.value = 1
})

// 监听路由参数变化（当切换到不同设备的历史记录时）
watch(() => route.params.id, (newId, oldId) => {
  if (newId && newId !== oldId) {
    console.log("设备切换:", oldId, "->", newId)
    fetchHistoryData()
  }
}, { immediate: false })

onMounted(() => {
  console.log("History.vue 页面加载，设备ID:", connectorId.value)
  
  // 获取初始历史数据
  fetchHistoryData()

  // 初始化 WebSocket 连接并监听设备状态更新
  try {
    const wsClient = initWebSocket()
    
    // 注册事件监听器
    wsClient.on('deviceStatusUpdate', handleDeviceStatusUpdate)
    wsClient.on('connected', handleWebSocketConnected)
    wsClient.on('error', handleWebSocketError)
    wsClient.on('disconnected', handleWebSocketDisconnected)
  } catch (error) {
    console.error("History.vue 初始化 WebSocket 失败:", error)
  }
})

onUnmounted(() => {
  console.log("History.vue 组件卸载，移除 WebSocket 监听器")
  
  // 移除事件监听器
  const wsClient = getWebSocketClient()
  if (wsClient) {
    wsClient.off('deviceStatusUpdate', handleDeviceStatusUpdate)
    wsClient.off('connected', handleWebSocketConnected)
    wsClient.off('error', handleWebSocketError)
    wsClient.off('disconnected', handleWebSocketDisconnected)
  }
})
</script>

<style scoped>
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
</style>