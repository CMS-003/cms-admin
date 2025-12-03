import { IAuto, IBaseComponent } from '@/types/component'
import { Observer } from 'mobx-react'
import { ComponentWrap } from '../style';
import styled from 'styled-components';
import { isNil } from 'lodash-es';
import { useEffectOnce } from 'react-use';
import { useModeContext } from '../context';

const Text = styled.div`
  line-height: 1.5;
  word-break: break-all;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 32px;
`

export default function CText({ self, source = {}, setDataField, drag, children, mode, page }: IAuto & IBaseComponent) {
  useEffectOnce(() => {
    if (!source._id || mode === 'edit' || self.widget.query) {
      setDataField(self.widget, self.widget.value)
    }
  })
  return <Observer>{() => (
    <ComponentWrap
      className={mode + drag.className}
      {...drag.events}
      style={{
        flex: self.attrs.flex ? 1 : 0,
      }}
    >
      {children}
      <Text className='two-line-ellipsis' style={self.style}>{mode === 'edit' ? self.title : (!isNil(source[self.widget.field]) ? source[self.widget.field] : self.widget.value)}</Text>
    </ComponentWrap>
  )}</Observer>
}