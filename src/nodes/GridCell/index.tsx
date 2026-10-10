import { IBaseCom } from "@/types";
import { GripVertical } from "lucide-react";
import { useMode } from "@/context";

export default function GridCell({ bindings, children }: IBaseCom) {
  const mode = useMode();
  const cls = ['node', bindings.isDragging ? 'is-dragging' : '',].join(' ');
  return <div
    {...bindings.root}
    className={cls}
    style={{
      flexDirection: 'row', height: '100%', width: '100%'
    }}>
    <div style={{ display: 'flex', }}>
      {mode === 'edit' && <GripVertical className="node-handle" ref={bindings.handleRef} onContextMenu={bindings.onContextMenu} />}
    </div>
    {children}
  </div>
}
