import axios from "axios";

//const API_BASE = "http://120.46.133.240:32888";

// 使用相对路径，通过Vite代理转发到后端
// 开发环境：/api 会被代理到 http://120.46.133.240:32888
// 生产环境：需要配置nginx或其他方式处理
const API_BASE = "/api";

// 创建 axios 实例，配置超时和默认设置
const apiClient = axios.create({
  baseURL: API_BASE,
  timeout: 10000, // 10秒超时
  headers: {
    'Content-Type': 'application/json'
  }
});

// 请求拦截器
apiClient.interceptors.request.use(
  (config) => {
    console.log('发送请求:', config.method?.toUpperCase(), config.url);
    return config;
  },
  (error) => {
    console.error('请求错误:', error);
    return Promise.reject(error);
  }
);

// 响应拦截器
apiClient.interceptors.response.use(
  (response) => {
    console.log('收到响应:', response.status, response.config.url);
    return response;
  },
  (error) => {
    console.error('响应错误:', error.config?.url, error.message);
    return Promise.reject(error);
  }
);




// 获取所有连接器（首页使用）
export const getConnectors = () => axios.get(`${API_BASE}/connectors`);

// 获取单个连接器数据（详情页使用，按端口号）
export const getConnectorData = () =>
  axios.get(`${API_BASE}/device/list`);


export const getConnectorHis = (deviceId) =>
  axios.get(`${API_BASE}/device/history/`+deviceId);

// 推送模拟数据（可测试）
export const pushConnectorData = (data) =>
  axios.post(`${API_BASE}/connectors/push`, data);

// 用户登录
export const login = (credentials) =>
  axios.post(`${API_BASE}/auth/login`, credentials);

// 用户注册
export const register = (userData) =>
  axios.post(`${API_BASE}/auth/register`, userData);

// 获取报警信息列表
export const getWarningList = (params) =>
  axios.get(`${API_BASE}/warning/list`, { params });

// 获取一周内的报警信息（用于导出）
export const getWarningListForWeek = () =>
  axios.get(`${API_BASE}/warning/week`);

// 处理报警信息
export const handleWarning = (warningId, data) =>
  axios.post(`${API_BASE}/warning/handle/${warningId}`, data);

// 创建报警信息
export const createWarning = (data) =>
  axios.post(`${API_BASE}/warning/create`, data);

// 报警类型分布统计
export const getWarningSummary = () =>
  axios.get(`${API_BASE}/warning/summary`);
