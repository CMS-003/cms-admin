import { IComponent } from '@/types/component'
import { Input } from 'antd'
import { toJS } from 'mobx'
import { Observer } from 'mobx-react'

export default function SearchBtn({ self, mode, children, level }: { self: IComponent, mode: string, children?: any, level: number }) {
  return <Observer>{() => (
    <div style={{ ...Object.fromEntries(self.style) }}>
      <Input />
    </div>
  )}</Observer>
}