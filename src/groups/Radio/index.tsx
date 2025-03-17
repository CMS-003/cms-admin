import { IAuto, IBaseComponent } from '@/types/component'
import { Radio } from 'antd'
import { Observer } from 'mobx-react'
import { useEffectOnce } from 'react-use';
import _ from 'lodash'

export default function CRadio({ self, mode, drag, dnd, source = {}, setSource, children }: IAuto & IBaseComponent) {
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
          setSource && setSource(self.widget.field, e.target.value, self.widget.type);
        }
      }} value={_.get(source, self.widget.field)} />
    </div>
  )
  }</Observer >
}