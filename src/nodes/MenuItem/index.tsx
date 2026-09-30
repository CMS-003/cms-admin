import { IBaseCom } from "@/types";
import { GripVertical } from "lucide-react";

export default function MenuItem({ self, bindings, mode, children }: IBaseCom) {
  const cls = ['node', bindings.isDragging ? 'is-dragging' : '',].join(' ');
  return <div
    {...bindings.root}
    className={cls}
    style={{
      flexDirection: 'column',
    }}>
    <div style={{ display: 'flex' }}>
      {mode === 'edit' && <GripVertical className="node-handle" {...bindings.handle.listeners} {...bindings.handle.attributes} />}
      {self.title}
    </div>
    {children && <div className="child" style={{ paddingLeft: 40, }}>
      {children}
    </div>}
  </div>
}