import { Button, notification, Space, Table, Tag, Input, Select } from 'antd';
import { Observer, useLocalStore } from 'mobx-react';
import React, { Fragment, useCallback, useRef, useState } from 'react';
import EditPage from '@/components/Editor'
import { IComponent, IEditorComponent } from '../../types'
import apis from '@/api'
import { AlignAside } from '@/components/style'
import { useEffectOnce } from 'react-use';
import { cloneDeep } from 'lodash'
import store from '@/store';
import Acon from '@/components/Acon';

type SelectItem = {
  name: string;
  value: string;
}

const ComponentPage: React.FC = () => {
  const local = useLocalStore<{ showEditPage: boolean, temp: IComponent | null, openEditor: Function, list: IComponent[], types: SelectItem[], projects: SelectItem[], selectedProjectId: string }>(() => ({
    showEditPage: false,
    list: [],
    temp: null,
    types: store.component.types.map(it => ({ name: it.title, value: it.name })),
    projects: store.project.list.map(it => ({ name: it.title, value: it._id })),
    selectedProjectId: '',
    openEditor(data: IComponent) {
      local.showEditPage = true
      local.temp = data
    }
  }))

  const searchInput: any = useRef(null)
  const refresh = useCallback(async () => {
    const result = await apis.getComponents({ query: { project_id: local.selectedProjectId } })
    if (result.code === 0) {
      local.list = result.data.items
    }
  }, [local])
  const [fields] = useState([
    {
      field: 'type',
      title: '组件类型',
      type: 'string',
      component: IEditorComponent.Select,
      defaultValue: '',
      autoFocus: false,
      value: local.types,
    },
    {
      field: 'project_id',
      title: '所属项目',
      type: 'string',
      component: IEditorComponent.Select,
      defaultValue: '',
      autoFocus: false,
      value: local.projects,
    },
    {
      field: 'title',
      title: '组件名称',
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
      field: 'desc',
      title: '组件描述',
      type: 'string',
      component: IEditorComponent.Input,
      defaultValue: '',
      autoFocus: false,
      value: [],
    },
    {
      field: 'template_id',
      title: '模板页',
      type: 'string',
      component: IEditorComponent.RemoteSelect,
      defaultValue: '',
      autoFocus: false,
      value: [],
      fetch: async function () {
        const response = await apis.getTemplates({ query: {} })
        if (response.code === 0) {
          response.data.items.unshift({ title: '无', name: '', id: '' })
        }
        return response;
      },
    },
    {
      field: 'parent_id',
      title: '父组件',
      type: 'string',
      component: IEditorComponent.RemoteSelect,
      defaultValue: '',
      autoFocus: false,
      value: [],
      fetch: async function () {
        const response = await apis.getComponents({ query: {} })
        if (response.code === 0) {
          response.data.items.push({ title: '无', name: '', id: '' })
        }
        return response;
      },
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
      field: 'cover',
      title: '图片',
      type: 'string',
      component: IEditorComponent.Image,
      defaultValue: '',
      value: [],
      autoFocus: false,
    },
    {
      field: 'icon',
      title: '图标',
      type: 'string',
      component: IEditorComponent.Input,
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
  const addComponent = useCallback(async (params: { body: any }) => {
    const result = params.body._id ? await apis.updateComponent(params) : await apis.createComponent(params)
    if (result.code === 0) {
      notification.info({ message: params.body._id ? '修改成功' : '添加成功' })
      await refresh()
    }
  }, [])
  useEffectOnce(() => {
    refresh()
  })
  return (
    <Observer>{() => (<div style={{ padding: '0 10px' }}>
      <AlignAside style={{ margin: 10 }}>
        <Space>
          模板页:
          <Select defaultValue="" onChange={v => {
            local.selectedProjectId = v;
            refresh()
          }}>
            <Select.Option value="">全部</Select.Option>
            {local.projects.map(it => <Select.Option key={it.value} value={it.value}>{it.name}</Select.Option>)}
          </Select>
          <Input ref={ref => searchInput.current = ref} />
          <Button type="primary" onClick={() => {
            refresh()
          }}>搜索</Button>
        </Space>
        <Space>
          <Button type="primary" onClick={e => {
            local.showEditPage = true
          }}>添加</Button>
        </Space>
      </AlignAside>
      <EditPage
        visible={local.showEditPage}
        close={() => { local.showEditPage = false; local.temp = null }}
        data={local.temp}
        fields={fields}
        fetch={addComponent}
      />
      <Table style={{ height: '100%' }} pagination={{ position: ['bottomRight'] }} rowKey="_id" dataSource={local.list}>
        <Table.Column title="组件名称" dataIndex="title" render={(title, record: any) => (
          <span><Acon icon={record.icon as string} />{title}</span>
        )} />
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
        <Table.Column title="操作" key="id" render={(_, record: IComponent) => (
          <Space size="middle">
            <Acon icon='FormOutlined' onClick={() => {
              local.openEditor(cloneDeep(record))
            }} />
            <Acon icon='DeleteOutlined' onClick={async () => {
              await apis.destroyComponent({ params: { _id: record._id } })
              await refresh()
            }} />
          </Space>
        )} />
      </Table>
    </div>)
    }
    </Observer >
  );
};

export default ComponentPage;