import { IBaseCom } from "@/types";
import { Radio } from "antd";
import { GripVertical } from "lucide-react";
import { get } from 'lodash-es'
import store from "@/store";

export default function CRow({ self, bindings, source, setDataField, mode, page, children }: IBaseCom) {
  const cls = ['node', bindings.isDragging ? 'is-dragging' : '',].join(' ');
  return <div
    {...bindings.root}
    className={cls}
    style={{
      flexDirection: 'row', width: '100%',
    }}>
    <div style={{ display: 'flex' }}>
      {mode === 'edit' && <GripVertical className="node-handle" ref={bindings.handleRef} />}
    </div>
    {children}
  </div>
}