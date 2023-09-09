import { Button, notification, Space, Table, Tag, Input, Select } from 'antd';
import { DeleteOutlined, FormOutlined } from '@ant-design/icons'
import { Observer, useLocalObservable } from 'mobx-react';
import React, { Fragment, useCallback, useRef, useState } from 'react';
import EditPage from '@/components/Editor'
import { IComponent, IConfig, IEditorComponent } from '../../types'
import apis from '@/api'
import { AlignAside } from '@/components/style'
import { useEffectOnce } from 'react-use';
import { cloneDeep } from 'lodash'

const ConfigPage: React.FC = () => {
  const local = useLocalObservable<{ showEditPage: boolean, temp: IComponent | null, openEditor: Function, list: IConfig[] }>(() => ({
    showEditPage: false,
    list: [],
    temp: null,
    openEditor(data: IComponent) {
      local.showEditPage = true
      local.temp = data
    }
  }))
  const searchInput: any = useRef(null)
  const refresh = useCallback(async () => {
    const result = await apis.getConfig()
    if (result.code === 0) {
      local.list = result.data.items
    }
  }, [])
  const [fields, setFields] = useState([
    {
      field: 'type',
      title: '配置类型',
      type: 'string',
      component: IEditorComponent.Input,
      defaultValue: '',
      autoFocus: false,
      value: [],
    },
    {
      field: 'title',
      title: '配置名称',
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
      title: '配置描述',
      type: 'string',
      component: IEditorComponent.Input,
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
      field: 'cover',
      title: '图片',
      type: 'string',
      component: IEditorComponent.Image,
      defaultValue: '',
      value: [],
      autoFocus: false,
    },
    {
      field: 'value',
      title: '值',
      type: 'json',
      component: IEditorComponent.Editor,
      defaultValue: '{}',
      value: [],
      autoFocus: false,
    },
  ])
  const editConfig = useCallback(async (params: { body: any }) => {
    const result = params.body._id ? await apis.updateConfig(params) : await apis.createConfig(params)
    if (result.code === 0) {
      notification.info({ message: params.body._id ? '修改成功' : '添加成功' })
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
        close={() => { local.showEditPage = false; local.temp = null }}
        data={local.temp}
        fields={fields}
        fetch={editConfig}
      />
      <Table style={{ height: '100%' }} pagination={{ position: ['bottomRight'] }} rowKey="_id" dataSource={local.list}>
        <Table.Column title="配置名称" dataIndex="title" />
        <Table.Column title="配置类型" dataIndex="name" />
        <Table.Column title="分类类型" dataIndex="type" />
        <Table.Column title="操作" key="id" render={(_, record: IComponent) => (
          <Space size="middle">
            <FormOutlined onClick={() => {
              local.openEditor(cloneDeep(record))
            }} />
            <DeleteOutlined onClick={async () => {
              await apis.destroyComponent({ params: { id: record._id } })
              await refresh()
            }} />
          </Space>
        )} />
      </Table>
    </Fragment>)}
    </Observer>
  );
};

export default ConfigPage;