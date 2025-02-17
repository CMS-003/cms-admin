import { IAuto } from '@/types/component'
import { Button } from 'antd'
import { Observer } from 'mobx-react'

export default function CButton({ self, mode, drag, children }: IAuto) {
  return <Observer>{() => (
    <div
      className={`${mode} ${drag?.classNames}`}
      onMouseEnter={drag?.onMouseEnter || ((e) => { })}
      onMouseLeave={drag?.onMouseLeave || ((e) => { })}
      onContextMenu={drag?.onContextMenu || ((e) => { })}
      onDragOver={drag?.onDragOver || ((e) => { })}
      onDrop={drag?.onDrop || ((e) => { })}
      onDragLeave={drag?.onDragLeave || ((e) => { })}>
      {children}
      <Button type={self.attrs.get('type') || 'primary'}>{self.title}</Button>
    </div>
  )}</Observer>
}