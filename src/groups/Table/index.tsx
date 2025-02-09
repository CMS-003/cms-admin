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

export default function ComponentTable({ self, mode, children, level }: { self: IComponent, mode: string, children?: any, level: number }) {
  const local: { loading: boolean, resources: IResource[], total: number, page: number, setResources: (resource: IResource[]) => void } = useLocalStore(() => ({
    resources: [],
    loading: false,
    total: 0,
    page: 1,
    setResources(resources: IResource[]) {
      local.resources = resources;
    }
  }));
  const init = useCallback(async () => {
    if (self.api) {
      local.loading = true;
      const resp = await apis.getList(self.api, { page: local.page });
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
    <div style={{ display: 'flow-root', ...Object.fromEntries(self.style) }}>
      <Table
        loading={local.loading}
        pagination={{ total: local.total }}
        rowKey={'_id'}
        dataSource={local.resources}
        onChange={p => {
          local.page = p.current as number;
          init();
        }}
        columns={mode === 'edit'
          ? [...self.children.map(child => ({ title: <Component self={child} mode={mode} key={child._id} />, key: child._id, dataIndex: self.widget?.field, render: (t: string, d: any) => d.name })), { title: <Acon icon="PlusOutlined" onClick={() => { self.appendChild('TableColumn') }} />, key: '', }]
          : self.children.map(child => ({ title: child.title, key: child._id, dataIndex: self.widget?.field, render: (t: string, d: any) => <Observer>{() => <Component self={child} mode={mode} source={d} key={child._id} />}</Observer> }))} />
    </div>
  )}</Observer>
}