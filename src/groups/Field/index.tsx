import { IAuto, IBaseComponent } from '@/types/component'
import { Row, Col } from 'antd'
import { Observer } from 'mobx-react'
import { Component } from '../auto'

export default function CField({ self, mode, dnd, drag, children, ...props }: IAuto & IBaseComponent) {
  return <Observer>{() => <Row
    className={mode + drag.className}
    {...drag.events}
    ref={dnd?.ref}
    {...dnd?.props}
    style={{
      paddingTop: 8, paddingBottom: 8,
      ...dnd?.style,
      backgroundColor: dnd?.isDragging ? 'lightblue' : '',
    }}
  >
    {children}
    <Col span={self.attrs.left || 6}>
      <div style={{ textAlign: 'right', lineHeight: '32px', paddingRight: 10, whiteSpace: 'nowrap' }}>{self.title}</div>
    </Col>
    <Col span={self.attrs.right || 18}>
      {self.children.map((child, i) => (
        <Component key={i} self={child} mode={mode} index={i} {...props} />
      ))}
    </Col>
  </Row>}</Observer>
}