<template>
  <div class="max-w-7xl mx-auto">
    <div class="flex items-center mb-6">
      <router-link :to="getReturnPath()" class="text-blue-500 hover:text-blue-700 mr-4 p-2 rounded-lg hover:bg-blue-50 transition-colors">
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
            <option value="10min">近 10 分钟</option>
            <option value="30min">近 30 分钟</option>
            <option value="1hour">近 1 小时</option>
            <option value="2hours">近 2 小时</option>
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
            <option value="all">全部筛选</option>
            <option value="environmentA">环境A</option>
            <option value="environmentB">环境B</option>
            <option value="environmentC">环境C</option>
            <option value="environmentD">环境D</option>
          </select>
        </div>
      </div>
      <div class="flex flex-col xl:flex-row justify-between gap-4 items-stretch xl:items-center">
        <div class="flex flex-col sm:flex-row items-end sm:items-end gap-3">
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

        <!-- 新数据提示 -->
        <div v-if="newDataCount > 0" class="flex-1 flex justify-start xl:justify-center">
          <div 
            class="flex items-center px-3 py-1.5 rounded-full border shadow-sm animate-pulse transition-colors duration-500"
            :class="getNewDataStatusClass"
          >
            <i class="fas fa-exclamation-circle mr-2 text-xs" :class="getNewDataIconClass"></i>
            <span class="text-sm font-bold">
              {{ getNewDataMessage() }}
            </span>
            <button 
              @click="refreshData"
              class="ml-3 hover:opacity-70 text-sm font-black border-l border-current pl-3 transition-opacity"
            >
              更新
            </button>
          </div>
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
              <th class="px-4 py-3 text-left text-sm font-medium text-gray-700">环境D - 位置信息</th>
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
                <div :class="getPositionStatusClass(record.environmentD)" class="font-medium">
                  {{ getPositionStatus(record.environmentD) }}
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
import { ref, computed, onMounted, onUnmounted, watch } from 'vue'
import { useRoute } from 'vue-router'
import RecordDetails from '../components/RecordDetails.vue'
import { getConnectorHis, getWarningList } from '../api/api'
import { initWebSocket, getWebSocketClient } from '../utils/websocket'
import * as XLSX from 'xlsx'

const newDataCount = ref(0)
const newErrorCount = ref(0)
const newWarningCount = ref(0)

const route = useRoute()

const DAY_IN_MS = 24 * 60 * 60 * 1000

const parseRecordDate = (record) => {
  if (!record) return null
  if (record.timestamp) {
    const timestamp = Number(record.timestamp)
    if (!Number.isNaN(timestamp)) {
      return new Date(timestamp)
    }
  }
  if (record.create_time) {
    const parsed = new Date(record.create_time)
    if (!Number.isNaN(parsed.getTime())) {
      return parsed
    }
  }
  if (record.date && record.time) {
    const parsed = new Date(`${record.date}T${record.time}`)
    if (!Number.isNaN(parsed.getTime())) {
      return parsed
    }
  }
  if (record.date) {
    const parsed = new Date(record.date)
    if (!Number.isNaN(parsed.getTime())) {
      return parsed
    }
  }
  return null
}

const getRangeStart = (range) => {
  const now = new Date()
  switch (range) {
    case '10min':
      return new Date(now.getTime() - 10 * 60 * 1000)
    case '30min':
      return new Date(now.getTime() - 30 * 60 * 1000)
    case '1hour':
      return new Date(now.getTime() - 60 * 60 * 1000)
    case '2hours':
      return new Date(now.getTime() - 2 * 60 * 60 * 1000)
    default:
      return null
  }
}

const hasVoltageIssue = (envA = {}) => {
  const voltages = [envA.voltage1, envA.voltage2, envA.voltage3]
  const currents = [envA.current1, envA.current2, envA.current3]
  return voltages.some(value => typeof value === 'number' && value < 11.8) ||
    currents.some(value => typeof value === 'number' && value > 3.3)
}

