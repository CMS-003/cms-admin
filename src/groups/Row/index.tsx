import { IAuto, IBaseComponent } from '@/types/component'
import { Row, Col } from 'antd'
import { Observer } from 'mobx-react'
import { Component } from '../auto'
import NatureSortable from '@/components/NatureSortable'
import { ComponentWrap } from '../style';
import store from '@/store'


export default function CRow({ self, mode, dnd, drag, children, ...props }: IAuto & IBaseComponent) {
  return <Observer>{() => (
    <ComponentWrap
      className={mode + drag.className}
      {...drag.events}
      ref={dnd?.ref}
      {...dnd?.props}
      style={{
        ...dnd?.style,
        backgroundColor: dnd?.isDragging ? 'lightblue' : '',
      }}>
      {children}
      <NatureSortable
        items={self.children}
        direction='horizontal'
        disabled={mode === 'preview' || store.component.can_drag_id !== self._id}
        droppableId={self._id}
        style={{ flex: 1 }}
        wrap={Row}
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