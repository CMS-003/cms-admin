import { IAuto, IBaseComponent } from '@/types/component'
import { Table } from 'antd'
import { Observer, useLocalObservable } from 'mobx-react'
import { Component } from '../auto'
import { useEffectOnce } from 'react-use'
import apis from '@/api'
import { useCallback } from 'react'
import { IResource } from '@/types'
import events from '@/utils/event'
import NatureSortable from '@/components/NatureSortable'
import { usePageContext } from '../context'
import { toJS } from 'mobx'
import CONST from '@/constant'

export default function CTable({ self, mode, dnd, drag, children }: IAuto & IBaseComponent) {
  const page = usePageContext()
  const local: {
    loading: boolean,
    resources: IResource[],
    total: number,
    setResources: (resource: IResource[]) => void;
    setValue: Function;
  } = useLocalObservable(() => ({
    resources: [],
    loading: false,
    total: 0,
    setResources(resources: IResource[]) {
      local.resources = resources;
    },
    setValue(field: 'loading' | 'total', value: boolean | number) {
      switch (field) {
        case 'loading': local.loading = value as boolean; break;
        case 'total': local.total = value as number; break;
        default: break;
      }
    }
  }));
  const onSetQuery = useCallback((event: { target: { template_id: string, path: string } }) => {
    if (self.template_id === event.target.template_id) {
      init();
    }
  }, []);
  const init = useCallback(async () => {
    if (self.api && mode === 'preview') {
      local.setValue('loading', true)
      const resp = await apis.getDataList(self.api, page.query);
      if (resp.code === 0) {
        local.setResources(resp.data.items as IResource[]);
        local.setValue('total', (resp as any).count || resp.data.total || 0)
      }
      local.setValue('loading', false)
    }
  }, [self.api])
  useEffectOnce(() => {
    init();
    events.on(CONST.ACTION_TYPE.SEARCH, onSetQuery);
    () => {
      events.off(CONST.ACTION_TYPE.SEARCH, onSetQuery);
    }
  })
  return <Observer>{() => (
    <div
      className={mode + drag.className}
      {...drag.events}
      ref={dnd?.ref}
      {...dnd?.props}
      style={{
        flex: 1,
        overflow: 'auto',
        ...self.style,
        ...dnd?.style,
        backgroundColor: dnd?.isDragging ? 'lightblue' : '',
      }}
    >
      {children}
      <Table
        loading={local.loading}
        pagination={{ total: local.total, pageSize: page.query.page_size as number || 20 }}
        rowKey={'_id'}
        sticky={true}
        dataSource={mode === 'edit' ? [{ _id: 'mock', title: 'mock', status: 0 }] : local.resources}
        onChange={p => {
          page.setQuery('page', p.current as number);
          page.setQuery('page_size', p.pageSize as number);
          init();
        }}
        columns={self.children.map((child, i) => ({
          title: <Observer>{() => (<Component self={child} mode={mode} key={child._id} />)}</Observer>,
          key: child._id,
          width: child.style.width || '',
          align: child.attrs.align || 'left',
          dataIndex: self.widget.field,
          render: (t: string, d: any) => (
            <NatureSortable
              items={child.children}
              direction='horizontal'
              disabled={mode === 'preview'}
              droppableId={child._id}
              sort={self.swap}
              renderItem={({ item, dnd }) => (
                <Component
                  self={item}
                  mode={mode}
                  source={d}
                  setSource={(field: string, value: any) => {
                    d[field] = value
                  }}
                  dnd={dnd}
                />
              )}
            />
          )
        }))} />
    </div>
  )}</Observer>
}