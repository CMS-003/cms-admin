import { IAuto, IBaseComponent } from '@/types/component'
import { Row, Col } from 'antd'
import { Observer } from 'mobx-react'
import { Component } from '../auto'
import NatureSortable from '@/components/NatureSortable'


export default function CRow({ self, mode, dnd, source, setSource, drag, children }: IAuto & IBaseComponent) {
  return <Observer>{() => (
    <Row
      className={`${mode} ${drag?.classNames}`}
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
        renderItem={({ item, dnd, index }) => (
          <Component
            self={item}
            mode={mode}
            index={index}
            source={source}
            setSource={setSource}
            setParentHovered={drag?.setIsMouseOver}
            dnd={dnd}
          />
        )}
      />
    </Row>
  )}</Observer>
}