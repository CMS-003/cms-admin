import { IComponent } from '@/types/component'
import { Tag } from 'antd'

export default function ComponentFilterTag({ self, mode, children }: { self: IComponent, mode: string, children?: any }) {
  return <Tag style={self.attrs.get('selected') ? { color: 'white', backgroundColor: '#3498db' } : { color: '#666' }}>{self.title}</Tag>
}