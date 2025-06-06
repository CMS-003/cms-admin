import CONST from '@/constant';
import { IAuto, IBaseComponent } from '@/types/component'
import { Input } from 'antd'
import { Observer } from 'mobx-react'
import { usePageContext } from '../context';
import { ComponentWrap } from '../style';

export default function CInput({ self, mode, source = {}, drag, dnd, setDataField, children }: IAuto & IBaseComponent) {
  const page = usePageContext();
  return <Observer>{() => (
    <ComponentWrap
      className={mode + drag.className}
      {...drag.events}
      ref={dnd?.ref}
      {...dnd?.props}
      style={{
        ...dnd?.style,
        flex: self.style.flex,
        backgroundColor: dnd?.isDragging ? 'lightblue' : '',
      }}
    >
      {children}
      <Input addonBefore={self.title || null} value={source[self.widget.field]} style={self.style} onChange={e => {
        setDataField(self.widget, e.target.value);
      }} />
    </ComponentWrap>
  )}</Observer>
}