import { IAuto, IBaseComponent } from '@/types/component'
import { Progress } from 'antd'
import { Observer } from 'mobx-react'
import { useEffectOnce } from 'react-use';
import { ComponentWrap } from '../style';

export default function CProgress({ self, drag, source = {}, setDataField, children, mode, page }: IAuto & IBaseComponent) {
  useEffectOnce(() => {
    if (!source._id) {
      setDataField(self.widget, self.widget.value)
    }
  })

  return <Observer>{() => (
    <ComponentWrap
      className={drag.className}
      {...drag.events}
      style={self.style}
    >
      {children}
      <Progress percent={source[self.widget.field]} type='circle' size={'small'} />
    </ComponentWrap>
  )
  }</Observer >
}