import { IAuto, IBaseComponent } from '@/types/component'
import { Observer } from 'mobx-react'
import { ComponentWrap } from '../style';
import { useEffectOnce } from 'react-use';
import { Tooltip } from 'antd';
import { Acon } from '@/components';

export default function CTip({ self, source = {}, setDataField, drag, children, mode, page }: IAuto & IBaseComponent) {
  useEffectOnce(() => {
    if (!source._id || mode === 'edit' || self.widget.query) {
      setDataField(self.widget, self.widget.value)
    }
  })
  return <Observer>{() => (
    <ComponentWrap
      className={drag.className}
      {...drag.events}
    >
      {children}
      <Tooltip trigger='hover' title={mode === 'edit' ? self.title : source[self.widget.field]}>
        <span>
          <Acon icon='Tip' />
        </span>
      </Tooltip>
    </ComponentWrap>
  )}</Observer>
}