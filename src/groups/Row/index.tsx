import { IAuto, IBaseComponent } from '@/types/component'
import { Observer } from 'mobx-react'
import { MemoComponent } from '../auto'
import { ComponentWrap } from '../style';
import store from '@/store'
import { SortDD } from '@/components/SortableDD'


export default function CRow({ self, drag, children, mode, page, ...props }: IAuto & IBaseComponent) {
  return <Observer>{() => (
    <ComponentWrap
      className={drag.className}
      {...drag.events}
    >
      {children}
      <SortDD
        items={self.children.map(child => ({ id: child._id, data: child }))}
        direction='horizontal'
        disabled={mode === 'preview' || store.component.can_drag_id !== self._id}
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