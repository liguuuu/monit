<template>
  <div class="bigscreen-container">
    <!-- 顶部标题栏 -->
    <div class="header">
      <dv-decoration-10 class="header-sleft" />
      <dv-decoration-8 class="text-boder"  />
      <h1 class="title">中矽科技连接器监测平台 </h1>

      <!-- 移动端汉堡菜单按钮 -->
      <div class="sidebar-button" @click="toggleSidebar" v-if="showSidebarButton">
        <span></span>
        <span></span>
        <span></span>
      </div>

      <div class="header-right">
        <div class="time-display">{{ currentTime }}</div>
        <button class="back-btn" @click="goBack">返回</button>
      </div>
      <dv-decoration-8
        class="text-boder"
        :reverse="true"
      />
      <dv-decoration-10 class="header-sright" />
    </div> 

    <!-- 主要内容区域：三栏布局 -->
    <div class="main-content" v-if="renderDataV">
      <!-- 左侧栏 -->
      <div class="left-column">
        <!-- 状态统计 -->
        <dv-border-box-13 class="chart-item compact">
          <malfuncation-chart :stats="connectorStats" />
        </dv-border-box-13>
        
        <!-- 电压数据图表 -->
        <dv-border-box-13 class="chart-item">
          <voltage-chart ref="voltageChartRef" />
        </dv-border-box-13>

        <!-- 电流数据图表 -->
        <dv-border-box-13 class="chart-item">
          <current-chart ref="currentChartRef" />
        </dv-border-box-13>

      </div>

      <!-- 中间栏 -->
      <div class="middle-column">
        <!-- 报警信息 -->
        <dv-border-box-13 class="chart-item warning-chart">
          <warning-chart ref="warningChartRef" />
        </dv-border-box-13>

        <!-- 连接器分布 -->
        <dv-border-box-13 class="chart-item">
          <connector-chart ref="connectorChartRef" :connectors="connectors" />
        </dv-border-box-13>
          

      </div>

      <!-- 右侧栏 -->
      <div class="right-column">
        <!-- 异常分布 -->
        <dv-border-box-13 class="chart-item compact">
          <status-chart />
        </dv-border-box-13>
        <!-- 气体浓度数据图表 -->
        <!-- <dv-border-box-13 class="chart-item">
          <gas-chart ref="gasChartRef" />
        </dv-border-box-13> -->

        <!-- 温度热力图 -->
        <dv-border-box-13 class="chart-item">
          <temp-chart ref="tempChartRef" :connectors="connectors" />
        </dv-border-box-13>

        <!-- 湿度热力图 -->
        <dv-border-box-13 class="chart-item">
          <humidity-chart ref="humidityChartRef" :connectors="connectors" />
        </dv-border-box-13>

      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted, computed, nextTick } from 'vue'
import VoltageChart from '../components/bigscreen/voltageChart.vue'
import CurrentChart from '../components/bigscreen/currentChart.vue'
// import GasChart from '../components/bigscreen/gasChart.vue'
import TempChart from '../components/bigscreen/tempChart.vue'
import HumidityChart from '../components/bigscreen/humidityChart.vue'
import WarningChart from '../components/bigscreen/warningChart.vue'
import ConnectorChart from '../components/bigscreen/connectorChart.vue'
import MalfuncationChart from '../components/bigscreen/malfuncationChart.vue'
import StatusChart from '../components/bigscreen/statusChart.vue'
import { initWebSocket } from '../utils/websocket'
import { useRouter } from 'vue-router'
import { getConnectorData } from '../api/api'
import { applyConnectorSnapshots } from '../utils/connectorState'

const currentTime = ref('')
const voltageChartRef = ref(null)
const currentChartRef = ref(null)
// const gasChartRef = ref(null)
const tempChartRef = ref(null)
const humidityChartRef = ref(null)
const warningChartRef = ref(null)
const connectorChartRef = ref(null)
const connectors = ref([])

// 添加响应式状态
const sidebarOpen = ref(false)
const showSidebarButton = ref(false)

const router = useRouter()

let timeTimer = null

const renderDataV = ref(true)

const connectorStats = computed(() => {
  const total = connectors.value.length
  const normal = connectors.value.filter(c => c.status === 'normal').length
  const warning = connectors.value.filter(c => c.status === 'warning').length
  const error = connectors.value.filter(c => c.status === 'error').length
  return { total, normal, warning, error }
})

// 切换侧边栏
const toggleSidebar = () => {
  sidebarOpen.value = !sidebarOpen.value
}

