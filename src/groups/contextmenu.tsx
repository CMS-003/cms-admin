import { observer } from "mobx-react"
import { Menu, Item as ContextMenuItem } from 'react-contexify';
import { IComponent, } from '@/types'
import events from '@/utils/event';
import { AlignAround } from "@/components/style";
import styled from "styled-components";

const ActionItem = styled.div`
  padding: 5px 8px;
  flex: 1;
  display: flex;
  align-item: center;
  justify-content: center;
  border-radius: 5px;
  &:hover {
    color: white;
    background-color: #63cdf7;
  }
`

// 编辑中组件的右键菜单
const ContextMenu = observer(({ setEditComponent, copyComponent, pasteComponent }: { setEditComponent: Function, copyComponent: Function, pasteComponent: Function }) => (
  <Menu id='group_menu'>

    <ContextMenuItem style={{ color: "purple" }} onClick={async (e: any) => {

      switch (e.event.target.getAttribute('data-action')) {
        case 'edit':
          setEditComponent(e.props, 'base');
          break;
        case 'copy':
          copyComponent(e.props._id)
          break;
        case 'paste':
          pasteComponent(e.props._id)
          break;
        default: break;
      }
    }}>
      <AlignAround style={{ width: '100%', }}>
        <ActionItem data-action='edit'>编辑</ActionItem>
        <ActionItem data-action='copy'>复制</ActionItem>
        <ActionItem data-action='paste'>粘贴</ActionItem>
      </AlignAround>
    </ContextMenuItem>
    <ContextMenuItem onClick={async (e: any) => {
      setEditComponent(e.props, 'widget');
    }}>控件</ContextMenuItem>
    <ContextMenuItem onClick={async (e: any) => {
      setEditComponent(e.props, 'data');
    }}>数据</ContextMenuItem>
    <ContextMenuItem onClick={async (e: any) => {
      setEditComponent(e.props, 'event');
    }}>事件</ContextMenuItem>
    <ContextMenuItem onClick={async (e: any) => {
      setEditComponent(e.props, 'layout');
    }}>布局</ContextMenuItem>
    <ContextMenuItem onClick={(e: { props?: IComponent }) => {
      if (e.props) {
        events && events.emit('remove_component', e.props._id);
      }
    }}>删除</ContextMenuItem>
  </Menu>
))

export default ContextMenu;