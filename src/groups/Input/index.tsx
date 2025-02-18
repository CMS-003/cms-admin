import { IAuto, IBaseComponent} from '@/types/component'
import { Input } from 'antd'
import { Observer } from 'mobx-react'

export default function CInput({ self, mode, source = {}, drag, setSource, children }: IAuto & IBaseComponent) {
  return <Observer>{() => (
    <div style={self.style}
      className={`${mode} ${drag?.classNames}`}
      {...drag.events}
    >
      {children}
      <Input value={source[self.widget.field]} onChange={e => {
        setSource && setSource(self.widget.field, e.target.value);
      }} />
    </div>
  )}</Observer>
}