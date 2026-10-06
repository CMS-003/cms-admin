import { IBaseCom } from "@/types";
import { Radio } from "antd";
import { GripVertical } from "lucide-react";
import { get } from 'lodash-es'
import store from "@/store";

export default function CRadio({ self, bindings, source, setDataField, mode, page, children }: IBaseCom) {
  const cls = ['node', bindings.isDragging ? 'is-dragging' : '',].join(' ');
  return <div
    {...bindings.root}
    className={cls}
    style={{
      flexDirection: 'row',
    }}>
    <div style={{ display: 'flex' }}>
      {mode === 'edit' && <GripVertical className="node-handle" {...bindings.handle.listeners} {...bindings.handle.attributes} />}
    </div>
    <Radio.Group
      style={{ display: 'flex', alignItems: 'center', minHeight: 35 }}
      options={[...self.widget.refer, ...(store.global.getValue(self.widget.source) || [])]}
      onChange={e => {
        setDataField(self.widget, e.target.value)
      }}
      value={get(source, self.widget.field)}
    />
  </div>
}