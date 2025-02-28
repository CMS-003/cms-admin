import styled from 'styled-components'

export const TemplateBox = styled.div`
  height: 100%;
  display: flex;
  &.edit.dragover {
    background-color: #55a558;
  }
  &.preview.dragover {
    background-color: #df3540;
  }
  &.cantdrag {
    background-color: #df3540;
  }
`

export const Handler = styled.div`
  position: absolute;
  z-index: 9;
  left: 0px;
  bottom: 0px;
  top: 0px;
  visibility: visible;
  opacity: 0.15;
  cursor: move !important;
  display: flex; 
  align-items: center;
  height: 100%;
`;
export const LineL = styled.span`
  left: 0;
  top: 0;
  height: 100%;
  width: 0;
  border-left-width: 1px !important;
`;
export const LineT = styled.span`
  left: 0;
  top: 0;
  width: 100%;
  height: 0;
  border-top-width: 1px !important;
`;
export const LineR = styled.span`
  right: 0;
  top: 0;
  height: 100%;
  width: 0;
  border-right-width: 1px !important;
`;
export const LineB = styled.span`
  left: 0;
  bottom: 0;
  width: 100%;
  height: 0;
  border-bottom-width: 1px !important;
`;

export const ConerLT = styled.span`
  left: 1px;
  top: 1px;
  border-width: 0 1px 1px 0;
`

export const ConerRT = styled.span`
  right: 1px;
  top: 1px;
  border-width: 0 0 1px 1px;
`

export const ConerLB = styled.span`
  left: 1px;
  bottom: 1px;
  border-width: 1px 1px 0 0;
`

export const ConerRB = styled.span`
  right: 1px;
  bottom: 1px;
  border-width: 1px 0 0 1px;
`

// 属性编辑部分
export const EditItem = styled.div`
  margin-bottom: 8px;
  padding: 0 8px;
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