const hasTemperatureIssue = (envB = {}) => {
  const temperatures = [
    envB.temperature1, envB.temperature2, envB.temperature3,
    envB.temperature4, envB.temperature5, envB.temperature6
  ]
  return temperatures.some(temp => typeof temp === 'number' && temp > 40)
}

const hasGasIssue = (envC = {}) => {
  const coWarning = typeof envC.co === 'number' && envC.co > 15
  const ch4Warning = typeof envC.ch4 === 'number' && envC.ch4 > 0.8
  const o2Warning = typeof envC.o2 === 'number' && (envC.o2 < 19.5 || envC.o2 > 23.5)
  return coWarning || ch4Warning || o2Warning
}

const hasAccelerationIssue = (envD = {}) => {
  const axisValues = ['d_x', 'd_y', 'd_z']
    .map(axis => envD?.[axis]?.value)
    .filter(value => typeof value === 'number')
  return axisValues.some(value => Math.abs(value) > 1.5)
}

const matchesDataType = (record, type) => {
  if (type === 'all') return true
  switch (type) {
    case 'environmentA':
      // 环境A：三个电压值、三个电流值
      return true // 显示所有记录，但导出时只导出环境A的数据
    case 'environmentB':
      // 环境B：六个温度值、两个湿度值和两个气压值
      return true
    case 'environmentC':
      // 环境C：CO、CH4、O2的值和温度以及湿度的值
      return true
    case 'environmentD':
      // 环境D：位置信息
      return true
    default:
      return true
  }
}

const matchesTimeRange = (record, range) => {
  const now = new Date()
  const recordDate = parseRecordDate(record)
  if (!recordDate) {
    return false
  }
  
  // 默认显示逻辑：[2小时内所有数据] + [一周内所有异常/警告数据]
  if (range === '2hours' || !range) {
    const twoHoursAgo = new Date(now.getTime() - 2 * 60 * 60 * 1000)
    const oneWeekAgo = new Date(now.getTime() - 7 * DAY_IN_MS)
    
    // 2小时内的所有数据
    if (recordDate >= twoHoursAgo) {
      return true
    }
    
    // 一周内的异常/警告数据
    if (recordDate >= oneWeekAgo && (record.status === 'error' || record.status === 'warning')) {
      return true
    }
    
    return false
  }
  
  // 其他时间范围：只显示该时间范围内的数据
  const start = getRangeStart(range)
  if (!start) {
    return true
  }
  return recordDate >= start
}

// 响应式数据
const pendingData = ref([])   // WebSocket 推送的新数据
const historyData = ref([])
const allHistoryData = ref([]) // 存储所有历史数据（用于新数据计数）
const connectorName = ref('')
const timeRange = ref('2hours') // 默认显示近2小时
const statusFilter = ref('all')
const dataType = ref('all')
const currentPage = ref(1)
const selectedRecord = ref(null)
const pageSize = 10
const exportFormat = ref('excel')
const isExporting = ref(false)

// 新数据相关
const entryTime = ref(Date.now()) // 用户进入界面的时间
let newDataTimer = null

// 获取当前设备ID（设备编号）
const connectorId = computed(() => route.params.id)

// 根据设备编号获取连接器名称
const getConnectorName = (deviceNo) => {
  if (deviceNo !== null && deviceNo !== undefined) {
    const displayIndex = Number(deviceNo)
    return Number.isFinite(displayIndex)
      ? `连接器 ${displayIndex + 1}`
      : `连接器 ${deviceNo}`
  }
  return '未知连接器'
}

// 获取返回路径（包含生产区域参数）
const getReturnPath = () => {
  const fromArea = route.query.fromArea || 'all'
  return `/?area=${fromArea}`
}

// 获取历史数据
const fetchHistoryData = async () => {
  const res = await getConnectorHis(connectorId.value)

  historyData.value = res.data
  connectorName.value = getConnectorName(parseInt(connectorId.value))

  // 清空新数据缓存
  pendingData.value = []

  updateNewDataCount()
}

