import { IComponent } from "@/types"
import { Observer, useLocalObservable } from 'mobx-react'
import styled from 'styled-components'
import store from '@/store'

export const TabItemWrap = styled.div`
  min-height: 300px;
  &.edit:hover {
    box-shadow: inset rgb(41, 172, 233) 0px 0px 8px 0px;
  }
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
export default function TabItem({ self, mode, children }: { self: IComponent, mode: string, children?: any }) {
  const local = useLocalObservable(() => ({
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
      mode === 'edit' ? <TabItemWrap
        className={`${mode} ${self.status === 0 ? 'delete' : ''} ${store.app.editing_component_id === self._id ? 'focus' : ''} ${store.app.dragingType && local.isDragOver ? (store.component.canDrop(store.app.dragingType, self.type) ? 'dragover' : 'cantdrag') : ''}`}
        onDragOver={local.onDragOver}
        onDragLeave={local.onDragLeave}
        onDrop={local.onDrop} >
        {children}
      </TabItemWrap> : children
    )}
  </Observer>
}