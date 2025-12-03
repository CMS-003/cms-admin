import { IAuto, IBaseComponent } from '@/types/component'
import styled from 'styled-components'
import Acon from '@/components/Acon'
import { MemoComponent } from '../auto'
import { Observer } from 'mobx-react'
import { ComponentWrap } from '../style';
import { FullWidth } from '@/components/style'
import store from '@/store'
import { SortDD } from '@/components/SortableDD'

const MenuItem = styled.div`
  color: #333;
  cursor: pointer;
  padding: 10px;
  &:hover {
    background-color: ${props => props.className === 'edit' ? 'transparent' : '#71ace3'};
  }
`
export default function CMenuItem({ self, drag, children, mode, page, ...props }: IAuto & IBaseComponent) {
  return <Observer>{() => (
    <ComponentWrap
      className={drag.className}
      {...drag.events}
    >
      {children}
      <div style={{ flexDirection: self.attrs.layout === 'horizontal' ? 'row' : 'column' }}>
        <MenuItem className={mode}>
          <FullWidth>
            <Acon icon={self.icon} style={{ marginRight: 5 }} />{self.title}
          </FullWidth>
        </MenuItem>
        <SortDD
          items={self.children.map(child => ({ id: child._id, data: child }))}
          direction='vertical'
          disabled={mode === 'preview' || store.component.can_drag_id !== self._id}
          sort={self.swap}
          renderItem={(item: any) => (
            <MemoComponent
              self={item.data}
              {...props}
            />
          )}
        />
      </div>
    </ComponentWrap>
  )}</Observer>
}