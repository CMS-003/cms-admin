import React, { Fragment, useCallback, useState } from 'react';
import { Button, Image, notification, Space, Table } from 'antd';
import { Observer, useLocalObservable } from 'mobx-react';
import Editor from '@/components/Editor'
import { IComponent, IEditorComponent } from '@/types'
import apis from '@/api'
import { useEffectOnce } from 'react-use';
import { cloneDeep } from 'lodash-es'
import store from '@/store';
import { IType, IMSTArray } from 'mobx-state-tree'
import { IComponentType } from '@/types/component.js';
import Acon from '@/components/Acon';

const ComponentTypePage: React.FC = () => {
  const local = useLocalObservable<{ page: number, showEditPage: boolean, temp: IComponent | null, openEditor: Function, list: IComponentType[] }>(() => ({
    showEditPage: false,
    list: [],
    temp: null,
    page: 1,
    openEditor(data: IComponent) {
      local.showEditPage = true
      local.temp = data
    },
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
      field: 'group',
      title: '类别',
      type: 'string',
      component: IEditorComponent.Select,
      defaultValue: 'widget',
      autoFocus: false,
      value: [
        { value: '', name: '无' },
        { value: 'widget', name: '控件' },
        { value: 'container', name: '容器' },
        { value: 'component', name: '组件' },
      ],
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
    // {
    //   field: 'available',
    //   title: '是否可用',
    //   type: 'boolean',
    //   component: IEditorComponent.Switch,
    //   defaultValue: false,
    //   value: [{ name: '可用', value: 1 }, { name: '不可用', value: 0 }],
    //   autoFocus: false,
    // },
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
      notification.info({ title: params.body._id ? '修改成功' : '添加成功', placement: 'top' })
      await refresh()
    }
  }, [refresh])
  useEffectOnce(() => {
    refresh()
  })
  return (<Observer>{() => <div style={{ padding: 10, height: '100%', display: 'flex', flexDirection: 'column' }}>
    <Space style={{ padding: '0 10px 10px', width: '100%', justifyContent: 'end' }}>
      <Button type="primary" onClick={e => {
        local.openEditor({})
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
      <Table pagination={{ current: local.page, }} rowKey="_id" dataSource={local.list} sticky={true} style={{ overflow: 'auto' }} onChange={(e) => {
        local.page = e.current || 0
      }}>
        <Table.Column title="序号" dataIndex="order" width={60} />
        <Table.Column title="名称" dataIndex="title" render={(title, record: IComponent) => (
          <span><Image style={{ width: 24, height: 24, margin: '0 5px' }} src={store.app.imageLine + (record.cover ? record.cover : '/images/nocover.jpg')} />{title}</span>
        )} />
        <Table.Column title="类型" dataIndex="name" />
        <Table.Column title="类别" dataIndex="group" />
        <Table.Column title="accepts" dataIndex="accepts" render={(types) => types.join(',')} />
        <Table.Column title="操作" key="_id" render={(_, record: IComponent) => (
          <Space size="middle" >
            <Acon icon='Edit' onClick={
              () => {
                local.openEditor(cloneDeep(record))
              }
            } />
            <Acon icon='CircleX' onClick={async () => {
              await apis.destroyComponentTypes({ params: { _id: record._id } })
              await refresh()
            }} />
          </Space>
        )} />
      </Table>
    </div>
  </div>}</Observer>);
};

export default ComponentTypePage;