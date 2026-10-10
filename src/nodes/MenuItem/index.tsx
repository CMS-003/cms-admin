import { Acon } from "@/components";
import { FullWidth } from "@/components/style";
import { IBaseCom } from "@/types";
import { GripVertical } from "lucide-react";
import styled from 'styled-components'
import { useMode } from "@/context";

const MenuItem = styled.div`
  color: #333;
  cursor: pointer;
  padding: 10px;
  &:hover {
    background-color: ${props => props.className === 'edit' ? 'transparent' : '#71ace3'};
  }
`

export default function CMenuItem({ self, bindings, children }: IBaseCom) {
  const mode = useMode();
  const cls = ['node', bindings.isDragging ? 'is-dragging' : '',].join(' ');
  return <div
    {...bindings.root}
    className={cls}
    style={{
      flexDirection: 'column',
    }}>
    <div style={{ display: 'flex' }}>

    </div>
    <MenuItem className={mode}>
      <FullWidth>
        {mode === 'edit' && <GripVertical className="node-handle" ref={bindings.handleRef} onContextMenu={bindings.onContextMenu} />}<Acon icon={self.icon} style={{ marginRight: 5 }} />{self.title}
      </FullWidth>
    </MenuItem>
    <div className="child" style={{ paddingLeft: 40, }}>
      {children}
    </div>
  </div>
}
