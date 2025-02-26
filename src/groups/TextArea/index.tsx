import { IAuto, IBaseComponent } from '@/types/component'
import { Observer } from 'mobx-react'
import { Input } from 'antd'

export default function CTextArea({ self, mode, drag, dnd, children }: IAuto & IBaseComponent) {
  return <Observer>{() => (
    <div
      className={mode + drag.className}
      {...drag.events}
      ref={dnd?.ref}
      {...dnd?.draggableProps}
      {...dnd?.dragHandleProps}
      style={{
        ...self.style,
        ...dnd?.style,
      }}
    >
      {children}
      <Input.TextArea />
    </div>
  )}</Observer>
}