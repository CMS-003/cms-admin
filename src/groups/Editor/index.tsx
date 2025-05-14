import React, { useEffect, useRef } from 'react';
import { IAuto, IBaseComponent } from '@/types/component'
import { Observer } from 'mobx-react'
import { useEffectOnce } from 'react-use';
import { Editor, EditorState, ContentState, convertFromHTML, } from 'draft-js';
import { stateToHTML } from 'draft-js-export-html';
import 'draft-js/dist/Draft.css';
import { ComponentWrap } from '../style';

export default function CEditor({ self, mode, drag, dnd, source, setDataField, children }: IAuto & IBaseComponent) {
  const [editorState, setEditorState] = React.useState(
    () => EditorState.createEmpty(),
  );
  const editorRef = useRef(null);
  useEffectOnce(() => {
    if (!source._id) {
      setDataField(self.widget, self.widget.value)
    }
  })
  useEffect(() => {
    if (mode !== 'edit') {
      const blocksFromHTML = convertFromHTML(source[self.widget.field] || '');
      const contentState = ContentState.createFromBlockArray(
        blocksFromHTML.contentBlocks,
        blocksFromHTML.entityMap
      );
      setEditorState(EditorState.createWithContent(contentState))
    }
  }, [source, self.widget.field])
  return <Observer>{() => (
    <ComponentWrap
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
      <div
        style={{
          minHeight: 120,
          border: '1px solid #dedede',
          cursor: 'text',
          flex: 1,
          borderRadius: 3,
          backgroundColor: 'white'
        }}
        onClick={() => {
          if (editorRef.current) {
            // @ts-ignore
            editorRef.current.focus();
          }
        }}
      >
        <Editor ref={editorRef} editorState={editorState} onChange={(v) => {
          setEditorState(v)
          setDataField(self.widget, stateToHTML(v.getCurrentContent()))
        }} />
      </div>

    </ComponentWrap>
  )}</Observer>
}