import { Observer, useLocalObservable } from "mobx-react";

/**
 * 
 * 图表模块：类型，数据，参数 大小位置样式
 */

export default function Page() {
  return <Observer>{() => (
    <div style={{ width: '100%', height: '100%', position: 'relative' }}>
      
    </div>
  )
  }</Observer >
}