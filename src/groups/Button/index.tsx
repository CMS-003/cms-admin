import { IComponent } from '@/types/component'
import { Button } from 'antd'

export default function SearchBtn({ self, mode, children, level }: { self: IComponent, mode: string, children?: any, level: number }) {
  return <div>
    <Button>{self.title}</Button>
  </div>
}