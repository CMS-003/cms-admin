import { Breadcrumb, Layout, Dropdown, Menu } from 'antd';
import React, { useEffect, useState } from 'react';
import logo from '../logo.svg';
import { UserOutlined } from '@ant-design/icons';
import { Avatar } from 'antd';
import MenuComponent from './menu'
import Router from '../router'
import store from '@/store';
import { useLocation } from 'react-use';

const { Content, Sider } = Layout;

const App: React.FC<{ data: any }> = (props: { data: any }) => {
  const location = useLocation()
  const [collapsed, setCollapsed] = useState(false);
  const [breadcrumbs, setArr] = useState<string[]>([])
  useEffect(() => {
    setArr((location.pathname || '').split('/'))
  }, [location.pathname])
  return (
    <Layout style={{ height: '100vh' }}>
      <Sider collapsible collapsed={collapsed} onCollapse={value => setCollapsed(value)}>
        <div style={{ display: 'flex', alignItems: 'center', alignContent: 'center', justifyContent: 'center' }}>
          <Dropdown overlay={<Menu
            style={{ backgroundColor: 'palegreen' }}
            onClick={e => {

            }}
            items={store.project.list.map(project => ({
              label: project.title,
              key: project.id,
              icon: <img src={project.cover} alt="" style={{ width: 32, height: 32 }} />
            }))}
          />}>
            <img src={logo} alt="logo" style={{ width: 40, height: 40 }} />
          </Dropdown>
        </div>
        <MenuComponent tree={props.data} />
      </Sider>
      <Layout className="site-layout">
        <Content style={{ display: 'flex', flexDirection: 'column' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <Breadcrumb style={{ margin: '16px 0' }}>
              {breadcrumbs.map((pilot, index) => <Breadcrumb.Item key={index}>{pilot}</Breadcrumb.Item>)}
            </Breadcrumb>
            <Dropdown overlay={<Menu style={{ minWidth: 100 }}>
              <Menu.Item>退出</Menu.Item>
            </Menu>}>
              <Avatar icon={<UserOutlined />} style={{ marginRight: 10 }} />
            </Dropdown>
          </div>
          <div className="site-layout-background" style={{ height: '100%', display: 'flex', overflow: 'auto', flexDirection: 'column' }}>
            <Router />
          </div>
        </Content>
        <div style={{ textAlign: 'center', padding: 10 }}>Ant Design ©2018 Created by Ant UED</div>
      </Layout>
    </Layout>
  );
};

export default App;