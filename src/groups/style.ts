import styled from 'styled-components'

export const TemplateBox = styled.div`
  height: 100%;
  &.edit.dragover {
    background-color: #55a558;
  }
  &.preview.dragover {
    background-color: #df3540;
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
    padding-left: 20px;
  }
  &.edit.hover {
    border: 1px dashed #df3540;
  }
  &.edit.hover > div {
    visibility: visible;
  }
  &.edit .coner {
    position: absolute;
    width: 2px;
    height: 2px;
    border-style: solid;
    border-color: #df3540;
    visibility: hidden;
  }
  &.focus > .coner {
    border-color: #1890ff;
  }
  &.edit.hover > .coner {
    border-color: #df3540;
  }
  &.focus > .coner, &.edit.hover > .coner {
    visibility: visible;
  }
  &.delete {
    background-color: #333;
  }
  border: 1px dashed transparent;
  &.focus {
    border-color: #1890ff;
  }
  &.dragover {
    background-color: green;
  }
  &.cantdrag {
    background-color: #df3540;
  }
`;
export const ConerLT = styled.span`
  left: 0;
  top: 0;
  border-width: 0 1px 1px 0;
`

export const ConerRT = styled.span`
  right: 0;
  top: 0;
  border-width: 0 0 1px 1px;
`

export const ConerLB = styled.span`
  left: 0;
  bottom: 0;
  border-width: 1px 1px 0 0;
`

export const ConerRB = styled.span`
  right: 0;
  bottom: 0;
  border-width: 1px 0 0 1px;
`

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
  left: 0px;
  top: 4px;
  cursor: move !important;
  visibility: hidden;
`;