import { IComponent } from '@/types/component'
import styled from 'styled-components'
import { Component } from '../auto'
import Acon from '@/components/Acon'
import SortList from '@/components/SortList'
import { Observer } from 'mobx-react'
import { ScrollWrap } from '../style'
import { useEffectOnce } from 'react-use'
import NatureSortable from '@/components/NatureSortable'
import { ReactElement } from 'react'

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

export default function ComponentFilterRow({ self, mode, children, setParentHovered }: { self: IComponent, mode: string, children?: any, setParentHovered?: Function }) {
  useEffectOnce(() => {
    self.children.forEach(child => {
      if (child.attrs.get('selected')) {
        child.setAttr('$selected', true)
      }
    })
  })
  return <Observer>
    {() => (
      <Wrap key={self.children.length}>
        {/* <NatureSortable
          droppableId={self._id}
          items={self.children}
          onDragEnd={(result) => {
            if (!result.destination) return;
            self.swap(result.source.index, result.destination.index)
          }}
          renderItem={({ item, isDragging, provided, index }) => {
            return <div
              key={index}
              ref={provided.innerRef}
              {...provided.draggableProps}
              {...provided.dragHandleProps}
              style={{
                background: isDragging ? "lightblue" : "",
                // 合并由react-beautiful-dnd提供的样式，避免覆盖拖拽动画样式
                ...provided.draggableProps.style,
                transform: provided.draggableProps.style?.transform?.replace(/,.+\)/, ",0)")
              }}
            >
              <Component mode={mode} self={item} key={item._id} setParentHovered={setParentHovered} />
            </div>
          }}
        >
          {() => ScrollWrap}
        </NatureSortable> */}
        {mode === 'edit' ? <div style={{ display: 'flex', alignItems: 'center' }}>
          <SortList
            sort={(oldIndex: number, newIndex: number) => {
              self.swap(oldIndex, newIndex);
            }}
            droppableId={self._id}
            items={self.children}
            itemStyle={{ display: 'flex', alignItems: 'center', }}
            mode={mode}
            direction={'horizontal'}
            renderItem={({ item, handler }: { item: IComponent, handler: HTMLObjectElement }) => <Component mode={mode} handler={handler} self={item} key={item._id} setParentHovered={setParentHovered} />}
          />
          <Acon icon='PlusCircleOutlined' onClick={() => {
            self.appendChild('FilterTag')
          }} />
        </div> : (
          <ScrollWrap>
            {self.children.map(child => <Component self={child} mode={mode} key={child._id}  {...({
              onSelect: (id: string) => {
                self.children.forEach(child => {
                  child.setAttr('$selected', child._id === id ? true : false)
                })
              }
            })} />)}
          </ScrollWrap>
        )}
      </Wrap>
    )}
  </Observer>
}