import { NodeWrapper } from "@/composer/NodeWrapper";
import { IBaseCom } from "@/types";
import { GripVertical } from "lucide-react";
import { useEffectOnce } from "react-use";

export default function CFilterRow({ self, bindings, setNodeField, source, setDataField, mode, page, children, childrenNodes }: IBaseCom) {
  const cls = ['node', 'no-scrollbar', bindings.isDragging ? 'is-dragging' : '',].join(' ');
  useEffectOnce(() => {
    childrenNodes.forEach(child => {
      if (child.attrs.selected) {
        setNodeField(child, '$selected', true)
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
      {mode === 'edit' && <GripVertical className="node-handle" ref={bindings.handleRef} />}
    </div>
    {childrenNodes.map(child => (
      <NodeWrapper key={child._id} self={child} setNodeField={setNodeField} source={source} setDataField={setDataField} onSelect={(id: string) => {
        childrenNodes.forEach(c => {
          setNodeField(c, '$selected', id === c._id ? true : false)
        })
      }} />
    ))}
  </div>
}