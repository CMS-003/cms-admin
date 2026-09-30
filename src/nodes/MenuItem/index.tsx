import { IBaseCom } from "@/types";
import { GripVertical } from "lucide-react";

export default function MenuItem({ self, events, mode, children }: IBaseCom) {
  const cls = [
    'node',
    events.isDragging ? 'is-dragging' : '',
  ].join(' ');
  return <div
    ref={events.setNodeRef}
    data-node-id={self._id}
    data-node-type={self.type}
    onContextMenu={events.onContextMenu}
    className={cls}
    style={{
      flexDirection: 'column',
    }}>

    <div style={{ display: 'flex' }}>
      {mode === 'edit' && <GripVertical className="node-handle" {...events.listeners} {...events.attributes} />}
      {self.title}
    </div>

    {children && <div className="child" style={{ paddingLeft: 40, }}>
      {children}
    </div>}
  </div>
}