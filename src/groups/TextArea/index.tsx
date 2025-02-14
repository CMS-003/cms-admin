import { IComponent } from '@/types/component'
import { Observer } from 'mobx-react'
import { Input } from 'antd'

export default function Text({ self, mode, source }: { self: IComponent, mode: string, children?: any, level: number, source: any }) {
  return <Observer>{() => (
    <Input.TextArea />
  )}</Observer>
}