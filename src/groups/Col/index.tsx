import { IComponent } from '@/types/component'
import { Col } from 'antd'
import { Observer } from 'mobx-react'


export default function CCol({ self, mode, children, level, }: { self: IComponent, mode: string, children?: any, level: number, }) {
  return <Observer>{() => (
    <Col style={{ minHeight: 35 }}>
      {children}
    </Col>
  )}</Observer>
}