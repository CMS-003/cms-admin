import { IAuto, IBaseComponent } from '@/types/component'
import { Checkbox } from 'antd'
import { Observer } from 'mobx-react'
import { useEffectOnce } from 'react-use'

export default function CCheckbox({ self, mode, source = {}, drag, dnd, setSource, children }: IAuto & IBaseComponent) {
  useEffectOnce(() => {
    if (!source._id && setSource) {
      setSource(self.widget.field, self.widget.value)
    }
  })
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
      <Checkbox checked={source[self.widget.field]} style={{ lineHeight: 2 }} onChange={e => {
        setSource && setSource(self.widget.field, e.target.checked);
      }} />
    </div>
  )}</Observer>
}