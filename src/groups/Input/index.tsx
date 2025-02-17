import { IAuto } from '@/types/component'
import { Input } from 'antd'
import { Observer } from 'mobx-react'

export default function CInput({ self, mode, source = {}, drag, setSource, children }: IAuto) {
  return <Observer>{() => (
    <div style={self.style}
      className={`${mode} ${drag?.classNames}`}
      onMouseEnter={drag?.onMouseEnter || ((e) => { })}
      onMouseLeave={drag?.onMouseLeave || ((e) => { })}
      onContextMenu={drag?.onContextMenu || ((e) => { })}
      onDragOver={drag?.onDragOver || ((e) => { })}
      onDrop={drag?.onDrop || ((e) => { })}
      onDragLeave={drag?.onDragLeave || ((e) => { })}
    >
      {children}
      <Input value={source[self.widget.field]} onChange={e => {
        setSource && setSource(self.widget.field, e.target.value);
      }} />
    </div>
  )}</Observer>
}