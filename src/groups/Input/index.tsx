import { IAuto } from '@/types/component'
import { Input } from 'antd'
import { Observer } from 'mobx-react'

export default function CInput({ self, source = {}, setSource }: IAuto) {
  return <Observer>{() => (
    <div style={self.style}>
      <Input value={source[self.widget.field]} onChange={e => {
        setSource && setSource(self.widget.field, e.target.value);
      }} />
    </div>
  )}</Observer>
}