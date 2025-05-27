import { IAuto, IBaseComponent } from '@/types/component'
import { Observer } from 'mobx-react';
import { ComponentWrap } from '../style';
import styled from 'styled-components';
import { chunk } from 'lodash';
import { Component } from '../auto';

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

export default function CHotArea({ self, mode, children, drag, dnd, ...props }: IAuto & IBaseComponent) {
  return <Observer>{() => (
    <ComponentWrap
      className={mode + drag.className}
      {...drag.events}
      ref={dnd?.ref}
      {...dnd?.props}
      style={{
        flex: 0,
        ...dnd?.style,
        backgroundColor: dnd?.isDragging ? 'lightblue' : '',
      }}
    >
      {children}
      <Area>
        {self.title && <Title>{self.title}</Title>}
        <Content>
          {chunk(self.children, self.attrs.columns || 1).map((rows, i) => (
            <Row key={i}>
              {rows.map(child => (
                <Component
                  key={child._id}
                  self={child}
                  mode={mode}
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