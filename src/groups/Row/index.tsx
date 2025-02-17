import { IAuto } from '@/types/component'
import { Row, Col } from 'antd'
import { Observer } from 'mobx-react'
import { Component } from '../auto'


export default function CRow({ self, mode, drag, children }: IAuto) {
  return <Observer>{() => (
    <Row style={{ flex: 1, paddingTop: 8, paddingBottom: 8 }}
      className={`${mode} ${drag?.classNames}`}
      onMouseEnter={drag?.onMouseEnter || ((e) => { })}
      onMouseLeave={drag?.onMouseLeave || ((e) => { })}
      onContextMenu={drag?.onContextMenu || ((e) => { })}
      onDragOver={drag?.onDragOver || ((e) => { })}
      onDrop={drag?.onDrop || ((e) => { })}
      onDragLeave={drag?.onDragLeave || ((e) => { })}
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