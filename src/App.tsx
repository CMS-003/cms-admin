import { useCallback, useEffect } from 'react';
import Layout from './layout'
import { Route, Routes } from 'react-router-dom'
import { Observer, useLocalObservable } from 'mobx-react';
import { useNavigate, useLocation } from "react-router-dom";
import { Space, Spin, Button } from 'antd'
import apis from './api';
import BindPage from './pages/auth/bind'
import SignInPage from './pages/auth/sign-in'
import SuccessPage from './pages/auth/success'
import FailurePage from './pages/auth/failure'
import store from './store'
import { useEffectOnce } from 'react-use';
import { ws } from '@/utils/ws'
import events from './utils/event';
import 'react-resizable/css/styles.css';
import { CenterXY } from './components/style';

function Main() {
  const location = useLocation()
  const navigate = useNavigate()
  const local = useLocalObservable(() => ({
    booting: true,
    booted: false,
    error: false,
    setBooting(b: boolean) {
      this.booting = b;
    },
    setError(b: boolean) {
      this.error = b;
    },
    setValue(key: 'booting' | 'booted' | 'error', value: boolean) {
      local[key] = value;
    }
  }))
  const init = useCallback(async () => {
    try {
      local.setValue('error', false)
      local.setValue('booting', true)

      const data = await apis.getBootData();
      store.project.setList(data.projects.items)
      store.menu.setTree(data.tree.children[0])
      store.component.setTypes(data.types.items)

      const result = await apis.getProfile();
      if (result.code !== 0) {
        navigate('/manager/sign-in')
      } else {
        local.setValue('booted', true)
        store.user.setInfo(result.data.item)
      }
      return true;
    } catch (e) {
      local.setValue('error', true)
    }
    return false;
  }, [])
  useEffect(() => {
    (async () => {
      try {
        // 第三方登录和跳转设置
        const searchParams = new URLSearchParams(window.location.search.substring(1));
        const access_token = searchParams.get('access_token') as string
        if (searchParams.get('refresh_token')) {
          store.user.setRefreshToken(searchParams.get('refresh_token') as string);
        }
        if (searchParams.get('redirect')) {
          return window.location.href = decodeURI(searchParams.get('redirect') as string);
        }
        if (access_token) {
          store.user.setAccessToken(access_token);
          navigate(window.location.pathname)
        }
        if (!local.booted) {
          const finished = await init();
          if (!finished) {
            throw new Error('boot fail');
          }
          if (!store.user.isLogin() && !['/manager/auth/bind', '/manager/auth/success', '/manager/auth/failure'].includes(location.pathname)) {
            navigate('/manager/auth/sign-in')
          } else if (location.pathname === '/' || location.pathname === '/manager/') {
            navigate('/manager/dashboard')
          }
        }
        local.setValue('error', false)
        local.setValue('booting', false)
      } catch (e) {
        local.setValue('error', true)
        console.log(e, 'boot')
      }
    })();
    return () => {

    }
  }, []);
  return <Observer>{() => {
    if (local.error) {
      return (
        <CenterXY>
          <Button type="primary" onClick={init}>重试</Button>
        </CenterXY>
      )
    }
    if (local.booting) {
      return (
        <div style={{ width: '100vw', height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Space>
            <Spin spinning />加载中...
          </Space>
        </div>
      )
    }
    return <Layout data={store.menu.tree} flag={store.menu.flag} />
  }}</Observer>
}


function App() {
  const navigate = useNavigate()
  useEffectOnce(() => {
    ws.on('connect', () => {
      console.log('connected');
    });
    window.goto = function (url: string) {
      navigate(url);
    }
    window.sendCustomEvent = function (view_id: string, name: string, data) {
      events.emit(view_id, name, data)
    }
  });
  return (
    <Observer>{() => (
      <div className="App">
        <Routes>
          <Route path={"/manager/auth/sign-in"} element={<SignInPage />} />
          <Route path={"/manager/auth/bind"} element={<BindPage />} />
          <Route path={"/manager/auth/success"} element={<SuccessPage />} />
          <Route path={"/manager/auth/failure"} element={<FailurePage />} />
          <Route path="/manager/*" element={<Main />} />
        </Routes>
      </div>
    )}</Observer>
  );
}

export default App;
