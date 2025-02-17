import { IAuto, IBaseComponent } from '@/types/component'
import { Row, Col } from 'antd'
import { Observer } from 'mobx-react'
import { Component } from '../auto'


export default function CRow({ self, mode, handler, isDragging, drag, children }: IAuto & IBaseComponent) {
  return <Observer>{() => (
    <Row
      className={`${mode} ${drag?.classNames}`}
      onMouseEnter={drag?.onMouseEnter || ((e) => { })}
      onMouseLeave={drag?.onMouseLeave || ((e) => { })}
      onContextMenu={drag?.onContextMenu || ((e) => { })}
      onDragOver={drag?.onDragOver || ((e) => { })}
      onDrop={drag?.onDrop || ((e) => { })}
      onDragLeave={drag?.onDragLeave || ((e) => { })}
      ref={handler.innerRef}
      {...handler.draggableProps}
      {...handler.dragHandleProps}
      style={{
        paddingTop: 8, paddingBottom: 8,
        backgroundColor: isDragging ? 'lightblue' : '',
        ...(handler.draggableProps || {}).style,
      }}
    >
      {children}
      <Col span={0} style={{ minHeight: 32, display: 'block' }} />
      {self.children.map((child, i) => <Component
        key={i}
        index={i}
        self={child}
        mode={mode}
        setParentHovered={drag?.setIsMouseOver}
      />)}
    </Row>
  )}</Observer>
}