import styled from 'styled-components'

export const TemplateBox = styled.div`
  height: 100%;
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
export const EditWrap = styled.div`
  position: relative;
  flex: 1;
  width: 100%;

  &.preview > div {
    height: 100%;
  }
  // 为拖拽handler提供位置
  &.edit {
    padding-left: 20px;
  }
  // 鼠标悬浮时显示整个组件的形状和handler
  &.edit.hover {
    border: 1px dashed #df3540;
    &>div.hover {
      visibility: visible;
      background-color: #cc000040;
      &::after {
        height: 100%;
        content: '';
        margin-right: -1px;
        border-right: 1px dashed #df3540;
        z-index: 2;
      }    
    }
  }
  // 显示组件位置的四个角定位
  &.edit .coner {
    position: absolute;
    z-index: 2;
    width: 2px;
    height: 2px;
    border-style: solid;
    border-color: #df3540;
    visibility: hidden;
  }
  &.focus > .coner {
    border-color: #1890ff;
  }
  &.focus > .coner {
    visibility: visible;
  }
  &.edit.hover > .coner {
    border-color: #df3540;
  }
  &.edit.hover > .coner {
    visibility: visible;
  }
  // 被删除组件的背景
  &.delete {
    background: repeating-linear-gradient(
      45deg, 
      gray 0px, 
      gray 10px, 
      white 10px, 
      white 20px
    );
    background-clip: padding-box;
    opacity: 0.6;
  }
  border: 1px dashed transparent;

  // 编辑状态形状显示为蓝色
  &.focus {
    border-color: #1890ff;
  }
  &.dragover {
    background-color: #7cd77f;
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
  bottom: 0px;
  top: 0px;
  visibility: hidden;
  cursor: move !important;
  display: flex; 
  align-items: center;
  height: 100%;
`;