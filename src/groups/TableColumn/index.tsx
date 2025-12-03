import { IAuto, IBaseComponent } from '@/types/component'
import { Observer } from 'mobx-react'
import { ComponentWrap } from '../style';

export default function TableColumn({ self, source, drag, children, mode, page }: IAuto & IBaseComponent) {
  return <Observer>{() => (
    <ComponentWrap
      key={self._id}
      className={drag.className}
      {...drag.events}
      style={{ alignItems: 'center', ...self.style }}
    >
      {children}
      <div>{self.title}</div>
    </ComponentWrap>
  )}</Observer>
}