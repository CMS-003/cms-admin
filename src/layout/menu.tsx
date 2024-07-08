import { Menu } from 'antd';
import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom'
import Acon from '@/components/Acon';
import store from '@/store'
import { get } from 'lodash'

const keyPathMap: { [key: string]: string } = {}
const pathKeyMap: { [key: string]: string } = {}

export function transform(tree: any) {
  if (!tree) {
    return [];
  }
  const path = tree.attrs.get('path')
  const node: any = { label: tree.title, key: path || tree._id, children: [] }
  keyPathMap[node.key] = path
  pathKeyMap[path] = node.key
  node.icon = <Acon icon={tree.icon} />
  if (tree.children && tree.children.length) {
    node.children = tree.children.map((item: any) => transform(item))
  } else {
    delete node.children
  }
  return node;
}

const MENU: React.FC<{ tree: any, flag: number }> = (props: { tree: any, flag: number }) => {
  const navigate = useNavigate()
  const location = useLocation()
  const [tree, setTree] = useState([])
  const [selectedKey, setKey] = useState(location.pathname)
  useEffect(() => {
    setTree(transform(props.tree).children)
  }, [props.flag])
  useEffect(() => {
    // 路由变化自动选中菜单
    if (pathKeyMap[location.pathname]) {
      setKey(pathKeyMap[location.pathname])
    }
  }, [location.pathname])
  return (
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
  );
};

export default MENU;