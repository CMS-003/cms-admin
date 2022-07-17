import {
  AppstoreOutlined,
  ContainerOutlined,
  DesktopOutlined,
  MailOutlined,
  PieChartOutlined,
} from '@ant-design/icons';
import type { MenuProps } from 'antd';
import { Menu } from 'antd';
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom'
import { useEffectOnce } from 'react-use';

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

const items: MenuItem[] = [
  getItem('首页', 'home', <PieChartOutlined />),
  getItem('组件', 'component', <DesktopOutlined />),
  getItem('Option 3', '3', <ContainerOutlined />),

  getItem('Navigation One', 'sub1', <MailOutlined />, [
    getItem('Option 5', '5'),
    getItem('Option 6', '6'),
    getItem('Option 7', '7'),
    getItem('Option 8', '8'),
  ]),

  getItem('Navigation Two', 'sub2', <AppstoreOutlined />, [
    getItem('Option 9', '9'),
    getItem('Option 10', '10'),

    getItem('Submenu', 'sub3', null, [getItem('Option 11', '11'), getItem('Option 12', '12')]),
  ]),
];

function transform(tree: any) {
  const node: any = { label: tree.title, key: tree.name, children: [] }
  if (tree.children && tree.children.length) {
    node.children = tree.children.map((item: any) => transform(item))
  } else {
    delete node.children
  }
  return node;
}
const MENU: React.FC<{ tree: any }> = (props: { tree: any }) => {
  const navigate = useNavigate()
  const [tree, setTree] = useState([])
  useEffectOnce(() => {
    setTree(transform(props.tree).children)
  })

  return (
    <div>
      <Menu
        defaultSelectedKeys={['1']}
        defaultOpenKeys={['sub1']}
        mode="inline"
        theme="dark"
        items={tree}
        onClick={e => {
          navigate(e.key)
        }}
      />
    </div>
  );
};

export default MENU;