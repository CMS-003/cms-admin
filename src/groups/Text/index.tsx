import { IAuto, IBaseComponent } from '@/types/component'
import { Observer } from 'mobx-react'

export default function CText({ self, mode, source = {}, drag, dnd, children }: IAuto & IBaseComponent) {
  return <Observer>{() => (
    <div
      className={mode + drag.className}
      {...drag.events}
      ref={dnd?.ref}
      {...dnd?.draggableProps}
      {...dnd?.dragHandleProps}
      style={{
        lineHeight: 2.5,
        ...self.style,
        ...dnd?.style,
      }}
    >
      {children}
      {mode === 'edit' ? self.title : (source[self.widget.field] || self.title)}
    </div>
  )}</Observer>
}