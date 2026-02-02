<template>
  <div>
    <!-- 统计概览 -->
    <StatsOverview :stats="stats" />

    <!-- Tabs 标签页 -->
    <div class="mb-6 bg-white rounded-xl shadow-md p-4">
      <div class="flex space-x-4 border-b border-gray-200">
        <button
          v-for="tab in tabs"
          :key="tab.value"
          @click="activeTab = tab.value"
          :class="[
            'px-6 py-3 font-medium text-sm transition-colors border-b-2',
            activeTab === tab.value
              ? 'text-blue-600 border-blue-600'
              : 'text-gray-500 border-transparent hover:text-gray-700 hover:border-gray-300'
          ]"
        >
          {{ tab.label }}
        </button>
      </div>
    </div>

    <!-- 连接器监控卡片 -->
    <div class="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
      <ConnectorCard 
        v-for="connector in filteredConnectors" 
        :key="connector.id" 
        :connector="connector" 
        :current-tab="activeTab"
        :initial-is-chart="cardViewStates[connector.id] || false"
        :saved-history="allHistoryData[connector.id] || []" 
        @update-view="(isChart) => handleToggleView(connector.id, isChart)"
        @update-history="(data) => updateHistoryData(connector.id, data)"
      />
    </div>
  </div>
</template>
 
<script setup>
import { ref, computed, onMounted, onUnmounted, nextTick } from 'vue'
import { useRoute } from 'vue-router'
import StatsOverview from '../components/StatsOverview.vue'
import ConnectorCard from '../components/ConnectorCard.vue'
import { getConnectorData } from '../api/api'
import { initWebSocket, disconnectWebSocket, getWebSocketClient } from '../utils/websocket'
import { applyConnectorSnapshots } from '../utils/connectorState'
import { data } from 'autoprefixer'

const route = useRoute()

// 连接器数据
let connectors = ref([])
const activeTab = ref('all')

// Tabs 标签页配置
const tabs = [
  { label: '全部区域', value: 'all' },
  { label: '生产区域A', value: 'A' },
  { label: '生产区域B', value: 'B' },
  { label: '生产区域C', value: 'C' }
]

// 获取连接器的生产区域
const getProductionArea = (connector) => {
  
  const loc = (connector && connector.location) ? String(connector.location).trim() : '';

  // 只要包含 A/a 就归为 A
  if (/[Aa]/.test(loc) || loc.includes('A区')) return 'A';
  if (/[Bb]/.test(loc) || loc.includes('B区')) return 'B';
  if (/[Cc]/.test(loc) || loc.includes('C区')) return 'C';

  return 'A'; 
};

// 记录状态的对象
const cardViewStates = ref({}) // 格式如: { "设备ID": true/false }

// 处理切换的方法
const handleToggleView = (id, isChart) => {
  cardViewStates.value[id] = isChart
}

//存储所有设备的历史记录
const allHistoryData = ref({})

//提供一个更新历史数据的方法传给子组件
const updateHistoryData = (id, data) => {
  allHistoryData.value[id] = data
}
// 根据选中的Tab过滤连接器
const filteredConnectors = computed(() => {
  if (activeTab.value === 'all') {
    return connectors.value
  }
  return connectors.value.filter(connector => {
    return getProductionArea(connector) === activeTab.value
  })
})

// 统计数据计算（基于过滤后的连接器）
let stats = computed(() => {
  const filtered = filteredConnectors.value
  const total = filtered.length
  const normal = filtered.filter(c => c.status === 'normal').length
  const warning = filtered.filter(c => c.status === 'warning').length
  const error = filtered.filter(c => c.status === 'error').length
  
  return { total, normal, warning, error }
})

const updateConnectorList = (incoming) => {
  if (!Array.isArray(incoming)) {
    return 
  }
  if (incoming.length === 0) {
    connectors.value = [];
    return 
  }
  connectors.value = applyConnectorSnapshots(incoming) 
  console.log("连接器数据已刷新，数量:", connectors.value.length) 
  nextTick(() => {
    console.log("数据已更新，组件已重新渲染") 
  }) 
}

// WebSocket 事件处理函数
const handleDeviceStatusUpdate = (data) => {
  console.log("收到设备状态更新:", data);
  updateConnectorList(data);
}

const handleWebSocketConnected = () => {
  console.log("WebSocket 连接已建立");
}

const handleWebSocketError = (error) => {
  console.error("WebSocket 错误:", error);
}

const handleWebSocketDisconnected = () => {
  console.log("WebSocket 连接已断开");
}

onMounted(() => {
  console.log("页面加载运行");
  
  // 从路由查询参数中获取生产区域，并设置activeTab
  const areaParam = route.query.area
  if (areaParam && ['all', 'A', 'B', 'C'].includes(areaParam)) {
    activeTab.value = areaParam
    console.log("从路由参数设置生产区域标签:", areaParam)
  }
  
  // 先通过 HTTP 请求获取初始数据
  getConnectorData().then(res => {
    if (res.data && Array.isArray(res.data)) {
      updateConnectorList(res.data)
      console.log("初始数据加载完成，连接器数量:", connectors.value.length);
      console.log("连接器列表:", connectors.value);
    }
  }).catch(error => {
    console.error("获取初始数据失败:", error);
  });

  // 初始化 WebSocket 连接
  try {
    const wsClient = initWebSocket();
    
    // 注册事件监听器
    wsClient.on('deviceStatusUpdate', handleDeviceStatusUpdate);
    wsClient.on('connected', handleWebSocketConnected);
    wsClient.on('error', handleWebSocketError);
    wsClient.on('disconnected', handleWebSocketDisconnected);
  } catch (error) {
    console.error("初始化 WebSocket 失败:", error);
  }
});

onUnmounted(() => {
  console.log("组件卸载，断开 WebSocket 连接");
  
  // 移除事件监听器
  const wsClient = getWebSocketClient();
  if (wsClient) {
    wsClient.off('deviceStatusUpdate', handleDeviceStatusUpdate);
    wsClient.off('connected', handleWebSocketConnected);
    wsClient.off('error', handleWebSocketError);
    wsClient.off('disconnected', handleWebSocketDisconnected);
    
    // 断开连接（如果不是最后一个组件使用，可以注释掉这行）
    // disconnectWebSocket();
  }
});

</script> 