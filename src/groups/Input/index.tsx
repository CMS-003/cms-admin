import { IAuto, IBaseComponent } from '@/types/component'
import { Input } from 'antd'
import { Observer } from 'mobx-react'

export default function CInput({ self, mode, source = {}, drag, dnd, setSource, children }: IAuto & IBaseComponent) {
  return <Observer>{() => (
    <div
      className={mode + drag.className}
      {...drag.events}
      ref={dnd?.ref}
      {...dnd?.props}
      style={{
        ...self.style,
        ...dnd?.style,
        backgroundColor: dnd?.isDragging ? 'lightblue' : '',
      }}
    >
      {children}
      <Input value={source[self.widget.field]} onChange={e => {
        setSource && setSource(self.widget.field, e.target.value);
      }} />
    </div>
  )}</Observer>
}