//引入防抖函数
const debounce = (fn, delay) => {
  let timer = null
  return function() {
    if(timer) clearTimeout(timer)
    timer = setTimeout(() => fn.apply(this, arguments),delay)
  }
}

// 监听窗口大小变化
const checkScreenSize = debounce(() => {
  const width = window.innerWidth
  showSidebarButton.value = width < 768 // 768px以下显示汉堡菜单
  renderDataV.value = false
  nextTick(() => {
    renderDataV.value = true
  })
},300)

// 新增一个处理函数：在 resize 触发的第一时间就“关掉” DataV
const handleResizeStart = () => {
  if (renderDataV.value) {
    renderDataV.value = false // 立即销毁，停止内部所有监听
  }
  checkScreenSize() // 调用防抖后的恢复函数
}

// 返回Dashboard
const goBack = () => {
  router.push('/')
}

// 更新时间显示
const updateTime = () => {
  const now = new Date()
  const year = now.getFullYear()
  const month = String(now.getMonth() + 1).padStart(2, '0')
  const day = String(now.getDate()).padStart(2, '0')
  const hours = String(now.getHours()).padStart(2, '0')
  const minutes = String(now.getMinutes()).padStart(2, '0')
  const seconds = String(now.getSeconds()).padStart(2, '0')
  currentTime.value = `${year}年${month}月${day}日 ${hours}:${minutes}:${seconds}`
}

// WebSocket 事件处理
const handleDeviceStatusUpdate = (data) => {

  console.log('大屏收到设备状态更新:', data)
  if (Array.isArray(data)) {
    connectors.value = applyConnectorSnapshots(data)
    
    // 更新热力图
    if (tempChartRef.value) {
      tempChartRef.value.updateData()
    }
    if (humidityChartRef.value) {
      humidityChartRef.value.updateData()
    }
  }

  const mainConnector = Array.isArray(data)
    ? (data.find(item => item.device_no === 0 || item.device_no === '0') || data[0])
    : null

  if (mainConnector) {
    // 更新电压图表
    if (voltageChartRef.value && mainConnector.environmentA) {
      voltageChartRef.value.updateData({
        voltage1: mainConnector.environmentA.voltage1,
        voltage2: mainConnector.environmentA.voltage2,
        voltage3: mainConnector.environmentA.voltage3
      })
    }

    // 更新电流图表
    if (currentChartRef.value && mainConnector.environmentA) {
      currentChartRef.value.updateData({
        current1: mainConnector.environmentA.current1,
        current2: mainConnector.environmentA.current2,
        current3: mainConnector.environmentA.current3
      })
    }

    // 更新温度热力图
    if (tempChartRef.value) {
      tempChartRef.value.updateData()
    }
    
    // 更新湿度热力图
    if (humidityChartRef.value) {
      humidityChartRef.value.updateData()
    }
  }

  // 检查是否有报警信息（这里需要根据实际数据结构判断）
  // 如果数据中包含报警信息，传递给报警组件
  // 注意：报警信息通过WebSocket单独推送，由warningChart组件自己处理
}

onMounted(() => {
  // 立即更新时间
  updateTime()
  // 每秒更新时间
  timeTimer = setInterval(updateTime, 1000)

  // 先获取一次连接器数据用于统计
  getConnectorData().then(res => {
    if (res.data && Array.isArray(res.data)) {
      connectors.value = applyConnectorSnapshots(res.data)
    }
  }).catch(err => {
    console.error('获取连接器列表失败', err)
  })

  // 初始化 WebSocket 连接
  try {
    const wsClient = initWebSocket()
    wsClient.on('deviceStatusUpdate', handleDeviceStatusUpdate)
    // 注意：报警信息的WebSocket订阅由warningChart组件自己处理
  } catch (error) {
    console.error('初始化 WebSocket 失败:', error)
  }
  // 监听窗口大小变化
  checkScreenSize()
  window.addEventListener('resize', handleResizeStart)
})

onUnmounted(() => {
  // 清理定时器
  if (timeTimer) {
    clearInterval(timeTimer)
    timeTimer = null
  }
  // 移除事件监听
  window.removeEventListener('resize', handleResizeStart)
})
</script>

<style scoped>
.bigscreen-container {
  width: 100%;
  height: 100vh;
  margin: 0 auto;
  background-image: url('../assets/OIP.jpg'); 
  background-size: cover; 
  background-position: center center; 
  color: #fff;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  box-sizing: border-box;
  padding: 0 16px;
}

