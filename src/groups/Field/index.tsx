import { IComponent } from '@/types/component'
import { Col, Row } from 'antd'
import { Observer } from 'mobx-react'
import { Component } from '../auto'
import { Fragment } from 'react'

export default function Field({ self, mode, source, setSource, setParentHovered, children }: { self: IComponent, mode: string, setSource?: Function, children?: any, level: number, source: any, setParentHovered?: Function }) {
  return <Observer>{() => <Fragment>
    <Col span={self.attrs.get('left') || 0} />
    {self.children.map((child, i) => (
      <Fragment key={i}>
        <Col span={child.attrs.get('left') || 6} style={{ textAlign: 'right', lineHeight: 2.5, paddingRight: 8, whiteSpace: 'nowrap' }}>{child.title}</Col>
        <Col span={child.attrs.get('right') || 18}>
          <Component self={child} mode={mode} source={source} setSource={setSource} setParentHovered={setParentHovered} /></Col>
      </Fragment>
    ))}
    <Col span={self.attrs.get('right') || 0} />
  </Fragment>}</Observer>
}