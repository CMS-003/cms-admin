import { IBaseCom } from "@/types";
import { GripVertical } from "lucide-react";
import { Tag } from 'antd'

export default function CFilterTag({ self, actions, bindings, source, mode, page, children, onSelect }: IBaseCom) {
  const cls = ['node', bindings.isDragging ? 'is-dragging' : '',].join(' ');
  return <div
    {...bindings.root}
    className={cls}
    style={{
      flexDirection: 'row',
    }}>
    {mode === 'edit' && <GripVertical className="node-handle" ref={bindings.handleRef} onContextMenu={bindings.onContextMenu} />}
    <Tag
      variant='outlined'
      style={(mode === 'edit' ? self.attrs.selected : self.$selected) ? { color: 'white', backgroundColor: '#3498db' } : { color: '#666' }}
      onClick={() => {
        onSelect(self._id)
      }}>{self.title}</Tag>
  </div>
}