import { IAuto, IBaseComponent} from '@/types/component'
import { Observer } from 'mobx-react'

export default function CText({ self, mode, source = {}, drag, children }: IAuto & IBaseComponent) {
  return <Observer>{() => (
    <div style={{ lineHeight: 2.5 }}
      className={`${mode} ${drag?.classNames}`}
      onMouseEnter={drag?.onMouseEnter || ((e) => { })}
      onMouseLeave={drag?.onMouseLeave || ((e) => { })}
      onContextMenu={drag?.onContextMenu || ((e) => { })}
      onDragOver={drag?.onDragOver || ((e) => { })}
      onDrop={drag?.onDrop || ((e) => { })}
      onDragLeave={drag?.onDragLeave || ((e) => { })}
    >
      {children}
      {mode === 'edit' ? self.title : (source[self.widget.field] || self.title)}
    </div>
  )}</Observer>
}