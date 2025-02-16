import { IAuto } from '@/types/component'
import { Radio } from 'antd'
import { Observer } from 'mobx-react'

export default function CRadio({ self, source = {}, setSource }: IAuto) {
  return <Observer>{() => (
    <div style={{ lineHeight: 2.5 }}>
      <Radio.Group options={self.widget.refer} onChange={e => {
        if (self.widget) {
          setSource && setSource(self.widget.field, e.target.value);
        }
      }} value={source[self.widget.field]} />
    </div>
  )
  }</Observer >
}