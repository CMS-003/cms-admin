import { Button, notification, Space, Table, Input, Select } from 'antd';
import { Observer, useLocalStore } from 'mobx-react';
import React, { Fragment, useCallback, useRef, useState } from 'react';
import { ILog } from '../../types'
import apis from '@/api'
import { AlignAside } from '@/components/style'
import { useEffectOnce } from 'react-use';
import Acon from '@/components/Acon';
import styled from 'styled-components';

const ContntWrap = styled.span`

`

const ConfigPage: React.FC = () => {
  const local = useLocalStore<{ type: string, group: string, list: ILog[] }>(() => ({
    list: [],
    type: '',
    group: '',
  }))
  const searchInput: any = useRef(null)
  const refresh = useCallback(async () => {
    const result = await apis.getLogs({ type: local.type, group: local.group })
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
          级别:
          <Select defaultValue="" onSelect={type => {
            local.type = type;
          }}>
            <Select.Option value="">全部</Select.Option>
            <Select.Option value="info">info</Select.Option>
            <Select.Option value="error">error</Select.Option>
          </Select>
          <Input ref={ref => searchInput.current = ref} />
          <Button type="primary" onClick={e => {
            refresh()
          }}>搜索</Button>
        </Space>
        <Space>
        </Space>
      </AlignAside>
      <Table style={{ height: '100%' }} pagination={{ position: ['bottomRight'] }} rowKey="_id" dataSource={local.list}>
        <Table.Column title="级别" dataIndex="type" />
        <Table.Column title="组别" dataIndex="group" />
        <Table.Column title="时间" dataIndex="createdAt" render={time => {
          return <span>{new Date(time).toLocaleString()}</span>
        }} />
        <Table.Column title="内容" dataIndex="content" render={(content) => {
          return <ContntWrap title={content}>{content}</ContntWrap>
        }} />
      </Table>
    </div>)}
    </Observer>
  );
};

export default ConfigPage;