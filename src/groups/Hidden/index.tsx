import CONST from '@/constant';
import { IAuto, IBaseComponent } from '@/types/component'
import { Input } from 'antd'
import { Observer } from 'mobx-react'
import { ComponentWrap } from '../style';
import { useEffectOnce } from 'react-use';

export default function CHidden({ self, mode, source = {}, drag, dnd, setDataField, children }: IAuto & IBaseComponent) {
  useEffectOnce(() => {
    if (!source._id || mode === 'edit' || self.widget.query) {
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
        ...dnd?.style,
        flex: self.style.flex,
        display: mode === 'preview' ? 'none' : 'block',
        backgroundColor: dnd?.isDragging ? 'lightblue' : '',
      }}
    >
      {children}
      <Input type={mode === 'preview' ? 'hidden' : 'text'} disabled readOnly value={mode === 'preview' ? source[self.widget.field] : self.widget.field} style={self.style} onChange={e => {
        setDataField(self.widget, e.target.value);
      }} />
    </ComponentWrap>
  )}</Observer>
}