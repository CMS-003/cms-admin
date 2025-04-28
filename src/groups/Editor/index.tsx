import React from 'react';
import { IAuto, IBaseComponent } from '@/types/component'
import { Observer } from 'mobx-react'
import { useEffectOnce } from 'react-use';
import { Editor, EditorState, ContentState, convertFromHTML } from 'draft-js';
import 'draft-js/dist/Draft.css';
import { ComponentWrap } from '../style';

export default function CEditor({ self, mode, drag, dnd, source, setDataField, children }: IAuto & IBaseComponent) {
  const [editorState, setEditorState] = React.useState(
    () => EditorState.createEmpty(),
  );
  useEffectOnce(() => {
    if (!source._id) {
      setDataField(self.widget, self.widget.value)
    }
    if (mode !== 'edit') {
      const blocksFromHTML = convertFromHTML(source[self.widget.field]);
      const contentState = ContentState.createFromBlockArray(
        blocksFromHTML.contentBlocks,
        blocksFromHTML.entityMap
      );
      setEditorState(EditorState.createWithContent(contentState))
    }
  })
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
      {source[self.widget.field] && <Editor editorState={editorState} onChange={(v: any) => {
        setEditorState(v)
        // setDataField(self.widget, value)
      }} />}
    </ComponentWrap>
  )}</Observer>
}