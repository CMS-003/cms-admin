import { IBaseCom } from "@/types";
import { GripVertical } from "lucide-react";

export default function TableColumn({ self, bindings, mode, children }: IBaseCom) {
  const cls = ['node', bindings.isDragging ? 'is-dragging' : '',].join(' ');
  return <div
    {...bindings.root}
    className={cls}
    style={self.style}>
    <div style={{ display: 'flex', alignItems: 'center' }}>
      {mode === 'edit' && <GripVertical className="node-handle" ref={bindings.handleRef} onContextMenu={bindings.onContextMenu} />}
      {self.title}
    </div>
  </div>
}