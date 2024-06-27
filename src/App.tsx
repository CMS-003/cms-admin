import { useCallback } from 'react';
import Layout from './layout'
import { Route, Routes } from 'react-router-dom'
import { Observer, useLocalObservable } from 'mobx-react';
import { useNavigate, useLocation } from "react-router-dom";
import { useEffectOnce } from 'react-use';
import { Space, Spin, Button } from 'antd'
import apis from './api';
import SignInPage from './pages/signin'
import BindPage from './pages/bind'
import SuccessPage from './pages/oauthResult/success'
import FailPage from './pages/oauthResult/fail'
import store from './store'
import { IUser } from '@/types'

function App() {
  const location = useLocation()
  const navigate = useNavigate()
  const local = useLocalObservable(() => ({
    booting: true,
    booted: false,
    error: false,
    setBooting(b: boolean) {
      this.booting = b;
    }
  }))
  const white_paths = ['/sign-in', '/bind']
  const init = useCallback(async () => {
    local.error = false;
    local.booting = true;
    const result = await apis.getProfile<IUser>();
    if (result.code !== 0) {
      if (location.pathname !== '/sign-in') {
        navigate('/sign-in')
      }
      return;
    } else {
      store.user.setInfo(result.data.item)
    }
    await store.getBoot();
  }, [])
  useEffectOnce(() => {
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
        if (local.booted !== true && !white_paths.includes(location.pathname)) {
          await init();
          local.booted = true
          if (!store.user.isLogin()) {
            navigate('/sign-in')
          } else if (location.pathname === '/') {
            navigate('/dashboard')
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
  })
  return (
    <Observer>{() => (
      <div className="App">
        {local.error ? <Button type="primary" onClick={init}>重试</Button> : local.booting ? <div style={{ width: '100vw', height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Space>
            <Spin spinning />加载中...
          </Space>
        </div> : <Routes>
          <Route path="/sign-in" element={<SignInPage />} />
          <Route path="/bind" element={<BindPage />} />
          <Route path="/oauth/success" element={<SuccessPage />} />
          <Route path="/oauth/fail" element={<FailPage />} />
          <Route path="/*" element={<Layout data={store.menu.tree} />} />
        </Routes>}
      </div>
    )}</Observer>
  );
}

export default App;
