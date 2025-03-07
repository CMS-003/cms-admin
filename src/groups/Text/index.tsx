import { IAuto, IBaseComponent } from '@/types/component'
import { Observer } from 'mobx-react'

export default function CText({ self, mode, source = {}, drag, dnd, children }: IAuto & IBaseComponent) {
  return <Observer>{() => (
    <div
      className={mode + drag.className}
      {...drag.events}
      ref={dnd?.ref}
      {...dnd?.props}
      style={{
        lineHeight: 2.5,
        ...self.style,
        ...dnd?.style,
        backgroundColor: dnd?.isDragging ? 'lightblue' : '',
      }}
    >
      {children}
      <span style={{ lineHeight: 1.5, display: 'inherit' }}>{mode === 'edit' ? self.title : (source[self.widget.field] || self.title)}</span>
    </div>
  )}</Observer>
}