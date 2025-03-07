
import { FullHeight } from '@/components/style'
import { IAuto, IBaseComponent } from '@/types/component'
import _ from 'lodash'
import NatureSortable from '@/components/NatureSortable'
import { Component } from '../auto'
import { Observer } from 'mobx-react'

export default function ObjectList({ self, mode, drag, dnd, children, ...props }: IAuto & IBaseComponent) {
  return <Observer>{() => (
    <FullHeight key={self.children.length}
      className={mode + drag.className}
      {...drag.events}
      ref={dnd?.ref}
      {...dnd?.props}
      style={{ ...self.style, ...dnd?.style }}
    >
      {children}
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
          />
        )}
      />
    </FullHeight>
  )}</Observer>
}