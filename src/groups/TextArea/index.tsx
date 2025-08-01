import { IAuto, IBaseComponent } from '@/types/component'
import { Observer } from 'mobx-react'
import { Input } from 'antd'
import { useEffectOnce } from 'react-use';
import { ComponentWrap } from '../style';
import JSON5 from 'json5';

export default function CTextArea({ self, mode, drag, dnd, source, setDataField, children }: IAuto & IBaseComponent) {
  useEffectOnce(() => {
    if (!source._id) {
      setDataField(self.widget, self.widget.value)
    }
  })
  return <Observer>{() => (
    <ComponentWrap
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
      <Input.TextArea rows={4} value={self.widget.type === 'json' ? JSON5.stringify(source[self.widget.field], null, 2) : source[self.widget.field]}
        onChange={(e => {
          setDataField(self.widget, e.target.value)
        })}
      />
    </ComponentWrap>
  )}</Observer>
}