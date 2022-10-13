import { Button, notification, Space, Table, Tag, Input, Select } from 'antd';
import { DeleteOutlined, FormOutlined } from '@ant-design/icons'
import { Observer, useLocalObservable } from 'mobx-react';
import React, { Fragment, useCallback, useRef, useState } from 'react';
import EditPage from '@/components/Editor'
import { Component, EditorComponent } from '../../types'
import apis from '@/api'
import { AlignAside } from '@/components/style'
import { useEffectOnce } from 'react-use';
import { cloneDeep } from 'lodash'
import store from '@/store';

type SelectItem = {
  name: string;
  value: string;
}
const ComponentPage: React.FC = () => {
  const local = useLocalObservable<{ showEditPage: boolean, temp: Component, openEditor: Function, list: Component[], types: SelectItem[], projects: SelectItem[] }>(() => ({
    showEditPage: false,
    list: [],
    temp: {},
    types: store.component.types.map(it => ({ name: it.title, value: it.name })),
    projects: store.project.list.map(it => ({ name: it.title, value: it.id })),
    openEditor(data: Component) {
      local.showEditPage = true
      local.temp = data
    }
  }))

  const searchInput: any = useRef(null)
  const refresh = useCallback(async () => {
    const result = await apis.getComponents()
    if (result.code === 0) {
      local.list = result.data.items
    }
  }, [])
  const [fields, setFields] = useState([
    {
      field: 'type',
      title: '组件类型',
      type: 'string',
      component: EditorComponent.Select,
      defaultValue: '',
      autoFocus: false,
      value: local.types,
    },
    {
      field: 'project_id',
      title: '所属项目',
      type: 'string',
      component: EditorComponent.Select,
      defaultValue: '',
      autoFocus: false,
      value: local.projects,
    },
    {
      field: 'title',
      title: '组件名称',
      type: 'string',
      component: EditorComponent.Input,
      defaultValue: '',
      autoFocus: true,
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
      field: 'order',
      title: '序号',
      type: 'number',
      component: EditorComponent.Input,
      defaultValue: 1,
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
  const addComponent = useCallback(async (params: { body: any }) => {
    const result = params.body.id ? await apis.updateComponent(params) : await apis.createComponent(params)
    if (result.code === 0) {
      notification.info({ message: params.body.id ? '修改成功' : '添加成功' })
      await refresh()
    }
  }, [])
  useEffectOnce(() => {
    refresh()
  })
  return (
    <Observer>{() => (<Fragment>
      <AlignAside style={{ margin: 10 }}>
        <Space>
          分类类型:
          <Select defaultValue="">
            <Select.Option value="">全部</Select.Option>
          </Select>
          <Input ref={ref => searchInput.current = ref} />
          <Button type="primary" onClick={e => {
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
        close={() => { local.showEditPage = false; local.temp = {} }}
        data={local.temp}
        fields={fields}
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