import { IAuto, IBaseComponent } from '@/types/component'
import styled from 'styled-components'
import { Component } from '../auto'
import { Observer } from 'mobx-react'
import { useEffectOnce } from 'react-use'
import NatureSortable from '@/components/NatureSortable'
import { ComponentWrap } from '../style';
import store from '@/store'

const Wrap = styled.div`
  display: flex;
  flex-direction: row;
  align-items: center;
  align-content: center;
  overflow-x: auto;
  &::-webkit-scrollbar {
    display: none;
  }
`
const Row = styled.div`
  display: flex;
  align-items: flex-start;
`

export default function CFilterRow({ self, mode, drag, dnd, children, ...props }: IAuto & IBaseComponent) {
  useEffectOnce(() => {
    self.children.forEach(child => {
      if (child.attrs.selected) {
        child.setAttr('$selected', true)
      }
    })
  })
  return <Observer>
    {() => (
      <ComponentWrap key={self.children.length}
        className={mode + drag.className}
        {...drag.events}
        ref={dnd?.ref}
        {...dnd?.props}
        style={{
          overflowX: 'auto',
          ...dnd?.style,
          backgroundColor: dnd?.isDragging ? 'lightblue' : '',
        }}
      >
        {children}
        <NatureSortable
          style={{ alignItems: 'center' }}
          items={self.children}
          direction='horizontal'
          disabled={mode === 'preview' || store.component.can_drag_id !== self._id}
          droppableId={self._id}
          sort={self.swap}
          wrap={Row}
          renderItem={({ item, dnd }) => (
            <Component
              self={item}
              mode={mode}
              dnd={dnd}
              {...props}
            />
          )}
        />
      </ComponentWrap>
    )}
  </Observer>
}