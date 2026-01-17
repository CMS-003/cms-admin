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
const ContextMenu = observer(({ setEditComponent }: { setEditComponent: Function }) => (
  <Menu id='group_menu'>
    <ContextMenuItem style={{ color: "purple" }} onClick={async (e: any) => {
      switch (e.event.target.getAttribute('data-action')) {
        case 'add':
          if (e.props.accepts.length === 1) {
            events.emit('add_component', e.props._id, e.props.accepts[0])
          }
          break;
        case 'edit':
          setEditComponent(e.props, 'base');
          break;
        case 'copy':
          events.emit('copy_component', e.props._id)
          break;
        case 'paste':
          navigator.clipboard.readText()
            .then((text) => {
              events.emit('paste_component', text, e.props._id, e.props.template_id)
            })
            .catch(err => {
              console.error('读取失败:', err);
            });
          break;
        default: break;
      }
    }}>
      <AlignAround style={{ width: '100%', }}>
        <ActionItem data-action='edit'>编辑</ActionItem>
        <ActionItem data-action='copy'>复制</ActionItem>
        <ActionItem data-action='paste'>粘贴</ActionItem>
        <ActionItem data-action='add'>添加子组件</ActionItem>
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