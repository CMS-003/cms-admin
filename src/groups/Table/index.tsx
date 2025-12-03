import { IAuto, IBaseComponent, IComponent, IWidget } from '@/types/component'
import { Table, message } from 'antd'
import { Observer, useLocalObservable } from 'mobx-react'
import { MemoComponent } from '../auto'
import { useEffectOnce } from 'react-use'
import apis from '@/api'
import { Fragment, useCallback } from 'react'
import { IResource } from '@/types'
import events from '@/utils/event'
import CONST from '@/constant'
import { runInAction } from 'mobx'
import { ComponentWrap } from '../style';
import { AlignAside } from '@/components/style'
import { Acon, VisualBox } from '@/components'
import { getWidgetValue } from '../utils'
import { isNil } from 'lodash-es'
import { SortDD } from '@/components/SortableDD'

export default function CTable({ self, drag, source, query, children, mode, page }: IAuto & IBaseComponent) {
  const local: {
    loading: boolean,
    resources: IResource[],
    total: number,
    setResources: (resource: IResource[]) => void;
    setValue: Function;
    changeResource: Function;
    temp: any;
  } = useLocalObservable(() => ({
    resources: [],
    loading: false,
    total: 0,
    temp: { _id: 'temp' },
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
      if (data.resource_type === 'resource' || data.resource_type === 'task') {
        local.resources.forEach(resource => {
          if (resource._id === data.resource_id) {
            if (!isNil(data.status)) {
              resource.status = data.status;
            }
            if (!isNil(data.transcode)) {
              resource.transcode = data.transcode;
            }
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
      className={drag.className}
      {...drag.events}
      style={{
        flex: 1,
        overflow: 'auto',
        ...self.style,
      }}
    >
      {children}
      <Table
        tableLayout='auto'
        style={{ width: '100%' }}
        loading={local.loading}
        pagination={{ total: local.total, pageSize: page.query.page_size as number || 20 }}
        rowKey={'_id'}
        sticky={true}
        dataSource={mode === 'edit' ? [local.temp] : local.resources}
        onChange={p => {
          page.setQuery('page', p.current as number);
          page.setQuery('page_size', p.pageSize as number);
          init();
        }}
        columns={self.children.map((child, i) => ({
          title: <Observer>{() => (<div key={i}>
            <VisualBox visible={mode === 'edit'}>
              <AlignAside>
                <Acon icon="MoveLeft" onClick={() => {
                  if (i !== 0) {
                    runInAction(() => {
                      self.swap(i, i - 1)
                    })
                  }
                }} />
                <Acon icon="MoveRight" onClick={() => {
                  if (i !== self.children.length - 1) {
                    runInAction(() => {
                      self.swap(i, i + 1)
                    })
                  }
                }} />
              </AlignAside>
            </VisualBox>
            <MemoComponent self={child} source={{}} setDataField={() => { }} key={child._id} />
          </div>)}</Observer>,
          key: child._id,
          width: child.style.width || '',
          align: child.attrs.align || 'left',
          dataIndex: self.widget.field,
          render: (t: any, d: any) => (
            mode === 'edit' ?
              <SortDD
                direction='vertical'
                items={child.children.map((c: IComponent) => ({ id: c._id, data: c }))}
                renderItem={(item: any) => (
                  <MemoComponent
                    key={item.id}
                    self={item.data}
                    source={local.temp}
                    setDataField={(widget: IWidget, value: any) => {
                      if (!widget.field) {
                        return;
                      }
                      value = getWidgetValue(widget, value);
                      if (isNil(value)) {
                        return;
                      }
                      runInAction(() => {
                        local.temp[widget.field] = value
                      })
                    }}
                  />
                )}
              />
              : (<Fragment>
                {child.children.map((item: IComponent, k: number) => (
                  <MemoComponent
                    key={k}
                    self={item}
                    source={d}
                    setDataField={(widget: IWidget, value: any) => {
                      if (!widget.field) {
                        return;
                      }
                      value = getWidgetValue(widget, value);
                      if (isNil(value)) {
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