import Acon from '@/components/Acon'
import { IComponent } from '@/types/component'
import { Table } from 'antd'
import { toJS } from 'mobx'
import { Observer, useLocalStore } from 'mobx-react'
import { Component } from '../auto'
import { useEffectOnce } from 'react-use'
import apis from '@/api'
import { useCallback } from 'react'
import { IResource } from '@/types'

export default function ComponentTable({ self, mode, children, level }: { self: IComponent, mode: string, children?: any, level: number }) {
  const local: { loading: boolean, resources: IResource[], total: number } = useLocalStore(() => ({
    resources: [],
    loading: false,
    total: 0
  }));
  const init = useCallback(async () => {
    if (self.api) {
      const resp = await apis.getList(self.api);
      if (resp.code === 0) {
        local.resources = resp.data.items as IResource[];
        local.total = resp.data.total || 0;
      }
    }
  }, [self.api])
  useEffectOnce(() => {
    init();
  })
  return <Observer>{() => (
    <div style={{ ...Object.fromEntries(self.style) }}>
      <Table
        loading={local.loading}
        pagination={{ total: local.total }}
        dataSource={toJS(local.resources)}
        columns={mode === 'edit'
          ? [...self.children.map(child => ({ title: <Component self={child} mode={mode} key={child._id} />, key: child._id, dataIndex: self.widget?.field, render: (t: string) => t })), { title: <Acon icon="PlusOutlined" onClick={() => { self.appendChild('TableColumn') }} />, key: '', }]
          : self.children.map(child => ({ title: child.title, key: child._id, dataIndex: self.widget?.field, render: (t: string, d: any) => d.name }))} />
    </div>
  )}</Observer>
}