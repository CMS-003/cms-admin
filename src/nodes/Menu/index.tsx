import { IBaseCom, IComponent } from "@/types";
import { GripVertical } from "lucide-react";

export default function Menu({ self, drag, mode, children }: IBaseCom) {
  const cls = [
    'node',
    drag.isDragging ? 'is-dragging' : '',
  ].join(' ');
  return <div
    ref={drag.setNodeRef}
    data-node-id={self._id}
    data-node-type={self.type}
    className={cls} style={{ flexDirection: 'row', justifyContent: 'center', height: '100%', overflow: 'auto' }}>
    {mode === 'edit' && <GripVertical className="node-handle" {...drag.listeners} {...drag.attributes} />}
    <div style={{ overflow: 'auto' }}>
      {children}
    </div>

  </div>
}