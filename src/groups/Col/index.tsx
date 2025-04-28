import { IAuto, IBaseComponent } from '@/types/component'
import { Col } from 'antd'
import { Observer } from 'mobx-react'
import { Component } from '../auto'
import { ComponentWrap } from '../style';


export default function CCol({ self, mode, drag, dnd, children, ...props }: IAuto & IBaseComponent) {
  return <Observer>{() => (
    <Col
      offset={self.attrs.left || 0}
      span={self.attrs.right || 6}
      className={mode + drag.className + ComponentWrap.styledComponentId}
      {...drag.events}
      ref={dnd?.ref}
      {...dnd?.props}
      style={{ ...self.style, ...dnd?.style }}
    >
      {children}
      {self.children.map((child, index) => (
        <Component
          mode={mode}
          self={child}
          key={index}
          {...props}
        />
      ))}
    </Col>
  )}</Observer>
}