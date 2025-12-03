import { IAuto, IBaseComponent } from '@/types/component'
import styled from 'styled-components'
import { MemoComponent } from '../auto'
import { Observer } from 'mobx-react'
import { useEffectOnce } from 'react-use'
import { ComponentWrap } from '../style';
import store from '@/store'
import { SortDD } from '@/components/SortableDD'

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

export default function CFilterRow({ self, drag, children, mode, page, ...props }: IAuto & IBaseComponent) {
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
        style={{
          alignItems: 'center',
          justifyContent:'center',
        }}
      >
        {children}
        <SortDD
          items={self.children.map(child => ({ id: child._id, data: child }))}
          direction='horizontal'
          disabled={mode === 'preview' || store.component.can_drag_id !== self._id}
          sort={self.swap}
          renderItem={(item: any) => (
            <MemoComponent
              self={item.data}
              {...props}
            />
          )}
        />
      </ComponentWrap>
    )}
  </Observer>
}