import { Layout, Dropdown, Menu, Popover, Button } from 'antd';
import React, { useCallback, useState } from 'react';
import logo from '@/asserts/images/logo.svg';
import { Avatar } from 'antd';
import MenuComponent from './menu'
import Router from '../router'
import { Link, Navigate, useNavigate } from "react-router-dom";
import store from '@/store';
import { useEffectOnce } from 'react-use';
import apis from '@/api'
import Acon from '@/components/Acon';

const { Content, Sider } = Layout;

const CLayout: React.FC<{ data: any, flag: number }> = (props: { data: any, flag: number }) => {
  const navigate = useNavigate()
  const [collapsed, setCollapsed] = useState(false);
  const [logouting, setLogout] = useState(false);
  const [project_title, setProjectTitle] = useState('');
  const logout = useCallback(async () => {
    setLogout(true);
    try {
      await apis.SignOut({ refresh_token: store.user.getRefreshToken() })
      navigate('/manager/sign-in')
    } catch (e) {
      navigate('/manager/sign-in')
    } finally {
      store.user.setAccessToken('')
      store.user.setRefreshToken('')
      setLogout(false)
    }
  }, [])
  useEffectOnce(() => {
    const project = store.project.list.find(it => it._id === store.app.project_id)
    if (project) {
      setProjectTitle(project.title);
    }
  })
  if (location.pathname === '/manager') {
    return <Navigate to={'/manager/dashboard'} />
  }
  return (
    <Layout style={{ height: '100vh' }}>
      <Sider theme='dark' className="app-slider" collapsible collapsed={collapsed} onCollapse={value => {
        setCollapsed(value)
      }}>
        <div style={{ display: 'flex', alignItems: 'center', alignContent: 'center', justifyContent: 'center' }}>
          <Dropdown overlay={<Menu
            style={{}}
            onClick={e => {
              const id = e.key;
              const project = store.project.list.find(it => it._id === id);
              if (project) {
                store.app.setProjectId(e.key);
                setProjectTitle(project.title);
                window.location.reload();
              }
            }}
            items={store.project.list.map(project => ({
              label: project.title,
              key: project._id,
              style: { backgroundColor: project._id === store.app.project_id ? '#aaa' : '' },
              icon: project.cover ? <img src={project.cover} alt="" style={{ width: 24, height: 24 }} /> : null
            }))}
          />}>
            <div style={{ flexDirection: collapsed ? 'column' : 'row', color: 'white', display: 'flex', alignItems: 'center' }}>
              <img src={logo} alt="logo" style={{ width: 40, height: 40 }} />{project_title}
            </div>
          </Dropdown>
        </div>
        <MenuComponent tree={props.data} collapsed={collapsed} flag={props.flag} />
        <Popover
          content={<Button type="text" block loading={logouting} onClick={logout}>退出</Button>}
          title="设置"
          trigger="hover"
          placement="rightBottom"
        >
          <Link to={'/manager/user/bind'}>
            <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', padding: 10, alignItems: 'center' }}>
              <div style={{ width: 40, height: 40, borderRadius: 40, backgroundColor: '#eee', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Acon icon='UserOutlined' />
              </div>
              <span style={{ marginTop: 5, color: 'wheat' }}>{store.user.info?.nickname}</span>
            </div>
          </Link>
        </Popover>
      </Sider>
      <Layout className="site-layout">
        <Content style={{ display: 'flex', flexDirection: 'column' }}>
          <div className="site-layout-background" style={{ height: '100%', display: 'flex', overflow: 'auto', flexDirection: 'column' }}>
            <Router />
          </div>
        </Content>
        {/* <div style={{ textAlign: 'center', padding: 10 }}>Ant Design ©2018 Created by Ant UED</div> */}
      </Layout>
    </Layout >
  );
};

export default CLayout;