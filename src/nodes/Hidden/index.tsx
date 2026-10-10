import { IBaseCom } from "@/types";
import { Input } from "antd";
import { GripVertical } from "lucide-react";
import { useActions, useMode, useSource } from "@/context";

export default function CHidden({ self, bindings }: IBaseCom) {
  const source = useSource();
  const actions = useActions();
  const mode = useMode();
  const cls = ['node', bindings.isDragging ? 'is-dragging' : '',].join(' ');
  return <div
    {...bindings.root}
    className={cls}
    style={{
      flexDirection: 'row',
    }}>
    <div style={{ display: 'flex' }}>
      {mode === 'edit' && <GripVertical className="node-handle" ref={bindings.handleRef} onContextMenu={bindings.onContextMenu} />}
    </div>
    <Input
      type={mode === 'preview' ? 'hidden' : 'text'}
      disabled
      readOnly
      value={mode === 'preview' ? source[self.widget.field] : self.widget.field}
      style={self.style}
      onChange={e => {
        actions.setDataField(self.widget, e.target.value);
      }}
    />
  </div>
}
