import { IAuto, IBaseComponent} from '@/types/component'
import { Row, Col } from 'antd'
import { Observer } from 'mobx-react'
import { Component } from '../auto'

export default function CField({ self, mode, source, setSource, drag, children }: IAuto & IBaseComponent) {
  return <Observer>{() => <Row
    className={`${mode} ${drag?.classNames}`}
    onMouseEnter={drag?.onMouseEnter || ((e) => { })}
    onMouseLeave={drag?.onMouseLeave || ((e) => { })}
    onContextMenu={drag?.onContextMenu || ((e) => { })}
    onDragOver={drag?.onDragOver || ((e) => { })}
    onDrop={drag?.onDrop || ((e) => { })}
    onDragLeave={drag?.onDragLeave || ((e) => { })}
  >
    {children}
    <Col span={self.attrs.get('left') || 6}>
      <div style={{ textAlign: 'right', lineHeight: '32px', paddingRight: 10, whiteSpace: 'nowrap' }}>{self.title}</div>
    </Col>
    <Col span={self.attrs.get('right') || 18}>
      {self.children.map((child, i) => (
        <Component key={i} index={i} self={child} mode={mode} source={source} setSource={setSource} setParentHovered={drag?.setIsMouseOver} />
      ))}
    </Col>
  </Row>}</Observer>
}