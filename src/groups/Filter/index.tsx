import { FullHeight, FullHeightAuto, FullHeightFix } from '@/components/style'
import { IAuto, IBaseComponent } from '@/types/component'
import { Component } from '../auto'
import { Observer } from 'mobx-react';
import NatureSortable from '@/components/NatureSortable'
import { ComponentWrap } from '../style';
import store from '@/store';

export default function CFilter({ self, mode, drag, dnd, children, ...props }: IAuto & IBaseComponent) {
  return <Observer>
    {() => (
      <ComponentWrap key={self.children.length}
        className={mode + drag.className}
        {...drag.events}
        ref={dnd?.ref}
        {...dnd?.props}
        style={{ height: '100%', width: '100%', ...dnd?.style }}
      >
        {children}
        <FullHeight style={{ flex: 1 }}>
          <FullHeightFix style={{ flexDirection: 'column', alignItems: 'flex-start', width: '100%' }}>
            <NatureSortable
              items={self.children}
              direction='vertical'
              disabled={mode === 'preview' || store.component.can_drag_id !== self._id}
              droppableId={self._id}
              sort={self.swap}
              renderItem={({ item, dnd }) => (
                <Component
                  self={item}
                  mode={mode}
                  dnd={dnd}
                  {...props}
                />
              )}
            />
          </FullHeightFix>
          <FullHeightAuto>
            resources
          </FullHeightAuto>
        </FullHeight>
      </ComponentWrap>
    )}
  </Observer>
}