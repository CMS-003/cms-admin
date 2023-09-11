import styled from 'styled-components'

export const TemplateBox = styled.div`
  margin-top: 30px;
  padding: 10px;
  width: 400px;
  border: 1px solid #29ace9;
  box-shadow: #29ace9 4px 4px 16px 3px;
  min-height: 480px;
  &.focus {
    background-color: #29ace988
  }
`
export const EditWrap = styled.div`
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
    background-color: #29ace988;
  }
  &.cantdrag {
    background-color: red;
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