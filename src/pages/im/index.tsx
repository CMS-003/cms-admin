import store from '../../store';
import { Button, notification, Space, Spin } from 'antd';
import { SyncOutlined } from '@ant-design/icons'
import { Observer, useLocalObservable } from 'mobx-react';
import React, { useCallback, useRef } from 'react';
import shttp from '../../utils/shttp';
import { useEffectOnce } from 'react-use';
import events from '../../utils/events';
import TIM from 'tim-js-sdk'
import styled from 'styled-components'
import { Menu, Item, useContextMenu, TriggerEvent } from 'react-contexify'
import 'react-contexify/dist/ReactContexify.css';

const GroupMemberAvatar = styled.img`
  width: 35px;
  height: 35px;
  border-radius: 50%;
`

interface IGroup {
  GroupId: string, joined?: boolean
}

interface IMember {
  user_id: string;
  name?: string;
  cover?: string;
  seconds: number;
}
interface IUser {
  user_id: string, time: number, cover?: string, name?: string
}

const GroupTipType: { [key: string]: string } = {
  '1': '加入',
  '2': '退出',
  '3': '被踢出',
  '4': '成为管理员',
  '5': '被撤销管理员',
  '6': '组群资料变更',
  '7': '用户资料变更',
  '10': '被封',
  '11': '被解封',
}

const SystemTipType: { [key: string]: string } = {
  '1': '申请加入',
  '2': '申请加入被同意',
  '3': '申请加入被拒绝',
  '4': '被踢出群',
  '5': '群被解散',
  '6': '创建群',
  '7': '邀请加群',
  '8': '退出群',
  '9': '被设为管理员',
  '10': '被取消管理员',
  '11': '群被回收',
  '12': '收到加群邀请',
  '13': '邀请加群，被同意',
  '14': '邀请加群，被拒绝',
  '15': '已读上报多终端同步',
  '20': '群消息提醒类型设置多终端、多实例同步通知',
  '21': '被封',
  '22': '解封',
  '255': '自定义通知',
}

