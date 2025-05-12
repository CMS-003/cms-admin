import { IAuto, IBaseComponent } from '@/types/component'
import styled from 'styled-components'
import Acon, { Icon } from '@/components/Acon'
import { Component } from '../auto'
import { Observer } from 'mobx-react'
import NatureSortable from '@/components/NatureSortable'
import { ComponentWrap } from '../style';
import { FullWidth } from '@/components/style'
import store from '@/store'

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
    <ComponentWrap
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
      <div style={{ flexDirection: self.attrs.layout === 'horizontal' ? 'row' : 'column' }}>
        <MenuItem className={mode}>
          <FullWidth>
            <Acon icon={self.icon as Icon} style={{ marginRight: 5 }} />{self.title}
          </FullWidth>
        </MenuItem>
        <NatureSortable
          items={self.children}
          direction='vertical'
          disabled={mode === 'preview' || store.component.can_drag_id !== self._id}
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
    </ComponentWrap>
  )}</Observer>
}