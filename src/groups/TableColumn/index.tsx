import { IAuto } from '@/types/component'

export default function TableColumn({ self, mode, source }: IAuto) {
  return <div>
    {mode === 'edit' ? self.title : (source ? source[self.widget.field] : '')}
  </div>
}