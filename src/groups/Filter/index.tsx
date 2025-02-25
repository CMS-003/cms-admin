import { FullHeight, FullHeightAuto, FullHeightFix } from '@/components/style'
import { IAuto, IBaseComponent } from '@/types/component'
import _ from 'lodash'
import SortList from '@/components/SortList/';
import { Component } from '../auto'
import Acon from '@/components/Acon';
import { Observer } from 'mobx-react';
import NatureSortable from '@/components/NatureSortable'

export default function CFilter({ self, mode, drag, page, source, setSource, dnd, children }: IAuto & IBaseComponent) {
  return <Observer>
    {() => (
      <FullHeight key={self.children.length}
        className={`${mode} ${drag?.classNames}`}
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
            renderItem={({ item, dnd, index }) => (
              <Component
                self={item}
                mode={mode}
                index={index}
                page={page}
                source={source}
                setSource={setSource}
                setParentHovered={drag?.setIsMouseOver}
                dnd={dnd}
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