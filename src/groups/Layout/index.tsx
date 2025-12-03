import { IAuto, IBaseComponent } from '@/types/component'
import { MemoComponent } from '../auto'
import { Observer } from 'mobx-react'
import { ComponentWrap } from '../style';
import store from '@/store'
import { SortDD } from '@/components/SortableDD'

export default function ComponentLayout({ self, drag, children, mode, page, ...props }: IAuto & IBaseComponent) {
  return <Observer>{() => (
    <ComponentWrap
      id={self._id}
      className={drag.className}
      {...drag.events}
      style={self.style}
    >
      {children}
      <SortDD
        disabled={mode === 'preview' || store.component.can_drag_id !== self._id}
        direction={self.attrs.layout === 'horizontal' ? 'horizontal' : 'vertical'}
        items={self.children.map(child => ({ id: child._id, data: child, style: { flex: child.attrs.flex || 0 } }))}
        sort={self.swap}
        renderItem={(item: any) => (
          <MemoComponent
            self={item.data}
            {...props}
          />
        )}
      />
    </ComponentWrap>
  )}</Observer>
}