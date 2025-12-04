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

export const ComponentWrap = styled.div`
  position: relative;
  box-sizing: border-box;
  flex-direction: row;
  display: flex;
  // align-items: center;
  // justify-content: center;
  flex: 1 1 100%; // 个组件自己控制默认值

  &::-webkit-scrollbar {
    display: none;
  }
  &.edit {
    display: flex;
    flex-direction: row;
  }
  &.edit::before {
    content: '';
    padding-left: 20px !important;
    height: 32px;
  }
  /* 预览模式全部隐藏 */
  &.preview>.line,&.preview>.coner {
    display: none;
  }
  /* 边线 */
  &.edit > .line {
    position: absolute;
    z-index: 22;
    visibility: hidden;
    border: 0 dashed transparent;
  }
  &.edit.focus > .line {
    border-color: #1890ff;
    visibility: visible;
  }
  &.edit.hover > .line {
    border-color: #df3540;
    visibility: visible;
    z-index: 22;
  }
  /* 边角 */
  &.edit > .coner {
    position: absolute;
    z-index: 22;
    width: 2px;
    height: 2px;
    border-style: solid;
    visibility: hidden;
  }
  &.edit.focus > .coner {
    border-color: #1890ff;
    visibility: visible;
  }
  &.edit.hover > .coner {
    border-color: #df3540;
    visibility: visible;
  }

  /* 删除 */
  &.delete {
    background: repeating-linear-gradient(45deg,
      gray 0px,
      gray 10px,
      white 10px,
      white 20px);
    background-clip: padding-box;
    opacity: 0.6;
  }

  /* 拖入判定: 允许 */
  &.edit.dragover {
    background-color: #7cd77f;
  }
  /* 拖入判定: 拒绝 */
  &.edit.cantdrag {
    background-color: #df3540;
  }
`

export const Handler = styled.div`
  position: absolute;
  z-index: 22;
  left: 0px;
  bottom: 0px;
  top: 0px;
  visibility: visible;
  opacity: 0.15;
  cursor: move !important;
  display: flex; 
  align-items: center;
  height: 100%;

  /* 预览模式全部隐藏 */
  .component.preview > & {
    display: none;
  }
  /* 编辑模式 */
  .component.edit > &::after {
    height: 100%;
    content: '';
    margin-right: -1px;
    border-right: 1px dashed transparent;
    z-index: 22;
  }

  /* 进入编辑: 变蓝 */
  .component.edit.focus > & {
    opacity: 1;
    background-color: #1890ff40;
    &::after {
      border-right-color: #1890ff;
    }
  }
  /* 鼠标浮空: 变红 */
  .component.edit.hover > & {
    opacity: 1;
    background-color: #cc000040;
    &::after {
      border-right-color: #df3540;
    }
  }
`;
export const LineL = styled.span`
  left: 0;
  top: 0;
  height: 100%;
  width: 0;
  border-left-width: 1px !important;
  z-index: 22;
`;
export const LineT = styled.span`
  left: 0;
  top: 0;
  width: 100%;
  height: 0;
  border-top-width: 1px !important;
  z-index: 22;
`;
export const LineR = styled.span`
  right: 0;
  top: 0;
  height: 100%;
  width: 0;
  border-right-width: 1px !important;
  z-index: 22;
`;
export const LineB = styled.span`
  left: 0;
  bottom: 0;
  width: 100%;
  height: 0;
  border-bottom-width: 1px !important;
  z-index: 22;
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
  display: flex;
  flex-direction: column;
  gap: 5px;
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
