import { IAuto, IBaseComponent } from '@/types/component'
import { Observer } from 'mobx-react'
import { Input } from 'antd'
import { useEffectOnce } from 'react-use';

export default function CTextArea({ self, mode, drag, dnd, source, setSource, children }: IAuto & IBaseComponent) {
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
      <Input.TextArea value={source[self.widget.field]}
        onChange={(e => {
          setSource && setSource(self.widget.field, e.target.value)
        })}
      />
    </div>
  )}</Observer>
}