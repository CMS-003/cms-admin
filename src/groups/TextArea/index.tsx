import { IAuto, IBaseComponent } from '@/types/component'
import { Observer } from 'mobx-react'
import { Input } from 'antd'
import { useEffectOnce } from 'react-use';
import { ComponentWrap } from '../style';
import JSON5 from 'json5';
import { useModeContext } from '../context';

export default function CTextArea({ self, drag, source, setDataField, children, mode, page }: IAuto & IBaseComponent) {
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
      <Input.TextArea rows={4} defaultValue={self.widget.type === 'json' ? JSON5.stringify(source[self.widget.field], null, 2) : source[self.widget.field]}
        onBlur={(e => {
          setDataField(self.widget, e.target.value)
        })}
      />
    </ComponentWrap>
  )}</Observer>
}