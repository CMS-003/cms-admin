import { IAuto, IBaseComponent } from "@/types"
import { Observer, useLocalObservable } from 'mobx-react'
import styled from 'styled-components'
import store from '@/store'
import { Component } from "../auto"
import { ComponentWrap } from '../style';

export const TabItemWrap = styled.div`
  height: 100%;
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
export default function TabItem({ self, mode, drag, children, ...props }: IAuto & IBaseComponent) {
  const local = useLocalObservable(() => ({
    isDragOver: false,
    onDrop: (e: any) => {
      e.preventDefault();
      e.stopPropagation();
      local.isDragOver = false;
      if (store.component.canDrop(store.component.dragingType, self.type)) {
        self.appendChild(store.component.dragingType)
      }
    },
    onDragLeave: () => {
      local.isDragOver = false;
    },
    onDragOver: (e: any) => {
      e.preventDefault();
      e.stopPropagation();
      if (!local.isDragOver) {
        local.isDragOver = true;
      }
    }
  }))
  return <Observer>
    {() => (
      <ComponentWrap
        className={mode + drag.className}
        onDragOver={local.onDragOver}
        onDragLeave={local.onDragLeave}
        onDrop={local.onDrop}>
        {/* {children} */}
        <TabItemWrap>
          {self.children.map((child, index) => <Component mode={mode} self={child} key={index}{...props} />)}
        </TabItemWrap>
      </ComponentWrap>
    )}
  </Observer>
}