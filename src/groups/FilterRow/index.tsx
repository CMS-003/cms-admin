import { IAuto, IBaseComponent } from '@/types/component'
import styled from 'styled-components'
import { Component } from '../auto'
import Acon from '@/components/Acon'
import SortList from '@/components/SortList'
import { Observer } from 'mobx-react'
import { ScrollWrap } from '../style'
import { useEffectOnce } from 'react-use'
import NatureSortable from '@/components/NatureSortable'

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
      if (child.attrs.get('selected')) {
        child.setAttr('$selected', true)
      }
    })
  })
  return <Observer>
    {() => (
      <Wrap key={self.children.length}
        className={mode + drag.className}
        {...drag.events}
        ref={dnd?.ref}
        {...dnd?.draggableProps}
        {...dnd?.dragHandleProps}
        style={{
          ...dnd?.style,
        }}
      >
        {children}
        <NatureSortable
          items={self.children}
          direction='horizontal'
          droppableId={self._id}
          sort={self.swap}
          wrap={Row}
          renderItem={({ item, dnd }) => (
            <Component
              self={item}
              mode={mode}
              dnd={dnd}
              {...props}
              setParentHovered={drag?.setIsMouseOver}
            />
          )}
        />
      </Wrap>
    )}
  </Observer>
}