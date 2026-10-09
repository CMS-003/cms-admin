import apis from "@/api";
import { IBaseCom } from "@/types";
import { GripVertical } from "lucide-react";
import { useRef, useState, useCallback, useEffect } from "react";

import * as echarts from 'echarts/core';
import { CanvasRenderer } from 'echarts/renderers';
import {
  LineChart,
  BarChart,
  PieChart,
} from 'echarts/charts';
import {
  TitleComponent,
  TooltipComponent,
  LegendComponent,
  GridComponent,
  DatasetComponent,
  TransformComponent
} from 'echarts/components';

// 注册必须的组件
echarts.use([
  CanvasRenderer,
  LineChart,
  BarChart,
  PieChart,
  TitleComponent,
  TooltipComponent,
  LegendComponent,
  GridComponent,
  DatasetComponent,
  TransformComponent
]);

export default function Chart({ self, bindings, mode, children }: IBaseCom) {
  const cls = ['node', bindings.isDragging ? 'is-dragging' : '',].join(' ');
  const divRef = useRef<HTMLDivElement | null>(null)
  const [inited, setInited] = useState(false)
  const instanceRef = useRef<any>(null)
  const refresh = useCallback(async () => {
    if (instanceRef.current) {
      // 绘制图表
      instanceRef.current.showLoading()
      apis.fetch(self.widget.method, self.url).then(result => {
        instanceRef.current.hideLoading()
        if (result.code === 0) {
          instanceRef.current.setOption(result.data)
        }
      }).catch(() => {
        instanceRef.current.hideLoading()
      })
    }
  }, [])
  useEffect(() => {
    if (divRef.current && !inited) {
      setInited(true)
      const myChart = echarts.init(divRef.current, self.attrs.theme, { renderer: self.attrs.renderer || 'canvas' });
      instanceRef.current = myChart;
      instanceRef.current.setOption(self.attrs.option || { title: { text: '无' } });
      refresh()
    }
    const observer = new ResizeObserver(() => {
      if (instanceRef.current) {
        instanceRef.current.resize();
      }
    });
    divRef.current && observer.observe(divRef.current);
    // 清理逻辑
    return () => {
      observer.disconnect();
    };
  })
  return <div
    {...bindings.root}
    className={cls}
    style={{
      flexDirection: 'column', position: 'relative', height: '100%'
    }}>
    <div style={{ display: 'flex' }}>
      {mode === 'edit' && <GripVertical className="node-handle" style={{ position: 'absolute', height: 'auto', zIndex: 3 }} ref={bindings.handleRef} onContextMenu={bindings.onContextMenu} />}
    </div>
    <div style={{ height: '100%', width: '100%', }} ref={divRef}></div>
  </div>
}