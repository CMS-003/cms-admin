import React from 'react'
import { Observer, useLocalStore } from 'mobx-react-lite'
import { Form, Button, Input, Avatar, message } from 'antd'
import { useNavigate } from "react-router-dom";
import logo from '../../logo.svg'
import apis from '../../api'
import store from '../../store'

export default function SignInPage() {
  const navigate = useNavigate()
  const local = useLocalStore(() => ({
    isFetch: false,
    username: '',
    password: '',
  }))
  return <Observer>{() => (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%' }}>
      <Form style={{ transform: 'translate(0,-100px)' }}>
        <Form.Item style={{ textAlign: 'center' }}>
          <Avatar src={logo} size={80} />
        </Form.Item>
        <Form.Item>
          <Input name="username" onChange={e => local.username = e.target.value} placeholder="用户名" />
        </Form.Item>
        <Form.Item>
          <Input name="password" onChange={e => local.password = e.target.value} type="password" placeholder="密码" onKeyDown={e => {
            if (e.keyCode === 13) {
              const btn = document.getElementById('signin')
              if (btn) {
                btn.click();
              }
            }
          }} />
        </Form.Item>
        <Form.Item style={{ textAlign: 'center' }}>
          <Button id="signin" type="primary" loading={local.isFetch} block onClick={async () => {
            local.isFetch = true
            try {
              const res = await apis.SignIn({ account: local.username, pass: local.password })
              if (res.code === 0) {
                store.user.setAccessToken(res.data.access_token)
                navigate('/home')
              } else {
                message.error(res.message)
              }
            } catch (e: any) {
              message.error(e.message)
            } finally {
              local.isFetch = false
            }
          }}>登录</Button>
        </Form.Item>
      </Form>
    </div>
  )}</Observer>
}