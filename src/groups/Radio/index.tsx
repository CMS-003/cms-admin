import { IComponent } from '@/types/component'
import { Radio } from 'antd'
import { Observer } from 'mobx-react'

export default function ComponentSelect({ self, mode, children, level }: { self: IComponent, mode: string, children?: any, level: number }) {
  return <Observer>{() => (
    <div style={{ lineHeight: 2.5 }}>
      <Radio.Group onChange={e => {
        if (self.widget) {
          self.widget.value = e.target.value;
        }
      }} value={self.widget?.value}>
        {self.widget?.refer.map((v, i) => (
          <Radio key={i} value={v.value}>{v.label}</Radio>
        ))}
      </Radio.Group>
    </div>
  )}</Observer>
}