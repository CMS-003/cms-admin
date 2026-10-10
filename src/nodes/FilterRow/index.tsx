import { NodeWrapper } from "@/composer/NodeWrapper";
import { IBaseCom } from "@/types";
import { GripVertical } from "lucide-react";
import { useEffectOnce } from "react-use";

export default function CFilterRow({ self, actions, bindings, source, mode, page, children, childrenNodes }: IBaseCom) {
  const cls = ['node', 'no-scrollbar', bindings.isDragging ? 'is-dragging' : '',].join(' ');
  useEffectOnce(() => {
    childrenNodes.forEach(child => {
      if (child.attrs.selected) {
        actions.setNodeField(child, '$selected', true)
      }
    })
  })
  return <div
    {...bindings.root}
    className={cls}
    style={{
      flexDirection: 'row', flex: 1, overflow: 'auto'
    }}>
    <div style={{ display: 'flex' }}>
      {mode === 'edit' && <GripVertical className="node-handle" ref={bindings.handleRef} onContextMenu={bindings.onContextMenu} />}
    </div>
    {childrenNodes.map(child => (
      <NodeWrapper key={child._id} self={child} onContextMenu={bindings.onContextMenu} onSelect={(id: string) => {
        childrenNodes.forEach(c => {
          actions.setNodeField(c, '$selected', id === c._id ? true : false)
        })
      }} />
    ))}
  </div>
}