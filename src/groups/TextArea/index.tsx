import { IAuto, IBaseComponent} from '@/types/component'
import { Observer } from 'mobx-react'
import { Input } from 'antd'

export default function CTextArea({ self, mode, source, setSource, drag, children }: IAuto & IBaseComponent) {
  return <Observer>{() => (
    <div
      className={`${mode} ${drag?.classNames}`}
      {...drag.events}
    >
      {children}
      <Input.TextArea />
    </div>
  )}</Observer>
}