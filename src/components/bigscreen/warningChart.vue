<template>
  <div class="warning-chart-container">
    <div class="header-row">
      <h3 class="chart-title">报警信息</h3>

      <!-- 时间范围选择下拉框 -->
      <div class="time-selector">
        <select v-model="timeRange" @change="handleTimeRangeChange" class="range-select">
          <option value="7">最近7天</option>
          <option value="30">最近30天</option>
          <option value="90">最近90天</option>
          <option value="365">最近一年</option>
          <option value="custom">自定义</option>
        </select>
      </div>

      <button class="export-btn" @click="exportToExcel" :disabled="isExporting">
        <span v-if="!isExporting">导出数据</span>
        <span v-if="isExporting">导出中...</span>
      </button>
    </div>

    <!-- 自定义日期选择弹窗 -->
    <div v-if="showDatePicker" class="date-picker-overlay" @click.self="showDatePicker = false">
      <div class="date-picker-content">
        <h4>选择日期范围</h4>
        <div class="date-inputs">
          <div>
            <label>开始日期:</label>
            <input type="date" v-model="startDate" class="date-input">
          </div>
          <div>
            <label>结束日期:</label>
            <input type="date" v-model="endDate" class="date-input">
          </div>
        </div>
        <div class="date-buttons">
          <button @click="showDatePicker = false" class="btn-cancel">取消</button>
          <button @click="confirmDateRange" class="btn-confirm">确认</button>
        </div>
      </div>
    </div>

    <!-- 导出加载遮罩 -->
    <div v-if="isExporting" class="export-loading-overlay">
      <div class="loading-spinner">
        <div class="spinner"></div>
        <p>正在导出数据，请稍候...</p>
      </div>
    </div>


    <div 
      class="warning-list"
      ref="scrollContainer"
      @mouseenter="pauseScroll"
      @mouseleave="resumeScroll"
    >
      <div 
        v-for="(warning, index) in warningList" 
        :key="warning.id || index"
        class="warning-item"
      >
        <div class="warning-content">
          <span class="warning-text">
            {{ index + 1 }}、{{ warning.deviceNo !== undefined && warning.deviceNo !== null ? `连接器${warning.deviceNo}` : '未知连接器' }}，{{ warning.info }}，时间：{{ formatTime(warning.createTime) }}
          </span>
          <button 
            :class="['handle-btn', warning.state === '已解除' ? 'solved' : 'unsolved']"
            @click="handleWarningClick(warning)"
          >
            去处理
          </button>
        </div>
      </div>

      <div v-if="warningList.length === 0" class="no-warning">
        暂无报警信息
      </div>
    </div>

    <!-- 处理对话框 -->
    <div v-if="showDialog" class="dialog-overlay" @click.self="closeDialog">
      <div class="dialog-content">
        <h3 class="dialog-title">处理报警信息</h3>
        <div class="dialog-body">
          <div class="form-item">
            <label>处理人姓名：</label>
            <input 
              type="text" 
              v-model="handleForm.person" 
              placeholder="请输入处理人姓名"
              class="form-input"
            />
          </div>
          <div class="form-item">
            <label>处理情况：</label>
            <select v-model="handleForm.state" class="form-select">
              <option value="未解决">未解决</option>
              <option value="已解除">已解除</option>
            </select>
          </div>
        </div>
        <div class="dialog-footer">
          <button class="btn btn-cancel" @click="closeDialog">取消</button>
          <button class="btn btn-confirm" @click="confirmHandle">确定</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue'
import { getWarningList, getWarningListForWeek, handleWarning } from '../../api/api'
import { initWebSocket, getWebSocketClient } from '../../utils/websocket'
import * as XLSX from 'xlsx'

const scrollContainer = ref(null)
const warningList = ref([])
const showDialog = ref(false)
const currentWarning = ref(null)
  const handleForm = ref({
    person: '',
    state: '未解决'
  })

let scrollTimer = null
let isPaused = false
let scrollPosition = 0

