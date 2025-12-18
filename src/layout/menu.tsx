import { Menu } from 'antd';
import { FC, useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom'
import Acon from '@/components/Acon';
import store from '@/store'
import { Observer } from 'mobx-react';
import styled from 'styled-components';

const keyPathMap: { [key: string]: string } = {}
const pathKeyMap: { [key: string]: string } = {}
const NoScrollbar = styled.div`
  flex: 1;
  overflow: auto;
  &::scroll-bar {
    display: none;
  }
  &::-webkit-scrollbar {
    display: none;
  }
`

function transform(tree: any, collapsed = true) {
  if (!tree) {
    return [];
  }
  const path = process.env.PUBLIC_URL + tree.attrs.path
  const node: any = { label: tree.title, key: path || tree._id, children: [] }
  keyPathMap[node.key] = path
  pathKeyMap[path] = node.key
  node.icon = <Acon icon={tree.icon} style={{ marginRight: 5 }} />
  if (collapsed) {
    node.label = null;
  }
  if (tree.children && tree.children.length) {
    node.children = tree.children.filter((item: any) => item.status === 1).map((item: any) => transform(item, false))
  }
  if (!node.children || node.children.length === 0) {
    delete node.children
  }
  return node;
}

const MENU: FC<{ tree: any, collapsed: boolean, flag: number }> = (props: { tree: any, collapsed: boolean, flag: number }) => {
  const navigate = useNavigate()
  const location = useLocation()
  const [tree, setTree] = useState([])
  const [selectedKey, setKey] = useState(location.pathname + location.search)
  useEffect(() => {
    setTree(transform(props.tree, props.collapsed).children)
  }, [props.collapsed, props.flag])
  useEffect(() => {
    // 路由变化自动选中菜单
    if (pathKeyMap[location.pathname + location.search]) {
      setKey(pathKeyMap[location.pathname + location.search])
    }
  }, [location.pathname, location.search])
  return <Observer>{() => (
    <NoScrollbar>
      <Menu
        defaultSelectedKeys={[selectedKey]}
        selectedKeys={[selectedKey]}
        defaultOpenKeys={store.router.openedMenu}
        mode="inline"
        theme="dark"
        items={tree}
        onClick={(e: any) => {
          navigate(keyPathMap[e.key])
        }}
        onOpenChange={keys => {
          store.router.setOpenedMenu(keys);
        }}
      />
    </NoScrollbar>
  )}</Observer>;
};

export default MENU;