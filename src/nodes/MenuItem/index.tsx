import { Acon } from "@/components";
import { FullWidth } from "@/components/style";
import { IBaseCom } from "@/types";
import { GripVertical } from "lucide-react";
import styled from 'styled-components'

const MenuItem = styled.div`
  color: #333;
  cursor: pointer;
  padding: 10px;
  &:hover {
    background-color: ${props => props.className === 'edit' ? 'transparent' : '#71ace3'};
  }
`

export default function CMenuItem({ self, bindings, mode, children }: IBaseCom) {
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
        {mode === 'edit' && <GripVertical className="node-handle" {...bindings.handle.listeners} {...bindings.handle.attributes} />}<Acon icon={self.icon} style={{ marginRight: 5 }} />{self.title}
      </FullWidth>
    </MenuItem>
    <div className="child" style={{ paddingLeft: 40, }}>
      {children}
    </div>
  </div>
}