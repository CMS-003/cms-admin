import { ContextMenu } from "@/composer/ContextMenu";
import { IBaseCom, IComponent } from "@/types";
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
    data-dragging={drag.isDragging}
    className={cls}
    style={{
      flexDirection: 'row',
      alignItems: 'center',
    }}>
    {mode === 'edit' && <GripVertical className="node-handle" {...drag.listeners} {...drag.attributes} />}
    {self.title}
    {children && <div className="child" style={{ paddingLeft: 40 }}>
      {children}
    </div>}
  </div>
}