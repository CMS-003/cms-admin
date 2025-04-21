import { IAuto, IBaseComponent } from '@/types/component'
import { Checkbox } from 'antd'
import { toJS } from 'mobx';
import { Observer } from 'mobx-react'
import { useEffectOnce } from 'react-use'

export default function CCheckbox({ self, mode, query = {}, source = {}, drag, dnd, setSource, children }: IAuto & IBaseComponent) {
  const IN = self.widget.in || 'body';
  useEffectOnce(() => {
    if (IN === 'body' && setSource) {
      if (!source._id) {
        setSource(self.widget.field, self.widget.value)
      }
    }
    if (IN === 'query' && setSource) {
      setSource(self.widget.field, self.widget.value, IN)
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
        {self.title && <span style={{ marginRight: 10 }}>{self.title}</span>}
        <Checkbox checked={(IN === 'body' ? source[self.widget.field] : query[self.widget.field] ? true : false)} style={{ lineHeight: '35px' }} onChange={e => {
          let v: any = e.target.checked;
          if (self.widget.type === 'number') {
            v = v ? 1 : 0;
          } else if (self.widget.type === 'string') {
            v = v ? '1' : ''
          }
          if (setSource) {
            setSource(self.widget.field, v, IN)
          }
        }} />
        <span style={{ marginLeft: 5 }}>
          {self.widget.refer.map(refer => (
            ['1', 'true', 'TRUE'].includes(refer.value as string) === (IN === 'body' ? source[self.widget.field] : [query[self.widget.field]]) && refer.label
          ))}
        </span>
      </div>
    </div>
  )}</Observer>
}