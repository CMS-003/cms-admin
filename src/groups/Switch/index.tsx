import { IAuto, IBaseComponent } from '@/types/component'
import { Switch } from 'antd'
import { runInAction } from 'mobx';
import { Observer, useLocalObservable } from 'mobx-react'
import { useEffectOnce } from 'react-use'

export default function CCheckbox({ self, mode, query = {}, source = {}, drag, dnd, setDataField, children }: IAuto & IBaseComponent) {
  const IN = self.widget.in || 'body';
  const local = useLocalObservable(() => ({
    TRUE: '开启',
    FALSE: '关闭',

  }))
  useEffectOnce(() => {
    const i1 = self.widget.refer.findIndex(v => ['1', 1, 'true', true, 'TRUE'].includes(v.value))
    const i0 = self.widget.refer.findIndex(v => !['1', 1, true, 'true', 'TRUE'].includes(v.value))
    runInAction(() => {
      if (i1 !== -1) {
        local.TRUE = self.widget.refer[i1].label
      }
      if (i0 !== -1) {
        local.FALSE = self.widget.refer[i1].label
      }
    })
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
      <div style={{ lineHeight: '32px' }}>
        {self.title && <span style={{ marginRight: 10 }}>{self.title}</span>}
        {/* @ts-ignore */}
        <Switch checkedChildren={local.TRUE} unCheckedChildren={local.FALSE} defaultChecked={[1, '1', 'TRUE', 'true', true].includes(self.widget.value)} onChange={checked => {
          let v: any = checked;
          if (self.widget.type === 'number') {
            v = v ? 1 : 0;
          } else if (self.widget.type === 'string') {
            v = v ? '1' : ''
          }
          setDataField(self.widget, v)
        }} />
      </div>
    </div>
  )}</Observer>
}