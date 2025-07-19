import CodeMirror from '@uiw/react-codemirror';
import { json } from '@codemirror/lang-json';
import { javascript } from '@codemirror/lang-javascript';
import { vscodeDark } from '@uiw/codemirror-theme-vscode';
import { IAuto, IBaseComponent } from '@/types/component'
import { Observer } from 'mobx-react'
import { useEffectOnce } from 'react-use';
import { ComponentWrap } from '../style';

export default function Editor({ self, mode, drag, dnd, source, setDataField, children }: IAuto & IBaseComponent) {
  useEffectOnce(() => {
    if (!source._id) {
      setDataField(self.widget, self.widget.value)
    }
  })
  return <Observer>{() => (
    <ComponentWrap
      className={mode + drag.className}
      {...drag.events}
      ref={dnd?.ref}
      {...dnd?.props}
      style={{
        ...dnd?.style,
        width: '100%',
        flex: 0,
        backgroundColor: dnd?.isDragging ? 'lightblue' : '',
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