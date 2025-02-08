import { IComponent } from '@/types/component'

export default function TableColumn({ self, mode, children, level }: { self: IComponent, mode: string, children?: any, level: number }) {
  return <div>
    {self.title}
  </div>
}