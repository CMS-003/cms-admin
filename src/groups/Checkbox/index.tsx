import { IAuto, IBaseComponent } from '@/types/component'
import { Checkbox } from 'antd'
import { Observer } from 'mobx-react'
import { useEffectOnce } from 'react-use'
import { ComponentWrap } from '../style';
import { useModeContext } from '../context';

export default function CCheckbox({ self, source = {}, drag, setDataField, children, mode, page }: IAuto & IBaseComponent) {
  useEffectOnce(() => {
    if (!source._id) {
      setDataField(self.widget, self.widget.value)
    }
  })
  return <Observer>{() => (
    <ComponentWrap
      className={drag.className}
      {...drag.events}
      style={self.style}
    >
      {children}
      <div>
        <span style={{ marginLeft: 5 }}>
          {self.widget.refer.map((refer, i) => (
            <Checkbox key={i} defaultChecked={(source[self.widget.field] || []).findIndex((v: any) => v === refer.value) !== -1} onChange={v => {
              const checked = v.target.checked
              setDataField(self.widget, checked ? [...source[self.widget.field], refer.value] : source[self.widget.field].filter((v: any) => v === refer.value))
            }}>{refer.label}</Checkbox>
          ))}
        </span>
      </div>
    </ComponentWrap>
  )}</Observer>
}