import { IAuto, IBaseComponent } from '@/types/component'
import styled from 'styled-components'
import Acon, { Icon } from '@/components/Acon'
import { Component } from '../auto'
import { Observer } from 'mobx-react'
import NatureSortable from '@/components/NatureSortable'

const MenuItem = styled.div`
  color: #333;
  cursor: pointer;
  padding: 10px;
  &:hover {
    background-color: ${props => props.className === 'edit' ? 'transparent' : '#71ace3'};
  }
`
export default function CMenuItem({ self, mode, drag, dnd, children, props }: IAuto & IBaseComponent) {
  return <Observer>{() => (
    <div
      className={mode + drag.className}
      {...drag.events}
      ref={dnd?.ref}
      {...dnd?.props}
      style={{
        ...dnd?.style,
        backgroundColor: dnd?.isDragging ? 'lightblue' : '',
      }}
    >
      {children}
      <MenuItem className={mode}><Acon icon={self.icon as Icon} style={{ marginRight: 5 }} />{self.title}</MenuItem>
      <div style={{ paddingLeft: 24 }}>
        <NatureSortable
          items={self.children}
          direction='vertical'
          droppableId={self._id}
          sort={self.swap}
          renderItem={({ item, dnd }) => (
            <Component
              self={item}
              mode={mode}
              dnd={dnd}
              {...props}
            />
          )}
        />
      </div>
    </div>
  )}</Observer>
}