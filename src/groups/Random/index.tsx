
import { IAuto, IBaseComponent } from '@/types/component'
import { Observer } from 'mobx-react'
import styled from 'styled-components'
import Acon from '@/components/Acon'

const Header = styled.div`
 font-weight: 600;
 font-size: 16px;
 padding: 5px;
 color: #555;
`
const Wrap = styled.div`
border-radius: 10px;
background-color: #eee;
`
const Content = styled.div`
  min-height: 120px;
`
export default function CRandom({ self, mode, drag, dnd, children }: IAuto & IBaseComponent) {
  return <Observer>{() => (
    <div
      className={mode + drag.className}
      {...drag.events}
      ref={dnd?.ref}
      {...dnd?.props}
      style={{ flex: 0, ...self.style, ...dnd?.style }}
    >
      {children}
      <Header>
        {self.title}
      </Header>
      <Wrap>
        <Content>

        </Content>
        <div style={{ textAlign: 'center', padding: '5px 0' }}><Acon icon='SyncOutlined' /></div>
      </Wrap>
    </div>
  )}</Observer >
}