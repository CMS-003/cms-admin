import { IComponent } from '@/types/component'
import { Row, Col } from 'antd'
import { Observer } from 'mobx-react'


export default function CRow({ self, mode, children, level, }: { self: IComponent, mode: string, children?: any, level: number, }) {
  return <Observer>{() => (
    <Row>
      <Col span={0} style={{ minHeight: 35, display: 'block' }} />
      {children}
    </Row>
  )}</Observer>
}