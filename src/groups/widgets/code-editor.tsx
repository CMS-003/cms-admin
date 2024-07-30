import { Codemirror } from 'react-codemirror-ts';
import 'codemirror/mode/javascript/javascript';
import 'codemirror/addon/edit/matchbrackets';
import 'codemirror/lib/codemirror.css';
import 'codemirror/theme/3024-night.css';
import { Observer } from 'mobx-react';
import { ITableWidget } from '@/types';
import { useState } from 'react';

export default function Widget(props: { widget: ITableWidget, mode: string }) {
  const [value, setValue] = useState(props.widget.value);
  return <Observer>{() => (
    <Codemirror
      value={value}
      name="attrs"
      options={{
        lineNumbers: true,
        lineWrapping: true,
        matchBrackets: true,
        theme: '3024-night',
        mode: 'javascript',
        tabSize: 2,
      }}
      className="code-mirror"
      onChange={(value, options) => {
        props.widget.value = value;
      }}
    />
  )}</Observer>
}