/* 汉堡菜单按钮 */
.sidebar-button {
  display: none;
  flex-direction: column;
  justify-content: space-between;
  width: 30px;
  height: 24px;
  background: transparent;
  border: none;
  cursor: pointer;
  padding: 0;
  position: absolute;
  left: 20px;
  top: 28px;
  z-index: 100;
}

.sidebar-button span {
  display: block;
  width: 100%;
  height: 3px;
  background: #40e0d0;
  border-radius: 2px;
  transition: all 0.3s;
}

.header {
  height: 90px;
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 0 16px;
  background: rgba(0, 0, 0, 0.3);
  position: relative;
  width: 100%;
  box-sizing: border-box;
  flex-shrink: 0;
}

.header-sleft,
.header-sright {
  /* flex: 1; */
  width: 80%;
  height: 5px; 
  position: relative;
  top: -24px;
  left: 14px; /* 右移20px，可根据需要调整 */
}
.header-sright {
  transform: rotateY(180deg); 
  left: -14px;
}

.text-boder {
  width: 400px;
  height: 45px;
  position: relative;
  top: -2px; 
  flex-shrink: 0;
  min-width: 200px !important;
}

.header-right {
  display: flex;
  align-items: center;
  gap: 20px;
  position: absolute; 
  top: 58%;
  transform: translateY(-40%);
  right: 12px;
  padding-right: 0;
  max-width: calc(100% - 720px);
  min-width: 200px;
  flex-wrap: nowrap;
}

