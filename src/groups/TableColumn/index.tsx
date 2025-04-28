import { IAuto, IBaseComponent } from '@/types/component'
import { Observer } from 'mobx-react'
import { ComponentWrap } from '../style';

export default function TableColumn({ self, mode, source, drag, isTitle = true, children }: IAuto & IBaseComponent & { isTitle?: boolean }) {
  return <Observer>{() => (
    <ComponentWrap
      key={self._id}
      className={mode + drag.className}
      {...drag.events}
      style={isTitle ? { lineHeight: '32px' } : {}}
    >
      {children}
      {isTitle ? self.title : (source ? source[self.widget.field] : '')}
    </ComponentWrap>
  )}</Observer>
}