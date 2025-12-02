import { IAuto, IBaseComponent } from '@/types/component'
import { Component } from '../auto'
import { Observer } from 'mobx-react'
import { ComponentWrap } from '../style';
import store from '@/store';
import { SortDD } from '@/components/SortableDD';

export default function CMenu({ self, mode, drag, children, ...props }: IAuto & IBaseComponent) {
  return <Observer>{() => (
    <ComponentWrap
      className={mode + drag.className}
      {...drag.events}
      style={{
        flexDirection: 'row',
        height: '100%',
      }}
    >
      {children}
      <div style={{ height: '100%', display: 'flex', flexDirection: self.attrs.layout === 'vertical' ? 'column' : 'row' }}>
        <SortDD
          mode={mode as 'edit' | 'preview'}
          items={self.children.map(child => ({ id: child._id, data: child }))}
          direction='vertical'
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

      </div>
    </ComponentWrap>
  )}</Observer>
}