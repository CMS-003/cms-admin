import { IAuto, IBaseComponent } from '@/types/component'
import { Observer } from 'mobx-react'

export default function TableColumn({ self, mode, source, drag, isTitle = true, children }: IAuto & IBaseComponent & { isTitle?: boolean }) {
  return <Observer>{() => (
    <div
      key={self._id}
      className={mode + drag.className}
      {...drag.events}
      style={isTitle ? { minHeight: 25 } : {}}
    >
      {children}
      {isTitle ? self.title : (source ? source[self.widget.field] : '')}
    </div>
  )}</Observer>
}