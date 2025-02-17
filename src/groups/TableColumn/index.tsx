import { IAuto } from '@/types/component'
import { Observer } from 'mobx-react'

export default function TableColumn({ self, mode, source, drag, children }: IAuto) {
  return <Observer>{() => (
    <div
      className={`${mode} ${drag?.classNames}`}
      onMouseEnter={drag?.onMouseEnter || ((e) => { })}
      onMouseLeave={drag?.onMouseLeave || ((e) => { })}
      onContextMenu={drag?.onContextMenu || ((e) => { })}
      onDragOver={drag?.onDragOver || ((e) => { })}
      onDrop={drag?.onDrop || ((e) => { })}
      onDragLeave={drag?.onDragLeave || ((e) => { })}
    >
      {children}
      {mode === 'edit' ? self.title : (source ? source[self.widget.field] : '')}
    </div>
  )}</Observer>
}