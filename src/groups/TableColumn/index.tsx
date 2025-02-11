import { IComponent } from '@/types/component'

export default function TableColumn({ self, mode, source }: { self: IComponent, source?: any, mode: string }) {
  return <div>
    {mode === 'edit' ? self.title : (source ? source[(self.widget as any).field] : '')}
  </div>
}