import { IAuto, IBaseComponent } from '@/types/component'
import { Component } from '../auto'
import { Observer } from 'mobx-react'
import NatureSortable from '@/components/NatureSortable'

export default function CMenu({ self, mode, drag, dnd, children }: IAuto & IBaseComponent) {
  return <Observer>{() => (
    <div style={{ ...self.style, ...dnd?.style }}
      className={`${mode} ${drag?.classNames}`}
      {...drag.events}
      ref={dnd?.ref}
      {...dnd?.draggableProps}
      {...dnd?.dragHandleProps}
    >
      {children}
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
            setParentHovered={drag?.setIsMouseOver}
            dnd={dnd}
          />
        )}
      />
    </div>
  )}</Observer>
}