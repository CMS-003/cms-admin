import React, { Fragment, useCallback, useState } from 'react';
import { Button, Divider, notification, Space, Table, Select } from 'antd';
import { FormOutlined } from '@ant-design/icons'
import { Observer, useLocalObservable } from 'mobx-react';
import Editor from '@/components/Editor'
import { Component, EditorComponent } from '@/types'
import apis from '@/api'
import { useEffectOnce } from 'react-use';
import { cloneDeep } from 'lodash'
import store from '@/store';
import { AlignAside } from '@/components/style'

const ComponentTemplatePage = () => {
  const local = useLocalObservable < { showEditPage: boolean, temp: Component, openEditor: Function, list: Component[], types: { name: string, value: string }[], selectedProjectId: string } > (() => ({
    showEditPage: false,
    list: [],
    temp: {},
    selectedProjectId: '',
    types: store.component.types.map(item => ({ name: item.title, value: item.name })),
    openEditor(data: Component) {
      local.temp = data
      local.showEditPage = true
    }
  }))
  const refresh = useCallback(async () => {
    const result = await apis.getTemplates({ query: { project_id: local.selectedProjectId } })
    if (result.code === 0) {
      local.list = result.data.items
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
      </Space>
      <Space style={{ padding: 10, width: '100%', justifyContent: 'end' }}>
        < Button type="primary" onClick={e => {
          local.showEditPage = true
        }}>新增</Button>
      </Space>
    </AlignAside>
    <div style={{ flex: 1, overflowY: 'auto' }}>
      
    </div>
  </Fragment>}</Observer>);
};

export default ComponentTemplatePage;