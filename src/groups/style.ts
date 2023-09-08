import styled from 'styled-components'

export const EditWrap = styled.div`
  &.delete {
    background-color: #333;
  }
  border: 2px dashed transparent;
  &.focus {
    border-color: #1890ff;
  }
  &.dragover {
    background-color: yellow;
  }
`; 

export const ScrollWrap = styled.div`
  display: flex;
  flex: 1;
  flex-wrap: nowrap;
  align-items: flex-start;
  justify-content: flex-start;
  overflow-x: auto;
  box-sizing: border-box;
  &::-webkit-scrollbar {
    display: none;
  }
`;