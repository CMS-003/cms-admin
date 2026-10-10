import { IBaseCom } from "@/types";
import { GripVertical } from "lucide-react";
import styled from 'styled-components'
import { NodeWrapper } from "@/composer/NodeWrapper";
import { chunk } from "lodash-es";
import { useMode } from "@/context";

const Area = styled.div`
  display: flex;
  flex-direction: column;
  flex: 1;
`
const Title = styled.div`

`
const Content = styled.div`
  min-height: 30px;
  flex: 1;
`
const Row = styled.div`
  display: flex;
  flex-direction: row;
  align-items: center;
  justify-content: space-around;
`

export default function CHotArea({ self, bindings, childrenNodes }: IBaseCom) {
  const mode = useMode();
  const cls = ['node', bindings.isDragging ? 'is-dragging' : '',].join(' ');

  return <div
    {...bindings.root}
    className={cls}
    style={{
      flexDirection: 'row',
    }}>
    {mode === 'edit' && <GripVertical className="node-handle" ref={bindings.handleRef} onContextMenu={bindings.onContextMenu} />}
    <Area>
      {self.title && <Title>{self.title}</Title>}
      <Content>
        {chunk(childrenNodes, self.attrs.columns || 1).map((rows, i) => (
          <Row key={i}>
            {rows.map(child => (
              <NodeWrapper key={child._id} self={child} onContextMenu={bindings.onContextMenu} />
            ))}
          </Row>
        ))}
      </Content>
    </Area>
  </div>
}
