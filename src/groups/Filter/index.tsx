import { FullHeight, FullHeightAuto, FullHeightFix } from '@/components/style'
import { IAuto, IBaseComponent } from '@/types/component'
import _ from 'lodash'
import SortList from '@/components/SortList/';
import { Component } from '../auto'
import Acon from '@/components/Acon';
import { Observer } from 'mobx-react';
import NatureSortable from '@/components/NatureSortable'

export default function CFilter({ self, mode, drag, dnd, children, ...props }: IAuto & IBaseComponent) {
  return <Observer>
    {() => (
      <FullHeight key={self.children.length}
        className={mode + drag.className}
        {...drag.events}
        ref={dnd?.ref}
        {...dnd?.draggableProps}
        {...dnd?.dragHandleProps}
        style={{ ...self.style, ...dnd?.style }}
      >
        {children}
        <FullHeightFix style={{ flexDirection: 'column', alignItems: 'flex-start', width: '100%' }}>
          <NatureSortable
            items={self.children}
            direction='vertical'
            droppableId={self._id}
            sort={self.swap}
            renderItem={({ item, dnd }) => (
              <Component
                self={item}
                mode={mode}
                dnd={dnd}
                {...props}
                setParentHovered={drag?.setIsMouseOver}
              />
            )}
          />
        </FullHeightFix>
        <FullHeightAuto>
          resources
        </FullHeightAuto>
      </FullHeight>
    )}
  </Observer>
}