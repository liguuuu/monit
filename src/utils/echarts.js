/**
 * ECharts 按需引入工具
 * 减小打包体积，只引入需要的图表类型和组件
 */
import * as echarts from 'echarts/core';
import {
  LineChart,
  BarChart,
  PieChart,
  GaugeChart,
  GraphChart,
  HeatmapChart,
} from 'echarts/charts';
import {
  TitleComponent,
  TooltipComponent,
  LegendComponent,
  GridComponent,
  DataZoomComponent,
  ToolboxComponent,
  VisualMapComponent,
} from 'echarts/components';

import { CanvasRenderer } from 'echarts/renderers';

// 注册必需的组件
echarts.use([
  LineChart,
  BarChart,
  PieChart,
  GaugeChart,
  GraphChart,
  HeatmapChart,
  TitleComponent,
  TooltipComponent,
  LegendComponent,
  GridComponent,
  DataZoomComponent,
  ToolboxComponent,
  VisualMapComponent,
  CanvasRenderer
]);

export default echarts;


