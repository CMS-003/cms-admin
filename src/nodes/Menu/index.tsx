import { IBaseCom } from "@/types";
import { GripVertical } from "lucide-react";
import { useMode } from "@/context";

export default function Menu({ bindings, children }: IBaseCom) {
  const mode = useMode();
  const cls = ['node', bindings.isDragging ? 'is-dragging' : '',].join(' ');
  return <div
    {...bindings.root}
    className={cls}
    style={{ flexDirection: 'row', overflow: 'auto', }}
  >
    {mode === 'edit' && <GripVertical className="node-handle" ref={bindings.handleRef} onContextMenu={bindings.onContextMenu} />}
    <div className="no-scrollbar" style={{ overflow: 'auto' }}>
      {children}
    </div>
  </div>
}
