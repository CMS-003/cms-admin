import type { MenuProps } from 'antd';
import { Menu } from 'antd';
import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom'
import { useEffectOnce } from 'react-use';
import store from '@/store'
import * as _ from 'lodash'

type MenuItem = Required<MenuProps>['items'][number];

function getItem(
  label: React.ReactNode,
  key: React.Key,
  icon?: React.ReactNode,
  children?: MenuItem[],
  type?: 'group',
): MenuItem {
  return {
    key,
    icon,
    children,
    label,
    type,
  } as MenuItem;
}

const keyPathMap: { [key: string]: string } = {}
const pathKeyMap: { [key: string]: string } = {}

function transform(tree: any) {
  const node: any = { label: tree.title, key: tree._id, children: [] }
  const path = _.get(tree, 'attrs.path', '')
  keyPathMap[node.key] = path
  pathKeyMap[path] = node.key
  if (tree.children && tree.children.length) {
    node.children = tree.children.map((item: any) => transform(item))
    node.key = path
  } else {
    delete node.children
  }
  return node;
}

const MENU: React.FC<{ tree: any }> = (props: { tree: any }) => {
  const navigate = useNavigate()
  const location = useLocation()
  const [tree, setTree] = useState([])
  const [selectedKey, setKey] = useState(location.pathname)
  useEffectOnce(() => {
    setTree(transform(props.tree).children)
  })
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