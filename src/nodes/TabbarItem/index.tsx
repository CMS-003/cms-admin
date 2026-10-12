import { IBaseCom } from "@/types";
import { GripVertical } from "lucide-react";
import styled from 'styled-components'

export const TabItemWrap = styled.div`
  height: 100%;
  width: 100%;
  &.delete {
    background-color: #333;
  }
  
  &.focus {
    border-color: #1890ff;
  }
  &.dragover {
    background-color: #ded200;
  }
  &.cantdrag {
    background-color: #df3540;
  }
`

export default function CTabbarItem({ self, bindings, special = false, children }: IBaseCom & { special?: boolean }) {
  const cls = ['node', bindings.isDragging ? 'is-dragging' : '',].join(' ');
  return <div
    {...bindings.root}
    className={cls}
    style={{
      flexDirection: special ? 'row' : 'column', height: '100%',
    }}>
    {special
      ? <><GripVertical className="node-handle" ref={bindings.handleRef} onContextMenu={bindings.onContextMenu} /> {self.title}</>
      : <TabItemWrap>
        {children}
      </TabItemWrap>
    }
  </div>
}
