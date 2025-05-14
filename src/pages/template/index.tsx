import React, { Fragment, useCallback, useState } from 'react';
import { Button, notification, Space, Table, Select, message, Popconfirm } from 'antd';
import { Observer, useLocalObservable } from 'mobx-react';
import Editor from '@/components/Editor'
import { IComponent, IEditorComponent, ITemplate } from '@/types'
import apis from '@/api'
import { useEffectOnce } from 'react-use';
import { cloneDeep } from 'lodash'
import store from '@/store';
import Acon from '@/components/Acon';
import CopyToClipboard from 'react-copy-to-clipboard';
import { useNavigate } from 'react-router-dom';
import { runInAction } from 'mobx';

const ComponentTemplatePage: React.FC = () => {
  const navigate = useNavigate();
  const local = useLocalObservable<{ loading: boolean, showEditPage: boolean, temp: ITemplate | null, openEditor: Function, list: ITemplate[], types: { name: string, value: string }[], selectedProjectId: string }>(() => ({
    loading: false,
    showEditPage: false,
    list: [],
    temp: null,
    selectedProjectId: store.app.project_id === 'manager' ? '' : store.app.project_id,
    types: store.component.types.map(item => ({ name: item.title, value: item.name })),
    openEditor(data: ITemplate) {
      local.temp = data
      local.showEditPage = true
    }
  }))
  const [fields] = useState([
    {
      field: '_id',
      title: '模板id',
      type: 'string',
      component: IEditorComponent.Read,
      defaultValue: '',
      autoFocus: false,
      value: [],
    },
    {
      field: 'project_id',
      title: '所属项目',
      type: 'string',
      component: IEditorComponent.Select,
      defaultValue: '',
      autoFocus: false,
      value: store.project.list.map(it => ({ name: it.title, value: it._id })),
    },
    {
      field: 'title',
      title: '模板名称',
      type: 'string',
      component: IEditorComponent.Input,
      defaultValue: '',
      autoFocus: true,
      value: [],
    },
    {
      field: 'name',
      title: '标识名称',
      type: 'string',
      component: IEditorComponent.Input,
      defaultValue: '',
      autoFocus: false,
      value: [],
    },
    {
      field: 'type',
      title: '类型',
      type: 'string',
      component: IEditorComponent.Select,
      defaultValue: '',
      autoFocus: false,
      value: [
        { name: '应用', value: 'app' },
        { name: '列表页', value: 'page' },
        { name: '表单页', value: 'form' },
        { name: '前端动态页', value: 'Dynamic' },
        { name: '前端视频页', value: 'Video' },
        { name: '前端文章页', value: 'Article' },
        { name: '前端图片页', value: 'Gallery' },
        { name: '前端频道页', value: 'Channel' },
      ],
    },
    {
      field: 'desc',
      title: '模板描述',
      type: 'string',
      component: IEditorComponent.Area,
      defaultValue: '',
      autoFocus: false,
      value: [],
    },
    {
      field: 'order',
      title: '序号',
      type: 'number',
      component: IEditorComponent.Number,
      defaultValue: 1,
      value: [{ name: '可用', value: 1 }, { name: '不可用', value: 0 }],
      autoFocus: false,
    },
    {
      field: 'cover',
      title: '图片',
      type: 'string',
      component: IEditorComponent.Image,
      defaultValue: '',
      value: [],
      autoFocus: false,
    },
    {
      field: 'attrs',
      title: '属性',
      type: 'json',
      component: IEditorComponent.Editor,
      defaultValue: '',
      value: [],
      autoFocus: false,
    },
    {
      field: 'style',
      title: '样式',
      type: 'json',
      component: IEditorComponent.Editor,
      defaultValue: '',
      value: [],
      autoFocus: false,
    },
  ])
  const refresh = useCallback(async () => {
    try {
      local.loading = true;
      const result = await apis.getTemplates({ query: { project_id: local.selectedProjectId } })
      if (result.code === 0) {
        runInAction(() => {
          local.list = result.data.items
        })
      } else {
        message.warn(result.message)
      }
    } catch (e) {

    } finally {
      local.loading = false;
    }
  }, [])
  const editTemplate = useCallback(async (params: { body: any }) => {
    const result = params.body._id ? await apis.updateTemplate(params) : await apis.addTemplate(params)
    if (result.code === 0) {
      notification.info({ message: params.body._id ? '修改成功' : '添加成功' })
      await refresh()
    }
  }, [])
  useEffectOnce(() => {
    refresh()
  })
  return (<Observer>{() => <div style={{ height: '100%', display: 'flex', flexDirection: 'column', padding: '0 10px', overflow: 'hidden' }}>
    <Space style={{ padding: '8px 0' }}>
      <Select defaultValue={local.selectedProjectId} onChange={v => {
        local.selectedProjectId = v;
        refresh()
      }}>
        {store.project.list.map(it => <Select.Option key={it._id} value={it._id}>{it.title}</Select.Option>)}
      </Select>
      <Button type="primary" onClick={() => {
        refresh()
      }}>搜索</Button>
      < Button type="primary" onClick={e => {
        local.temp = { _id: '', project_id: store.app.project_id, title: '', name: '', desc: '', cover: '', type: '', path: '', attrs: {}, style: {}, available: false, children: [], order: 1 };
        local.showEditPage = true
      }}>新增</Button>
    </Space>
    <Editor
      visible={local.showEditPage}
      close={() => { local.showEditPage = false; local.temp = null }}
      data={local.temp}
      fetch={editTemplate}
      fields={fields}
    />
    <div style={{ flex: 1, paddingBottom: 10, overflowY: 'hidden' }}>
      <Table
        sticky={true}
        tableLayout='auto'
        pagination={false}
        rowKey="_id"
        dataSource={local.list}
      >
        <Table.Column title="" width={50} dataIndex="_id" render={(_id: string) => {
          return <CopyToClipboard
            text={_id}
            onCopy={() => {
              message.success('已复制', 1)
            }}>
            <Acon icon='copy' />
          </CopyToClipboard>
        }} />
        <Table.Column title="名称" dataIndex="title" />
        <Table.Column title="标识名称" dataIndex="name" />
        <Table.Column title="序号" dataIndex="order" />
        <Table.Column title="类型" dataIndex="type" />
        <Table.Column title="操作" key="_id" render={(_, record: IComponent) => (
          <Space size="middle" >
            <Acon icon="FormOutlined" onClick={
              () => {
                local.openEditor(cloneDeep(record))
              }
            } />
            <Acon icon='FileSearchOutlined' onClick={() => {
              navigate(`/manager/template/editable?id=${record._id}`)
            }} />
            <Popconfirm title='是否确认删除' okText='是' cancelText='否' onConfirm={async () => {
              local.loading = true;
              await apis.delTemplate(record._id);
              refresh()
            }}>
              <Acon icon="DeleteOutlined" />
            </Popconfirm>

          </Space>
        )} />
      </Table>
    </div>
  </div>}</Observer>);
};

export default ComponentTemplatePage;