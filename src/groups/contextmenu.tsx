import { observer } from "mobx-react"
import { Menu, Item as ContextMenuItem } from 'react-contexify';
import { IComponent, } from '@/types'
import events from '@/utils/event';

// 编辑中组件的右键菜单
const ContextMenu = observer(({ setEditComponent, copyComponent, pasteComponent }: { setEditComponent: Function, copyComponent: Function, pasteComponent: Function }) => (
  <Menu id='group_menu'>
    <ContextMenuItem onClick={async (e: any) => {
      setEditComponent(e.props, 'base');
    }}>编辑</ContextMenuItem>
    <ContextMenuItem onClick={async (e: any) => {
      copyComponent(e.props._id)
    }}>复制</ContextMenuItem>
    <ContextMenuItem onClick={async (e: any) => {
      pasteComponent(e.props._id)
    }}>粘贴</ContextMenuItem>
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
    {/* <ContextMenuItem onClick={(e: any) => {
      // ComponentItem.create({})
      e.props.appendChild('type')
      store.component.setEditComponentId(e.props._id);
      local.editComponent = e.props
    }}>添加子视图</ContextMenuItem> */}
  </Menu>
))

export default ContextMenu;