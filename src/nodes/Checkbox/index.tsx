import { IBaseCom } from "@/types";
import { GripVertical } from "lucide-react";
import { Checkbox } from "antd";
import { useEffectOnce } from "react-use";

export default function CCheckbox({ self, bindings, source, setDataField, mode, page, children }: IBaseCom) {
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
      flexDirection: 'row',
    }}>
    {mode === 'edit' && <GripVertical className="node-handle" ref={bindings.handleRef} />}
    <span>
      {self.widget.refer.map((refer, i) => (
        <Checkbox
          key={i}
          defaultChecked={(source[self.widget.field] || []).findIndex((v: any) => v === refer.value) !== -1}
          onChange={e => {
            const checked = e.target.checked
            setDataField(self.widget, checked ? [...source[self.widget.field], refer.value] : source[self.widget.field].filter((v: any) => v === refer.value))
          }}
        >
          {refer.label}
        </Checkbox>
      ))}
    </span>
  </div>
}