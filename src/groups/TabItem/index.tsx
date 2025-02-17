import { IAuto } from "@/types"
import { Observer, useLocalStore } from 'mobx-react'
import styled from 'styled-components'
import store from '@/store'
import { Component } from "../auto"

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
export default function TabItem({ self, mode, page, drag, source, setSource, children }: IAuto) {
  const local = useLocalStore(() => ({
    isDragOver: false,
    onDrop: (e: any) => {
      e.preventDefault();
      e.stopPropagation();
      local.isDragOver = false;
      if (store.component.canDrop(store.app.dragingType, self.type)) {
        self.appendChild(store.app.dragingType)
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
      <TabItemWrap
        className={`${mode} ${drag?.classNames}`}
        onDragOver={local.onDragOver}
        onDragLeave={local.onDragLeave}
        onDrop={local.onDrop} >
        {children}
        {self.children.map((child, index) => <Component mode={mode} page={page} self={child} key={index} source={source} setSource={setSource} setParentHovered={drag?.setIsMouseOver} />)}
      </TabItemWrap>
    )}
  </Observer>
}