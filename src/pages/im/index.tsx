import store from '../../store';
import { Button, notification, Space, Spin } from 'antd';
import { Observer, useLocalObservable } from 'mobx-react';
import React, { useCallback, useRef } from 'react';
import shttp from '../../utils/shttp';
import { useEffectOnce } from 'react-use';
import events from '../../utils/events';
import TIM from 'tim-js-sdk'

const IMPage: React.FC = () => {
  const local = useLocalObservable<{ groupId: string, groups: { GroupId: string, joined?: boolean }[], fetchSignature: boolean, fetchGroups: boolean }>(() => ({
    fetchSignature: false,
    fetchGroups: false,
    groups: [],
    groupId: '',
  }))
  const contentRef = useRef<null | Element>(null)
  const getGroups = useCallback(async () => {
    try {
      local.fetchGroups = true
      const result = await shttp.get<{ list: { GroupId: string }[] }>('/api/v1/im/groups/remote')
      if (result.code === 0) {
        local.groups = result.data.list
        notification.info({ message: '成功' })
      } else {
        notification.error({ message: result.message })
      }
    } catch (e) {
      console.log(e)
    } finally {
      local.fetchGroups = false;
    }
  }, [])
  function messager(event: any) {
    const { name, data } = event;
    // "TIMGroupTipElem" 修改群profile
    // "TIMGroupSystemNoticeElem" 群系统通知
    // onMessageReceived
    if (data.length === 1 && data[0].type === "TIMTextElem") {
      if (contentRef.current) {
        const p = document.createElement('p', {})
        p.textContent = `${data[0].from} 说: ${data[0].payload.text}`
        contentRef.current.append(p)
      }
    }
  }
  useEffectOnce(() => {
    events.on(TIM.EVENT.MESSAGE_RECEIVED, messager)
    return () => {
      events.off(TIM.EVENT.MESSAGE_RECEIVED, messager)
    }
  })
  return (
    <Observer>{() => (<div>
      <Space>
        <Button type="primary" loading={local.fetchSignature} onClick={async (e) => {
          try {
            local.fetchSignature = true
            const result = await shttp.post<{ usersig: string }>('/api/v1/im/user/signature', { user_id: 'ttt' })
            console.log(result)
            if (result.code === 0) {
              store.user.setIMSignature(result.data.usersig)
              notification.info({ message: '成功' })
            } else {
              notification.error({ message: result.message })
            }
          } catch (e) {
            console.log(e)
          } finally {
            local.fetchSignature = false;
          }
        }}>获取usrsig</Button>
        <Button type="primary" onClick={e => {
          if (!store.user.im_signatue) {
            return notification.error({ message: '请选获取signature' })
          }
          let promise = store.tim.login({ userID: 'ttt', userSig: store.user.im_signatue });
          promise.then(function (imResponse: any) {
            console.log(imResponse.data); // 登录成功
            if (imResponse.data.repeatLogin === true) {
              // 标识账号已登录，本次登录操作为重复登录。v2.5.1 起支持
              console.log(imResponse.data.errorInfo);
            }
          }).catch(function (imError: Error) {
            console.warn('login error:', imError); // 登录失败的相关信息
          });
        }}>登录</Button>
        <Button onClick={() => {
          getGroups()
        }}>所有群</Button>
      </Space>
      <div style={{ display: 'flex', flexDirection: 'row', }}>
        <div style={{ width: 200 }}>{local.fetchGroups ? <Spin /> : <div>
          {
            local.groups.map((item) => <div
              key={item.GroupId}
              onClick={() => {
                if (!item.joined) {
                  item.joined = true;
                  local.groupId = item.GroupId
                  store.tim.joinGroup({ groupID: item.GroupId, type: 'AVChatRoom' });
                } else {
                  item.joined = false;
                  local.groupId = ''
                  store.tim.quitGroup(item.GroupId);
                }
              }}>
              {item.joined ? '✅' : '❌'}{item.GroupId}</div>)
          }</div>
        }</div>
        <div style={{ flex: 1 }}>
          <div id="content" style={{ width: '100%', height: 500, overflowY: 'auto' }} ref={elem => contentRef.current = elem}></div>
          <textarea id="msg" style={{ width: 500, height: 150, resize: 'none', display: 'block', margin: '10px 0' }}></textarea>
          <Button type="primary" size='small' onClick={async () => {
            const t: any = document.querySelector('#msg');
            if (t) {
              console.log(t.value)
            }
            const text = t.value.trim()
            if (text === '') {
              return alert('不能为空')
            }
            if (!local.groupId) {
              return alert('请先进群')
            }
            // 发送群消息
            let message = store.tim.createTextMessage({
              to: local.groupId,
              conversationType: TIM.TYPES.CONV_GROUP,
              payload: {
                text: text
              },
              // v2.18.0起支持群消息已读回执功能，如果您发消息需要已读回执，需购买旗舰版套餐，并且创建消息时将 needReadReceipt 设置为 true
              needReadReceipt: false
            });
            // 发送消息
            let result = await store.tim.sendMessage(message);
            if (result.code === 0) {
              if (contentRef.current) {
                const p = document.createElement('p', {})
                p.textContent = `你 说: ${result.data.message.payload.text}`
                contentRef.current.append(p)
              }
            } else {
              alert('发送失败')
            }
          }}>发送</Button>
        </div>
      </div>

    </div>)}
    </Observer>
  );
};

export default IMPage;