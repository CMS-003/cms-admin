import { IAuto, IBaseComponent } from '@/types/component'
import { Checkbox } from 'antd'
import { Observer } from 'mobx-react'
import { useEffectOnce } from 'react-use'

export default function CCheckbox({ self, mode, query = {}, source = {}, drag, dnd, setDataField, children }: IAuto & IBaseComponent) {
  useEffectOnce(() => {
    if (!source._id) {
      setDataField(self.widget, self.widget.value)
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
      <div>
        <span style={{ marginLeft: 5 }}>
          {self.widget.refer.map((refer, i) => (
            <Checkbox key={i} defaultChecked={(source[self.widget.field] || []).findIndex((v: any) => v === refer.value) !== -1} onChange={v => {
              const checked = v.target.checked
              setDataField(self.widget, checked ? [...source[self.widget.field], refer.value] : source[self.widget.field].filter((v: any) => v === refer.value))
            }}>{refer.label}</Checkbox>
          ))}
        </span>
      </div>
    </div>
  )}</Observer>
}