import { IAuto, IBaseComponent } from '@/types/component'
import { MemoComponent } from '../auto'
import { Observer } from 'mobx-react'
import { ComponentWrap } from '../style';
import store from '@/store';
import { SortDD } from '@/components/SortableDD';

export default function CMenu({ self, drag, children, mode, page, ...props }: IAuto & IBaseComponent) {
  return <Observer>{() => (
    <ComponentWrap
      className={drag.className}
      {...drag.events}
      style={{
        flexDirection: 'row',
        height: '100%',
      }}
    >
      {children}
      <div style={{ height: '100%', display: 'flex', overflow: 'auto', flex: 1, flexDirection: self.attrs.layout === 'vertical' ? 'column' : 'row' }}>
        <SortDD
          items={self.children.map(child => ({ id: child._id, data: child }))}
          direction='vertical'
          disabled={mode === 'preview' || store.component.can_drag_id !== self._id}
          sort={self.swap}
          renderItem={(item: any) => (
            <MemoComponent
              self={item.data}
              {...props}
            />
          )}
        />

      </div>
    </ComponentWrap>
  )}</Observer>
}