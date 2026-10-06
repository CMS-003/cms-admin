import { IBaseCom } from "@/types";
import { GripVertical } from "lucide-react";
import styled from "styled-components";

const Cell = styled.div`
  background-color: #d9d9d9c7;
`

export default function GridCell({ self, bindings, mode, children }: IBaseCom) {
  const cls = ['node', bindings.isDragging ? 'is-dragging' : '',].join(' ');
  return <div
    {...bindings.root}
    className={cls}
    style={{
      flexDirection: 'column',
    }}>
    <div style={{ display: 'flex', }}>
      {mode === 'edit' && <GripVertical className="node-handle" {...bindings.handle.listeners} {...bindings.handle.attributes} />}
    </div>
      {children}
  </div>
}