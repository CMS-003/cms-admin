import { IAuto, IBaseComponent } from "@/types"
import { Observer } from 'mobx-react'
import styled from 'styled-components'
import { MemoComponent } from "../auto"
import { ComponentWrap } from '../style';

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
export default function TabItem({ self, drag, children, mode, page, ...props }: IAuto & IBaseComponent) {
  return <Observer>
    {() => (
      <ComponentWrap
        className={mode + drag.className}
        {...drag.events}
        style={{ minHeight: '100%' }}
      >
        <TabItemWrap>
          {self.children.map((child, index) => <MemoComponent self={child} key={index}{...props} />)}
        </TabItemWrap>
      </ComponentWrap>
    )}
  </Observer>
}