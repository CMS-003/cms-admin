import { IAuto, IBaseComponent } from '@/types/component'
import { Radio } from 'antd'
import { Observer } from 'mobx-react'
import { useEffectOnce } from 'react-use';
import _ from 'lodash'
import { ComponentWrap } from '../style';

export default function CRadio({ self, mode, drag, dnd, source = {}, setDataField, children }: IAuto & IBaseComponent) {
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
        ...self.style, ...dnd?.style
      }}
    >
      {children}
      <Radio.Group style={{
        display: 'flex',
        alignItems: 'center',
        minHeight: 35,
      }} options={self.widget.refer} onChange={e => {
        setDataField(self.widget, e.target.value);
      }} value={_.get(source, self.widget.field)} />
    </ComponentWrap>
  )
  }</Observer >
}