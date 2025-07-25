import { useCallback, useEffect, useRef, useState } from 'react'
import { IAuto, IBaseComponent } from '@/types/component'
import { Observer } from 'mobx-react'
import { ComponentWrap } from '../style';
import * as echarts from 'echarts';
import apis from '@/api';
import { Acon } from '@/components';
import icon_drag from '@/asserts/images/drag.svg'
import { Style } from '@/components/index';

export default function Chart({ self, mode, source = {}, drag, dnd, setDataField, children }: IAuto & IBaseComponent) {
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
      <Style.IconSVG src={icon_drag} className='drag' style={{ position: 'absolute', left: 5, top: 5, cursor: 'pointer', userSelect: 'none' }} />
      {self.attrs.refresh && <Acon icon="reload" style={{ position: 'absolute', right: 10, top: 10, padding: 5 }} color='#666' onClick={e => {
        refresh()
      }} />}
    </ComponentWrap>
  )}</Observer>
}