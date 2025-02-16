import { IComponent } from '@/types/component'
import { Radio } from 'antd'
import { Observer } from 'mobx-react'

export default function ComponentSelect({ self, mode, children, level, source = {}, setSource }: { self: IComponent, source: any, setSource?: Function, mode: string, children?: any, level: number }) {
  return <Observer>{() => (
    <div style={{ lineHeight: 2.5 }}>
      {self.widget && (
        <Radio.Group options={self.widget.refer} onChange={e => {
          if (self.widget) {
            setSource && setSource(self.widget.field, e.target.value);
          }
        }} value={source[self.widget.field] + ''} />
      )}
    </div>
  )
  }</Observer >
}