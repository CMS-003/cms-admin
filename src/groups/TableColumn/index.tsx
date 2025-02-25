import { IAuto, IBaseComponent } from '@/types/component'
import { Observer } from 'mobx-react'

export default function TableColumn({ self, mode, source, drag, isTitle = true, children }: IAuto & IBaseComponent & { isTitle?: boolean }) {
  return <Observer>{() => (
    <div
      className={`${mode} ${drag?.classNames}`}
      {...drag.events}
    >
      {children}
      {isTitle ? self.title : (source ? source[self.widget.field] : '')}
    </div>
  )}</Observer>
}