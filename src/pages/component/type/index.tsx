import React, { Fragment, useCallback, useState } from 'react';
import { Button, Image, notification, Space, Table } from 'antd';
import { DeleteOutlined, FormOutlined } from '@ant-design/icons'
import { Observer, useLocalObservable } from 'mobx-react';
import Editor from '@/components/Editor'
import { IComponent, IEditorComponent } from '@/types'
import apis from '@/api'
import { useEffectOnce } from 'react-use';
import { cloneDeep } from 'lodash'
import store from '@/store';
import { IType, IMSTArray } from 'mobx-state-tree'
import { IComponentType } from '@/types/component.js';

const ComponentTypePage: React.FC = () => {
  const local = useLocalObservable<{ showEditPage: boolean, temp: IComponent | null, openEditor: Function, list: IComponentType[] }>(() => ({
    showEditPage: false,
    list: [],
    temp: null,
    openEditor(data: IComponent) {
      local.showEditPage = true
      local.temp = data
    }
  }))
  const [fields] = useState([
    {
      field: 'title',
      title: '名称',
      type: 'string',
      component: IEditorComponent.Input,
      defaultValue: '',
      autoFocus: false,
      value: []
    },
    {
      field: 'name',
      title: '类型',
      type: 'string',
      component: IEditorComponent.Input,
      defaultValue: '',
      autoFocus: false,
      value: [],
    },
    {
      field: 'cover',
      title: '图片',
      type: 'string',
      component: IEditorComponent.Image,
      defaultValue: '',
      autoFocus: false,
      value: [],
    },
    {
      field: 'order',
      title: '序号',
      type: 'number',
      component: IEditorComponent.Input,
      defaultValue: 1,
      value: [],
      autoFocus: false,
    },
    {
      field: 'status',
      title: '状态',
      type: 'number',
      component: IEditorComponent.Select,
      defaultValue: 1,
      value: [{ value: 1, name: '正常' }, { value: 2, name: '弃用' }],
      autoFocus: false,
    },
  ])
  const refresh = useCallback(async () => {
    const result = await apis.getComponentTypes()
    if (result.code === 0) {
      local.list = result.data.items
      store.component.setTypes(result.data.items as IMSTArray<IType<IComponentType, IComponentType, IComponentType>>)
    }
  }, [local])
  const addComponentType = useCallback(async (params: { body: any }) => {
    const result = params.body._id ? await apis.updateComponentTypes(params) : await apis.addComponentTypes(params)
    if (result.code === 0) {
      notification.info({ message: params.body._id ? '修改成功' : '添加成功' })
      await refresh()
    }
  }, [refresh])
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
      close={() => { local.showEditPage = false; local.temp = null }}
      data={local.temp}
      fetch={addComponentType}
      fields={fields}
    />
    {/* { pageSize: 999, position: ['bottomRight'] } */}
    <div style={{ flex: 1, overflowY: 'auto' }}>
      <Table pagination={false} rowKey="id" dataSource={local.list} >
        <Table.Column title="名称" dataIndex="title" render={(title, record: IComponent) => (
          <span><Image style={{ width: 24, height: 24, margin: '0 5px' }} src={store.app.imageLine + (record.cover ? record.cover : '/images/nocover.jpg')} />{title}</span>
        )} />
        <Table.Column title="类型" dataIndex="name" />
        <Table.Column title="操作" key="id" render={(_, record: IComponent) => (
          <Space size="middle" >
            <FormOutlined onClick={
              () => {
                local.openEditor(cloneDeep(record))
              }
            } />
            <DeleteOutlined onClick={async () => {
              console.log(record, '?')
              await apis.destroyComponentTypes({ params: { _id: record._id } })
              await refresh()
            }} />
          </Space>
        )} />
      </Table>
    </div>
  </Fragment>}</Observer>);
};

export default ComponentTypePage;