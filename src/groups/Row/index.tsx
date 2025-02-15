import { IComponent } from '@/types/component'
import { Row, Col } from 'antd'
import { Observer } from 'mobx-react'


export default function CRow({ self, mode, children, level, source }: { self: IComponent, mode: string, children?: any, level: number, source: any }) {
  return <Observer>{() => (
    <Row style={{margin: '8px 0'}}>
      <Col span={0} style={{ minHeight: 35, display: 'block' }} />
      {children}
    </Row>
  )}</Observer>
}