// 新增时间范围相关变量
const timeRange = ref('7') // 默认最近7天
const showDatePicker = ref(false)
const startDate = ref('')
const endDate = ref('')
const customStartDate = ref(null)
const customEndDate = ref(null)
const isExporting = ref(false) // 导出加载状态

// 格式化时间
const formatTime = (timeStr) => {
  if (!timeStr) return ''
  const date = new Date(timeStr)
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  const hours = String(date.getHours()).padStart(2, '0')
  const minutes = String(date.getMinutes()).padStart(2, '0')
  const seconds = String(date.getSeconds()).padStart(2, '0')
  return `${year}年${month}月${day}日 ${hours}:${minutes}:${seconds}`
}

// 处理时间范围选择变化
const handleTimeRangeChange = () => {
  if (timeRange.value === 'custom') {
    // 打开自定义日期选择器时初始化默认日期
    const today = new Date().toISOString().split('T')[0]
    const defaultStart = new Date()
    defaultStart.setDate(defaultStart.getDate() - 7)
    const defaultStartStr = defaultStart.toISOString().split('T')[0]
    
    startDate.value = defaultStartStr
    endDate.value = today
    showDatePicker.value = true
  }
}

// 确认自定义日期范围
const confirmDateRange = () => { 
  if (!startDate.value || !endDate.value) {
    alert('请选择完整的日期范围')
    return
  }
  if (new Date(startDate.value) > new Date(endDate.value)) {
    alert('开始日期不能晚于结束日期')
    return
  }
  customStartDate.value = startDate.value
  customEndDate.value = endDate.value
  showDatePicker.value = false
}

// 自动滚动
const startScroll = () => {
  if (!scrollContainer.value) return
  
  scrollTimer = setInterval(() => {
    if (!isPaused && scrollContainer.value) {
      scrollPosition += 1
      scrollContainer.value.scrollTop = scrollPosition
      
      // 计算原始列表的高度（不含复制的部分）
      const scrollHeight = scrollContainer.value.scrollHeight
      const originalHeight = scrollHeight / 2
      
      // 当接近底部时开始准备无缝过渡
      if (scrollPosition >= originalHeight - 50) {
        // 到达底部时平滑跳回顶部（而非瞬间跳转）
        if (scrollPosition >= originalHeight) {
          scrollPosition = 0
          // 使用平滑滚动
          scrollContainer.value.scrollTo({
            top: 0,
            behavior: 'smooth'
          })
        }
      }
    }
  }, 50) // 每40ms滚动1px
}

// 暂停滚动
const pauseScroll = () => {
  isPaused = true
}

// 恢复滚动
const resumeScroll = () => {
  isPaused = false
}

// 加载报警列表
const loadWarningList = async () => {
  try {
    // 直接请求所有报警信息（不限制state参数）
    const res = await getWarningList({})
    let allWarnings = []
    if (res.data && Array.isArray(res.data)) {
      allWarnings = res.data
    } else if (res.data && res.data.data && Array.isArray(res.data.data)) {
      allWarnings = res.data.data
    }
    
    // 只显示state为未解决的数据
    warningList.value = allWarnings.filter(warning => {
      return warning.state !== '已解除' && warning.state !== '已解决'
    })
    
    console.log('加载的未解决报警信息数量:', warningList.value.length)
  } catch (error) {
    console.error('加载报警列表失败:', error)
    // 重试时同样请求所有数据
    try {
      const allRes = await getWarningList({})
      let allWarnings = []
      if (allRes.data && Array.isArray(allRes.data)) {
        allWarnings = allRes.data
      } else if (allRes.data && allRes.data.data && Array.isArray(allRes.data.data)) {
        allWarnings = allRes.data.data
      }
      
      // 只显示state为未解决的数据
      warningList.value = allWarnings.filter(warning => {
        return warning.state !== '已解除' && warning.state !== '已解决'
      })
    } catch (retryError) {
      console.error('重试加载报警列表失败:', retryError)
    }
  }
}

