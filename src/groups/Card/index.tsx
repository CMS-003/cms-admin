import { IComponent } from '@/types/component'
import Acon from '@/components/Acon'
import { Observer, useLocalObservable } from 'mobx-react'
import styled from 'styled-components'
import { Center } from '@/components/style'
import ResourceModal from '@/components/ResourceModal'
import { IResource } from '@/types/resource'
import _ from 'lodash'
import { Fragment } from 'react'
import { Image } from 'antd'

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
  padding: 10px;
`
const ScrollWrap = styled.div`
  display: flex;
  flex: 1;
  flex-wrap: nowrap;
  align-items: flex-start;
  justify-content: flex-start;
  overflow-x: auto;
  box-sizing: border-box;
  height: 100%;
  &::-webkit-scrollbar {
    display: none;
  }
  &>div:first-child {
    margin-left: 0;
  }
`;
const ItemWrap = styled.div`
  width: 150px;
  display: flex;
  flex-direction: column;
  height: 150px;
  margin-left: 10px;
`

const ItemTitle = styled.div`
  overflow: hidden; 
  text-overflow: ellipsis; 
  display: -webkit-box; 
  -webkit-box-orient: vertical; 
  -webkit-line-clamp: 2;
  height: 34px;
  line-height: 1.2;
  margin: 5px 0;
`
export default function ComponentCard({ self, mode, children }: { self: IComponent, mode: string, children?: any }) {
  const local = useLocalObservable(() => ({
    show: false,
    close() {
      local.show = false;
    },
    open() {
      local.show = true;
    }
  }))
  return <Observer>{() => (
    <div style={Object.fromEntries(self.style)}>
      <Header>
        {self.title}
      </Header>
      <Content>
        <ScrollWrap>
          {self.resources?.map(item => (<Fragment key={item._id}>
            <ItemWrap>
              <div style={{ width: 150, height: 120, backgroundImage: `url(${"https://u67631x482.vicp.fun" + (item.cover || '/images/poster/nocover.jpg')})`, backgroundSize: 'cover', backgroundPosition: 'center center' }}></div>
              <ItemTitle >{item.title}</ItemTitle>
            </ItemWrap>
          </Fragment>))}
        </ScrollWrap>
      </Content>
      {local.show && <ResourceModal onClose={() => {
        local.close()
      }} onAdd={(d: IResource) => {
        self.addResource(_.pick(d, ['_id', 'title', 'cover']))
      }} />}
      {mode === 'edit' && <Center style={{ marginTop: 5 }} onClick={() => {
        local.open()
      }}>
        添加资源<Acon icon='PlusOutlined' />
      </Center>}
    </div>
  )
  }</Observer >
}