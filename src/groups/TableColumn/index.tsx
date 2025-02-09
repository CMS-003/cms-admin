import { IComponent } from '@/types/component'

export default function TableColumn({ self, mode, source, children, level }: { self: IComponent, source?: any, mode: string, children?: any, level: number }) {
  return <div>
    {mode === 'edit' ? self.title : (source ? source[(self.widget as any).field] : '')}
  </div>
}