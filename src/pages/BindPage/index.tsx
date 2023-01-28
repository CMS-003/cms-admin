import React, { useCallback } from 'react'
import { Observer, useLocalStore } from 'mobx-react-lite'
import { Button, Input, Avatar, message, Tabs, Select, Space } from 'antd'
import { IType, IMSTArray } from 'mobx-state-tree'
import { useNavigate } from "react-router-dom";
import logo from '../../logo.svg'
import apis from '../../api'
import store from '../../store'
import { Project } from '@/types'
import { useEffectOnce } from 'react-use';

export default function BindPage() {
  const navigate = useNavigate()
  const local = useLocalStore(() => ({
    isFetch: false,
    bind_token: '',
    username: '',
    password: '',
    email: '',
    email_code: '',
    area_code: '',
    phone: '',
    phone_code: '',
    type: 'account',
    email_count: 0,
    phone_count: 0,
    timer: null as any,
  }))
  const sendCode = useCallback(async () => {
    if (local.email_count > 0 || local.phone_count > 0) {
      return;
    }
    const resp = await apis.sendCode({ type: local.type, account: local.type === 'email' ? local.email : local.area_code + local.phone });
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
    local.bind_token = searchParams.get('bind_token') || '';
  })
  return <Observer>{() => (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%' }}>
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'flex-start', minWidth: '80%', maxWidth: 800, height: 500, transform: 'translate(0,-100px)' }}>
        <Avatar src={logo} size={80} />
        <Tabs centered defaultActiveKey={local.type} onChange={type => {
          local.type = type;
        }} >
        <Tabs.TabPane tab="账号密码" key="account">
          <Space direction='vertical'>
            <Input name="username" type={'text'} onChange={e => local.username = e.target.value} placeholder="用户名" addonBefore="用户名" />
            <Input name="password" type="password" onChange={e => local.password = e.target.value} addonBefore="密码" placeholder="密码" onKeyDown={e => {
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
            <Space direction='vertical'>
              <Input name="email" addonBefore="邮箱" onChange={e => local.email = e.target.value} placeholder="邮箱" type={'email'} />
              <Input name="验证码" type={'text'} addonAfter={<span onClick={sendCode}>{local.email_count > 0 ? local.email_count + 's后重试' : '获取验证码'}</span>} />
            </Space>
          </Tabs.TabPane>
          <Tabs.TabPane tab="手机号" key="phone">
            <Space direction='vertical'>
              <Input
                name="手机号"
                type={'text'}
                onChange={e => local.phone = e.target.value}
                addonBefore={<Select defaultValue={'+86'}>
                  <Select.Option value="+86">中国大陆(+86)</Select.Option>
                </Select>}
                addonAfter={<span onClick={sendCode}>{local.phone_count > 0 ? local.phone_count + 's后重试' : '获取验证码'}</span>} />
              <Input name="验证码" type={'text'} addonBefore="验证码" />
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
            if (res.code === 0) {
              store.user.setAccessToken(res.data.access_token)
              const projectResult = await apis.getProjects<Project>()
              if (projectResult.code === 0) {
                store.project.setList(projectResult.data.items as IMSTArray<IType<Project, Project, Project>>)
              }
              const menuResult: any = await apis.getMenu()
              if (menuResult.code === 0) {
                store.menu.setTree(menuResult.data)
              }
              const componentTypes: any = await apis.getComponentTypes()
              if (componentTypes.code === 0) {
                store.component.setTypes(componentTypes.data.items)
              }
              navigate('/dashboard')
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