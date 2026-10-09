import { IBaseCom } from "@/types";
import { Input } from "antd";
import { GripVertical } from "lucide-react";
import { useEffectOnce } from "react-use";

export default function CTextArea({ self, bindings, source, setDataField, mode, children }: IBaseCom) {
  const cls = ['node', bindings.isDragging ? 'is-dragging' : '',].join(' ');
  useEffectOnce(() => {
    if (!source._id) {
      setDataField(self.widget, self.widget.value)
    }
  })
  return <div
    {...bindings.root}
    className={cls}
    style={{
      flexDirection: 'row', flex: 1,
    }}>
    <div style={{ display: 'flex' }}>
      {mode === 'edit' && <GripVertical className="node-handle" ref={bindings.handleRef} />}
    </div>
    <Input.TextArea
      rows={4}
      defaultValue={self.widget.type === 'json' ? JSON.stringify(source[self.widget.field], null, 2) : source[self.widget.field]}
      onBlur={e => {
        setDataField(self.widget, e.target.value)
      }}
    />
  </div>
}