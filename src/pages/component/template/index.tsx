import React, { Fragment, useCallback, useState } from 'react';
import { Button, notification, Space, Table } from 'antd';
import { FormOutlined } from '@ant-design/icons'
import { Observer, useLocalObservable } from 'mobx-react';
import Editor from '@/components/Editor'
import { Component, EditorComponent } from '@/types'
import apis from '@/api'
import { useEffectOnce } from 'react-use';
import { cloneDeep } from 'lodash'

const ComponentTemplatePage: React.FC = () => {
  const local = useLocalObservable<{ showEditPage: boolean, temp: Component, openEditor: Function, list: Component[] }>(() => ({
    showEditPage: false,
    list: [],
    temp: {},
    openEditor(data: Component) {
      local.showEditPage = true
      local.temp = data
    }
  }))
  const [fields, setFields] = useState([
    {
      field: 'type',
      title: '组件类型',
      type: 'string',
      component: EditorComponent.Select,
      defaultValue: '',
      autoFocus: false,
      value: []// store.component.types.forEach(item => ({ name: item.title, value: item.name })),
    },
    {
      field: 'id',
      title: '',
      type: 'string',
      component: EditorComponent.Input,
      defaultValue: '',
      autoFocus: false,
      value: [],
    },
    {
      field: 'title',
      title: '组件名称',
      type: 'string',
      component: EditorComponent.Input,
      defaultValue: '',
      autoFocus: false,
      value: [],
    },
    {
      field: 'name',
      title: '标识名称',
      type: 'string',
      component: EditorComponent.Input,
      defaultValue: '',
      autoFocus: false,
      value: [],
    },
    {
      field: 'desc',
      title: '组件描述',
      type: 'string',
      component: EditorComponent.Input,
      defaultValue: '',
      autoFocus: false,
      value: [],
    },
    {
      field: 'tree_id',
      title: '根组件',
      type: 'string',
      component: EditorComponent.RemoteSelect,
      defaultValue: '',
      autoFocus: false,
      value: [],
      fetch: apis.getComponents
    },
    {
      field: 'parent_id',
      title: '父组件',
      type: 'string',
      component: EditorComponent.RemoteSelect,
      defaultValue: '',
      autoFocus: false,
      value: [],
      fetch: apis.getComponents
    },
    {
      field: 'available',
      title: '是否可用',
      type: 'boolean',
      component: EditorComponent.Switch,
      defaultValue: false,
      value: [{ name: '可用', value: 1 }, { name: '不可用', value: 0 }],
      autoFocus: false,
    },
    {
      field: 'cover',
      title: '图片',
      type: 'string',
      component: EditorComponent.Image,
      defaultValue: '',
      value: [],
      autoFocus: false,
    },
    {
      field: 'attrs',
      title: '属性',
      type: 'json',
      component: EditorComponent.Editor,
      defaultValue: '',
      value: [],
      autoFocus: false,
    },
  ])
  const refresh = useCallback(async () => {
    const result = await apis.getComponentTemplates()
    if (result.code === 0) {
      local.list = result.data.items
    }
  }, [])
  const updateComponent = useCallback(async (params: { body: any }) => {
    const result = await apis.updateComponent(params)
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
      < Button type="primary" onClick={e => {
        refresh()
      }}>刷新</Button>
    </Space>
    <Editor
      visible={local.showEditPage}
      close={() => { local.showEditPage = false; local.temp = {} }}
      data={local.temp}
      fetch={updateComponent}
      fields={fields}
    />
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
          </Space>
        )} />
      </Table>
    </div>
  </Fragment>}</Observer>);
};

export default ComponentTemplatePage;