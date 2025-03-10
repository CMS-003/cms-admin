import CodeMirror from '@uiw/react-codemirror';
import { json } from '@codemirror/lang-json';
import { IAuto, IBaseComponent } from '@/types/component'
import { Row, Col } from 'antd'
import { Observer } from 'mobx-react'
import { Component } from '../auto'
import { toJS } from 'mobx';

export default function Editor({ self, mode, drag, dnd, source, setSource, children }: IAuto & IBaseComponent) {
  return <Observer>{() => (
    <div
      className={mode + drag.className}
      {...drag.events}
      ref={dnd?.ref}
      {...dnd?.props}
      style={{
        ...self.style,
        ...dnd?.style,
        backgroundColor: dnd?.isDragging ? 'lightblue' : '',
      }}
    >
      {children}
      <CodeMirror
        key={self._id}
        value={source[self.widget.field]}
        className="code-mirror"
        extensions={[json()]}
        onChange={(value, options) => {
          if (setSource) {
            setSource(self.widget.field, value)
          }
        }}
      />
    </div>
  )}</Observer>
}