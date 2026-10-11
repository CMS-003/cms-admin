import { IBaseCom } from "@/types";
import { GripVertical } from "lucide-react";
import styled from 'styled-components';
import { isNil } from 'lodash-es';
import { useMode, useSource } from "@/context";

const Text = styled.div`
  line-height: 1.5;
  word-break: break-all;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 32px;
`

export default function CText({ self, bindings }: IBaseCom) {
  const source = useSource();
  const mode = useMode();
  const cls = ['node', bindings.isDragging ? 'is-dragging' : '',].join(' ');
  return <div
    {...bindings.root}
    className={cls}
    style={{
      flexDirection: 'row',
    }}>
      {mode === 'edit' && <GripVertical className="node-handle" ref={bindings.handleRef} onContextMenu={bindings.onContextMenu} />}
      <Text className='two-line-ellipsis' style={self.style}>{mode === 'edit' ? self.title : (!isNil(source[self.widget.field]) ? source[self.widget.field] : self.title)}</Text>
  </div>
}
