import { IBaseCom } from "@/types";
import { GripVertical } from "lucide-react";
import { Acon, VisualBox } from '@/components'

export default function CIcon({ self, bindings, mode, children }: IBaseCom) {
  const cls = ['node', bindings.isDragging ? 'is-dragging' : '',].join(' ');
  return <div
    {...bindings.root}
    className={cls}
    style={{
      flexDirection: 'row',
    }}>
    <div style={{ display: 'flex' }}>
      {mode === 'edit' && <GripVertical className="node-handle" ref={bindings.handleRef} />}
    </div>
    <Acon icon={self.icon || 'CirclePlus' as any} style={self.style} title={self.title} />
  </div>
}