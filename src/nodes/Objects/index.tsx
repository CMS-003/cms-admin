import { IBaseCom, IResource } from "@/types";
import { Col } from "antd";
import { GripVertical } from "lucide-react";
import apis from '@/api';
import styled from 'styled-components';
import CONST from '@/constant';
import { isNil } from 'lodash-es';
import { useLocalProxy } from "@/utils/valtio";
import { FullHeight } from "@/components/style";
import { NodeWrapper } from "@/composer/NodeWrapper";

const ObjectItem = styled.div`
  display: flex;
  flex-direction: row;
  position: relative;
  align-items: center;
  flex: 1;
  padding: 2px;
  border: 1px dashed #00000036;
`

export default function CObjects({ self, bindings, source, setDataField,setNodeField, mode, children, childrenNodes }: IBaseCom) {
  const cls = ['node', bindings.isDragging ? 'is-dragging' : '',].join(' ');
  const [localState, localStore] = useLocalProxy({
    showAdd: false,
    source: {} as any,
  });

  return <div
    {...bindings.root}
    className={cls}
    style={{
      flexDirection: 'row',
    }}>
    <div style={{ display: 'flex' }}>
      {mode === 'edit' && <GripVertical className="node-handle" ref={bindings.handleRef} onContextMenu={bindings.onContextMenu} />}
    </div>
    <FullHeight>
      {mode === 'edit'
        ? children
        : (source[self.widget.field] || []).map((item: IResource) => (
          <ObjectItem key={item._id}>
            {childrenNodes.map(child => (
              <NodeWrapper key={child._id} self={child} setNodeField={setNodeField} source={source} setDataField={setDataField} onContextMenu={bindings.onContextMenu} />
            ))}
          </ObjectItem>
        ))}
    </FullHeight>
  </div>
}