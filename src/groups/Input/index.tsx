import { IComponent } from '@/types/component'
import { Input } from 'antd'
import { toJS } from 'mobx'
import { Observer } from 'mobx-react'

export default function SearchBtn({ self, mode, children, level, source }: { self: IComponent, mode: string, children?: any, level: number, source: any }) {
  return <Observer>{() => (
    <div style={self.style}>
      <Input value={source ? source[self.widget?.field || ''] : ''} />
    </div>
  )}</Observer>
}