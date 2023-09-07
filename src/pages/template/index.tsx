import React, { Fragment, useCallback, useState } from 'react';
import { Button, Divider, notification, Space, Table, Select } from 'antd';
import { FormOutlined } from '@ant-design/icons'
import { Observer, useLocalObservable } from 'mobx-react';
import Editor from '@/components/Editor'
import { IComponent, IEditorComponent } from '@/types'
import apis from '@/api'
import { useEffectOnce } from 'react-use';
import { cloneDeep } from 'lodash'
import store from '@/store';
import { AlignAside } from '@/components/style'

const ComponentTemplatePage: React.FC = () => {
  const local = useLocalObservable < { showEditPage: boolean, temp: IComponent, openEditor: Function, list: IComponent[], types: { name: string, value: string }[], selectedProjectId: string } > (() => ({
    showEditPage: false,
    list: [],
    temp: {},
    selectedProjectId: '',
    types: store.component.types.map(item => ({ name: item.title, value: item.name })),
    openEditor(data: IComponent) {
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
      autoFocus: false,
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
      field: 'desc',
      title: '模板描述',
      type: 'string',
      component: IEditorComponent.Area,
      defaultValue: '',
      autoFocus: false,
      value: [],
    },
    {
      field: 'available',
      title: '是否可用',
      type: 'boolean',
      component: IEditorComponent.Switch,
      defaultValue: false,
      value: [{ name: '可用', value: 1 }, { name: '不可用', value: 0 }],
      autoFocus: false,
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
  ])
  const refresh = useCallback(async () => {
    const result = await apis.getTemplates({ query: { project_id: local.selectedProjectId } })
    if (result.code === 0) {
      local.list = result.data.items
    }
  }, [])
  const editTemplate = useCallback(async (params: { body: any }) => {
    const result = params.body._id ? await apis.updateTemplate(params) : await apis.addTemplate(params)
    if (result.code === 0) {
      notification.info({ message: params.body.id ? '修改成功' : '添加成功' })
      await refresh()
    }
  }, [])
  useEffectOnce(() => {
    refresh()
  })
  return (<Observer>{() => <Fragment>
    <AlignAside>
      <Space>
        <Select defaultValue="" onChange={v => {
          local.selectedProjectId = v;
          refresh()
        }}>
          <Select.Option value="">全部</Select.Option>
          {store.project.list.map(it => <Select.Option key={it._id} value={it._id}>{it.title}</Select.Option>)}
        </Select>
        <Button type="primary" onClick={() => {
          refresh()
        }}>搜索</Button>
      </Space>
      <Space style={{ padding: 10, width: '100%', justifyContent: 'end' }}>
        < Button type="primary" onClick={e => {
          local.showEditPage = true
        }}>新增</Button>
      </Space>
    </AlignAside>
    <Editor
      visible={local.showEditPage}
      close={() => { local.showEditPage = false; local.temp = {} }}
      data={local.temp}
      fetch={editTemplate}
      fields={fields}
    />
    <div style={{ flex: 1, overflowY: 'auto' }}>
      <Table pagination={false} rowKey="_id" dataSource={local.list} >
        <Table.Column title="名称" dataIndex="title" />
        <Table.Column title="标识名称" dataIndex="name" />
        <Table.Column title="操作" key="_id" render={(_, record: IComponent) => (
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