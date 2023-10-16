import { IComponent } from '@/types/component'
import { Tag } from 'antd'

export default function ComponentFilterTag({ self, mode, children }: { self: IComponent, mode: string, children?: any }) {
  return <Tag>{self.title}</Tag>
}