import store from '../../store';
import { Button, Space, Table, Tag } from 'antd';
import type { ColumnsType } from 'antd/lib/table';
import { Observer, useLocalObservable } from 'mobx-react';
import React, { useState } from 'react';
import EditPage from './edit'
import { getSnapshot } from 'mobx-state-tree';

interface DataType {
  key: string;
  title: string;
  name: string;
  type: string;
}

const columns: ColumnsType<DataType> = [
  {
    title: '组件名称',
    dataIndex: 'title',
    key: 'title',
    render: text => <a>{text}</a>,
  },
  {
    title: '组件类型',
    dataIndex: 'name',
    key: 'name',
  },
  {
    title: '分类类型',
    dataIndex: 'type',
    key: 'type',
  },
  {
    title: '可接受子组件',
    key: 'accepts',
    dataIndex: 'accepts',
    render: (accepts: string[]) => (
      <span>
        {accepts.map(name => {
          let color = name.length > 5 ? 'geekblue' : 'green';
          return (
            <Tag color={color} key={name}>
              {name.toUpperCase()}
            </Tag>
          );
        })}
      </span>
    ),
  },
  {
    title: '操作',
    key: 'action',
    render: (_, record) => (
      <Space size="middle">
        <a>Invite {record.name}</a>
        <a>Delete</a>
      </Space>
    ),
  },
];


const ComponentPage: React.FC = () => {
  const local = useLocalObservable(() => ({
    showEditPage: false,
    data: {},
  }))
  const data: DataType[] = []
  return (
    <Observer>{() => (<div>
      <Space>
        <Button type="primary" onClick={e => {
          local.showEditPage = true
        }}>添加</Button>
      </Space>
      <EditPage
        visible={local.showEditPage}
        close={() => { local.showEditPage = false }}
        data={local.data}
      />
      <Table columns={columns} pagination={{ position: ['bottomRight'] }} dataSource={data} />
    </div>)}
    </Observer>
  );
};

export default ComponentPage;