// 关联warning数据到历史记录
const linkWarningData = async () => {
  try {
    const warningRes = await getWarningList({})
    const warnings = Array.isArray(warningRes.data) ? warningRes.data : (warningRes.data?.data || [])
    
    // 为每条历史记录查找对应的warning状态
    historyData.value.forEach(record => {
      if (record.status === 'error' || record.status === 'warning') {
        const recordDate = parseRecordDate(record)
        if (recordDate) {
          // 查找匹配的warning记录（通过device_no和时间匹配）
          const deviceNo = parseInt(connectorId.value)
          const matchingWarning = warnings.find(warning => {
            if (warning.deviceNo !== deviceNo && warning.device_no !== deviceNo) {
              return false
            }
            // 时间匹配：允许一定的时间误差（例如5分钟内）
            const warningTime = new Date(warning.createTime || warning.create_time)
            const timeDiff = Math.abs(recordDate.getTime() - warningTime.getTime())
            return timeDiff <= 5 * 60 * 1000 // 5分钟内
          })
          
          if (matchingWarning) {
            record.warningState = matchingWarning.state || '未解决'
            record.warningId = matchingWarning.id
          } else {
            record.warningState = '未解决'
          }
        } else {
          record.warningState = '未解决'
        }
      }
    })
    
    // 同步更新allHistoryData
    allHistoryData.value = historyData.value
  } catch (error) {
    console.error("获取warning数据失败:", error)
  }
}

// 获取warning状态样式
const getWarningStateClass = (state) => {
  if (state === '已解除') return 'text-green-600'
  return 'text-red-600'
}

// WebSocket 事件处理函数
const handleDeviceStatusUpdate = (data) => {
  console.log('原始数据：', data)
  // data = WebSocket 推送的数据
  // 假设是单条记录 or 数组，统一处理
  const records = Array.isArray(data) ? data : [data]

  records.forEach(record => {
    console.log('process record:', record)
    console.log('current device id',connectorId.value)
    // 只处理当前查看的设备
    if (String(record.id) !== String(connectorId.value)) {
      console.log('skopped device id mismatch')
      return
    }
    // 防止重复推送
    const recordDate = parseRecordDate(record)
    console.log('parsed date',recordDate)

    const recordTime = recordDate?.getTime()
    if (!recordTime) return

    const isNewerThanEntry = recordTime > entryTime.value
    const existsInPending = pendingData.value.some(r =>
      parseRecordDate(r)?.getTime() === recordTime
    )

    if (!isNewerThanEntry && !existsInPending) {
      pendingData.value.unshift(record) // 新数据放前面
    }
  })

  updateNewDataCount()
}


// 更新新数据计数
const updateNewDataCount = () => {
  newDataCount.value = pendingData.value.length
  newErrorCount.value = pendingData.value.filter(r => r.status === 'error').length
  newWarningCount.value = pendingData.value.filter(r => r.status === 'warning').length
}

// 获取新数据提示消息
const getNewDataMessage = () => {
  let message = `${newDataCount.value}条新更新`;
  const details = [];
  if (newErrorCount.value > 0) details.push(`异常:${newErrorCount.value}`);
  if (newWarningCount.value > 0) details.push(`警告:${newWarningCount.value}`);
  return details.length > 0 ? `${message} (${details.join('/')})` : message;
}

// 刷新数据
const refreshData = async () => {
  historyData.value = [...pendingData.value, ...historyData.value]
  pendingData.value = []
  entryTime.value = Date.now()
  updateNewDataCount()
}


// 监听warning更新（通过WebSocket或定时刷新）
const handleWarningUpdate = async () => {
  // 重新关联warning数据
  await linkWarningData()
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
  let data = historyData.value.slice()

  data = data.filter(record => matchesTimeRange(record, timeRange.value))

  if (statusFilter.value !== 'all') {
    data = data.filter(record => record.status === statusFilter.value)
  }

  if (dataType.value !== 'all') {
    data = data.filter(record => matchesDataType(record, dataType.value))
  }

  return data
})

