import { IBaseCom } from "@/types";
import { Progress } from "antd";
import { GripVertical } from "lucide-react";
import { useEffectOnce } from "react-use";

export default function CProgress({ self, bindings, source, setDataField, mode, children }: IBaseCom) {
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
    {mode === 'edit' && <GripVertical className="node-handle" ref={bindings.handleRef} onContextMenu={bindings.onContextMenu} />}
    <Progress percent={source[self.widget.field]} type='circle' size={'small'} />
  </div>
}