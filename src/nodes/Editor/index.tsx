import { IBaseCom } from "@/types";
import { GripVertical } from "lucide-react";
import { useEffectOnce } from 'react-use';
import { Editor, EditorState, ContentState, convertFromHTML, } from 'draft-js';
import { stateToHTML } from 'draft-js-export-html';
import 'draft-js/dist/Draft.css';
import store from "@/store";
import { useState, useRef, useEffect } from "react";

export default function CEditor({ self, bindings, source, setDataField, mode, children }: IBaseCom) {
  const cls = ['node', bindings.isDragging ? 'is-dragging' : '',].join(' ');
  const [editorState, setEditorState] = useState(
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
  return <div
    {...bindings.root}
    className={cls}
    style={{
      flexDirection: 'row',
    }}>
    <div style={{ display: 'flex' }}>
      {mode === 'edit' && <GripVertical className="node-handle" {...bindings.handle.listeners} {...bindings.handle.attributes} />}
    </div>
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
}