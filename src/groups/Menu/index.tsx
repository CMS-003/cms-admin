import { IAuto, IBaseComponent } from '@/types/component'
import { Component } from '../auto'
import { Observer } from 'mobx-react'
import NatureSortable from '@/components/NatureSortable'
import { ComponentWrap } from '../style';

export default function CMenu({ self, mode, drag, dnd, children, ...props }: IAuto & IBaseComponent) {
  return <Observer>{() => (
    <ComponentWrap
      className={mode + drag.className}
      {...drag.events}
      ref={dnd?.ref}
      {...dnd?.props}
      style={{
        flexDirection: 'row',
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
    </ComponentWrap>
  )}</Observer>
}