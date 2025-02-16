import { IAuto } from '@/types/component'
import { Row, Col } from 'antd'
import { Observer } from 'mobx-react'
import { Component } from '../auto'
import { Fragment } from 'react'

export default function CField({ self, mode, source, setSource, setParentHovered }: IAuto) {
  const Wrap = mode === 'edit' ? Row : Fragment;
  return <Observer>{() => <Wrap>
    <Col span={self.attrs.get('left') || 6} >
      <div style={{ textAlign: 'right', lineHeight: '2.5em', paddingRight: 10, whiteSpace: 'nowrap' }}>{self.title}</div>
    </Col>
    <Col span={self.attrs.get('right') || 18}>
      {self.children.map((child, i) => (
        <Component key={i} self={child} mode={mode} source={source} setSource={setSource} setParentHovered={setParentHovered} />
      ))}
    </Col>
  </Wrap>}</Observer>
}