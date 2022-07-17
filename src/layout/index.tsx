import { Breadcrumb, Layout, Dropdown, Menu } from 'antd';
import React, { useState } from 'react';
import { UserOutlined } from '@ant-design/icons';
import { Avatar } from 'antd';
import logo from '../logo.svg';
import MenuComponent from './menu'
import Router from '../router'
import store from '@/store';


const { Content, Footer, Sider } = Layout;

const App: React.FC<{ data: any }> = (props: { data: any }) => {
  const [collapsed, setCollapsed] = useState(false);

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Sider collapsible collapsed={collapsed} onCollapse={value => setCollapsed(value)}>
        <div style={{ height: 60, display: 'flex', alignItems: 'center', alignContent: 'center', justifyContent: 'center' }}>
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
        <Content style={{ margin: '0 16px', display: 'flex', flexDirection: 'column' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <Breadcrumb style={{ margin: '16px 0' }}>
              <Breadcrumb.Item>User</Breadcrumb.Item>
              <Breadcrumb.Item>Bill</Breadcrumb.Item>
            </Breadcrumb>
            <Avatar icon={<UserOutlined />} />
          </div>
          <div className="site-layout-background" style={{ minHeight: 360 }}>
            <Router />
          </div>
        </Content>
        <Footer style={{ textAlign: 'center' }}>Ant Design ©2018 Created by Ant UED</Footer>
      </Layout>
    </Layout>
  );
};

export default App;