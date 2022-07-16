import React from 'react';
import Layout from './layout'
import { Route, Routes } from 'react-router-dom'
import { Observer, useLocalObservable } from 'mobx-react';
import { useNavigate, useLocation } from "react-router-dom";
import { useEffectOnce } from 'react-use';
import { Space, Spin } from 'antd'
import apis from './api';
import SignInPage from './pages/SignInPage'
import store from './store'

function App() {
  const location = useLocation()
  const navigate = useNavigate()
  const local = useLocalObservable(() => ({
    booting: true,
    error: false,
  }))
  useEffectOnce(() => {
    (async () => {
      try {
        if (location.pathname !== '/sign-in') {
          const result = await apis.getProfile()
          if (result.code !== 0) {
            navigate('/sign-in')
          } else {
            console.log(result)
          }
        }
        local.booting = false
      } catch (e) {
        console.log(e)
      }
    })();
    return () => {

    }
  })
  return (
    <Observer>{() => (
      <div className="App">
        {local.booting ? <div style={{ width: '100vw', height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Space>
            <Spin spinning />加载中...
          </Space>
        </div> : <Routes>
          <Route path="/sign-in" element={<SignInPage />} />
          <Route path="/*" element={<Layout />} />
        </Routes>}
      </div>
    )}</Observer>
  );
}

export default App;
