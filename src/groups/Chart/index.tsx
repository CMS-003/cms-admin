import { useEffect, useRef, useState } from 'react'
import { IAuto, IBaseComponent } from '@/types/component'
import { Observer } from 'mobx-react'
import { ComponentWrap } from '../style';
import * as echarts from 'echarts';
import apis from '@/api';

export default function Chart({ self, mode, source = {}, drag, dnd, setDataField, children }: IAuto & IBaseComponent) {
  const divRef = useRef<HTMLDivElement | null>(null)
  const [inited, setInited] = useState(false)
  const instanceRef = useRef<any>(null)
  useEffect(() => {
    if (divRef.current && !inited) {
      setInited(true)
      const myChart = echarts.init(divRef.current, self.attrs.theme, { renderer: self.attrs.renderer || 'canvas' });
      instanceRef.current = myChart;
      // 绘制图表
      myChart.setOption(self.attrs.option || { title: { text: '无' } });
      myChart.showLoading()
      apis.fetch(self.widget.method, self.url).then(result => {
        myChart.hideLoading()
        if (result.code === 0) {
          myChart.setOption(result.data)
        }
      }).catch(() => {
        myChart.hideLoading()
      })
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
  return <Observer>{() => (
    <ComponentWrap
      className={mode + drag.className}
      {...drag.events}
      ref={dnd?.ref}
      {...dnd?.props}
      style={{
        ...self.style,
        ...dnd?.style,
        backgroundColor: dnd?.isDragging ? 'lightblue' : '',
      }}
    >
      {children}
      <div style={{ height: '100%', width: '100%' }} ref={divRef}></div>
    </ComponentWrap>
  )}</Observer>
}