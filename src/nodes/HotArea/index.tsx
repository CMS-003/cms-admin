import { IBaseCom } from "@/types";
import { GripVertical } from "lucide-react";
import styled from 'styled-components'
import { NodeWrapper } from "@/composer/NodeWrapper";
import { chunk } from "lodash-es";

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

export default function CHotArea({ self, bindings, source, setDataField, mode, page, children }: IBaseCom) {
  const cls = ['node', bindings.isDragging ? 'is-dragging' : '',].join(' ');

  return <div
    {...bindings.root}
    className={cls}
    style={{
      flexDirection: 'row',
    }}>
    {mode === 'edit' && <GripVertical className="node-handle" {...bindings.handle.listeners} {...bindings.handle.attributes} />}
    <Area>
      {self.title && <Title>{self.title}</Title>}
      <Content>
        {chunk(self.children, self.attrs.columns || 1).map((rows, i) => (
          <Row key={i}>
            {rows.map(child => (
              <NodeWrapper
                key={child._id}
                self={child}
                source={{}}
                setDataField={() => { }}
              />
            ))}
          </Row>
        ))}
      </Content>
    </Area>
  </div>
}