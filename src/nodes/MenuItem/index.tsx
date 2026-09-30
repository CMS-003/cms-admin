import { IBaseCom } from "@/types";
import { GripVertical } from "lucide-react";

export default function MenuItem({ self, drag, mode, children }: IBaseCom) {
  const cls = [
    'node',
    drag.isDragging ? 'is-dragging' : '',
  ].join(' ');
  return <div
    ref={drag.setNodeRef}
    data-node-id={self._id}
    data-node-type={self.type}
    onContextMenu={drag.onContextMenu}
    className={cls}
    style={{
      flexDirection: 'column',
    }}>

    <div style={{ display: 'flex' }}>
      {mode === 'edit' && <GripVertical className="node-handle" {...drag.listeners} {...drag.attributes} />}
      {self.title}
    </div>

    {children && <div className="child" style={{ paddingLeft: 40, paddingTop: 10 }}>
      {children}
    </div>}
  </div>
}