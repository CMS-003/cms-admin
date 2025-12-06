import React, { useCallback } from 'react'
import { Observer, useLocalObservable } from 'mobx-react-lite'
import { Button, Input, Avatar, message, Tabs, Select, Space, Divider } from 'antd'
import { useNavigate } from "react-router-dom";
import logo from '@/asserts/images/logo.svg'
import apis from '../../api'
import store from '../../store'
import { useEffectOnce } from 'react-use';

export default function BindPage() {
  const navigate = useNavigate()
  const local = useLocalObservable(() => ({
    isFetch: false,
    bind_token: '',
    username: '',
    password: '',
    email: '',
    email_code: '',
    area_code: '',
    phone: '',
    phone_code: '',
    type: 'name',
    email_count: 0,
    phone_count: 0,
    timer: null as any,
  }))
  const sendCode = useCallback(async () => {
    if (local.email_count > 0 || local.phone_count > 0) {
      return;
    }
    const resp = await apis.sendCode({ method: local.type === 'email' ? 1 : 2, type: 'bind', account: local.type === 'email' ? local.email : local.area_code + local.phone });
    if (resp.code === 0) {
      message.success('验证码已发送');
      local.email_count = 60;
      local.phone_count = 60;
      local.timer = setInterval(() => {
        if (local.email_count === 0) {
          clearInterval(local.timer);
          local.timer = null;
        }
        local.email_count--;
        local.phone_count--;
      }, 1000);
    } else {
      message.error('验证码发送失败:' + resp.message, 2)
    }
  }, []);
  useEffectOnce(() => {
    const searchParams = new URLSearchParams(window.location.search.substring(1));
    const bind_token = searchParams.get('bind_token') || '';
    if (bind_token) {
      local.bind_token = bind_token;
      navigate('/manager/oauth/bind', { replace: true });
    }
  })
  return <Observer>{() => (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%' }}>
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'flex-start', minWidth: '80%', maxWidth: 800, height: 500, transform: 'translate(0,-100px)' }}>
        <Avatar src={logo} size={80} />
        <Tabs centered defaultActiveKey={local.type} onChange={type => {
          console.log(type)
          local.type = type;
        }} >
          <Tabs.TabPane tab="账号密码" key="account">
            <Space orientation='vertical'>
              <Input prefix={<span>用户名<Divider orientation='vertical' /></span>} name="username" type={'text'} onChange={e => local.username = e.target.value} placeholder="用户名" />
              <Input prefix={<span>密码<Divider orientation='vertical' /></span>} name="password" type="password" onChange={e => local.password = e.target.value} placeholder="密码" onKeyDown={e => {
                if (e.keyCode === 13) {
                  const btn = document.getElementById('bind')
                  if (btn) {
                    btn.click();
                  }
                }
              }} />
            </Space>
          </Tabs.TabPane>
          <Tabs.TabPane tab="邮箱" key="email">
            <Space orientation='vertical'>
              <Input prefix={<span>邮箱<Divider orientation='vertical' /></span>} name="email" onChange={e => local.email = e.target.value} placeholder="邮箱" type={'email'} />
              <Input name="验证码" type={'text'} suffix={<span onClick={sendCode}>{local.email_count > 0 ? local.email_count + 's后重试' : '获取验证码'}</span>} />
            </Space>
          </Tabs.TabPane>
          <Tabs.TabPane tab="手机号" key="phone">
            <Space orientation='vertical'>
              <Input
                prefix={<Select defaultValue={'+86'}>
                  <Select.Option value="+86">中国</Select.Option>
                </Select>}
                name="手机号"
                type={'text'}
                onChange={e => local.phone = e.target.value}
              />
              <Input name="验证码" type={'text'} suffix={<span onClick={sendCode}>{local.phone_count > 0 ? local.phone_count + 's后重试' : '获取验证码'}</span>} />
            </Space>
          </Tabs.TabPane>
        </Tabs>
        <Button id="bind" type="primary" style={{ marginTop: 15 }} loading={local.isFetch} onClick={async () => {
          local.isFetch = true
          try {
            const res = await apis.bind<{ access_token: string, refresh_token: string }>({
              bind_token: local.bind_token,
              type: local.type,
              account: local.type === 'email' ? local.email : (local.type === 'phone' ? local.area_code + '-' + local.phone : local.username),
              value: local.type === 'email' ? local.email_code : (local.type === 'phone' ? local.phone_code : local.password)
            })
            if (res.code === 0 && res.data) {
              store.user.setAccessToken(res.data.access_token)
              navigate('/manager/dashboard')
            } else {
              message.error(res.message)
            }
          } catch (e: any) {
            message.error(e.message)
          } finally {
            local.isFetch = false
          }
        }}>绑定</Button>
      </div>
    </div>
  )}</Observer>
}