import { IAuto, IBaseComponent } from '@/types/component'
import { Observer } from 'mobx-react';
import { ComponentWrap } from '../style';
import styled from 'styled-components';
import { chunk } from 'lodash-es';
import { MemoComponent } from '../auto';

const Area = styled.div`
  display: flex;
  flex-direction: column;
  flex: 1;
`
const Title = styled.div`

`
const Content = styled.div`
  min-height: 30px;
  flex: 1;
`
const Row = styled.div`
  display: flex;
  flex-direction: row;
  align-items: center;
  justify-content: space-around;
`

export default function CHotArea({ self, children, drag, mode, page, ...props }: IAuto & IBaseComponent) {
  return <Observer>{() => (
    <ComponentWrap
      className={mode + drag.className}
      {...drag.events}
      style={{
        flex: 0,
      }}
    >
      {children}
      <Area>
        {self.title && <Title>{self.title}</Title>}
        <Content>
          {chunk(self.children, self.attrs.columns || 1).map((rows, i) => (
            <Row key={i}>
              {rows.map(child => (
                <MemoComponent
                  key={child._id}
                  self={child}
                  source={{}}
                  setDataField={() => { }}
                />
              ))}
            </Row>
          ))}
        </Content>
      </Area>
    </ComponentWrap>
  )}</Observer>
}