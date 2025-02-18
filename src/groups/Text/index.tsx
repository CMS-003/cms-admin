import { IAuto, IBaseComponent} from '@/types/component'
import { Observer } from 'mobx-react'

export default function CText({ self, mode, source = {}, drag, children }: IAuto & IBaseComponent) {
  return <Observer>{() => (
    <div style={{ lineHeight: 2.5 }}
      className={`${mode} ${drag?.classNames}`}
      {...drag.events}
    >
      {children}
      {mode === 'edit' ? self.title : (source[self.widget.field] || self.title)}
    </div>
  )}</Observer>
}