import { IAuto, IBaseComponent } from '@/types/component'
import { Col } from 'antd'
import { Observer } from 'mobx-react'
import { MemoComponent } from '../auto'
import { ComponentWrap } from '../style';

export default function CField({ self, drag, children, mode, page, ...props }: IAuto & IBaseComponent) {
  return <Observer>{() => <ComponentWrap
    className={'ant-row ' + drag.className}
    {...drag.events}
    style={self.style}
  >
    {children}
    <Col span={self.attrs.left || 6}>
      <div style={{ textAlign: 'right', lineHeight: '32px', paddingRight: 10, whiteSpace: 'nowrap' }}>{self.title}</div>
    </Col>
    <Col span={self.attrs.right || 18}>
      {self.children.map((child, i) => (
        <MemoComponent key={i} self={child} {...props} />
      ))}
    </Col>
  </ComponentWrap>}</Observer>
}