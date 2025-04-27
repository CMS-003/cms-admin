import { IAuto, IBaseComponent } from '@/types/component'
import { Component } from '../auto'
import { Observer } from 'mobx-react'
import NatureSortable from '@/components/NatureSortable'

export default function CMenu({ self, mode, drag, dnd, children, ...props }: IAuto & IBaseComponent) {
  return <Observer>{() => (
    <div
      className={mode + drag.className}
      {...drag.events}
      ref={dnd?.ref}
      {...dnd?.props}
      style={{
        flexDirection: self.attrs.layout === 'horizontal' ? 'row' : 'column',
        ...self.style,
        ...dnd?.style
      }}
    >
      {children}
      <NatureSortable
        items={self.children}
        direction='vertical'
        disabled={mode === 'preview'}
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
    </div>
  )}</Observer>
}