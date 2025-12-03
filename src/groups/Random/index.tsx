
import { IAuto, IBaseComponent } from '@/types/component'
import { Observer } from 'mobx-react'
import styled from 'styled-components'
import Acon from '@/components/Acon'
import { ComponentWrap } from '../style';
import { FullHeight } from '@/components/style';
import { useModeContext } from '../context';

const Header = styled.div`
 font-weight: 600;
 font-size: 16px;
 padding: 5px;
 color: #555;
`
const Wrap = styled.div`
border-radius: 10px;
background-color: #fff;
`
const Content = styled.div`
  min-height: 120px;
`
export default function CRandom({ self, drag, children, mode, page }: IAuto & IBaseComponent) {
  return <Observer>{() => (
    <ComponentWrap
      className={mode + drag.className}
      {...drag.events}
      style={{ flex: 0, }}
    >
      {children}
      <FullHeight style={{ flex: 1 }}>
        <Header>
          {self.title}
        </Header>
        <Wrap>
          <Content>

          </Content>
          <div style={{ textAlign: 'center', padding: '5px 0' }}><Acon icon='RefreshCw' /></div>
        </Wrap>
      </FullHeight>
    </ComponentWrap>
  )}</Observer >
}