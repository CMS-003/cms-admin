import Acon from '@/components/Acon'
import { IComponent } from '@/types/component'
import { Table } from 'antd'
import { toJS } from 'mobx'
import { Observer } from 'mobx-react'
import { Component } from '../auto'

export default function ComponentTable({ self, mode, children, level }: { self: IComponent, mode: string, children?: any, level: number }) {
  return <Observer>{() => (
    <div style={{ ...Object.fromEntries(self.style) }}>
      <Table columns={mode === 'edit'
        ? [...self.children.map(child => ({ title: <Component self={child} mode={mode} key={child._id} />, key: child._id })), { title: <Acon icon="PlusOutlined" onClick={() => { self.appendChild('TableColumn') }} />, key: '', }]
        : self.children.map(child => ({ title: child.title, key: child._id }))} />
    </div>
  )}</Observer>
}