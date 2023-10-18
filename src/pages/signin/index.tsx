import React from 'react'
import { Observer, useLocalStore } from 'mobx-react-lite'
import { Form, Button, Input, Avatar, message, Popconfirm } from 'antd'
import { MinusCircleOutlined } from '@ant-design/icons';
import { useNavigate } from "react-router-dom";
import logo from '../../logo.svg'
import apis from '../../api'
import store from '../../store'
import { IUser } from '@/types'
import { AlignAround } from '@/components/style'
import Icon_sns_alipay from '@/asserts/images/sns-alipay.svg'
import Icon_sns_github from '@/asserts/images/sns-github.svg'
import Icon_sns_google from '@/asserts/images/sns-google.svg'
import Icon_sns_apple from '@/asserts/images/sns-apple.svg'
import Icon_sns_wechat from '@/asserts/images/sns-wechat.svg'
import Icon_sns_weibo from '@/asserts/images/sns-weibo.svg'
import { IconSNS } from './style';

export default function SignInPage() {
  const navigate = useNavigate()
  const local = useLocalStore(() => ({
    isFetch: false,
    username: '',
    password: '',
  }))
  return <Observer>{() => (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%' }}>
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
              const res = await apis.SignIn({ type: 'account', account: local.username, value: local.password })
              console.log(res)
              if (res.code === 0) {
                store.user.setAccessToken(res.data.access_token)
                const result = await apis.getProfile<IUser>();
                if (result.code === 0) {
                  store.user.setInfo(result.data.item as any)
                }
                await store.getBoot();
                navigate('/dashboard')
              } else {
                message.error(res.message)
              }
            } catch (e: any) {
              console.log(e)
              // message.error(e.message)
            } finally {
              local.isFetch = false
            }
          }}>登录</Button>
        </Form.Item>
      </Form>
      <div style={{ color: '#999' }}>其他方式登录</div>
      <AlignAround>
        <a href="http://localhost:3334/api/v1/oauth/sns/google/" title=""><IconSNS src={Icon_sns_google} alt="google" /></a>
        <a href="http://localhost:3334/api/v1/oauth/sns/github/" title=""><IconSNS src={Icon_sns_github} alt="github" /></a>
        {/* redirect_uri要和支付宝里的配置一致 */}
        <a href="http://localhost:3334/api/v1/oauth/sns/alipay/"><IconSNS src={Icon_sns_alipay} alt="支付宝" /></a>

        <Popconfirm
          title="正在开发中..."
          icon={<MinusCircleOutlined />}
          okText="已阅"
          showCancel={false}>
          <IconSNS src={Icon_sns_wechat} alt="微信" />
        </Popconfirm>

        <Popconfirm
          title="apple开发账号太贵，用不起"
          icon={<MinusCircleOutlined />}
          okText="已阅"
          showCancel={false}>
          <IconSNS src={Icon_sns_apple} alt="苹果" />
        </Popconfirm>
        <a href="http://localhost:3334/api/v1/oauth/sns/weibo/" title=""><IconSNS src={Icon_sns_weibo} alt="微博" /></a>
      </AlignAround>
    </div>
  )}</Observer>
}