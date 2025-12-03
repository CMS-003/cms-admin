import { IAuto, IBaseComponent } from '@/types/component'
import { MemoComponent } from '../auto'
import { Observer } from 'mobx-react'
import { ComponentWrap } from '../style';

export default function GridCell({ self, drag, children, mode, page, ...props }: IAuto & IBaseComponent) {
  return <Observer>
    {() => (
      <ComponentWrap
        className={drag.className}
        {...drag.events}
        style={{ height: '100%', }}
      >
        {children}
        {self.children.map(child => (
          <MemoComponent key={child._id} self={child} {...props} />
        ))}
      </ComponentWrap>
    )}
  </Observer>
}