import { IAuto, IBaseComponent, IWidget } from '@/types/component'
import { Table, message } from 'antd'
import { Observer, useLocalObservable } from 'mobx-react'
import { Component } from '../auto'
import { useEffectOnce } from 'react-use'
import apis from '@/api'
import { Fragment, useCallback, useEffect } from 'react'
import { IResource } from '@/types'
import events from '@/utils/event'
import NatureSortable from '@/components/NatureSortable'
import { usePageContext } from '../context'
import CONST from '@/constant'
import { runInAction } from 'mobx'
import { ComponentWrap } from '../style';
import { ArrowLeftOutlined, ArrowRightOutlined } from '@ant-design/icons'
import { AlignAside } from '@/components/style'
import { VisualBox } from '@/components'
import { getWidgetValue } from '../utils'
import _ from 'lodash'

export default function CTable({ self, mode, dnd, drag, source, query, children }: IAuto & IBaseComponent) {
  const page = usePageContext()
  const local: {
    loading: boolean,
    resources: IResource[],
    total: number,
    setResources: (resource: IResource[]) => void;
    setValue: Function;
    changeResource: Function;
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
    },
    changeResource(data: any) {
      if (data.resource_type === 'resource') {
        local.resources.forEach(resource => {
          if (resource._id === data.resource_id) {
            resource.status = data.status;
          }
        })
      }
    }
  }));
  const onSetQuery = function (event: { target: { template_id: string, path: string } }) {
    if (self.template_id === event.target.template_id) {
      init();
    }
  };
  const init = useCallback(async () => {
    if (self.widget.action === 'FETCH' && mode === 'preview') {
      local.setValue('loading', true)
      const resp = await apis.fetch(self.widget.method, self.getApi('', Object.assign({}, page.query, query)));
      if (resp.code === 0) {
        local.setResources((resp.data as any).items as IResource[]);
        local.setValue('total', (resp.data as any).total || 0)
      }
      local.setValue('loading', false)
    }
  }, [self.widget.action])
  useEffectOnce(() => {
    init();
    events.on(CONST.ACTION_TYPE.SEARCH, onSetQuery);
    events.on('event', local.changeResource)
    return () => {
      events.off(CONST.ACTION_TYPE.SEARCH, onSetQuery);
      events.off('event', local.changeResource)
    }
  })
  return <Observer>{() => (
    <ComponentWrap
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
        tableLayout='auto'
        loading={local.loading}
        pagination={{ total: local.total, pageSize: page.query.page_size as number || 20 }}
        rowKey={'_id'}
        sticky={true}
        dataSource={mode === 'edit' ? [source] : local.resources}
        onChange={p => {
          page.setQuery('page', p.current as number);
          page.setQuery('page_size', p.pageSize as number);
          init();
        }}
        columns={self.children.map((child, i) => ({
          title: <Observer>{() => (<div key={i}>
            <VisualBox visible={mode === 'edit'}>
              <AlignAside>
                <ArrowLeftOutlined onClick={() => {
                  if (i !== 0) {
                    runInAction(() => {
                      self.swap(i, i - 1)
                    })
                  }
                }} />
                <ArrowRightOutlined onClick={() => {
                  if (i !== self.children.length - 1) {
                    runInAction(() => {
                      self.swap(i, i + 1)
                    })
                  }
                }} />
              </AlignAside>
            </VisualBox>
            <Component self={child} mode={mode} source={{}} setDataField={() => { }} key={child._id} />
          </div>)}</Observer>,
          key: child._id,
          width: child.style.width || '',
          align: child.attrs.align || 'left',
          dataIndex: self.widget.field,
          render: (t: string, d: any) => (
            mode === 'edit' ?
              <NatureSortable
                key={t}
                items={child.children}
                direction='horizontal'
                disabled={false}
                droppableId={child._id}
                sort={self.swap}
                renderItem={({ item, dnd, index }) => (
                  <Component
                    key={index}
                    self={item}
                    mode={mode}
                    source={d}
                    setDataField={(widget: IWidget, value: any) => {
                      if (!widget.field) {
                        return;
                      }
                      value = getWidgetValue(widget, value);
                      if (_.isNil(value)) {
                        return;
                      }
                      runInAction(() => {
                        d[widget.field] = value
                      })
                    }}
                    dnd={dnd}
                  />
                )}
              />
              : (<Fragment key={t}>
                {child.children.map((item, k) => (
                  <Component
                    key={k}
                    self={item}
                    mode={mode}
                    source={d}
                    setDataField={(widget: IWidget, value: any) => {
                      if (!widget.field) {
                        return;
                      }
                      value = getWidgetValue(widget, value);
                      if (_.isNil(value)) {
                        return;
                      }
                      runInAction(() => {
                        d[widget.field] = value
                      })
                    }}
                  />
                ))}
              </Fragment>)
          )
        }))} />
    </ComponentWrap>
  )}</Observer>
}