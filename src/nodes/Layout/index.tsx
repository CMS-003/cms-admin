import { IBaseCom } from "@/types";
import { GripVertical } from "lucide-react";

export default function Layout({ self, bindings, mode, children }: IBaseCom) {
  const cls = ['node', bindings.isDragging ? 'is-dragging' : '',].join(' ');
  return <div
    {...bindings.root}
    className={cls}
    style={{ display: 'flex', flexDirection: self.attrs.layout === 'horizontal' ? 'row' : 'column', ...self.style }}>
    <div style={{ display: 'flex', }}>
      {mode === 'edit' && <GripVertical className="node-handle" {...bindings.handle.listeners} {...bindings.handle.attributes} />}
    </div>
    {children}
  </div>
}