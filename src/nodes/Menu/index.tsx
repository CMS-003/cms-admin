import { IBaseCom } from "@/types";
import { GripVertical } from "lucide-react";

export default function Menu({ self, events, mode, children }: IBaseCom) {
  const cls = [
    'node',
    events.isDragging ? 'is-dragging' : '',
  ].join(' ');
  return <div
    ref={events.setNodeRef}
    data-node-id={self._id}
    data-node-type={self.type}
    onContextMenu={events.onContextMenu}
    className={cls} style={{ flexDirection: 'row', overflow: 'auto' }}>
    {mode === 'edit' && <GripVertical className="node-handle" {...events.listeners} {...events.attributes} />}
    <div style={{ overflow: 'auto' }}>
      {children}
    </div>

  </div>
}