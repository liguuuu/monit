<template>
  <div>
    <!-- 统计概览 -->
    <StatsOverview :stats="stats" />

    <!-- 连接器监控卡片 -->
    <div class="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
      <ConnectorCard 
        v-for="connector in connectors" 
        :key="connector.id" 
        :connector="connector" 
      />
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted, nextTick } from 'vue'
import StatsOverview from '../components/StatsOverview.vue'
import ConnectorCard from '../components/ConnectorCard.vue'
import { getConnectorData } from '../api/api'
import { initWebSocket, disconnectWebSocket, getWebSocketClient } from '../utils/websocket'

// 连接器数据
let connectors = ref([])

// 统计数据计算
let stats = computed(() => {
  const total = connectors.value.length
  const normal = connectors.value.filter(c => c.status === 'normal').length
  const warning = connectors.value.filter(c => c.status === 'warning').length
  const error = connectors.value.filter(c => c.status === 'error').length
  
  return { total, normal, warning, error }
})

// WebSocket 事件处理函数
const handleDeviceStatusUpdate = (data) => {
  console.log("收到设备状态更新:", data);
  if (data && Array.isArray(data)) {
    // 去重：根据 device_no 去重，保留第一个
    const uniqueConnectors = []
    const seenDeviceNos = new Set()
    
    data.forEach(connector => {
      const deviceNo = connector.device_no
      if (deviceNo !== null && deviceNo !== undefined && !seenDeviceNos.has(deviceNo)) {
        seenDeviceNos.add(deviceNo)
        uniqueConnectors.push(connector)
      }
    })
    
    connectors.value = uniqueConnectors
    console.log("WebSocket 数据更新完成，去重后连接器数量:", connectors.value.length);
    
    nextTick(() => {
      console.log("数据已更新，组件已重新渲染");
    });
  }
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
  
  // 先通过 HTTP 请求获取初始数据
  getConnectorData().then(res => {
    // 去重：根据 device_no 去重，保留第一个
    const uniqueConnectors = []
    const seenDeviceNos = new Set()
    
    if (res.data && Array.isArray(res.data)) {
      res.data.forEach(connector => {
        const deviceNo = connector.device_no
        if (deviceNo !== null && deviceNo !== undefined && !seenDeviceNos.has(deviceNo)) {
          seenDeviceNos.add(deviceNo)
          uniqueConnectors.push(connector)
        }
      })
    }
    
    connectors.value = uniqueConnectors
    console.log("初始数据加载完成，去重后连接器数量:", connectors.value.length);
    console.log("连接器列表:", connectors.value);
    
    nextTick(() => {
      console.log("数据已更新，组件已渲染");
    });
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