/* 主标题的样式 */
.title {
  font-size: 32px;
  font-weight: bold;
  background: linear-gradient(90deg, #40e0d0, #ff8c00);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  text-shadow: 0 0 20px rgba(64, 224, 208, 0.5);
  display: flex;
  justify-content: center;
  align-items: center;
  text-align: center; 
  width: 100%; 
  height: auto; 
  position: relative; 
}


.time-display {
  font-size: 18px;
  color: #40e0d0;
  font-weight: 500;
  text-shadow: 0 0 10px rgba(64, 224, 208, 0.8);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  flex-shrink: 1;
  min-width: 0;
}

.back-btn {
  padding: 5px 13px;
  background: rgba(64, 224, 208, 0.2);
  border: 2px solid #40e0d0;
  border-radius: 8px;
  color: #40e0d0;
  font-size: 15px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.3s;
  text-shadow: 0 0 10px rgba(64, 224, 208, 0.5);
  white-space: nowrap;
  flex-shrink: 0;
}

.back-btn:hover {
  background: rgba(64, 224, 208, 0.4);
  box-shadow: 0 0 20px rgba(64, 224, 208, 0.6);
  transform: translateY(-2px);
}

/* 主内容区域的布局 */
.main-content {
  flex: 1;
  display: grid;
  grid-template-columns: 0.7fr 1fr 0.7fr;  /* 左右窄，中间宽 */
  gap: 14px;
  padding: 12px 0;
  overflow: hidden;
  width: 100%;
  box-sizing: border-box;
  min-height: 0; /* 允许flex子元素缩小 */
}

/* 列容器（左 / 中 / 右栏） */
.left-column,
.middle-column,
.right-column {
  display: flex;
  flex-direction: column;
  gap: 20px;
  height: 100%;
  overflow: hidden;
}

/* 强制给DataV 边框一个保底宽高 */
:deep(.dv-border-box-13),
:deep(.dv-decoration-10),
:deep(.dv-decoration-8){
  min-width: 100px !important;
  min-height: 50px !important;
  /* 确保它是块级元素，更容易被读取到尺寸 */
  display: block !important;
}

/* 单个图表的容器样式 */
.chart-item {
  flex: 1;
  background: transparent;
  border-radius: 8px;
  padding: 14px;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  min-height: 100px; 
  display: block;
  box-sizing: border-box;
}

.chart-item.compact {
  /* flex: 0 0 auto; */
  min-height: 0;
  padding: 12px;
}

/* 中间列的警告图表高度调整 */
.middle-column .warning-chart {
  flex: 0.64; /* 高度变窄 */
}

/* 响应式设计 */
/* 1. 大屏笔记本/台式机 (1200px-1920px) */
@media (max-width: 1920px) {
  .title {
    font-size: 28px;
  }
  .time-display {
    font-size: 20px;
  }
  .main-content {
    grid-template-columns: 27% 35% 27%; /* 调整比例 */
  }
  .header-right {
    max-width: calc(100% - 800px - 80px);
  }
  .bigscreen-container {
    padding: 0 12px;
  }
}

/* 2. 中等屏幕 (992px-1200px) */
@media (max-width: 1200px) {
  .header {
    padding: 0 30px;
  }
  .title {
    font-size: 24px;
  }
  .time-display {
    font-size: 18px;
  }
  .back-btn {
    padding: 4px 12px;
    font-size: 14px;
  }
  .main-content {
    grid-template-columns: 30% 32% 30%; /* 左右30%，中间32% */
    gap: 15px;
    padding: 15px;
  }
  .chart-item {
    padding: 12px;
  }
  .middle-column .warning-chart {
    flex: 0.55; /* 相应调整 */
  }
  .text-boder {
    width: 300px;
  }
  .header-right {
    max-width: calc(100% - 600px - 60px);
    right: 30px;
  }
  .bigscreen-container {
    padding: 0 12px;
  }
}

/* 3. 平板横向 (768px-992px) - 两栏布局 */
@media (max-width: 992px) {
  .header {
    padding: 0 20px;
    height: 70px;
  }
  .title {
    font-size: 20px;
  }
  .time-display {
    font-size: 16px;
  }
  .back-btn {
    padding: 3px 10px;
    font-size: 13px;
  }
  .main-content {
    grid-template-columns: 1fr 1fr; /* 两栏布局 */
    grid-template-rows: 1fr 1fr;
    grid-template-areas: 
      "left middle"
      "right middle";
  }
  .left-column {
    grid-area: left;
  }
  .middle-column {
    grid-area: middle;
    /* 两栏时中间栏会变宽，warning-chart高度相应调整 */
  }
  .right-column {
    grid-area: right;
  }
  .middle-column .warning-chart {
    flex: 0.5; /* 相应调整 */
  }
  .text-boder {
    width: 200px;
  }
  .header-right {
    max-width: calc(100% - 400px - 40px);
    right: 20px;
  }
  .bigscreen-container {
    padding: 0 10px;
  }
}

/* 4. 平板纵向/大手机 (576px-768px) - 单栏布局 */
@media (max-width: 768px) {
  .sidebar-button {
    display: flex;
  }
  
  .header {
    padding-left: 60px;
  }
  
  .title {
    font-size: 18px;
    text-align: center;
    padding: 0 10px;
  }
  
  .header-right {
    position: static;
    gap: 10px;
    max-width: 100%;
    transform: none;
  }
  
  .time-display {
    font-size: 14px;
  }
  
  .back-btn {
    padding: 3px 8px;
    font-size: 12px;
  }

  .bigscreen-container {
    padding: 0 8px;
  }
  
  .main-content {
    display: flex;
    flex-direction: column;
    gap: 12px;
    padding: 12px 0;
  }
  
  /* 移动端布局顺序：中间栏 -> 左侧栏 -> 右侧栏 */
  .middle-column {
    order: 1;
  }
  
  .left-column {
    order: 2;
  }
  
  .right-column {
    order: 3;
  }
  
  .left-column,
  .middle-column,
  .right-column {
    flex-direction: column;
  }
  
  /* 单栏布局时恢复正常高度 */
  .middle-column .warning-chart {
    flex: 1; /* 恢复正常高度 */
  }
  
  .chart-item {
    padding: 10px;
  }
}

/* 5. 小手机 (小于576px) */
@media (max-width: 576px) {
  .header {
    height: 60px;
    padding: 0 15px;
    padding-left: 50px;
  }
  
  .title {
    font-size: 16px;
    margin-left: 10px;
  }
  
  .sidebar-button {
    width: 26px;
    height: 20px;
    left: 15px;
    top: 20px;
  }
  
  .header-right {
    flex-direction: column;
    gap: 5px;
    align-items: flex-end;
  }
  
  .time-display {
    font-size: 12px;
  }
  
  .back-btn {
    padding: 2px 6px;
    font-size: 11px;
    border-width: 1px;
  }
  
  .main-content {
    gap: 10px;
    padding: 10px;
  }
  
  .chart-item {
    padding: 8px;
    border-radius: 6px;
  }
  
  .header-sleft,
  .header-sright,
  .text-boder,
  .dv-decoraction-10{
    display: none !important
  }
}

/* 6. 超小手机 (小于419px) */
@media (max-width: 419px) {
  .title {
    font-size: 14px;
  }
  
  .time-display {
    font-size: 11px;
  }
  
  .back-btn {
    font-size: 10px;
  }
  
  .main-content {
    gap: 8px;
    padding: 8px;
  }
  
  .chart-item {
    padding: 6px;
  }
}
</style>


