import { IAuto, IBaseComponent } from '@/types/component'
import { Button } from 'antd'
import { Observer } from 'mobx-react'

export default function CButton({ self, mode, drag, dnd, children }: IAuto & IBaseComponent) {
  return <Observer>{() => (
    <div
      className={mode + drag.className}
      {...drag.events}
      ref={dnd?.ref}
      {...dnd?.props}
      style={{
        flex: 0,
        ...self.style,
        ...dnd?.style,
        backgroundColor: dnd?.isDragging ? 'lightblue' : '',
      }}
    >
      {children}
      <Button type={self.attrs.get('type') || 'primary'}>{self.title}</Button>
    </div>
  )}</Observer>
}