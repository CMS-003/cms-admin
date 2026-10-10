import { IBaseCom } from "@/types";
import { GripVertical } from "lucide-react";
import Acon from '@/components/Acon'
import styled from 'styled-components'
import { FullHeight } from '@/components/style'

const Header = styled.div`
 font-weight: 600;
 font-size: 16px;
 padding: 5px;
 color: #555;
`
const Wrap = styled.div`
border-radius: 10px;
background-color: #fff;
`
const Content = styled.div`
  min-height: 120px;
`
export default function CPickCard({ self, actions, bindings, source, mode, page, children }: IBaseCom) {
  const cls = ['node', bindings.isDragging ? 'is-dragging' : '',].join(' ');

  return <div
    {...bindings.root}
    className={cls}
    style={{
      flexDirection: 'row',
    }}>
    {mode === 'edit' && <GripVertical className="node-handle" ref={bindings.handleRef} onContextMenu={bindings.onContextMenu} />}
    <FullHeight style={{ flex: 1 }}>
      <Header>
        {self.title}
      </Header>
      <Wrap>
        <Content>

        </Content>
        <div style={{ textAlign: 'center', padding: '5px 0' }}><Acon icon='RefreshCw' /></div>
      </Wrap>
    </FullHeight>
  </div>
}