import { Layout, Dropdown, Menu } from 'antd';
import React, { useState } from 'react';
import logo from '../logo.svg';
import { UserOutlined } from '@ant-design/icons';
import { Avatar } from 'antd';
import MenuComponent from './menu'
import Router from '../router'
import store from '@/store';

const { Content, Sider } = Layout;

const App: React.FC<{ data: any }> = (props: { data: any }) => {
  const [collapsed, setCollapsed] = useState(false);

  return (
    <Layout style={{ height: '100vh' }}>
      <Sider className="app-slider" collapsible collapsed={collapsed} onCollapse={value => setCollapsed(value)}>
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
        <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', padding: 10, alignItems: 'center' }}>
          <Avatar icon={<UserOutlined />} />
          <span style={{ marginTop: 5, color: 'wheat' }}>{store.user.info?.account}</span>
        </div>
      </Sider>
      <Layout className="site-layout">
        <Content style={{ display: 'flex', flexDirection: 'column' }}>
          <div className="site-layout-background" style={{ height: '100%', display: 'flex', overflow: 'auto', flexDirection: 'column' }}>
            <Router />
          </div>
        </Content>
        <div style={{ textAlign: 'center', padding: 10 }}>Ant Design ©2018 Created by Ant UED</div>
      </Layout>
    </Layout >
  );
};

export default App;