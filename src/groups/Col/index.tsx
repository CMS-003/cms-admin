import { IAuto } from '@/types/component'
import { Col } from 'antd'
import { Observer } from 'mobx-react'


export default function CCol({ children }: IAuto) {
  return <Observer>{() => (
    <Col style={{ minHeight: 35 }}>
      {children}
    </Col>
  )}</Observer>
}