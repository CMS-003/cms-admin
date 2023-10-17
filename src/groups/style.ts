import styled from 'styled-components'

export const TemplateBox = styled.div`
  min-height: 300px;
  &.dragover {
    background-color: #ded200
  }
`
export const EditWrap = styled.div`
  position: relative;
  flex: 1;
  width: 100%;

  &.preview > div {
    height: 100%;
  }
  &.edit {
    padding: 5px 5px 5px 15px;
  }
  &.edit:hover {
    box-shadow: inset rgb(41, 172, 233) 0px 0px 8px 0px;
  }
  &.edit:hover > div {
    visibility: visible;
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

export const Handler = styled.div`
  position: absolute;
  left: -3px;
  top: -7px;
  visibility: hidden;
`;