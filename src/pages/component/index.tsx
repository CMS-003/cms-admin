import store from '../../store';
import { Button, notification, Space, Table, Tag } from 'antd';
import { DeleteOutlined, FormOutlined } from '@ant-design/icons'
import type { ColumnsType } from 'antd/lib/table';
import { Observer, useLocalObservable } from 'mobx-react';
import React, { Fragment, useCallback, useEffect, useState } from 'react';
import EditPage from './edit'
import { getSnapshot } from 'mobx-state-tree';
import { Component } from '../../types'
import apis from '@/api'
import { useEffectOnce } from 'react-use';
import { cloneDeep } from 'lodash'

const ComponentPage: React.FC = () => {
  const local = useLocalObservable<{ showEditPage: boolean, temp: Component, openEditor: Function, list: Component[] }>(() => ({
    showEditPage: false,
    list: [],
    temp: {},
    openEditor(data: Component) {
      local.showEditPage = true
      local.temp = data
    }
  }))
  const refresh = useCallback(async () => {
    const result = await apis.getComponents()
    if (result.code === 0) {
      local.list = result.data.items
    }
  }, [])
  const addComponent = useCallback(async (params: { body: any }) => {
    const result = await apis.createComponent(params)
    if (result.code === 0) {
      notification.info({ message: '添加成功' })
      await refresh()
    }
  }, [])
  useEffectOnce(() => {
    refresh()
  })
  return (
    <Observer>{() => (<Fragment>
      <Space style={{ marginBottom: 10 }}>
        <Button type="primary" onClick={e => {
          local.showEditPage = true
        }}>添加</Button>
        <Button type="primary" onClick={e => {
          refresh()
        }}>刷新</Button>
      </Space>
      <EditPage
        visible={local.showEditPage}
        close={() => { local.showEditPage = false; local.temp = {} }}
        data={local.temp}
        fetch={addComponent}
      />
      <Table style={{ height: '100%' }} pagination={{ position: ['bottomRight'] }} rowKey="id" dataSource={local.list}>
        <Table.Column title="组件名称" dataIndex="title" />
        <Table.Column title="组件类型" dataIndex="name" />
        <Table.Column title="分类类型" dataIndex="type" />
        <Table.Column title="可接受子组件" dataIndex="accepts" render={(accepts: string[], record, i: number) => (<span key={i} >
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
        </span >)} />
        <Table.Column title="操作" key="id" render={(_, record: Component) => (
          <Space size="middle">
            <FormOutlined onClick={() => {
              local.openEditor(cloneDeep(record))
            }} />
            <DeleteOutlined onClick={async () => {
              await apis.destroyComponent({ params: { id: record.id } })
              await refresh()
            }} />
          </Space>
        )} />
      </Table>
    </Fragment>)}
    </Observer>
  );
};

export default ComponentPage;