// 处理报警点击
const handleWarningClick = (warning) => {
  currentWarning.value = warning
  handleForm.value = {
    person: warning.person || '',
    state: warning.state === '已解除' ? '已解除' : '未解决'
  }
  showDialog.value = true
}

// 关闭对话框
const closeDialog = () => {
  showDialog.value = false
  currentWarning.value = null
  handleForm.value = {
    person: '',
    state: '未解决'
  }
}

// 确认处理
const confirmHandle = async () => {
  if (!handleForm.value.person.trim()) {
    alert('请输入处理人姓名')
    return
  }

  if (!currentWarning.value) return

  try {
    const res = await handleWarning(currentWarning.value.id, {
      person: handleForm.value.person,
      state: handleForm.value.state
    })

    if (res.data && res.data.success !== false) {
      // 如果已解除，从列表中移除
      if (handleForm.value.state === '已解除') {
        const index = warningList.value.findIndex(item => item.id === currentWarning.value.id)
        if (index > -1) {
          warningList.value.splice(index, 1)
        }
      } else {
        // 更新状态
        const warning = warningList.value.find(item => item.id === currentWarning.value.id)
        if (warning) {
          warning.state = handleForm.value.state
          warning.person = handleForm.value.person
        }
      }
      closeDialog()
    }
  } catch (error) {
    console.error('处理报警失败:', error)
    alert('处理失败，请重试')
  }
}

// 修改导出Excel函数（添加时间范围和加载状态）
const exportToExcel = async () => {
  if (warningList.value.length === 0) {
    alert('没有数据可导出')
    return
  }
  isExporting.value = true
  try {
    // 1. 精确到日的时间范围过滤（包含开始日和结束日全天）
    let filteredData = [...warningList.value]
    const endDate = new Date() // 导出当天
    let startDate
    let fileNameStart, fileNameEnd
    
    if (timeRange.value === 'custom' && customStartDate.value && customEndDate.value) {
      // 自定义时间范围：直接使用选择的日期（包含全天）
      startDate = new Date(customStartDate.value)
      startDate.setHours(0, 0, 0, 0) // 开始日00:00:00
      
      const customEnd = new Date(customEndDate.value)
      customEnd.setHours(23, 59, 59, 999) // 结束日23:59:59
      endDate.setTime(customEnd.getTime())

      // 自定义时间范围的文件名日期
      fileNameStart = formatFileNameDate(customStartDate.value)
      fileNameEnd = formatFileNameDate(customEndDate.value)
    } else {
      // 预设时间范围（最近7/30/90/365天）
      const days = parseInt(timeRange.value)
      startDate = new Date(endDate)
      startDate.setDate(endDate.getDate() - days + 1) // 包含开始日（例：24日-7天+1=18日）
      startDate.setHours(0, 0, 0, 0) // 开始日00:00:00
      endDate.setHours(23, 59, 59, 999) // 结束日23:59:59

      // 预设时间范围的文件名日期
      fileNameStart = formatFileNameDate(startDate)
      fileNameEnd = formatFileNameDate(endDate)
    }
    
    // 过滤：只根据时间范围过滤，不再过滤状态（满足需求2）
    filteredData = filteredData.filter(item => {
      if (!item.createTime) return false
      const itemTime = new Date(item.createTime)
      return itemTime >= startDate && itemTime <= endDate
    })
    
    if (filteredData.length === 0) {
      alert('所选时间范围内没有数据可导出')
      return
    }
    
    // 2. 按警报ID升序排序
    filteredData.sort((a, b) => {
      const idA = typeof a.id === 'number' ? a.id : parseInt(a.id) || 0
      const idB = typeof b.id === 'number' ? b.id : parseInt(b.id) || 0
      return idA - idB
    })
    
    // 3. 构造Excel导出格式
    const exportData = filteredData.map((warning, index) => ({
      '警报ID': warning.id || '',
      '连接器编号': warning.deviceNo !== undefined && warning.deviceNo !== null ? warning.deviceNo : '未知',
      '警报信息': warning.info || '',
      '发生时间': formatTime(warning.createTime) || '',
      '处理情况': warning.state || '未处理',
      '处理人': warning.person || '',
      '解决时间': warning.state === '已解除' ? (formatTime(warning.handleTime || warning.updateTime) || '') : ''
    }))
    
    // 4. 创建工作表并设置列宽
    const worksheet = XLSX.utils.json_to_sheet(exportData)
    worksheet['!cols'] = [
      { wch: 8 },  // 警报ID
      { wch: 12 }, // 连接器编号
      { wch: 25 }, // 警报信息
      { wch: 22 }, // 发生时间
      { wch: 10 }, // 处理情况
      { wch: 8 },  // 处理人
      { wch: 22 }  // 解决时间
    ]
    
    // 生成工作簿并导出（使用时间范围作为文件名，满足需求1）
    const workbook = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(workbook, worksheet, '报警信息')
    const fileName = `报警信息_${fileNameStart}-${fileNameEnd}.xlsx`
    XLSX.writeFile(workbook, fileName)
  } catch (error) {
    console.error('导出数据失败:', error)
    alert('导出数据失败，请重试')
  } finally {
    isExporting.value = false
  }
}

