import styled from 'styled-components'

export const TemplateBox = styled.div`
  &.dragover {
    background-color: #ded200
  }
`
export const EditWrap = styled.div`
  flex: 1;
  &.edit {
    padding: 5px;
    box-shadow: inset rgb(41, 172, 233) 0px 0px 8px 0px;
  }
  &.delete {
    background-color: #333;
  }
  border: 2px dashed transparent;
  &.focus {
    border-color: #1890ff;
  }
  &.dragover {
    background-color: #ded200;
  }
  &.cantdrag {
    background-color: #df3540;
  }
`;

export const EditItem = styled.div`
  margin: 8px 0;
`

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