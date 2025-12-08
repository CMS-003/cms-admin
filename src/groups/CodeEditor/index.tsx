import CodeMirror from '@uiw/react-codemirror';
import { javascript } from '@codemirror/lang-javascript';
import { vscodeDark } from '@uiw/codemirror-theme-vscode';
import { IAuto, IBaseComponent } from '@/types/component'
import { Observer } from 'mobx-react'
import { useEffectOnce } from 'react-use';
import { ComponentWrap } from '../style';

export default function Editor({ self, drag, source, setDataField, children, mode, page }: IAuto & IBaseComponent) {
  useEffectOnce(() => {
    if (!source._id) {
      setDataField(self.widget, self.widget.value)
    }
  })
  return <Observer>{() => (
    <ComponentWrap
      className={drag.className}
      {...drag.events}
      style={{
        width: '100%',
        flex: 0,
      }}
    >
      {children}
      <CodeMirror
        key={self._id}
        value={source[self.widget.field]}
        className="code-mirror"
        theme={vscodeDark}
        style={{
          border: '1px dotted grey',
          width: 700,
          maxHeight: 400,
        }}
        extensions={[javascript()]}
        onChange={(value, options) => {
          setDataField(self.widget, value)
        }}
      />
    </ComponentWrap>
  )}</Observer>
}