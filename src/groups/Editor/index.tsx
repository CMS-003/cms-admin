import React, { useEffect, useRef } from 'react';
import { IAuto, IBaseComponent } from '@/types/component'
import { Observer } from 'mobx-react'
import { useEffectOnce } from 'react-use';
import { Editor, EditorState, ContentState, convertFromHTML, } from 'draft-js';
import { stateToHTML } from 'draft-js-export-html';
import 'draft-js/dist/Draft.css';
import { ComponentWrap } from '../style';
import store from '@/store';

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
  const mediaBlockRenderer = (block: any) => {
    if (block.getType() === 'atomic') {
      return {
        component: (props: any) => {
          const entity = props.contentState.getEntity(props.block.getEntityAt(0));
          const { src } = entity.getData();
          return <img src={store.app.imageLine + src} style={{ maxWidth: '100%' }} />;
        },
        editable: false,
      };
    }
    return null;
  };
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
        <Editor ref={editorRef}
          editorState={editorState}
          blockRendererFn={mediaBlockRenderer}
          onChange={(v) => {
            setEditorState(v)
            setDataField(self.widget, stateToHTML(v.getCurrentContent(), {
              blockRenderers: {
                unstyled: (block) => {
                  const text = block.getText();
                  return text === '' ? '' : `<p>${text}</p>`;
                },
              },
            }))
          }} />
      </div>

    </ComponentWrap>
  )}</Observer>
}