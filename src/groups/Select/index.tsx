import { IComponent } from '@/types/component'
import { Select } from 'antd'

export default function ComponentSelect({ self, mode, children, level }: { self: IComponent, mode: string, children?: any, level: number }) {
  return <div>
    {self.title}
    <Select style={{ marginLeft: 5 }}>
      <Select.Option value="">全部</Select.Option>
    </Select>
  </div>
}