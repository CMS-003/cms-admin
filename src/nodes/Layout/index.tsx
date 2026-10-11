import { IBaseCom } from "@/types";
import { GripVertical } from "lucide-react";
import { useMode } from "@/context";

export default function Layout({ self, bindings, children }: IBaseCom) {
  const mode = useMode();
  const cls = ['node', bindings.isDragging ? 'is-dragging' : '',].join(' ');
  return <div
    {...bindings.root}
    className={cls}
    style={{ display: 'flex', ...(self.attrs.layout === 'horizontal' ? { flexDirection: 'row', width: '100%' } : { flexDirection: 'column', width: 'auto' }), ...self.style }}>
    <div style={{ display: 'flex', }}>
      {mode === 'edit' && <GripVertical className="node-handle" ref={bindings.handleRef} onContextMenu={bindings.onContextMenu} />}
    </div>
    {children}
  </div>
}
