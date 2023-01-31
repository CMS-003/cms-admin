import store from '../../store';
import { Button, Input, notification, Space, Spin, Avatar } from 'antd';
import { SyncOutlined, CheckCircleOutlined } from '@ant-design/icons'
import { Observer, useLocalObservable } from 'mobx-react';
import React, { useCallback, useRef } from 'react';
import shttp from '../../utils/shttp';
import { useEffectOnce } from 'react-use';
import events from '../../utils/events';
import TIM from 'tim-js-sdk'
import styled from 'styled-components'
import { Menu, Item, useContextMenu, TriggerEvent } from 'react-contexify'
import 'react-contexify/dist/ReactContexify.css';
import constant from '../../constant'

const GroupMemberAvatar = styled.img`
  width: 35px;
  height: 35px;
  border-radius: 50%;
`

interface IGroup {
  _id: string;
  title: string;
  status: number;
  cover: string;
  duanmu_enabled: boolean;
  joined?: boolean
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

interface IMessage {
  id: string,
  seq: number;
  text: string;
  user_id?: string;
  name: string;
  cover: string;
  type: string;
  time: string;
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
    mine: IUser,
    members: IMember[],
    groups: IGroup[],
    messages: IMessage[],
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
    mine: { user_id: '', time: 0, name: '', cover: '' },
    members: [],
    messages: []
  }))
  const { show } = useContextMenu({
    id: 'MUTE',
  })
  const handleItemClick = async ({ event, props }: any) => {
    let resp
    try {
      if (local.willMute) {
        resp = await shttp.post(`${store.app.getBaseHost()}/api/v1/im/groups/${local.groupId}/muted`, { members: [local.mute_user_id], seconds: 3600 })
      } else {
        resp = await shttp.delete(`${store.app.getBaseHost()}/api/v1/im/groups/${local.groupId}/muted`).send({ members: [local.mute_user_id], seconds: 0 })
      }
    } catch (e) {
      console.log(e)
    }
    local.mute_user_id = '';
    local.mute_user_seconds = 0;
    await getMembers(local.groupId)
    local.willMute = !local.willMute
  };
  const { show: recall } = useContextMenu({
    id: 'recall'
  });
  const handleRecallClick = async ({ event, props }: any) => {
    const index = local.messages.findIndex(it => it.id === props.id);
    if (index !== -1) {
      local.messages.splice(index, 1);
    }
    await shttp.post(`${store.app.getBaseHost()}/api/v1/im/groups/${props.live_id}/message/recall`, { _id: props.id }, { headers: { 'X-Signature': store.user.im_signatue } })
  };

  const contentRef = useRef<null | Element>(null)
  const getGroups = useCallback(async () => {
    try {
      local.fetchGroups = true
      console.log('get repeat?')
      await shttp.get(`${store.app.getBaseHost()}/api/v1/im/groups/remote`);
      const result = await shttp.get<{ list: IGroup[] }>(`${store.app.getBaseHost()}/api/v1/im/groups`)
      if (result.status === 0) {
        result.data.list.forEach(item => {
          item.joined = local.groupId === item._id;
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
      const result = await store.tim.getGroupMemberList({ groupID, userIDList: [store.app.im_user_id], count: 30, offset: 0 })
      if (result.code === 0) {
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
      const user = await shttp.get(`${store.app.getBaseHost()}/api/v1/im/groups/${local.groupId}/muted`)
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
      await shttp.delete(`${store.app.getBaseHost()}/api/v1/im/users/${user_id}`)
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
        // const p = document.createElement('p', {})
        const opType = data[0].payload.operationType as string;
        if (data[0].type === "TIMGroupTipElem") {
          // p.textContent = `用户:${data[0].payload.userIDList[0]} 类型:${GroupTipType[opType] || ''}`
          local.messages.push({
            id: '',
            user_id: (data[0].payload.userIDList[0] as string),
            type: 'tip',
            text: GroupTipType[opType],
            seq: data[0].sequence as number,
            name: '',
            cover: '',
            time,
          })
        } else if (data[0].type === "TIMGroupSystemNoticeElem") {
          // p.textContent = `系统消息: 用户${data[0].payload.operatorID} 类型:${SystemTipType[opType] || ''}`
          local.messages.push({
            id: '',
            user_id: (data[0].payload.operatorID as string),
            type: 'system',
            text: SystemTipType[opType],
            seq: data[0].sequence as number,
            name: '',
            cover: '',
            time,
          })
        } else {
          local.messages.push({
            id: '',
            user_id: (data[0].payload.userIDList[0] as string),
            type: 'text',
            text: data[0].payload.text,
            seq: data[0].sequence as number,
            name: data[0].nick,
            cover: data[0].avatar,
            time,
          })
          // p.textContent = `${data[0].nick} 说: ${data[0].type === "TIMGroupSystemNoticeElem" ? data[0].payload.userDefinedField : data[0].payload.text}`
        }
        // contentRef.current.append(p)
        if (local.messages.length > 100) {
          local.messages.shift()
        }
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
        <Input addonBefore={'sdkappid'} disabled={local.signined} defaultValue={store.app.im_sdk_appid} onChange={(e: any) => {
          store.app.setIMSdkAppId(e.target.value);
        }} />
        <Input addonBefore={'phone'} disabled={local.signined} defaultValue={store.app.phone} onChange={(e: any) => {
          store.app.setKey('phone', e.target.value)
        }} />
        <Input addonBefore={'password'} disabled={local.signined} defaultValue={store.app.password} onChange={(e: any) => {
          store.app.setKey('password', e.target.value)
        }} />
        <Button type="primary" loading={local.fetchSignature} onClick={async (e) => {
          try {
            if (!store.app.phone) {
              return notification.error({ message: '请先输入phone' })
            }
            if (!store.app.password) {
              return notification.error({ message: '请先输入password' })
            }
            const oauth: any = await shttp.post("http://localhost:8990/oauth/login", { phone: store.app.phone, password: store.app.password, code: '86', ticket: 'PIlHc8S49BpmWoHIgVMGf5N2pPUGaOikP8UQhodvFsDNimDJHpl892BA4UJGYhH5bKN/6CiKZB/YjK9b/hVUU7LSZfHGqbb+n7vtZQE+0+Z4o/Dc/1h8QNTwro/3TXNcJejS+SQeOfNJyV4iTRVxM+X1E9RT3scbFqUXDUcHIOo=' })
            if (oauth.status === '0') {
              store.app.setIMUserId(oauth.data.id);
              store.user.setAccessToken('Bear ' + oauth.data.token);
              local.mine.name = oauth.data.nickname
              local.mine.cover = oauth.data.icon;
            } else {
              notification.error({ message: oauth.message })
            }
            if (local.signined) {
              store.tim.logout().then(() => {
                local.signined = false
              })
              return;
            }
            local.fetchSignature = true
            const result = await shttp.post<{ usersig: string }>(`${store.app.getBaseHost()}/api/v1/im/user/signature`, { user_id: store.app.im_user_id })
            if (result.status === 0) {
              store.user.setIMSignature(result.data.usersig)
              store.tim.login({ userID: store.app.im_user_id, userSig: store.user.im_signatue }).then(function (imResponse: any) {
                // 登录成功
                getGroups()
                if (imResponse.data.repeatLogin === true) {
                  // 标识账号已登录，本次登录操作为重复登录。v2.5.1 起支持
                  console.log(imResponse.data.errorInfo);
                }
                local.signined = true
              }).catch(function (imError: Error) {
                notification.error({ message: imError.message }); // 登录失败的相关信息
              });
            } else {
              notification.error({ message: result.message })
            }
          } catch (e) {
            console.log(e)
          } finally {
            local.fetchSignature = false;
          }
        }}>{local.signined ? '退群' : '用token转IM'}</Button>
        <span>id: {store.app.im_user_id}</span>
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
                key={item._id}
                onClick={async () => {
                  if (item.joined) {
                    item.joined = false;
                    local.groupId = ''
                    store.tim.quitGroup(item._id);
                    local.users = []
                  } else if ('' !== local.groupId) {
                    notification.error({ message: '请先退出加入的群' })
                  } else {
                    item.joined = true;
                    local.groupId = item._id
                    local.messages = [];
                    store.tim.joinGroup({ groupID: item._id, type: 'AVChatRoom' });
                    // 最近20条
                    const latest = await shttp.get<[{ _id: string, type: number, created_time: string, seq: number, from_account: string, user: { nickname: string, icon: string }, payload: [{ type: number, content: string }] }]>(`http://localhost:8989/live/${item._id}/messages?page_size=20`)
                    if (latest.status === '0') {
                      latest.data.reverse().forEach(item => {
                        local.messages.push({
                          id: item._id,
                          seq: item.seq,
                          text: item.payload.filter(it => it.type === 1).map(it => it.content).join(),
                          user_id: item.from_account,
                          name: item.user.nickname,
                          cover: item.user.icon,
                          time: item.created_time,
                          type: 'text'
                        })
                      })
                    }
                    console.log(latest, 'latest')
                    // const result = await shttp.get<{ total: number, items: {Member_Account: string }[] }>(`/api/v1/im/group/${item.GroupId}/members`)
                    // local.users = result.data.items.map(item => ({user_id: item.Member_Account }))
                  }
                }} data-groupid={item._id}>
                <img src={item.cover} alt="" style={{ width: 24, height: 24 }} />{item.title}{item.joined ? '✅' : '❌'}</div>)
            }</div>
          }</div>
        {/* 中间内容区 */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'baseline', height: '100%' }}>
          <div
            id="content"
            style={{ width: '100%', flex: 1, padding: 5, overflowY: 'auto', border: '1px solid #aaa', borderRadius: 10, marginTop: 10 }}
            ref={elem => contentRef.current = elem}
            onContextMenu={(e: TriggerEvent) => {
              const ele = e.target as Element
              e.preventDefault();
              if (ele && ele.tagName === 'P') {
                const id = ele.getAttribute('data-id');
                recall(e, { props: { id, live_id: local.groupId } })
              }
            }}
          >
            {local.messages.map(msg => {
              if (msg.type === 'text') {
                return <p data-id={msg.id} key={msg.seq}>{msg.name} 说: ${msg.text}</p>
              } else if (msg.type === 'tip') {
                return <p key={msg.seq}>{msg.user_id} {msg.text}</p>
              } else if (msg.type === 'system') {
                return <p key={msg.seq}>系统消息 {msg.user_id} {msg.text}</p>
              }
              return null;
            })}
          </div>
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
              console.log(result);
              if (result.code === 0) {
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
                  resp = await shttp.post(`${store.app.getBaseHost()}/api/v1/im/groups/${local.groupId}/muted`, { members: [user.user_id], seconds: 3600 })
                  user.time = 3600
                } else {
                  resp = await shttp.delete(`${store.app.getBaseHost()}/api/v1/im/groups/${local.groupId}/muted`).send({ members: [user.user_id], seconds: 0 })
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
          <Menu id="recall">
            <Item onClick={handleRecallClick}>撤回</Item>
            <Item onClick={() => {

            }}>取消</Item>
          </Menu>
        </div>
      </div>

    </div>)
    }
    </Observer >
  );
};

export default IMPage;