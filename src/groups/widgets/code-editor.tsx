import CodeMirror from '@uiw/react-codemirror';
import { Observer } from 'mobx-react';
import { ITableWidget } from '@/types';
import { useState } from 'react';
import { json } from '@codemirror/lang-json';
import { javascript } from '@codemirror/lang-javascript';

export default function Widget(props: { widget: ITableWidget, mode: string }) {
  const [value, setValue] = useState(props.widget.value);
  return <Observer>{() => (
    <CodeMirror
      style={{ border: '1px solid #ccc' }}
      value={value}
      extensions={[javascript({ jsx: true, typescript: true })]}
      className="code-mirror"
      onChange={(value, options) => {
        props.widget.value = value;
      }}
    />
  )}</Observer>
}