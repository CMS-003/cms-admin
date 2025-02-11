import Acon from '@/components/Acon'
import { IComponent } from '@/types/component'
import { Table } from 'antd'
import { toJS } from 'mobx'
import { Observer, useLocalStore } from 'mobx-react'
import { Component } from '../auto'
import { useEffectOnce } from 'react-use'
import apis from '@/api'
import { useCallback, useEffect } from 'react'
import { IResource } from '@/types'
import events from '@/utils/event'
// import Table from 'rc-table';

export default function ComponentTable({ self, mode, children, level, setParentHovered }: { self: IComponent, mode: string, children?: any, level: number, setParentHovered?: Function }) {
  const local: {
    loading: boolean,
    query: { [key: string]: string | number },
    setQuery: Function,
    getQuery: Function,
    resources: IResource[],
    total: number,
    page: number,
    page_size: number,
    setResources: (resource: IResource[]) => void
  } = useLocalStore(() => ({
    resources: [],
    loading: false,
    total: 0,
    page: 1,
    page_size: 20,
    query: {},
    setResources(resources: IResource[]) {
      local.resources = resources;
    },
    setQuery(field: string, value: string | number) {
      local.query[field] = value;
    },
    getQuery() {
      return {
        page: local.page,
        page_size: local.page_size,
        ...local.query,
      }
    }
  }));
  const onSetQuery = useCallback((event: { field: string, value: string, force: boolean, template_id: string }) => {
    if (self.template_id === event.template_id) {
      local.setQuery(event.field, event.value);
      if (event.force) {
        init();
      }
    }
  }, []);
  useEffectOnce(() => {
    events.on('setQuery', onSetQuery);
    () => {
      events.off('setQuery', onSetQuery);
    }
  })
  const init = useCallback(async () => {
    if (self.api && mode === 'preview') {
      local.loading = true;
      const resp = await apis.getList(self.api, local.getQuery());
      if (resp.code === 0) {
        local.setResources(resp.data.items as IResource[]);
        local.total = resp.data.total || 0;
      }
      local.loading = false;
    }
  }, [self.api])
  useEffectOnce(() => {
    init();
  })
  return <Observer>{() => (
    <div style={{ height: '100%', flex: 1, overflow: 'auto', ...Object.fromEntries(self.style || {}) }}>
      <Table
        loading={local.loading}
        pagination={{ total: local.total, pageSize: local.page_size }}
        rowKey={'_id'}
        sticky={true}
        dataSource={mode === 'edit' ? [{ _id: 'mock', title: 'mock', }] : local.resources}
        onChange={p => {
          local.page = p.pageSize !== local.page_size ? 1 : p.current as number;
          local.page_size = p.pageSize as number;
          init();
        }}
        columns={self.children.map(child => ({
          title: mode === 'edit' ? <Component self={child} mode={mode} key={child._id} setParentHovered={setParentHovered} /> : child.title,
          key: child._id,
          dataIndex: self.widget?.field,
          render: (t: string, d: any) => (
            child.children.map(sun => <Observer>{() => <Component self={sun} mode={mode} source={d} key={sun._id} setParentHovered={setParentHovered} />}</Observer>)
          )
        }))} />
      {/* <Table
        rowKey="_id"
        columns={self.children.map(child => ({
          title: mode === 'edit' ? <Component self={child} mode={mode} key={child._id} setParentHovered={setParentHovered} /> : child.title,
          key: child._id,
          dataIndex: self.widget?.field || '_id',
          render: (t: string, d: any) => (
            child.children.map(sun => <Observer>{() => <Component self={sun} mode={mode} source={d} key={sun._id} setParentHovered={setParentHovered} />}</Observer>)
          )
        }))}
        data={mode === 'edit' ? [] : local.resources}
      /> */}
    </div>
  )}</Observer>
}