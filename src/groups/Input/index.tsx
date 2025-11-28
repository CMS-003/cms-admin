import CONST from '@/constant';
import { IAuto, IBaseComponent } from '@/types/component'
import { Input, Space } from 'antd'
import { Observer, useLocalObservable } from 'mobx-react'
import { usePageContext } from '../context';
import { ComponentWrap } from '../style';
import events from '@/utils/event';
import { pick } from 'lodash';

export default function CInput({ self, mode, source = {}, drag, dnd, setDataField, children }: IAuto & IBaseComponent) {
  const page = usePageContext();
  const local = useLocalObservable(() => ({
    composing: false,
    setComposition(is: boolean) {
      local.composing = is;
    }
  }))
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
      <Input
        prefix={self.title && <Space.Addon>{self.title}</Space.Addon>}
        value={source[self.widget.field]}
        style={self.style}
        onChange={e => {
          setDataField(self.widget, e.target.value);
        }}
        onCompositionStart={() => {
          local.setComposition(true)
        }}
        onCompositionEnd={() => {
          local.setComposition(false)
        }}
        onKeyDown={e => {
          if (e.key === 'Enter' && !local.composing && self.widget.action === CONST.ACTION_TYPE.SEARCH) {
            setDataField({
              field: 'page',
              type: 'number',
              source: '',
              value: 1,
              query: true,
              action: '',
              method: '',
              refer: []
            }, 1)
            events.emit(CONST.ACTION_TYPE.SEARCH, { target: pick(page, ['template_id', 'path', 'param', 'query']) })
          }
        }} />
    </ComponentWrap>
  )}</Observer>
}