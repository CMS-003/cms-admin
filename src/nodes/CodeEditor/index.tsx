import { IBaseCom } from "@/types";
import { Col } from "antd";
import { GripVertical } from "lucide-react";
import CodeMirror from '@uiw/react-codemirror';
import { javascript } from '@codemirror/lang-javascript';
import { vscodeDark } from '@uiw/codemirror-theme-vscode';
import { useEffectOnce } from 'react-use';

export default function CodeEditor({ self, bindings, source, setDataField, mode, children }: IBaseCom) {
  const cls = ['node', bindings.isDragging ? 'is-dragging' : '',].join(' ');
  useEffectOnce(() => {
    if (!source._id) {
      setDataField(self.widget, self.widget.value)
    }
  })
  return <div
    {...bindings.root}
    className={cls}
    style={{
      flexDirection: 'row',
    }}>
    <div style={{ display: 'flex' }}>
      {mode === 'edit' && <GripVertical className="node-handle" ref={bindings.handleRef} />}
    </div>
    <CodeMirror
      key={self._id}
      value={source[self.widget.field]}
      className="code-mirror"
      theme={vscodeDark}
      style={{ border: '1px dotted grey', width: 700, maxHeight: 400 }}
      extensions={[javascript()]}
      onChange={(value, options) => {
        setDataField(self.widget, value)
      }}
    />
  </div>
}