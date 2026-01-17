import { useCallback } from 'react';
import { useEffectOnce } from 'react-use';
import { Observer, useLocalObservable } from 'mobx-react';
import apis from '@/api';
import { ISNS } from '../../types';
import store from '@/store';
import { AlignAround } from '@/components/style'
import styled from 'styled-components'
import Icon_sns_alipay from '@/asserts/images/sns-alipay.svg'
import Icon_sns_github from '@/asserts/images/sns-github.svg'
import Icon_sns_google from '@/asserts/images/sns-google.svg'
import Icon_sns_apple from '@/asserts/images/sns-apple.svg'
import Icon_sns_wechat from '@/asserts/images/sns-wechat.svg'
import Icon_sns_weibo from '@/asserts/images/sns-weibo.svg'
import { Switch } from 'antd';

const ICON = styled.img`
  height: 32px;
  width: 32px;
  margin: 10px;
  src: ${({ src }) => src}
`
const sns_type: { [key: string]: any } = {
  alipay: Icon_sns_alipay,
  github: Icon_sns_github,
  google: Icon_sns_google,
  wechat: Icon_sns_wechat,
  weibo: Icon_sns_weibo,
  apple: Icon_sns_apple,
}

export default function Page({ }) {
  const local = useLocalObservable<{ list: ISNS[] }>(() => ({
    list: []
  }))
  const refresh = useCallback(async () => {
    const result = await apis.getSNS()
    if (result.code === 0 && result.data) {
      local.list = result.data.items
    }
  }, [])
  useEffectOnce(() => {
    refresh()
  })
  return <Observer>{() => (
    <div style={{ width: 250, margin: '0 auto', marginTop: 60 }}>
      {local.list.map(sns => (<AlignAround>
        <ICON src={sns_type[sns.sns_type]} />
        <span>
          <Switch checked={sns.status === 1} onChange={checked => {
            if (checked) {
              const access_token = store.user.getAccessToken()
              window.open(`/gw/api/v1/oauth/sns/${sns.sns_type}/?authorization=${encodeURIComponent(access_token)}`)
            } else {
              apis.destroySNS({ body: sns }).then(resp => {
                sns.status = sns.status === 1 ? 0 : 1;
              })
            }
          }} />{sns.status === 0 ? '未绑定' : '已绑定'}
        </span>
      </AlignAround>))}
    </div>
  )}</Observer>
}