import { IAuto, IBaseComponent } from '@/types/component'
import { Button } from 'antd'
import { Observer } from 'mobx-react'

export default function CButton({ self, mode, drag, children }: IAuto & IBaseComponent) {
  return <Observer>{() => (
    <div
      className={`${mode} ${drag?.classNames}`}
      {...drag.events}
    >
      {children}
      <Button type={self.attrs.get('type') || 'primary'}>{self.title}</Button>
    </div>
  )}</Observer>
}