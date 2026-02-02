/**
 * WebSocket 工具类
 * 用于与后端建立 WebSocket 连接，接收实时设备数据更新
 */

import SockJS from 'sockjs-client';
import { Client } from '@stomp/stompjs';

class WebSocketClient {
  constructor(url, options = {}) {
    this.url = url;
    this.options = {
      reconnectInterval: 3000, // 重连间隔（毫秒）
      maxReconnectAttempts: 10, // 最大重连次数
      ...options
    };
    this.socket = null;
    this.stompClient = null;
    this.reconnectAttempts = 0;
    this.listeners = new Map();
    this.isConnected = false;
  }

  /**
   * 连接 WebSocket
   */
  connect() {
    try {
      // 创建 STOMP 客户端
      this.stompClient = new Client({
        webSocketFactory: () => new SockJS(this.url),
        reconnectDelay: this.options.reconnectInterval,
        heartbeatIncoming: 4000,
        heartbeatOutgoing: 4000,
        debug: (str) => {
          // 生产环境可以禁用调试日志
          if (import.meta.env.DEV) {
            console.log('STOMP:', str);
          }
        },
        onConnect: (frame) => {
          console.log('WebSocket 连接成功', frame);
          this.isConnected = true;
          this.reconnectAttempts = 0;
          
          // 订阅设备状态更新主题
          if (this.stompClient && this.stompClient.connected) {
            this.stompClient.subscribe('/topic/device/status', (message) => {
              try {
                const data = JSON.parse(message.body);
                console.log('收到设备状态更新:', data);
                this.emit('deviceStatusUpdate', data);
              } catch (error) {
                console.error('解析设备状态数据失败:', error);
              }
            });
            console.log('已订阅设备状态更新主题: /topic/device/status');
          }
          
          // 触发连接成功事件
          this.emit('connected');
        },
        onStompError: (frame) => {
          console.error('WebSocket STOMP 错误:', frame);
          this.isConnected = false;
          this.emit('error', frame);
        },
        onWebSocketClose: () => {
          console.log('WebSocket 连接已关闭');
          this.isConnected = false;
          this.emit('disconnected');
          // 自动重连
          if (this.reconnectAttempts < this.options.maxReconnectAttempts) {
            this.reconnect();
          }
        },
        onWebSocketError: (error) => {
          console.error('WebSocket 连接错误:', error);
          this.isConnected = false;
          this.emit('error', error);
          this.reconnect();
        }
      });
      
      // 激活连接
      this.stompClient.activate();
    } catch (error) {
      console.error('创建 WebSocket 连接失败:', error);
      this.emit('error', error);
      this.reconnect();
    }
  }

  /**
   * 订阅主题
   */
  subscribe(destination, callback) {
    if (this.stompClient && this.isConnected && this.stompClient.connected) {
      return this.stompClient.subscribe(destination, (message) => {
        callback(message);
      });
    }
    return null;
  }

  /**
   * 断开连接
   */
  disconnect() {
    if (this.stompClient) {
      this.stompClient.deactivate();
      console.log('WebSocket 连接已断开');
      this.isConnected = false;
      this.emit('disconnected');
    }
  }

  /**
   * 重连
   */
  reconnect() {
    if (this.reconnectAttempts < this.options.maxReconnectAttempts) {
      this.reconnectAttempts++;
      console.log(`尝试重连 (${this.reconnectAttempts}/${this.options.maxReconnectAttempts})...`);
      
      setTimeout(() => {
        this.disconnect();
        this.connect();
      }, this.options.reconnectInterval);
    } else {
      console.error('达到最大重连次数，停止重连');
      this.emit('reconnectFailed');
    }
  }

  /**
   * 添加事件监听器
   */
  on(event, callback) {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, []);
    }
    this.listeners.get(event).push(callback);
  }

  /**
   * 移除事件监听器
   */
  off(event, callback) {
    if (this.listeners.has(event)) {
      const callbacks = this.listeners.get(event);
      const index = callbacks.indexOf(callback);
      if (index > -1) {
        callbacks.splice(index, 1);
      }
    }
  }

  /**
   * 触发事件
   */
  emit(event, data) {
    if (this.listeners.has(event)) {
      this.listeners.get(event).forEach(callback => {
        try {
          callback(data);
        } catch (error) {
          console.error(`事件监听器执行失败 (${event}):`, error);
        }
      });
    }
  }

  /**
   * 获取连接状态
   */
  getConnectionState() {
    return this.isConnected && this.stompClient && this.stompClient.connected;
  }
}

// 创建单例实例
let wsClient = null;

/**
 * 获取 WebSocket 客户端实例
 */
export function getWebSocketClient() {
  if (!wsClient) {
    // 根据当前环境确定 WebSocket URL
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const host = window.location.hostname;
    const port = window.location.port || (window.location.protocol === 'https:' ? '443' : '80');
    
    // 开发环境使用代理，生产环境直接连接
    let wsUrl;
    if (import.meta.env.DEV) {
      // 开发环境：通过 Vite 代理连接
      // SockJS 需要使用完整的 HTTP/HTTPS URL，而不是 ws://
      const protocol = window.location.protocol === 'https:' ? 'https:' : 'http:';
      wsUrl = `${protocol}//${window.location.host}/ws/device`;
    } else {
      // 生产环境：根据实际情况配置
      // 如果前后端部署在同一域名，使用相对路径；否则使用完整 URL
      // 这里假设前后端可能在同一服务器，使用当前 host
      const protocol = window.location.protocol === 'https:' ? 'https:' : 'http:';
      // 如果前后端不在同一端口，需要明确指定后端端口（例如 32888）
      // 这里可以根据实际部署情况调整
      const backendHost = window.location.hostname;
      const backendPort = window.location.port || (window.location.protocol === 'https:' ? '443' : '80');
      // 如果后端运行在 32888 端口且前端通过 nginx 等代理，可以使用 window.location.host
      // 如果直接连接，使用下面的配置
      wsUrl = `${protocol}//${backendHost}:${backendPort}/ws/device`;
    }
    
    console.log('WebSocket URL:', wsUrl);
    
    wsClient = new WebSocketClient(wsUrl);
  }
  return wsClient;
}

/**
 * 初始化 WebSocket 连接
 */
export function initWebSocket() {
  const client = getWebSocketClient();
  if (!client.getConnectionState()) {
    client.connect();
  }
  return client;
}

/**
 * 断开 WebSocket 连接
 */
export function disconnectWebSocket() {
  if (wsClient) {
    wsClient.disconnect();
    wsClient = null;
  }
}

export default WebSocketClient;

