import { Button, notification, Space, Table, Image } from 'antd';
import { Observer, useLocalStore } from 'mobx-react';
import React, { Fragment, useCallback, useState } from 'react';
import { IType, IMSTArray } from 'mobx-state-tree'
import EditPage from '@/components/Editor'
import { IProject, IEditorComponent } from '../../types'
import apis from '@/api'
import { AlignAside } from '@/components/style'
import { useEffectOnce } from 'react-use';
import { cloneDeep } from 'lodash'
import store from '@/store';
import Acon from '@/components/Acon';

const ProjectPage: React.FC = () => {
  const local = useLocalStore<{ showEditPage: boolean, temp: IProject, openEditor: Function, list: IProject[] }>(() => ({
    showEditPage: false,
    list: [],
    temp: {},
    openEditor(data: IProject) {
      local.showEditPage = true
      local.temp = data
    }
  }))
  const refresh = useCallback(async () => {
    const result = await apis.getProjects()
    if (result.code === 0 && result.data) {
      local.list = result.data.items
      store.project.setList(result.data.items as IMSTArray<IType<IProject, IProject, IProject>>);
    }
  }, [])
  const [fields] = useState([
    {
      field: 'title',
      title: '名称',
      type: 'string',
      component: IEditorComponent.Input,
      defaultValue: '',
      autoFocus: false,
      value: [],
    },
    {
      field: 'name',
      title: '标识',
      type: 'string',
      component: IEditorComponent.Input,
      defaultValue: '',
      autoFocus: false,
      value: [],
    },
    {
      field: 'desc',
      title: '描述',
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
      value: [],
      autoFocus: false,
    },
    {
      field: 'status',
      title: '状态',
      type: 'number',
      component: IEditorComponent.Input,
      defaultValue: 1,
      value: [],
      autoFocus: false,
    },
  ])
  const editProject = useCallback(async (params: { body: any }) => {
    const result = params.body._id ? await apis.updateProject(params) : await apis.createProject(params)
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
      <AlignAside style={{ margin: '10px 0' }}>
        <Space>
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
        fetch={editProject}
      />
      <Table style={{ height: '100%' }} pagination={{ position: ['bottomRight'] }} rowKey="_id" dataSource={local.list}>
        <Table.Column title="项目名称" dataIndex="title" render={(title, record: IProject) => <Fragment>{record.cover ? <Image src={record.cover} style={{ width: 40 }} /> : null} {title}</Fragment>} />
        <Table.Column title="标识" dataIndex="name" />
        <Table.Column title="操作" key="_id" render={(_, record: IProject) => (
          <Space size="middle">
            <Acon icon='FormOutlined' onClick={() => {
              local.openEditor(cloneDeep(record))
            }} />
            <Acon icon='DeleteOutlined' onClick={async () => {
              await apis.destroyProject({ body: { _id: record._id } })
              await refresh()
            }} />
          </Space>
        )} />
      </Table>
    </div>)}
    </Observer>
  );
};

export default ProjectPage;