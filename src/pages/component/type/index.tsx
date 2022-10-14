import React, { Fragment, useCallback, useState } from 'react';
import { Button, notification, Space, Table } from 'antd';
import { DeleteOutlined, FormOutlined } from '@ant-design/icons'
import { Observer, useLocalObservable } from 'mobx-react';
import Editor from '@/components/Editor'
import { Component, EditorComponent } from '@/types'
import apis from '@/api'
import { useEffectOnce } from 'react-use';
import { cloneDeep } from 'lodash'

const ComponentTypePage: React.FC = () => {
  const local = useLocalObservable<{ showEditPage: boolean, temp: Component, openEditor: Function, list: Component[] }>(() => ({
    showEditPage: false,
    list: [],
    temp: {},
    openEditor(data: Component) {
      local.showEditPage = true
      local.temp = data
    }
  }))
  const [fields] = useState([
    {
      field: 'title',
      title: '名称',
      type: 'string',
      component: EditorComponent.Input,
      defaultValue: '',
      autoFocus: false,
      value: []
    },
    {
      field: 'name',
      title: '类型',
      type: 'string',
      component: EditorComponent.Input,
      defaultValue: '',
      autoFocus: false,
      value: [],
    },
    {
      field: 'order',
      title: '序号',
      type: 'number',
      component: EditorComponent.Input,
      defaultValue: 1,
      value: [],
      autoFocus: false,
    },
  ])
  const refresh = useCallback(async () => {
    const result = await apis.getComponentTypes()
    if (result.code === 0) {
      local.list = result.data.items
    }
  }, [])
  const addComponentType = useCallback(async (params: { body: any }) => {
    const result = params.body.id ? await apis.updateComponentTypes(params) : await apis.addComponentTypes(params)
    if (result.code === 0) {
      notification.info({ message: params.body.id ? '修改成功' : '添加成功' })
      await refresh()
    }
  }, [])
  useEffectOnce(() => {
    refresh()
  })
  return (<Observer>{() => <Fragment>
    <Space style={{ padding: 10, width: '100%', justifyContent: 'end' }}>
      <Button type="primary" onClick={e => {
        local.showEditPage = true
      }}>添加</Button>
      < Button type="primary" onClick={e => {
        refresh()
      }}>刷新</Button>
    </Space>
    <Editor
      visible={local.showEditPage}
      close={() => { local.showEditPage = false; local.temp = {} }}
      data={local.temp}
      fetch={addComponentType}
      fields={fields}
    />
    {/* { pageSize: 999, position: ['bottomRight'] } */}
    <div style={{ flex: 1, overflowY: 'auto' }}>
      <Table pagination={false} rowKey="id" dataSource={local.list} >
        <Table.Column title="名称" dataIndex="title" />
        <Table.Column title="类型" dataIndex="name" />
        <Table.Column title="操作" key="id" render={(_, record: Component) => (
          <Space size="middle" >
            <FormOutlined onClick={
              () => {
                local.openEditor(cloneDeep(record))
              }
            } />
            <DeleteOutlined onClick={async () => {
              await apis.destroyComponentTypes({ params: { id: record.id } })
              await refresh()
            }} />
          </Space>
        )} />
      </Table>
    </div>
  </Fragment>}</Observer>);
};

export default ComponentTypePage;