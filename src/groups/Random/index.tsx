
import { IComponent } from '@/types/component'
import { Observer } from 'mobx-react'
import styled from 'styled-components'
import { SyncOutlined } from '@ant-design/icons'

const Header = styled.div`
 font-weight: 600;
 font-size: 16px;
 padding: 5px;
 color: #555;
`
const Content = styled.div`
  min-height: 150px;
  border-radius: 10px;
  background-color: #eee;
`
export default function ComponentCard({ self, mode, children }: { self: IComponent, mode: string, children?: any }) {
  return <Observer>{() => (
    <div style={Object.fromEntries(self.style)}>
      <Header>
        {self.title}
      </Header>
      <Content>

        <div style={{ textAlign: 'center', padding: '5px 0' }}><SyncOutlined /></div>
      </Content>
    </div>
  )
  }</Observer >
}