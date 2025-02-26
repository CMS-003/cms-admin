import { IAuto, IBaseComponent } from '@/types/component'
import { Row, Col } from 'antd'
import { Observer } from 'mobx-react'
import { Component } from '../auto'
import NatureSortable from '@/components/NatureSortable'


export default function CRow({ self, mode, dnd, drag, children, ...props }: IAuto & IBaseComponent) {
  return <Observer>{() => (
    <Row
      className={mode + drag.className}
      {...drag.events}
      ref={dnd?.ref}
      {...dnd?.draggableProps}
      {...dnd?.dragHandleProps}
      style={{
        ...dnd?.style,
      }}
    >
      {children}
      <Col span={0} style={{ minHeight: 32, display: 'block' }} />
      <NatureSortable
        items={self.children}
        direction='horizontal'
        droppableId={self._id}
        wrap={Row}
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
    </Row>
  )}</Observer>
}