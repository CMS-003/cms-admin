import { IAuto, IBaseComponent } from '@/types/component'
import { Row, Col } from 'antd'
import { Observer } from 'mobx-react'
import { Component } from '../auto'

export default function CField({ self, mode, source, setSource, dnd, drag, children }: IAuto & IBaseComponent) {
  return <Observer>{() => <Row
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
    <Col span={self.attrs.get('left') || 6}>
      <div style={{ textAlign: 'right', lineHeight: '32px', paddingRight: 10, whiteSpace: 'nowrap' }}>{self.title}</div>
    </Col>
    <Col span={self.attrs.get('right') || 18}>
      {self.children.map((child, i) => (
        <Component key={i} self={child} mode={mode} index={i} source={source} setSource={setSource} setParentHovered={drag?.setIsMouseOver} />
      ))}
    </Col>
  </Row>}</Observer>
}