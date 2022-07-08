import store from '../../store';
import { Button, Space, Table, Tag } from 'antd';
import type { ColumnsType } from 'antd/lib/table';
import { Observer, useLocalObservable } from 'mobx-react';
import React, { useCallback, useEffect, useState } from 'react';
import EditPage from './edit'
import { getSnapshot } from 'mobx-state-tree';
import { Component } from '../../types'
import { createComponent, destroyComponent } from '../../api'

interface DataType {
  key: string;
  title: string;
  name: string;
  type: string;
  dataIndex: string;
}

const columns: ColumnsType<Component> = [
  {
    title: '组件名称',
    dataIndex: 'title',
    key: 'id',
    render: text => <a>{text}</a>,
  },
  {
    title: '组件类型',
    dataIndex: 'name',
    key: 'id',
  },
  {
    title: '分类类型',
    dataIndex: 'type',
    key: 'id',
  },
  {
    title: '可接受子组件',
    dataIndex: 'accepts',
    key: 'id',
    render: (accepts: string[], record, i: number) => (<span key={i} >
      {
        accepts.map((name, j) => {
          let color = name.length > 5 ? 'geekblue' : 'green';
          return (
            <Tag color={color} key={j}>
              {name.toUpperCase()}
            </Tag>
          );
        })
      }
    </span >),
  },
  {
    title: '操作',
    key: 'id',
    render: (_, record) => (
      <Space size="middle">
        <Button onClick={() => {
          destroyComponent({ params: { id: record.id } })
        }}>delete</Button>
      </Space>
    ),
  },
];


const ComponentPage: React.FC = () => {
  const local = useLocalObservable<{ showEditPage: boolean, data: Component[] }>(() => ({
    showEditPage: false,
    data: store.component.getList(),
  }))
  const refresh = useCallback(async () => {

  }, [])
  return (
    <Observer>{() => (<div>
      <Space>
        <Button type="primary" onClick={e => {
          local.showEditPage = true
        }}>添加</Button>
        <Button type="primary" onClick={e => {
          refresh()
        }}>刷新</Button>
      </Space>
      <EditPage
        visible={local.showEditPage}
        close={() => { local.showEditPage = false }}
        data={local.data}
        fetch={createComponent}
      />
      <Table columns={columns} pagination={{ position: ['bottomRight'] }} dataSource={data} />
    </div>)}
    </Observer>
  );
};

export default ComponentPage;