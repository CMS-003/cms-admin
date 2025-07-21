import { useCallback, useEffect } from 'react';
import Layout from './layout'
import { Route, Routes } from 'react-router-dom'
import { Observer, useLocalObservable } from 'mobx-react';
import { useNavigate, useLocation } from "react-router-dom";
import { Space, Spin, Button } from 'antd'
import apis from './api';
import SignInPage from './pages/signin'
import BindPage from './pages/oauthResult/bind'
import SuccessPage from './pages/oauthResult/success'
import FailPage from './pages/oauthResult/failure'
import store from './store'
import { IUser } from '@/types'
import { useEffectOnce } from 'react-use';
import { ws } from '@/utils/ws'
import events from './utils/event';
import 'react-resizable/css/styles.css';

function App() {
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
    }
  }))
  const init = useCallback(async () => {
    local.setError(false)
    local.setBooting(true)
    await store.getBoot();
    const result = await apis.getProfile();
    if (result.code !== 0) {
      return;
    } else {
      store.user.setInfo(result.data.item)
    }
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
          await init();
          local.booted = true
          if (!store.user.isLogin() && !['/manager/oauth/bind', '/manager/oauth/success', '/manager/oauth/failure'].includes(location.pathname)) {
            navigate('/manager/sign-in')
          } else if (location.pathname === '/' || location.pathname === '/manager/') {
            navigate('/manager/dashboard')
          }
        }
        local.setBooting(false)
      } catch (e) {
        local.error = true;
        console.log(e, 'boot')
      }
    })();
    return () => {

    }
  }, [location.pathname]);
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
        {local.error ? <Button type="primary" onClick={init}>重试</Button> : local.booting ? <div style={{ width: '100vw', height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Space>
            <Spin spinning />加载中...
          </Space>
        </div> : <Routes>
          <Route path={"/manager/sign-in"} element={<SignInPage />} />
          <Route path={"/manager/oauth/bind"} element={<BindPage />} />
          <Route path={"/manager/oauth/success"} element={<SuccessPage />} />
          <Route path={"/manager/oauth/failure"} element={<FailPage />} />
          <Route path="/manager/*" element={<Observer>{() => <Layout data={store.menu.tree} flag={store.menu.flag} />}</Observer>} />
        </Routes>}
      </div>
    )}</Observer>
  );
}

export default App;
