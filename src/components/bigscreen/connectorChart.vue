<template>
  <div class="connector-chart">
    <div class="chart-header">
      <h3 class="chart-title">[ 连接器分布 ]</h3>
      <div class="header-right">
        <!-- 生产区域标签页 -->
        <div class="area-tabs">
          <button
            v-for="area in productionAreas"
            :key="area.value"
            @click="toggleAreaHighlight(area.value)"
            :class="[
              'area-tab',
              { 'active': highlightedAreas.includes(area.value) }
            ]"
          >
            {{ area.label }}
          </button>
        </div>
        
        <!-- 提示音开关 -->
        <div class="sound-toggle">
          <label class="switch-label">
            <span>提示音</span>
            <input
              type="checkbox"
              v-model="soundEnabled"
              class="switch-input"
            />
            <span class="switch-slider"></span>
          </label>
        </div>
      </div>
    </div>
    
    <div class="chart-container">
      <div class="tunnel-bg"></div>
      <canvas
        ref="canvasRef"
        class="connector-canvas"
        @mousemove="handleMouseMove"
        @mouseleave="handleMouseLeave"
      />
      
      <div class="legend-bar">
        <div class="legend-item normal">
          <span class="line left"></span>
          <div class="dot-wrapper">
            <div class="dot-core"></div>
            <div class="dot-ring"></div>
            <div class="dot-halo"></div>
          </div>
          <span class="label">正常</span>
          <span class="line right"></span>
        </div>
        <div class="legend-item warning">
          <span class="line left"></span>
          <div class="dot-wrapper">
            <div class="dot-core"></div>
            <div class="dot-ring"></div>
            <div class="dot-halo"></div>
            <div class="particles"></div>
          </div>
          <span class="label">预警</span>
          <span class="line right"></span>
        </div>
        <div class="legend-item alarm">
          <span class="line left"></span>
          <div class="dot-wrapper">
            <div class="dot-core"></div>
            <div class="dot-ring"></div>
            <div class="dot-halo"></div>
            <div class="particles"></div>
          </div>
          <span class="label">告警</span>
          <span class="line right"></span>
        </div>
      </div>
      
      <!-- Tooltip -->
      <div
        v-if="tooltip.show"
        class="tooltip"
        :style="{ left: tooltip.x + 'px', top: tooltip.y + 'px' }"
      >
        <div class="tooltip-title">连接器{{ tooltip.deviceNo }}</div>
        <div class="tooltip-content">{{ tooltip.content }}</div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted, watch } from 'vue'
import { getWarningList } from '../../api/api'

// Props
const props = defineProps({
  connectors: {
    type: Array,
    default: () => []
  }
})

/* ================= 核心配置 ================= */
const canvasRef = ref(null)
let ctx = null
let rafId = 0
let tick = 0

// 基础布局配置
const CONFIG = {
  startX: 0.18,
  startY: 0.58,
  vanishX: 0.72,
  vanishY: 0.48,
}

// 生产区域配置
const productionAreas = [
  { label: '生产区域A', value: 'A', color: '#10b981' },
  { label: '生产区域B', value: 'B', color: '#3b82f6' },
  { label: '生产区域C', value: 'C', color: '#8b5cf6' }
]

// 响应式数据
const highlightedAreas = ref([])
const soundEnabled = ref(true)
const tooltip = ref({
  show: false,
  x: 0,
  y: 0,
  deviceNo: 0,
  content: ''
})

// 连接器数据
const canvasConnectors = ref([])
const warningMap = ref(new Map())

// 音频对象
let alarmAudio = null
let warningAudio = null
let lastPlayedTime = 0

/* ================= 工具函数 ================= */

// 根据device_no获取生产区域
const getProductionArea = (connector) => {
  if (connector.productionArea) {
    return connector.productionArea
  }
  const deviceNo = connector.device_no ?? connector.id ?? 0
  if (deviceNo >= 0 && deviceNo <= 2) return 'A'
  if (deviceNo >= 3 && deviceNo <= 5) return 'B'
  if (deviceNo >= 6 && deviceNo <= 8) return 'C'
  return 'A'
}

