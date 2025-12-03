import { IAuto, IBaseComponent } from '@/types/component'
import { Col } from 'antd'
import { Observer } from 'mobx-react'
import { MemoComponent } from '../auto'
import { ComponentWrap } from '../style';
import { useModeContext } from '../context';


export default function CCol({ self, drag, children, mode, page, initField, ...props }: IAuto & IBaseComponent) {
  return <Observer>{() => (
    <Col
      offset={self.attrs.left || 0}
      span={self.attrs.right || 6}
      className={mode + drag.className + ComponentWrap.styledComponentId}
      {...drag.events}
      style={{ minWidth: 0, overflowX: 'auto', flexShrink: 1, ...self.style, }}
    >
      {children}
      {self.children.map((child, index) => (
        <MemoComponent
          self={child}
          key={index}
          {...props}
        />
      ))}
    </Col>
  )}</Observer>
}