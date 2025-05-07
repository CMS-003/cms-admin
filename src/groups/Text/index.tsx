import { IAuto, IBaseComponent } from '@/types/component'
import { Observer } from 'mobx-react'
import { ComponentWrap } from '../style';
import styled from 'styled-components';
import { isNil } from 'lodash';

const Text = styled.div`
  line-height: 1.5;
  word-break: break-all;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 32px;
  white-space: nowrap;
`

export default function CText({ self, mode, source = {}, drag, dnd, children }: IAuto & IBaseComponent) {
  return <Observer>{() => (
    <ComponentWrap
      className={mode + drag.className}
      {...drag.events}
      ref={dnd?.ref}
      {...dnd?.props}
      style={{
        flex: self.attrs.flex ? 1 : 0,
        ...dnd?.style,
        backgroundColor: dnd?.isDragging ? 'lightblue' : '',
      }}
    >
      {children}
      <Text className='two-line-ellipsis' style={self.style}>{mode === 'edit' ? self.title : (!isNil(source[self.widget.field]) ? source[self.widget.field] : self.title)}</Text>
    </ComponentWrap>
  )}</Observer>
}