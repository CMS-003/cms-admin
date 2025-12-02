import { IAuto, IBaseComponent } from '@/types/component'
import Acon from '@/components/Acon'
import { Observer, useLocalObservable } from 'mobx-react'
import styled from 'styled-components'
import { Center, FullHeight } from '@/components/style'
import { Fragment } from 'react'
import store from '@/store'
import { ComponentWrap } from '../style';

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
export default function CCard({ self, mode, drag, children }: IAuto & IBaseComponent) {
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
    <ComponentWrap
      className={mode + drag.className}
      {...drag.events}
      style={{
        flex: 0,
      }}
    >
      {children}
      <FullHeight>
        <Header>
          {self.title}
        </Header>
        <Content>
          <ScrollWrap>
            {self.resources?.map(item => (<Fragment key={item._id}>
              <ItemWrap>
                <div style={{ width: 150, height: 120, backgroundImage: `url(${store.app.imageLine + (item.poster || item.thumbnail || '/images/poster/nocover.jpg')})`, backgroundSize: 'cover', backgroundPosition: 'center center' }}></div>
                <ItemTitle >{item.title}</ItemTitle>
              </ItemWrap>
            </Fragment>))}
          </ScrollWrap>
        </Content>
        {mode === 'edit' && <Center style={{ marginTop: 5 }} onClick={() => {
          local.open()
        }}>
          <Acon icon='CirclePlus' title='添加资源' />
        </Center>}
      </FullHeight>
    </ComponentWrap>
  )
  }</Observer >
}