import { IBaseCom } from "@/types";
import { GripVertical } from "lucide-react";

export default function Menu({ self, bindings, mode, page, children }: IBaseCom) {
  const cls = ['node', bindings.isDragging ? 'is-dragging' : '',].join(' ');
  return <div
    {...bindings.root}
    className={cls}
    style={{ flexDirection: 'row', overflow: 'auto', }}
  >
    {mode === 'edit' && <GripVertical className="node-handle" ref={bindings.handleRef} />}
    <div className="no-scrollbar" style={{ overflow: 'auto' }}>
      {children}
    </div>
  </div>
}