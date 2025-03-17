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
      <Checkbox checked={source[self.widget.field]} style={{ lineHeight: '35px' }} onChange={e => {
        setSource && setSource(self.widget.field, e.target.checked);
      }} />
      <span style={{ marginLeft: 5 }}>
        {self.widget.refer.map(refer => (
          ['1', 'true', 'TRUE'].includes(refer.value as string) === source[self.widget.field] && refer.label
        ))}
      </span>
    </div>
  )}</Observer>
}