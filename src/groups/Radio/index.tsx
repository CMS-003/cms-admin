import { IAuto, IBaseComponent } from '@/types/component'
import { Radio } from 'antd'
import { Observer } from 'mobx-react'

export default function CRadio({ self, mode, drag, dnd, source = {}, setSource, children }: IAuto & IBaseComponent) {
  return <Observer>{() => (
    <div
      className={mode + drag.className}
      {...drag.events}
      ref={dnd?.ref}
      {...dnd?.draggableProps}
      {...dnd?.dragHandleProps}
      style={{
        ...self.style, ...dnd?.style
      }}
    >
      {children}
      <Radio.Group style={{
        display: 'flex',
        alignItems: 'center',
        minHeight: 35,
      }} options={self.widget.refer} onChange={e => {
        if (self.widget) {
          setSource && setSource(self.widget.field, e.target.value);
        }
      }} value={source[self.widget.field]} />
    </div>
  )
  }</Observer >
}