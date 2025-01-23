import CodeMirror from '@uiw/react-codemirror';
import { Observer } from 'mobx-react';
import { ITableWidget } from '@/types';
import { useState } from 'react';
import { json } from '@codemirror/lang-json';

export default function Widget(props: { widget: ITableWidget, mode: string }) {
  const [value, setValue] = useState(props.widget.value);
  return <Observer>{() => (
    <CodeMirror
      value={value}
      extensions={[json()]}
      className="code-mirror"
      onChange={(value, options) => {
        props.widget.value = value;
      }}
    />
  )}</Observer>
}