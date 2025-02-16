import { IAuto } from '@/types/component'
import { Row, Col } from 'antd'
import { Observer } from 'mobx-react'


export default function CRow({ children }: IAuto) {
  return <Observer>{() => (
    <Row style={{ margin: '8px 0', flex: 1 }}>
      <Col span={0} style={{ minHeight: 35, display: 'block' }} />
      {children}
    </Row>
  )}</Observer>
}