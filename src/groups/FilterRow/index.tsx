import { IComponent } from '@/types/component'
import styled from 'styled-components'
import { Component } from '../auto'
import { PlusCircleOutlined } from '@ant-design/icons'
import SortList from '@/components/SortList'
import { Observer } from 'mobx-react'
import { ScrollWrap } from '../style'

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

export default function ComponentFilterRow({ self, mode, children }: { self: IComponent, mode: string, children?: any }) {
  return <Observer>
    {() => (
      <Wrap key={self.children.length}>
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
            renderItem={({ item, handler }: { item: IComponent, handler: HTMLObjectElement }) => <Component mode={mode} handler={handler} self={item} key={item._id} />}
          />
          <PlusCircleOutlined onClick={() => {
            self.appendChild('FilterTag')
          }} />
        </div> : (
          <ScrollWrap>
            {self.children.map(child => <Component self={child} mode={mode} key={child._id} />)}
          </ScrollWrap>
        )}
      </Wrap>
    )}
  </Observer>
}