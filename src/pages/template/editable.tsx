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
  const local = useLocalObservable<{ temp: Component, list: Component[], types: { name: string, value: string }[], selectedProjectId: string }>(() => ({
    list: [],
    temp: {},
    selectedProjectId: '',
    types: store.component.types.map(item => ({ name: item.title, value: item.name })),
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
    <AlignAside style={{ padding: 10, width: '100%', justifyContent: 'end' }}>
      <Space>
        <Select defaultValue={store.project.list.length ? store.project.list[0]._id : ''} onChange={v => {
          local.selectedProjectId = v;
          refresh()
        }}>
          {store.project.list.map(it => <Select.Option key={it._id} value={it._id}>{it.title}</Select.Option>)}
        </Select>
      </Space>
      <Space>
        < Button type="primary" onClick={e => {
          refresh()
        }}>刷新</Button>
      </Space>
    </AlignAside>
    <div style={{ flex: 1, overflowY: 'auto' }}>

    </div>
  </Fragment>}</Observer>);
};

export default ComponentTemplatePage;