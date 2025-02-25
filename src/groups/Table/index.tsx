import { IAuto, IBaseComponent } from '@/types/component'
import { Table } from 'antd'
import { Observer, useLocalStore } from 'mobx-react'
import { Component } from '../auto'
import { useEffectOnce } from 'react-use'
import apis from '@/api'
import { useCallback } from 'react'
import { IResource } from '@/types'
import events from '@/utils/event'

export default function CTable({ self, mode, page, drag, children }: IAuto & IBaseComponent) {
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
        local.total = (resp as any).count || resp.data.total || 0;
      }
      local.loading = false;
    }
  }, [self.api])
  useEffectOnce(() => {
    init();
  })
  return <Observer>{() => (
    <div style={{ height: '100%', flex: 1, overflow: 'auto', ...self.style }}
      className={`${mode} ${drag?.classNames}`}
      {...drag.events}
    >
      {children}
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
        columns={self.children.map((child, i) => ({
          title: <Observer>{() => (<Component self={child} mode={mode} key={child._id} index={i} setParentHovered={drag?.setIsMouseOver} />)}</Observer>,
          key: child._id,
          dataIndex: self.widget.field,
          render: (t: string, d: any) => (
            child.children.map((sun, index) => <Observer>{() => <Component self={sun} isTitle={false} index={index} mode={mode} source={d} key={sun._id} setParentHovered={drag?.setIsMouseOver} />}</Observer>)
          )
        }))} />
    </div>
  )}</Observer>
}