const paginatedData = computed(() => {
  const start = (currentPage.value - 1) * pageSize
  const end = start + pageSize
  return filteredData.value.slice(start, end)
})

const totalPages = computed(() => {
  const pages = Math.ceil(filteredData.value.length / pageSize)
  return Math.max(1, pages || 0)
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

const getNewDataStatusClass = computed(() => {
  if (newErrorCount.value > 0) return 'bg-red-50 border-red-200 text-red-800';
  if (newWarningCount.value > 0) return 'bg-yellow-50 border-yellow-200 text-yellow-800';
  return 'bg-blue-50 border-blue-200 text-blue-800';
})

const getNewDataIconClass = computed(() => {
  if (newErrorCount.value > 0) return 'text-red-600';
  if (newWarningCount.value > 0) return 'text-yellow-600';
  return 'text-blue-600';
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

const viewDetails = (record) => {
  selectedRecord.value = record
}

const buildExportRows = (records) => {
  return records.map(record => {
    const row = {
      '日期': record.date || '',
      '时间': record.time || '',
      '状态': getStatusText(record.status)
    }
    
    // 根据数据筛选类型决定导出哪些字段
    if (dataType.value === 'all' || dataType.value === 'environmentA') {
      row['电压1(V)'] = record.environmentA?.voltage1 ?? ''
      row['电压2(V)'] = record.environmentA?.voltage2 ?? ''
      row['电压3(V)'] = record.environmentA?.voltage3 ?? ''
      row['电流1(A)'] = record.environmentA?.current1 ?? ''
      row['电流2(A)'] = record.environmentA?.current2 ?? ''
      row['电流3(A)'] = record.environmentA?.current3 ?? ''
    }
    
    if (dataType.value === 'all' || dataType.value === 'environmentB') {
      row['温度1(°C)'] = record.environmentB?.temperature1 ?? ''
      row['温度2(°C)'] = record.environmentB?.temperature2 ?? ''
      row['温度3(°C)'] = record.environmentB?.temperature3 ?? ''
      row['温度4(°C)'] = record.environmentB?.temperature4 ?? ''
      row['温度5(°C)'] = record.environmentB?.temperature5 ?? ''
      row['温度6(°C)'] = record.environmentB?.temperature6 ?? ''
      row['湿度1(%)'] = record.environmentB?.humidity1 ?? ''
      row['湿度2(%)'] = record.environmentB?.humidity2 ?? ''
      row['气压1(hPa)'] = record.environmentB?.atmosphericPressure1 ?? ''
      row['气压2(hPa)'] = record.environmentB?.atmosphericPressure2 ?? ''
    }
    
    if (dataType.value === 'all' || dataType.value === 'environmentC') {
      row['CO(ppm)'] = record.environmentC?.co ?? ''
      row['CH4(%LEL)'] = record.environmentC?.ch4 ?? ''
      row['O₂(%)'] = record.environmentC?.o2 ?? ''
      row['气体温度(°C)'] = record.environmentC?.temperature ?? ''
      row['气体湿度(%)'] = record.environmentC?.humidity ?? ''
    }
    
    if (dataType.value === 'all' || dataType.value === 'environmentD') {
      row['位置信息'] = getPositionStatus(record.environmentD)
    }
    
    return row
  })
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

watch(filteredData, () => {
  if (currentPage.value > totalPages.value) {
    currentPage.value = totalPages.value
  }
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
  
  // 记录进入时间
  entryTime.value = Date.now()
  
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
  
  // 每30秒更新一次新数据计数和warning状态
  newDataTimer = setInterval(() => {
    updateNewDataCount()
    linkWarningData() // 同步更新warning状态
  }, 30000)
})

onUnmounted(() => {
  console.log("History.vue 组件卸载，移除 WebSocket 监听器")
  
  // 清理定时器
  if (newDataTimer) {
    clearInterval(newDataTimer)
    newDataTimer = null
  }
  
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