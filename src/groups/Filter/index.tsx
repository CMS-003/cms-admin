import { FullHeight, FullHeightAuto, FullHeightFix } from '@/components/style'
import { IAuto, IBaseComponent } from '@/types/component'
import { MemoComponent } from '../auto'
import { Observer } from 'mobx-react';
import { ComponentWrap } from '../style';
import store from '@/store';
import { SortDD } from '@/components/SortableDD';
import { Empty } from 'antd';

export default function CFilter({ self, drag, children, mode, page, ...props }: IAuto & IBaseComponent) {
  return <Observer>
    {() => (
      <ComponentWrap key={self.children.length}
        className={drag.className}
        {...drag.events}
        style={{ height: '100%', width: '100%', }}
      >
        {children}
        <FullHeight style={{ flex: 1 }}>
          <FullHeightFix style={{ flexDirection: 'column', width: '100%' }}>
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
          </FullHeightFix>
          <FullHeightAuto>
            <Empty />
          </FullHeightAuto>
        </FullHeight>
      </ComponentWrap>
    )}
  </Observer>
}