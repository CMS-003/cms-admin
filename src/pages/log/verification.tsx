import { Button, notification, Space, Table, Input, Select } from 'antd';
import { Observer, useLocalObservable } from 'mobx-react';
import React, { Fragment, useCallback, useRef, useState } from 'react';
import { ILog, IVerification } from '../../types'
import apis from '@/api'
import { AlignAside } from '@/components/style'
import { useEffectOnce } from 'react-use';
import Acon from '@/components/Acon';
import styled from 'styled-components';

const ContntWrap = styled.span`

`
const Types: { [key: number]: string } = {
  1: '注册',
  2: '登陆',
  3: '修改密码',
  4: '忘记密码',
  5: '注销',
  6: '绑定',
}
const ConfigPage: React.FC = () => {
  const local = useLocalObservable<{ method: string, type: string, page: number, list: IVerification[] }>(() => ({
    list: [],
    method: '',
    type: '',
    page: 1,
  }))
  const receiverInput: any = useRef(null)
  const refresh = useCallback(async () => {
    const result = await apis.getCodes({ type: local.type, method: local.method, page: local.page })
    if (result.code === 0) {
      local.list = result.data.items
    }
  }, []);
  useEffectOnce(() => {
    refresh()
  })
  return (
    <Observer>{() => (<div style={{ padding: '0 10px' }}>
      <AlignAside style={{ margin: 10 }}>
        <Space>
          方式:
          <Select defaultValue={""} style={{ width: 100 }} onSelect={method => {
            local.method = method;
          }}>
            <Select.Option value="">全部</Select.Option>
            <Select.Option value="email">邮箱</Select.Option>
            <Select.Option value="phone">短信</Select.Option>
          </Select>
          类型:
          <Select defaultValue="" onSelect={type => {
            local.type = type;
          }}>
            <Select.Option value="">全部</Select.Option>
            <Select.Option value="1">注册</Select.Option>
            <Select.Option value="2">登陆</Select.Option>
            <Select.Option value="3">修改密码</Select.Option>
            <Select.Option value="4">忘记密码</Select.Option>
            <Select.Option value="5">注销</Select.Option>
            <Select.Option value="6">绑定</Select.Option>
          </Select>

          <Input ref={ref => receiverInput.current = ref} />
          <Button type="primary" onClick={e => {
            refresh()
          }}>搜索</Button>
        </Space>
        <Space>
        </Space>
      </AlignAside>
      <Table style={{ height: '100%' }} pagination={{ position: ['bottomRight'] }} rowKey="_id" dataSource={local.list}>
        <Table.Column title="类型" width={80} dataIndex="type" render={(type) => {
          return Types[type];
        }} />
        <Table.Column title="方式" dataIndex="method" />
        <Table.Column title="验证码" dataIndex="code" />
        <Table.Column title="内容" dataIndex="content" render={content => {
          return <p style={{ minWidth: 500, maxWidth: '80%', marginBottom: 0, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{content}</p>
        }} />
        <Table.Column title="发送时间" dataIndex="createdAt" render={time => {
          return <span>{new Date(time).toLocaleString()}</span>
        }} />
      </Table>
    </div>)}
    </Observer>
  );
};

export default ConfigPage;