// 转换connector状态
const convertStatus = (status) => {
  if (status === 'error' || status === 'alarm') return 'error'
  if (status === 'warning') return 'warning'
  return 'normal'
}

// 十六进制转RGBA
function hexToRgba(hex, alpha) {
  let r = 0, g = 0, b = 0;
  if (hex.length === 7) {
    r = parseInt(hex.slice(1, 3), 16);
    g = parseInt(hex.slice(3, 5), 16);
    b = parseInt(hex.slice(5, 7), 16);
  }
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

// 初始化连接器数据
function initConnectors() {
  if (!props.connectors || props.connectors.length === 0) {
    canvasConnectors.value = []
    return
  }
  
  // 按生产区域分组
  const areaGroups = {}
  props.connectors.forEach(connector => {
    const area = getProductionArea(connector)
    if (!areaGroups[area]) {
      areaGroups[area] = []
    }
    areaGroups[area].push(connector)
  })
  
  const list = []
  
  // 为每个生产区域分配位置
  Object.keys(areaGroups).forEach((area, areaIndex) => {
    const connectors = areaGroups[area]
    
    connectors.forEach((connector, index) => {
      // 非线性分布
      const t = Math.pow(index / Math.max(1, connectors.length - 1), 0.75)
      
      // 不同区域有不同的起始位置
      const areaOffsetX = (areaIndex % 3) * 0.2
      const areaOffsetY = (Math.floor(areaIndex / 3)) * 0.15
      
      const x = CONFIG.startX + (CONFIG.vanishX - CONFIG.startX) * t + areaOffsetX * 0.3
      const y = CONFIG.startY + (CONFIG.vanishY - CONFIG.startY) * t + areaOffsetY * 0.3
      const scale = Math.max(0.3, 1 - t * 0.6)
      
      const deviceNo = connector.device_no ?? connector.id ?? index
      const status = convertStatus(connector.status || 'normal')
      const faultInfo = warningMap.value.get(deviceNo) || ''
      
      list.push({
        deviceNo,
        status,
        x,
        y,
        scale,
        particles: [],
        productionArea: area,
        faultInfo
      })
    })
  })
  
  canvasConnectors.value = list
}

// 切换区域高亮
function toggleAreaHighlight(area) {
  const index = highlightedAreas.value.indexOf(area)
  if (index > -1) {
    highlightedAreas.value.splice(index, 1)
  } else {
    highlightedAreas.value.push(area)
  }
}

// 加载警告信息
async function loadWarnings() {
  try {
    const res = await getWarningList({})
    const warnings = Array.isArray(res.data) ? res.data : (res.data?.data || [])
    
    warningMap.value.clear()
    warnings.forEach((warning) => {
      const deviceNo = warning.deviceNo ?? warning.device_no
      if (deviceNo !== undefined && deviceNo !== null) {
        const info = warning.info || '未知故障'
        warningMap.value.set(deviceNo, info)
      }
    })
    
    // 重新初始化连接器数据以更新故障信息
    initConnectors()
  } catch (error) {
    console.error('加载警告信息失败', error)
  }
}

// 播放提示音
function playSound(status) {
  if (!soundEnabled.value) return
  
  const now = Date.now()
  // 防止频繁播放（至少间隔2秒）
  if (now - lastPlayedTime < 2000) return
  lastPlayedTime = now
  
  try {
    const soundUrl = new URL('../../assets/alarm.wav', import.meta.url).href
    if (status === 'error' || status === 'alarm') {
      if (!alarmAudio) {
        alarmAudio = new Audio(soundUrl)
        alarmAudio.volume = 0.5
      }
      alarmAudio.currentTime = 0
      alarmAudio.play().catch(err => console.error('播放提示音失败', err))
    } else if (status === 'warning') {
      // 警告使用较柔和的提示音
      if (!warningAudio) {
        warningAudio = new Audio(soundUrl)
        warningAudio.volume = 0.3
      }
      warningAudio.currentTime = 0
      warningAudio.play().catch(err => console.error('播放提示音失败', err))
    }
  } catch (error) {
    console.error('播放提示音失败', error)
  }
}

// 检测鼠标位置下的连接器
function getConnectorAt(x, y) {
  const canvas = canvasRef.value
  if (!canvas) return null
  
  const rect = canvas.getBoundingClientRect()
  const canvasX = x - rect.left
  const canvasY = y - rect.top
  
  const scaleX = canvas.width / rect.width
  const scaleY = canvas.height / rect.height
  const realX = canvasX * scaleX
  const realY = canvasY * scaleY
  
  for (const connector of canvasConnectors.value) {
    const connectorX = connector.x * canvas.width
    const connectorY = connector.y * canvas.height
    const distance = Math.sqrt(
      Math.pow(realX - connectorX, 2) + Math.pow(realY - connectorY, 2)
    )
    const radius = 6 * connector.scale * 5 // 扩大检测范围
    
    if (distance <= radius) {
      return connector
    }
  }
  
  return null
}

// 鼠标移动处理
function handleMouseMove(event) {
  const connector = getConnectorAt(event.clientX, event.clientY)
  
  if (connector && (connector.status === 'warning' || connector.status === 'error')) {
    tooltip.value = {
      show: true,
      x: event.clientX + 10,
      y: event.clientY - 10,
      deviceNo: connector.deviceNo,
      content: connector.faultInfo || '未知故障'
    }
  } else {
    tooltip.value.show = false
  }
}

// 鼠标离开处理
function handleMouseLeave() {
  tooltip.value.show = false
}

/* ================= 绘制函数 ================= */

// 根据状态获取核心透明度
function getCoreAlpha(status, time) {
  switch (status) {
    case 'error':
    case 'alarm':
      return 0.6 + Math.sin(time * 4) * 0.4
    case 'warning':
      return Math.sin(time * 2) > 0 ? 1 : 0.5
    default:
      return 1
  }
}

// 根据状态获取光晕透明度
function getGlowAlpha(status, time) {
  switch (status) {
    case 'error':
    case 'alarm':
      return 0.4 + Math.sin(time * 4) * 0.2
    case 'warning':
      return Math.sin(time * 2) > 0 ? 0.3 : 0.1
    default:
      return 0.2
  }
}

// 更新并绘制粒子效果
function updateAndDrawParticles(c, x, y, color) {
  if (c.particles.length < 15 && Math.random() > 0.7) {
    c.particles.push({
      x: 0, y: 0,
      vx: (Math.random() - 0.5) * 1.5,
      vy: (Math.random() - 0.5) * 1.5 - 0.5,
      life: 1.0,
      size: Math.random() * 2 * c.scale
    })
  }

  c.particles.forEach((p, index) => {
    p.x += p.vx;
    p.y += p.vy;
    p.life -= 0.015;
    
    if (p.life <= 0) {
      c.particles.splice(index, 1);
      return;
    }

    ctx.fillStyle = hexToRgba(color, p.life);
    ctx.beginPath();
    ctx.arc(x + p.x, y + p.y, p.size, 0, Math.PI * 2);
    ctx.fill();
  });
}

// 绘制连线
function drawConnections() {
  if (!canvasRef.value) return
  
  const width = canvasRef.value.width
  const height = canvasRef.value.height
  
  // 按生产区域分组连接器
  const areaGroups = {}
  canvasConnectors.value.forEach(connector => {
    if (!areaGroups[connector.productionArea]) {
      areaGroups[connector.productionArea] = []
    }
    areaGroups[connector.productionArea].push(connector)
  })
  
  // 为每个区域绘制连线
  Object.keys(areaGroups).forEach(area => {
    const connectors = areaGroups[area]
    const areaConfig = productionAreas.find(a => a.value === area)
    const areaColor = areaConfig?.color || '#10b981'
    
    // 检查是否高亮
    const isHighlighted = highlightedAreas.value.length === 0 || highlightedAreas.value.includes(area)
    const opacity = isHighlighted ? 0.6 : 0.2
    
    ctx.strokeStyle = hexToRgba(areaColor, opacity)
    ctx.lineWidth = 2
    
    // 绘制连线（连接同一区域内的连接器）
    for (let i = 0; i < connectors.length - 1; i++) {
      const c1 = connectors[i]
      const c2 = connectors[i + 1]
      
      const x1 = c1.x * width
      const y1 = c1.y * height
      const x2 = c2.x * width
      const y2 = c2.y * height
      
      ctx.beginPath()
      ctx.moveTo(x1, y1)
      ctx.lineTo(x2, y2)
      ctx.stroke()
    }
  })
}

// 绘制单个连接器
function drawConnector(c, width, height) {
  if (!canvasRef.value) return 
  // const { width, height } = canvasRef.value
  const realX = c.x * width
  const realY = c.y * height
  
  // 检查是否高亮
  const isHighlighted = highlightedAreas.value.length === 0 || highlightedAreas.value.includes(c.productionArea)
  if (!isHighlighted) {
    // 不高亮时降低透明度
    ctx.globalAlpha = 0.3
  } else {
    ctx.globalAlpha = 1.0
  }
  
  // 根据状态设置颜色
  let color = '#10b981' // 正常：绿色
  if (c.status === 'warning') color = '#fbbf24' // 预警：黄色
  if (c.status === 'error' || c.status === 'alarm') color = '#ef4444' // 异常/告警：红色

  const baseRadius = 6 * c.scale
  const time = tick * 0.05
  
  ctx.save()

  // 1. 底层大范围扩散光晕
  const outerGlowAlpha = getGlowAlpha(c.status, time)
  const outerGlow = ctx.createRadialGradient(realX, realY, 0, realX, realY, baseRadius * 10)
  outerGlow.addColorStop(0, hexToRgba(color, outerGlowAlpha * 0.3))
  outerGlow.addColorStop(0.5, hexToRgba(color, outerGlowAlpha * 0.1))
  outerGlow.addColorStop(1, 'transparent')
  ctx.fillStyle = outerGlow
  ctx.beginPath()
  ctx.arc(realX, realY, baseRadius * 10, 0, Math.PI * 2)
  ctx.fill()

  // 2. 静态扫描环
  ctx.strokeStyle = hexToRgba(color, 0.8)
  ctx.lineWidth = 1.5 * c.scale
  ctx.beginPath()
  ctx.arc(realX, realY, baseRadius * 2.5, 0, Math.PI * 2)
  ctx.stroke()
  
  // 3. 静态装饰点线
  ctx.beginPath()
  ctx.lineWidth = 2 * c.scale
  ctx.arc(realX, realY, baseRadius * 3.5, 0, Math.PI * 0.4)
  ctx.stroke()
  ctx.beginPath()
  ctx.arc(realX, realY, baseRadius * 3.5, Math.PI, Math.PI * 1.4)
  ctx.stroke()

  // 4. 粒子效果 (针对预警和告警)
  if (c.status !== 'normal') {
    updateAndDrawParticles(c, realX, realY, color)
  }

  // 5. 中心高亮核心
  const coreAlpha = getCoreAlpha(c.status, time)
  ctx.shadowBlur = 15 * c.scale * coreAlpha
  ctx.shadowColor = color
  ctx.fillStyle = hexToRgba('#fff', coreAlpha)
  ctx.beginPath()
  ctx.arc(realX, realY, baseRadius, 0, Math.PI * 2)
  ctx.fill()
  
  // 6. 编号文字
  ctx.shadowBlur = 0
  ctx.fillStyle = 'rgba(255,255,255,0.9)'
  ctx.font = `${Math.max(10, 14 * c.scale)}px "Microsoft YaHei"`
  ctx.textAlign = 'center'
  ctx.fillText(c.deviceNo.toString(), realX, realY - baseRadius * 5)
  
  ctx.restore()
  
  // 重置透明度
  ctx.globalAlpha = 1.0
}

// 渲染画布
function render() {
  if (!ctx || !canvasRef.value) return
  const {width,height} = canvasRef.value

  ctx.clearRect(0, 0, width, height)
  
  // 先绘制连线
  drawConnections()
  
  // 再绘制连接器
  canvasConnectors.value.forEach(c => drawConnector(c, width, height))
  
  tick++
  rafId = requestAnimationFrame(render)
}

// 处理窗口大小调整
function handleResize() {
  const canvas = canvasRef.value
  if (!canvas) return
  canvas.width = canvas.parentElement.clientWidth
  canvas.height = canvas.parentElement.clientHeight
}

// 监听connectors变化
watch(() => props.connectors, () => {
  initConnectors()
  
  // 检查是否有新的异常/警告，播放提示音
  canvasConnectors.value.forEach(connector => {
    if (connector.status === 'warning' || connector.status === 'error') {
      playSound(connector.status)
    }
  })
}, { deep: true })

// 监听highlightedAreas变化
watch(highlightedAreas, () => {
  // 高亮变化时重新渲染
}, { deep: true })

/* ================= 生命周期 ================= */
onMounted(() => {
  // 初始化画布尺寸
  handleResize()
  // 获取画布上下文
  ctx = canvasRef.value.getContext('2d')
  // 监听窗口大小变化
  window.addEventListener('resize', handleResize)
  
  // 加载警告信息
  loadWarnings()
  
  // 初始化连接器数据
  initConnectors()
  
  // 启动渲染循环
  render()
  
  // 定时刷新警告信息
  const warningTimer = setInterval(() => {
    loadWarnings()
  }, 30000) // 每30秒刷新一次
  
  // 保存定时器以便清理
  window.__connectorChartWarningTimer = warningTimer
})

onUnmounted(() => {
  // 取消动画帧
  cancelAnimationFrame(rafId)
  // 移除事件监听
  window.removeEventListener('resize', handleResize)
  
  // 清理定时器
  if (window.__connectorChartWarningTimer) {
    clearInterval(window.__connectorChartWarningTimer)
    window.__connectorChartWarningTimer = null
  }
  
  // 清理音频
  if (alarmAudio) {
    alarmAudio.pause()
    alarmAudio = null
  }
  if (warningAudio) {
    warningAudio.pause()
    warningAudio = null
  }
})
</script>

<style scoped>
.connector-chart {
  position: relative;
  width: 100%;
  height: 100%;
  min-height: 600px;
  background: transparent;
  display: flex;
  flex-direction: column;
}

.chart-header {
  padding: 20px 30px;
  z-index: 10;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.chart-title {
  font-size: 20px;
  color: #3affd8;
  text-shadow: 0 0 10px rgba(58, 255, 216, 0.5);
  margin: 0;
}

.header-right {
  display: flex;
  align-items: center;
  gap: 20px;
}

.area-tabs {
  display: flex;
  gap: 10px;
}

.area-tab {
  padding: 6px 16px;
  background: rgba(0, 30, 50, 0.6);
  color: #3affd8;
  border: 1px solid #3affd8;
  border-radius: 4px;
  cursor: pointer;
  font-size: 14px;
  transition: all 0.3s;
}

.area-tab:hover {
  background: rgba(58, 255, 216, 0.2);
}

.area-tab.active {
  background: rgba(58, 255, 216, 0.4);
  box-shadow: 0 0 10px rgba(58, 255, 216, 0.5);
}

.sound-toggle {
  display: flex;
  align-items: center;
}

.switch-label {
  display: flex;
  align-items: center;
  gap: 8px;
  color: #3affd8;
  font-size: 14px;
  cursor: pointer;
}

.switch-input {
  position: absolute;
  opacity: 0;
  width: 0;
  height: 0;
}

.switch-slider {
  position: relative;
  width: 44px;
  height: 24px;
  background: rgba(58, 255, 216, 0.3);
  border-radius: 24px;
  transition: background 0.3s;
}

.switch-slider::before {
  content: '';
  position: absolute;
  width: 20px;
  height: 20px;
  left: 2px;
  top: 2px;
  background: #fff;
  border-radius: 50%;
  transition: transform 0.3s;
}

.switch-input:checked + .switch-slider {
  background: rgba(58, 255, 216, 0.8);
}

.switch-input:checked + .switch-slider::before {
  transform: translateX(20px);
}

.chart-container {
  position: relative;
  flex: 1;
  overflow: hidden;

}

.tunnel-bg {
  position: absolute;
  inset: 0;
  background: url('../../assets/微信图片.jpg') center / contain no-repeat;
  background-color: transparent;
  filter: brightness(0.7) contrast(1.1);
  z-index: 1;
}

.connector-canvas {
  position: absolute;
  inset: 0;
  z-index: 5;
  cursor: pointer;
}

.tooltip {
  position: fixed;
  background: rgba(0, 0, 0, 0.9);
  border: 1px solid #3affd8;
  border-radius: 4px;
  padding: 8px 12px;
  color: #fff;
  font-size: 12px;
  z-index: 1000;
  pointer-events: none;
  box-shadow: 0 0 10px rgba(58, 255, 216, 0.5);
}

.tooltip-title {
  font-weight: bold;
  margin-bottom: 4px;
  color: #3affd8;
}

.tooltip-content {
  color: #fff;
}

.legend-bar {
  position: absolute;
  bottom: 22%;
  left: 50%;
  transform: translateX(-50%);
  width: 90%;
  display: flex;
  justify-content: center;
  gap: clamp(10px, 5vw, 80px);
  z-index: 99;
  pointer-events: auto;
  white-space: nowrap;
}

.legend-item {
  display: flex;
  align-items: center;
  gap: clamp(4px, 1vw, 15px);
  position: relative;
}

.label {
  font-size: clamp(12px, 1.2vw, 14px);
}

.dot-wrapper {
  position: relative;
  width: clamp(12px, 2vw, 24px);
  height: clamp(12px, 2vw, 24px);
  display: flex;
  align-items: center;
  justify-content: center;
}

.dot-core {
  width: 35%;
  height: 35%;
  background: #fff;
  border-radius: 50%;
  z-index: 2;
  box-shadow: 0 0 10px var(--color);
}

.dot-ring {
  position: absolute;
  width: 70%;
  height: 70%;
  border: 1.5px solid var(--color);
  border-radius: 50%;
}

.dot-halo {
  position: absolute;
  width: 100%;
  height: 100%;
  background: var(--color);
  border-radius: 50%;
  opacity: 0.2;
}

.legend-item .line {
  width: clamp(10px, 3vw, 40px);
  height: 1px;
  background: linear-gradient(to var(--dir, right), transparent, var(--color));
}

.legend-item .line.right { --dir: left; }

.legend-item .label {
  color: #fff;
  font-size: clamp(10px, 1.2vw, 15px);
  text-shadow: 0 0 5px rgba(0,0,0,0.5);
}

@media (max-width: 480px) {
  .legend-item .line {
    display: none; /* 手机端隐藏装饰线，腾出空间给圆点和文字 */ 
  }
  .legend-bar {
    gap: 15px;
  }
}

.normal { --color: #10b981 !important; }
.warning { --color: #fbbf24 !important; }
.alarm { --color: #ef4444 !important; }
.error { --color: #ef4444 !important; }

.particles {
  position: absolute;
  inset: 0;
  border-radius: 50%;
  background: radial-gradient(circle, var(--color) 0%, transparent 70%);
  opacity: 0.3;
}
</style>