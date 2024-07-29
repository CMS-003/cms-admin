import { Menu } from 'antd';
import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom'
import Acon from '@/components/Acon';
import store from '@/store'
import { get } from 'lodash'
import { Observer } from 'mobx-react';

const keyPathMap: { [key: string]: string } = {}
const pathKeyMap: { [key: string]: string } = {}

export function transform(tree: any, collapsed = true) {
  if (!tree) {
    return [];
  }
  const path = tree.attrs.get('path')
  const node: any = { label: tree.title, key: path || tree._id, children: [] }
  keyPathMap[node.key] = path
  pathKeyMap[path] = node.key
  node.icon = <Acon icon={tree.icon} />
  if (collapsed) {
    node.label = null;
  }
  if (tree.children && tree.children.length) {
    node.children = tree.children.map((item: any) => transform(item, collapsed))
  } else {
    delete node.children
  }
  return node;
}

const MENU: React.FC<{ tree: any, collapsed: boolean, flag: number }> = (props: { tree: any, collapsed: boolean, flag: number }) => {
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
    <div style={{ flex: 1 }}>
      <Menu
        defaultSelectedKeys={[selectedKey]}
        selectedKeys={[selectedKey]}
        defaultOpenKeys={store.page.defaultOpened}
        mode="inline"
        theme="dark"
        items={tree}
        onClick={(e: any) => {
          navigate(keyPathMap[e.key])
        }}
      />
    </div>
  )}</Observer>;
};

export default MENU;