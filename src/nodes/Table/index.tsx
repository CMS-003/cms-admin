import { NodeWrapper } from "@/composer/NodeWrapper";
import { IBaseCom, IComponent } from "@/types";
import { useLocalProxy } from "@/utils/valtio";
import { GripVertical } from "lucide-react";
import { getWidgetValue } from '@/groups/utils'
import { isNil } from 'lodash-es'

export default function CTable({ self, bindings, mode, children }: IBaseCom) {
  const cls = ['node', bindings.isDragging ? 'is-dragging' : '',].join(' ');
  const [localState, localStore] = useLocalProxy({
    loading: false,
    total: 0,
    resources: [],
    temp: { _id: 'temp' } as any,
  })
  return <div
    {...bindings.root}
    className={cls}
    style={{
      flexDirection: 'column',
    }}>
    <table>
      <thead>
        <tr>
          <th style={{ width: 20 }}>
            {mode === 'edit' && <GripVertical className="node-handle" {...bindings.handle.listeners} {...bindings.handle.attributes} />}
          </th>
          {self.children.map(child => (
            <th key={child._id}><NodeWrapper self={child} source={{}} setDataField={() => { }} /></th>
          ))}
        </tr>
      </thead>
      <tbody>
        <tr>
          <td></td>
          {self.children.map((child: IComponent) => (
            <td key={child._id}>
              {child.children.map(item => (
                <NodeWrapper key={item._id} self={item} source={localState.temp} setDataField={(widget, value) => {
                  if (!widget.field) {
                    return;
                  }
                  value = getWidgetValue(widget, value);
                  if (isNil(value)) {
                    return;
                  }
                  localStore.temp[widget.field] = value
                }} />
              ))}
            </td>
          ))}
        </tr>
      </tbody>
    </table>
  </div>
}