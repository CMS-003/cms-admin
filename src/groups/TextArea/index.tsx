import { IAuto } from '@/types/component'
import { Observer } from 'mobx-react'
import { Input } from 'antd'

export default function CTextArea({ self, mode, source, setSource, drag, children }: IAuto) {
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
      <Input.TextArea />
    </div>
  )}</Observer>
}