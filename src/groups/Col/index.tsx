import { IAuto, IBaseComponent } from '@/types/component'
import { Col } from 'antd'
import { Observer } from 'mobx-react'
import { Component } from '../auto'


export default function CCol({ self, mode, drag, page, source, setSource, children }: IAuto & IBaseComponent) {
  return <Observer>{() => (
    <Col style={{ minHeight: 32 }}
      offset={self.attrs.get('left') || 0}
      span={self.attrs.get('right') || 6}
      className={`${mode} ${drag?.classNames}`}
      {...drag.events}
    >
      {children}
      {self.children.map((child, index) => <Component mode={mode} page={page} self={child} key={index} source={source} setSource={setSource} setParentHovered={drag?.setIsMouseOver} />)}
    </Col>
  )}</Observer>
}