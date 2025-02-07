import styled from 'styled-components'

export const TemplateBox = styled.div`
  height: 100%;
  &.edit.dragover {
    background-color: #ded200
  }
  &.preview.dragover {
    background-color: #aaa;
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
    padding: 5px 5px 5px 5px;
  }
  &.edit.hover {
    // box-shadow: inset rgb(198 202 204) 3px 4px 10px 4px;
  }
  &.edit.hover > div {
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
  left: -4px;
  top: 4px;
  visibility: hidden;
`;