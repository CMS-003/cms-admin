import { IComponent } from '@/types/component'
import { Input } from 'antd'
import { Observer } from 'mobx-react'

export default function SearchBtn({ self, mode, children, level, source = {}, setSource }: { self: IComponent, setSource?: Function, mode: string, children?: any, level: number, source: any }) {
  return <Observer>{() => (
    <div style={self.style}>
      <Input value={source[self.widget?.field || '']} onChange={e => {
        setSource && setSource(self.widget?.field, e.target.value);
      }} />
    </div>
  )}</Observer>
}