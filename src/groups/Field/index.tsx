import { IComponent } from '@/types/component'
import { Col, Row } from 'antd'
import { Observer } from 'mobx-react'
import { Component } from '../auto'
import { Fragment } from 'react'

export default function Field({ self, mode, source, setParentHovered, children }: { self: IComponent, mode: string, children?: any, level: number, source: any, setParentHovered?: Function }) {
  return <Observer>{() => (
    <Col span={mode === 'edit' ? 24 : self.attrs.get('grids') || 24}>
      <Row style={{ lineHeight: 2.5 }}>
        <Col span={0} style={{ minHeight: 35, display: 'block' }} />
        {self.children.map((child, i) => (
          <Fragment key={i}>
            <Col span={self.attrs.get('left') || 6} style={{ textAlign: 'right', lineHeight: 2.5, paddingRight: 5, whiteSpace: 'nowrap' }}>{child.title}</Col>
            <Col span={self.attrs.get('right') || 18}>
              <Component self={child} mode={mode} source={source} setParentHovered={setParentHovered} /></Col>
          </Fragment>
        ))}
      </Row>
    </Col>
  )}</Observer>
}