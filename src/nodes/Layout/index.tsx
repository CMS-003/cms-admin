import { IBaseCom } from "@/types";
import { GripVertical } from "lucide-react";

export default function Layout({ self, actions, bindings, mode, children }: IBaseCom) {
  const cls = ['node', bindings.isDragging ? 'is-dragging' : '',].join(' ');
  return <div
    {...bindings.root}
    className={cls}
    style={{ display: 'flex', flexDirection: self.attrs.layout === 'horizontal' ? 'row' : 'column', width: self.attrs.layout === 'horizontal' ? '100%' : 'auto', ...self.style }}>
    <div style={{ display: 'flex', }}>
      {mode === 'edit' && <GripVertical className="node-handle" ref={bindings.handleRef} onContextMenu={bindings.onContextMenu} />}
    </div>
    {children}
  </div>
}