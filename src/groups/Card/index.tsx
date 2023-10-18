import { IComponent } from '@/types/component'
import { Observer } from 'mobx-react'
import styled from 'styled-components'

const Header = styled.div`
 font-weight: 600;
 font-size: 18px;
 padding: 5px;
`
const Content =styled.div`
  min-height: 150px;
  border-radius: 10px;
  background-color: #eee;
`
export default function ComponentFilterTag({ self, mode, children }: { self: IComponent, mode: string, children?: any }) {
  return <Observer>{() => (
    <div>
      <Header>
        {self.title}
      </Header>
      <Content>

      </Content>
    </div>
  )}</Observer>
}