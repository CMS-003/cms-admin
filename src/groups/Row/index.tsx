import { IAuto, IBaseComponent } from '@/types/component'
import { Row, Col } from 'antd'
import { Observer } from 'mobx-react'
import { Component } from '../auto'


export default function CRow({ self, mode, dnd, drag, children }: IAuto & IBaseComponent) {
  return <Observer>{() => (
    <Row
      className={`${mode} ${drag?.classNames}`}
      {...drag.events}
      ref={dnd?.ref}
      {...dnd?.draggableProps}
      {...dnd?.dragHandleProps}
      style={{
        paddingTop: 8, paddingBottom: 8,
        ...dnd?.style,
      }}
    >
      {children}
      <Col span={0} style={{ minHeight: 32, display: 'block' }} />
      {self.children.map((child, i) => <Component
        key={i}
        self={child}
        mode={mode}
        setParentHovered={drag?.setIsMouseOver}
      />)}
    </Row>
  )}</Observer>
}