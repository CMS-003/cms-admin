import React, { Fragment, useCallback, useState } from 'react';
import { Button, Image, notification, Popconfirm, Space, Table } from 'antd';
import { Observer, useLocalStore } from 'mobx-react';
import Editor from '@/components/Editor'
import { IWidget, IEditorComponent } from '@/types'
import apis from '@/api'
import { useEffectOnce } from 'react-use';
import { cloneDeep } from 'lodash'
import store from '@/store';
import { IType, IMSTArray } from 'mobx-state-tree'
import Acon from '@/components/Acon';

const WidgetPage: React.FC = () => {
  const local = useLocalStore<{ showEditPage: boolean, isAdd: boolean, temp: IWidget | null, openEditor: Function, list: IWidget[] }>(() => ({
    showEditPage: false,
    list: [],
    temp: null,
    isAdd: false,
    openEditor(data: IWidget) {
      local.showEditPage = true
      local.temp = data
    },
  }))
  const [fields] = useState([
    {
      field: '_id',
      title: '标志类型',
      type: 'string',
      component: IEditorComponent.Input,
      defaultValue: '',
      autoFocus: false,
      value: [],
    },
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
    const result = await apis.getWidgets()
    if (result.code === 0) {
      local.list = result.data.items
      // store.component.setTypes(result.data.items as IMSTArray<IType<IWidget, IWidget, IWidget>>)
    }
  }, [local])
  const addWidget = useCallback(async (params: { body: any }) => {
    const result = local.isAdd ? await apis.addWidget(params) : await apis.updateWidget(params)
    if (result.code === 0) {
      notification.info({ message: local.isAdd ? '修改成功' : '添加成功' })
      await refresh()
    }
  }, [refresh])
  useEffectOnce(() => {
    refresh()
  })
  return (<Observer>{() => <div style={{ padding: '0 10px' }}>
    <Space style={{ padding: 10, width: '100%', justifyContent: 'end' }}>
      <Button type="primary" onClick={e => {
        local.isAdd = true;
        local.openEditor({})
      }}>添加</Button>
      < Button type="primary" onClick={e => {
        refresh()
      }}>刷新</Button>
    </Space>
    <Editor
      isAdd={local.isAdd}
      visible={local.showEditPage}
      close={() => { local.showEditPage = false; local.temp = null }}
      data={local.temp}
      fetch={addWidget}
      fields={fields}
    />
    {/* { pageSize: 999, position: ['bottomRight'] } */}
    <div style={{ flex: 1, overflowY: 'auto' }}>
      <Table pagination={false} rowKey="_id" dataSource={local.list} >
        <Table.Column title="类型标志" dataIndex="_id" />
        <Table.Column title="名称" dataIndex="title" render={(title, record: IWidget) => (
          <span>{record.cover && <Image style={{ width: 24, height: 24, margin: '0 5px' }} src={store.app.imageLine + (record.cover)} />}{title}</span>
        )} />
        <Table.Column title="操作" key="_id" render={(_, record: IWidget) => (
          <Space size="middle" >
            <Acon icon='FormOutlined' onClick={
              () => {
                local.isAdd = false;
                local.openEditor(cloneDeep(record))
              }
            } />
            <Popconfirm title="确定要删除吗?" okText="确定" showCancel={false}
              onConfirm={async () => {
                await apis.destroyWidget({ params: { _id: record._id } })
                await refresh()
              }}
            >
              <Acon icon='DeleteOutlined' />
            </Popconfirm>
          </Space>
        )} />
      </Table>
    </div>
  </div>}</Observer>);
};

export default WidgetPage;