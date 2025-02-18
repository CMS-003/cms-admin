import { IAuto, IBaseComponent } from '@/types/component'
import { Radio } from 'antd'
import { Observer } from 'mobx-react'

export default function CRadio({ self, mode, drag, source = {}, setSource, children }: IAuto & IBaseComponent) {
  return <Observer>{() => (
    <div style={{ lineHeight: 2.5 }}
      className={`${mode} ${drag?.classNames}`}
      {...drag.events}
    >
      {children}
      <Radio.Group options={self.widget.refer} onChange={e => {
        if (self.widget) {
          setSource && setSource(self.widget.field, e.target.value);
        }
      }} value={source[self.widget.field]} />
    </div>
  )
  }</Observer >
}