// 新增文件名日期格式化函数
const formatFileNameDate = (dateInput) => {
  // 支持Date对象或日期字符串
  const date = typeof dateInput === 'string' ? new Date(dateInput) : dateInput
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}年${month}月${day}日`
}

// 日期格式化工具函数
const formatToApiDate = (date) => {
  return date.toISOString().split('T')[0]
}

let refreshTimer = null
let wsClient = null

// 处理报警信息更新（暴露给父组件调用）
const handleWarningUpdate = (data) => {
  console.log('收到报警信息更新:', data)
  
  // 如果收到的是单个报警信息
  if (data && data.id) {
    // 检查是否已存在，存在则更新，不存在则添加（不考虑state）
    const existingIndex = warningList.value.findIndex(item => item.id === data.id)
    if (existingIndex === -1) {
      warningList.value.unshift(data) // 添加到列表开头
      console.log('新增报警信息:', data)
    } else {
      warningList.value[existingIndex] = data // 更新现有信息
      console.log('更新报警信息:', data)
    }
  }
  // 如果收到的是报警信息数组
  else if (Array.isArray(data)) {
    // 合并所有数据，去重（不过滤state）
    data.forEach(warning => {
      const existingIndex = warningList.value.findIndex(item => item.id === warning.id)
      if (existingIndex === -1) {
        warningList.value.push(warning)
      } else {
        warningList.value[existingIndex] = warning
      }
    })
    console.log('批量更新报警信息，当前数量:', warningList.value.length)
  }
}

// 暴露方法给父组件
defineExpose({
  handleWarningUpdate,
  loadWarningList
})

onMounted(() => {
  loadWarningList()
  startScroll()
  
  // 定期刷新报警列表
  refreshTimer = setInterval(() => {
    loadWarningList()
  }, 30000) // 每30秒刷新一次
  
  // 初始化 WebSocket 连接并订阅报警信息更新
  try {
    wsClient = initWebSocket()
    
    // 订阅报警信息更新主题
    if (wsClient && wsClient.getConnectionState()) {
      wsClient.subscribe('/topic/warning/update', (message) => {
        try {
          const data = JSON.parse(message.body)
          handleWarningUpdate(data)
        } catch (error) {
          console.error('解析报警信息更新失败:', error)
        }
      })
      console.log('已订阅报警信息更新主题: /topic/warning/update')
    }
    
    // 监听连接成功事件，连接成功后再订阅
    wsClient.on('connected', () => {
      if (wsClient && wsClient.getConnectionState()) {
        wsClient.subscribe('/topic/warning/update', (message) => {
          try {
            const data = JSON.parse(message.body)
            handleWarningUpdate(data)
          } catch (error) {
            console.error('解析报警信息更新失败:', error)
          }
        })
        console.log('WebSocket连接成功，已订阅报警信息更新主题')
      }
    })
  } catch (error) {
    console.error('初始化 WebSocket 失败:', error)
  }
})

onUnmounted(() => {
  if (scrollTimer) {
    clearInterval(scrollTimer)
    scrollTimer = null
  }
  if (refreshTimer) {
    clearInterval(refreshTimer)
    refreshTimer = null
  }
  // 移除WebSocket事件监听
  if (wsClient) {
    wsClient.off('connected', handleWarningUpdate)
  }
})
</script>

<style scoped>
.warning-chart-container {
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
}

.header-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 10px;
}

.chart-title {
  font-size: 18px;
  font-weight: bold;
  color: #40e0d0;
  text-shadow: 0 0 10px rgba(64, 224, 208, 0.5);
}

.export-btn {
  padding: 4px 8px;
  background: rgba(64, 224, 208, 0.2);
  border: 1px solid #40e0d0;
  border-radius: 4px;
  color: #40e0d0;
  cursor: pointer;
  font-size: 13px;
  white-space: nowrap;
  transition: all 0.3s;
  margin-right: 10px; /* 增加右侧外边距，使按钮向左移动 */
  margin-top: 5px; /* 向下移动 */
}

.export-btn:hover {
  background: rgba(64, 224, 208, 0.4);
  box-shadow: 0 0 10px rgba(64, 224, 208, 0.5);
}

.warning-list {
  flex: 1;
  overflow-y: auto;
  overflow-x: hidden;
  padding: 10px;
  scroll-behavior: smooth;
}

.warning-list::-webkit-scrollbar {
  width: 6px;
}

.warning-list::-webkit-scrollbar-track {
  background: rgba(255, 255, 255, 0.1);
  border-radius: 3px;
}

.warning-list::-webkit-scrollbar-thumb {
  background: rgba(64, 224, 208, 0.5);
  border-radius: 3px;
}

.warning-item {
  margin-bottom: 12px;
  padding: 10px;
  background: rgba(255, 255, 255, 0.05);
  border-left: 3px solid #ff4444;
  border-radius: 4px;
  transition: all 0.3s;
}

.warning-item:hover {
  background: rgba(255, 255, 255, 0.1);
  transform: translateX(5px);
}

.warning-content {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 10px;
}

.warning-text {
  flex: 1;
  color: #fff;
  font-size: 14px;
  line-height: 1.5;
}

.handle-btn {
  padding: 6px 16px;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 14px;
  white-space: nowrap;
  transition: all 0.3s;
}

.handle-btn.unsolved {
  background: #ff4444;
  color: #fff;
}

.handle-btn.unsolved:hover {
  background: #ff6666;
  box-shadow: 0 0 10px rgba(255, 68, 68, 0.5);
}

.handle-btn.solved {
  background: #4caf50;
  color: #fff;
}

.handle-btn.solved:hover {
  background: #66bb6a;
  box-shadow: 0 0 10px rgba(76, 175, 80, 0.5);
}

.no-warning {
  text-align: center;
  color: rgba(255, 255, 255, 0.5);
  padding: 40px 0;
  font-size: 16px;
}

/* 对话框样式 */
.dialog-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.7);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  backdrop-filter: blur(5px);
}

.dialog-content {
  background: #1a1f3a;
  border: 2px solid #40e0d0;
  border-radius: 8px;
  padding: 24px;
  min-width: 400px;
  max-width: 500px;
  box-shadow: 0 10px 40px rgba(0, 0, 0, 0.5);
}

.dialog-title {
  font-size: 20px;
  color: #40e0d0;
  margin-bottom: 20px;
  text-align: center;
}

.dialog-body {
  margin-bottom: 24px;
}

.form-item {
  margin-bottom: 16px;
}

.form-item label {
  display: block;
  color: #fff;
  margin-bottom: 8px;
  font-size: 14px;
}

.form-input,
.form-select {
  width: 100%;
  padding: 10px;
  background: rgba(255, 255, 255, 0.1);
  border: 1px solid rgba(64, 224, 208, 0.3);
  border-radius: 4px;
  color: #fff;
  font-size: 14px;
  box-sizing: border-box;
}

.form-input:focus,
.form-select:focus {
  outline: none;
  border-color: #40e0d0;
  box-shadow: 0 0 10px rgba(64, 224, 208, 0.3);
}

.form-select option {
  background: #1a1f3a;
  color: #fff;
}

.dialog-footer {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
}

.btn {
  padding: 10px 24px;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 14px;
  transition: all 0.3s;
}

/* .btn-cancel {
  background: rgba(255, 255, 255, 0.1);
  color: #fff;
} */

.btn-cancel:hover {
  background: rgba(255, 255, 255, 0.2);
}

/* .btn-confirm {
  background: #40e0d0;
  color: #1a1f3a;
  font-weight: bold;
} */

.btn-confirm:hover {
  background: #66e6d6;
  box-shadow: 0 0 10px rgba(64, 224, 208, 0.5);
}

.header-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 15px;
  padding: 0 10px;
}

/* 时间选择器样式 */
.time-selector {
  margin-left: auto;
  margin-right: 10px;
  display: flex;
  align-items: center;
}

.range-select {
  appearance: none;
  -webkit-appearance: none;
  padding-right: 25px;
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='10' height='10' viewBox='0 0 24 24' fill='none' stroke='%2340e0d0' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpolyline points='6 9 12 15 18 9'%3E%3C/polyline%3E%3C/svg%3E");
  background-repeat: no-repeat;
  background-position: right 8px center;

  height: 28px;
  padding: 0 12px;
  font-size: 13px;
  line-height: 26px;
  border-radius: 4px;
  border: 1px solid #40e0d0;

  background: rgba(64, 224, 208, 0.2);
  color: #fff;
  
  box-sizing: border-box; /* 确保 padding 不撑大盒子 */
  transition: all 0.3s;
  cursor: pointer;
}

.range-select:hover{
  background-color: rgba(64, 224, 208, 0.4);
  box-shadow: 0 0 10px rgba(64, 224, 208, 0.5);
}
/* 日期选择弹窗样式 */
.date-picker-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.7);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.date-picker-content {
  background-color: #1a1a2e;
  padding: 20px;
  border-radius: 8px;
  width: 350px;
  border: 1px solid #40e0d0;
}

.date-picker-content h4 {
  color: #40e0d0;
  margin-top: 0;
  text-align: center;
}

.date-inputs {
  display: flex;
  gap: 15px;
  margin: 20px 0;
}

.date-inputs div {
  flex: 1;
}

.date-inputs label {
  display: block;
  color: #fff;
  margin-bottom: 5px;
  font-size: 14px;
}

.date-input {
  width: 100%;
  padding: 8px;
  border: 1px solid #40e0d0;
  border-radius: 4px;
  background-color: rgba(255, 255, 255, 0.1);
  color: #fff;
}

.date-buttons {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
  margin-top: 15px;
}

.btn-cancel, .btn-confirm {
  padding: 6px 15px;
  border-radius: 4px;
  border: none;
  cursor: pointer;
}

.btn-cancel {
  background-color: #666;
  color: #fff;
}

.btn-confirm {
  background-color: #40e0d0;
  color: #000;
  font-weight: bold;
}

/* 导出加载遮罩样式 */
.export-loading-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.6);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 2000;
}

.loading-spinner {
  text-align: center;
}

.spinner {
  width: 40px;
  height: 40px;
  margin: 0 auto;
  border: 4px solid rgba(64, 224, 208, 0.3);
  border-radius: 50%;
  border-top: 4px solid #40e0d0;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

.loading-spinner p {
  color: #40e0d0;
  margin-top: 15px;
  font-size: 16px;
}

/* 导出按钮禁用状态 */
.export-btn:disabled {
  background-color: #666;
  cursor: not-allowed;
  opacity: 0.8;
}
</style>

