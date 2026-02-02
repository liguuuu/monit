export interface ConnectorData {
  id: number
  name: string
  location: string
  status: 'normal' | 'warning' | 'error'
  lastUpdate: string
  
  // 环境编号A：电压电流数据
  environmentA: {
    voltage1: number
    voltage2: number
    voltage3: number
    current1: number
    current2: number
    current3: number
  }
  
  // 环境编号B：温湿度气压数据
  environmentB: {
    temperature1: number
    temperature2: number
    temperature3: number
    temperature4: number
    temperature5: number
    temperature6: number
    humidity1: number
    humidity2: number
    atmosphericPressure1: number
    atmosphericPressure2: number
  }
  
  // 环境编号C：气体监测数据
  environmentC: {
    co: number
    ch4: number
    o2: number
    temperature: number
    humidity: number
  }
  
  // 环境编号D：三轴加速度数据
  environmentD: {
    xAxis: {
      positive: boolean
      value: number
    }
    yAxis: {
      positive: boolean
      value: number
    }
    zAxis: {
      positive: boolean
      value: number
    }
  }
}