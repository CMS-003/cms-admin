import { IAuto, IBaseComponent } from '@/types/component'
import { Observer } from 'mobx-react'
import { Component } from '../auto'
import { ComponentWrap } from '../style';
import store from '@/store'
import { SortDD } from '@/components/SortableDD'


export default function CRow({ self, mode, drag, children, ...props }: IAuto & IBaseComponent) {
  return <Observer>{() => (
    <ComponentWrap
      className={mode + drag.className}
      {...drag.events}
    >
      {children}
      <SortDD
        mode={mode as 'edit'}
        items={self.children.map(child => ({ id: child._id, data: child }))}
        direction='horizontal'
        disabled={mode === 'preview' || store.component.can_drag_id !== self._id}
        sort={self.swap}
        renderItem={(item: any) => (
          <Component
            self={item.data}
            mode={mode}
            {...props}
          />
        )}
      />
    </ComponentWrap>
  )}</Observer>
}