const IMPage: React.FC = () => {
  const local = useLocalObservable<{
    groupId: string,
    signined: boolean,
    fetchMuted: boolean,
    fetchGroups: boolean,
    fetchMembers: boolean,
    fetchSignature: boolean,
    fetchRemoveUser: boolean,
    mute_user_id: string,
    mute_user_seconds: number,
    willMute: boolean,
    users: IUser[],
    members: IMember[],
    groups: IGroup[],
  }>(() => ({
    signined: false,
    fetchSignature: false,
    fetchGroups: false,
    fetchMembers: false,
    fetchMuted: false,
    fetchRemoveUser: false,
    mute_user_id: '',
    mute_user_seconds: 0,
    willMute: false,
    groups: [],
    groupId: '',
    users: [],
    members: []
  }))
  const { show } = useContextMenu({
    id: 'MUTE',
  })
  const handleItemClick = async ({ event, props }: any) => {
    let resp
    try {
      if (local.willMute) {
        resp = await shttp.post(`/api/v1/im/groups/${local.groupId}/muted`, { members: [local.mute_user_id], seconds: 3600 })
      } else {
        resp = await shttp.delete(`/api/v1/im/groups/${local.groupId}/muted`).send({ members: [local.mute_user_id], seconds: 0 })
      }
    } catch (e) {
      console.log(e)
    }
    local.mute_user_id = '';
    local.mute_user_seconds = 0;
    await getMembers(local.groupId)
    local.willMute = !local.willMute
  };

  const contentRef = useRef<null | Element>(null)
  const getGroups = useCallback(async () => {
    try {
      local.fetchGroups = true
      const result = await shttp.get<{ list: { GroupId: string, joined?: boolean }[] }>('/api/v1/im/groups/remote')
      if (result.status === 0) {
        result.data.list.forEach(item => {
          item.joined = local.groupId === item.GroupId
        })
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
  const getMembers = useCallback(async (groupID: string) => {
    if (groupID) {
      const result = await store.tim.getGroupMemberList({ groupID, userIDList: ['ttt'], count: 30, offset: 0 })
      if (result.status === 0) {
        local.members = result.data.memberList.map((member: any) => ({ user_id: member.userID, name: member.nick, cover: member.avatar, seconds: member.muteUntil }))
      } else {
        notification.warn({ message: '获取群成员失败' })
      }
    } else {
      notification.warn({ message: '请先选择群' })
    }
  }, [])
  const getMutedUsers = useCallback(async () => {
    if (!local.groupId) {
      return notification.error({ message: '没有加入群' })
    }
    try {
      local.fetchMuted = true
      const user = await shttp.get(`/api/v1/im/groups/${local.groupId}/muted`)
      local.users = user.data.list.map((item: any) => ({ user_id: item.Member_Account, time: item.ShuttedUntil }))
    } catch (e) {
      console.log(e)
    } finally {
      local.fetchMuted = false
    }
  }, [])
  const removeUser = useCallback(async (user_id: string) => {
    if (!local.groupId) {
      return notification.error({ message: '没有加入群' })
    }
    try {
      local.fetchRemoveUser = true
      await shttp.delete(`/api/v1/im/users/${user_id}`)
      await getMembers(local.groupId);
    } catch (e) {
      console.log(e)
    } finally {
      local.fetchRemoveUser = false
    }
  }, []);
  function messager(event: any) {
    const { name, data } = event;
    // "TIMGroupTipElem" 修改群profile
    // "TIMGroupSystemNoticeElem" 群系统通知
    // onMessageReceived
    if (name === "onGroupListUpdated" && data.length === 1 && data[0].type === "TIMTextElem") {
      if (contentRef.current) {
        const p = document.createElement('p', {})
        p.textContent = `${data[0].from} 说: ${data[0].payload.text}`
        contentRef.current.append(p)
      }
    }
    if (name === "onMessageReceived") {
      const time = new Date(data[0].time * 1000).toLocaleString();
      if (contentRef.current) {
        const p = document.createElement('p', {})
        const opType = data[0].payload.operationType as string;
        if (data[0].type === "TIMGroupTipElem") {
          p.textContent = `用户:${data[0].payload.userIDList[0]} 类型:${GroupTipType[opType] || ''}`
        } else if (data[0].type === "TIMGroupSystemNoticeElem") {
          p.textContent = `系统消息: 用户${data[0].payload.operatorID} 类型:${SystemTipType[opType] || ''}`
        } else {
          p.textContent = `${data[0].from} 说: ${data[0].type === "TIMGroupSystemNoticeElem" ? data[0].payload.userDefinedField : data[0].payload.text}`
        }
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
    <Observer>{() => (<div style={{ height: 'calc(100vh - 175px)' }}>
      <Space>
        <Button type="primary" loading={local.fetchSignature} onClick={async (e) => {
          try {
            local.fetchSignature = true
            const result = await shttp.post<{ usersig: string }>('/api/v1/im/user/signature', { user_id: 'ttt' })
            if (result.status === 0) {
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
          if (local.signined) {
            store.tim.logout().then((data: any) => {
              console.log(data)
              local.signined = false
            })
          } else {
            let promise = store.tim.login({ userID: 'ttt', userSig: store.user.im_signatue });
            promise.then(function (imResponse: any) {
              console.log(imResponse.data); // 登录成功
              if (imResponse.data.repeatLogin === true) {
                // 标识账号已登录，本次登录操作为重复登录。v2.5.1 起支持
                console.log(imResponse.data.errorInfo);
              }
              local.signined = true
            }).catch(function (imError: Error) {
              console.warn('login error:', imError); // 登录失败的相关信息
            });
          }
        }}>{local.signined ? '退出' : '登录'}</Button>
        <span>sig过期则重新获取 =&gt; 登录 =&gt;加入群</span>
      </Space>
      <div style={{ display: 'flex', flexDirection: 'row', height: '100%' }}>
        <div style={{ width: 200, padding: 5, backgroundColor: '#dfe98ae6', margin: '10px 10px 0 0' }}>
          <div>
            群列表 <SyncOutlined onClick={() => {
              getGroups()
            }} />
          </div>
          {local.fetchGroups ? <Spin /> : <div>
            {
              local.groups.map((item) => <div
                key={item.GroupId}
                onClick={async () => {
                  if (item.joined) {
                    item.joined = false;
                    local.groupId = ''
                    store.tim.quitGroup(item.GroupId);
                    local.users = []
                  } else if ('' !== local.groupId) {
                    notification.error({ message: '请先退出加入的群' })
                  } else {
                    item.joined = true;
                    local.groupId = item.GroupId
                    store.tim.joinGroup({ groupID: item.GroupId, type: 'AVChatRoom' });
                    // const result = await shttp.get<{ total: number, items: { Member_Account: string }[] }>(`/api/v1/im/group/${item.GroupId}/members`)
                    // local.users = result.data.items.map(item => ({ user_id: item.Member_Account }))
                  }
                }}>
                {item.joined ? '✅' : '❌'}{item.GroupId}</div>)
            }</div>
          }</div>
        {/* 中间内容区 */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'baseline', height: '100%' }}>
          <div id="content" style={{ width: '100%', flex: 1, padding: 5, overflowY: 'auto', border: '1px solid #aaa', borderRadius: 10, marginTop: 10 }} ref={elem => contentRef.current = elem}></div>
          <textarea id="msg" style={{ width: 500, height: 150, borderRadius: 10, padding: 5, resize: 'none', display: 'block', margin: '10px 0' }}></textarea>
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
            try {
              // 发送消息
              let result = await store.tim.sendMessage(message);
              if (result.status === 0) {
                if (contentRef.current) {
                  const p = document.createElement('p', {})
                  p.className = 'txt-right';
                  p.textContent = `你 说: ${result.data.message.payload.text}`
                  contentRef.current.append(p)
                  t.value = ''
                }
              } else {
                alert('发送失败')
              }
            } catch (e: any) {
              console.log(e, e.code)
              // 80003 超时
              notification.warn({ message: [10016, 8001].includes(e.code) ? '发送被拒绝' : e.message })
            }
          }}>发送</Button>
        </div>
        <div style={{ width: 200, backgroundColor: '#ac8bcd', margin: '10px 0 0 10px' }}>
          <div>
            <div>
              群禁言列表
              <SyncOutlined onClick={() => {
                getMutedUsers()
              }} />
            </div>
            {local.fetchMuted && <Spin />}
            {local.users.map(user => <div key={user.user_id} onClick={async () => {
              console.log(user)
              let resp
              try {
                if (user.time === 0) {
                  resp = await shttp.post(`/api/v1/im/groups/${local.groupId}/muted`, { members: [user.user_id], seconds: 3600 })
                  user.time = 3600
                } else {
                  resp = await shttp.delete(`/api/v1/im/groups/${local.groupId}/muted`).send({ members: [user.user_id], seconds: 0 })
                  user.time = 0
                }
                console.log(resp)
              } catch (e) {
                console.log(e)
              }
            }}>
              {user.user_id} {user.time}
            </div>)}
          </div>
          <div>
            <div>
              群成员列表
              <SyncOutlined onClick={() => {
                getMembers(local.groupId)
              }} /></div>
            {local.fetchMembers && <Spin />}
            {local.members.map(member => <div key={member.user_id} style={{ margin: 5 }} onContextMenu={(e: TriggerEvent) => {
              e.preventDefault();
              // props: { user_id: memgber.user_id }
              local.mute_user_id = member.user_id
              local.mute_user_seconds = member.seconds
              local.willMute = local.mute_user_seconds * 1000 < Date.now()
              show(e)
            }}>
              <GroupMemberAvatar src={member.cover || ''} />{member.name || member.user_id}
            </div>)}
          </div>
          <Menu id="MUTE">
            <Item onClick={handleItemClick}>{local.willMute ? '禁言' : '取消禁言'}</Item>
            <Item onClick={() => {
              removeUser(local.mute_user_id);
            }}>删除成员</Item>
          </Menu>
        </div>
      </div>

    </div>)
    }
    </Observer >
  );
};

export default IMPage;