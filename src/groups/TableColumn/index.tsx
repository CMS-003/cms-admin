import { IAuto, IBaseComponent} from '@/types/component'
import { Observer } from 'mobx-react'

export default function TableColumn({ self, mode, source, drag, children }: IAuto & IBaseComponent) {
  return <Observer>{() => (
    <div
      className={`${mode} ${drag?.classNames}`}
      {...drag.events}
    >
      {children}
      {mode === 'edit' ? self.title : (source ? source[self.widget.field] : '')}
    </div>
  )}</Observer>
}