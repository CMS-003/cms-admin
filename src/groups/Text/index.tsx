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
        ...self.style,
        ...dnd?.style,
        backgroundColor: dnd?.isDragging ? 'lightblue' : '',
      }}
    >
      {children}
      <span className='two-line-ellipsis' style={{ lineHeight: 1.5, wordBreak: 'break-all', ...self.style }}>{mode === 'edit' ? self.title : (source[self.widget.field] || self.title)}</span>
    </div>
  )}</Observer>
}