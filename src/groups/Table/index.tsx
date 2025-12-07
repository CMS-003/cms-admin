import { IAuto, IBaseComponent, IComponent, IMode, IPageInfo, IWidget } from '@/types/component'
import { Table } from 'antd'
import { Observer, useLocalObservable } from 'mobx-react'
import { Component, MemoComponent } from '../auto'
import { useEffectOnce } from 'react-use'
import apis from '@/api'
import { createContext, Fragment, useCallback, useContext, useMemo, useState } from 'react'
import { IResource } from '@/types'
import events from '@/utils/event'
import CONST from '@/constant'
import { runInAction } from 'mobx'
import { ComponentWrap } from '../style';
import { getWidgetValue } from '../utils'
import { isNil } from 'lodash-es'
import { SortDD } from '@/components/SortableDD'

import type { DragEndEvent, DragOverEvent, UniqueIdentifier } from '@dnd-kit/core';
import {
  closestCenter,
  DndContext,
  DragOverlay,
} from '@dnd-kit/core';
import { restrictToHorizontalAxis } from '@dnd-kit/modifiers';
import {
  horizontalListSortingStrategy,
  SortableContext,
  useSortable,
} from '@dnd-kit/sortable';
import React from 'react'

interface DragIndexState {
  active: UniqueIdentifier;
  over: UniqueIdentifier | undefined;
  direction?: 'left' | 'right';
}

const DragIndexContext = createContext<DragIndexState>({ active: -1, over: -1 });

const dragActiveStyle = (dragState: DragIndexState, id: string) => {
  const { active, over } = dragState;
  // drag active style
  let style: React.CSSProperties = {};
  if (active && active === id) {
    style = { backgroundColor: 'lightgrey', opacity: 0.5 };
  } else if (over && id === over && active !== over) {
    style = { borderInlineStart: '1px dashed lightgrey' };
  }
  return style;
};

const TableHeaderCell: React.FC<React.HTMLAttributes<HTMLTableCellElement> & { _id: string; mode: IMode, page: IPageInfo; self: IComponent }> = (props) => {
  const dragState = useContext(DragIndexContext);
  const { attributes, listeners, setNodeRef, isDragging } = useSortable({ id: props._id });
  const style: React.CSSProperties = {
    ...(isDragging ? { position: 'relative', zIndex: 9999, userSelect: 'none' } : {}),
    ...dragActiveStyle(dragState, props._id),
  };
  return <th ref={setNodeRef} style={style} {...attributes} {...listeners} >
    <Component
      self={props.self}
      mode={props.mode}
      page={props.page}
      source={{ _id: props._id, title: props.title }}
      setDataField={() => { }} />
  </th>;
};

function createHeaderComponent<P>(
  Component: React.ComponentType<P>
) {
  return React.memo(function ModeAwareComponent(props: P & { _id: string; }) {
    // 使用 useMemo 记忆化组件
    return useMemo(() => {
      return <Component {...props} />;
    }, [props]); // 只有当 props 或 mode 变化时才重新渲染
  });
}

const HeaderCell = createHeaderComponent(TableHeaderCell)

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

  const [dragIndex, setDragIndex] = useState<DragIndexState>({ active: -1, over: -1 });
  const onDragEnd = ({ active, over }: DragEndEvent) => {
    if (active.id !== over?.id) {
      const oldIndex = self.children.findIndex(c => c._id === active.id)
      const newIndex = self.children.findIndex(c => c._id === over?.id)
      self.swap(oldIndex, newIndex)
    }
    setDragIndex({ active: -1, over: -1 });
  };

  const onDragOver = ({ active, over }: DragOverEvent) => {
    const activeIndex = self.children.findIndex(c => c._id === active.id)
    const overIndex = self.children.findIndex(c => c._id === over?.id)
    setDragIndex({
      active: active.id,
      over: over?.id,
      direction: overIndex > activeIndex ? 'right' : 'left',
    });
  };

  useEffectOnce(() => {
    if (!page.query.page_size) {
      page.setQuery('page_size', 20)
    }
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
      <DndContext
        modifiers={[restrictToHorizontalAxis]}
        onDragEnd={onDragEnd}
        onDragOver={onDragOver}
        collisionDetection={closestCenter}
      >
        <SortableContext disabled={mode === 'preview'} items={self.children.map((i) => i._id)} strategy={horizontalListSortingStrategy}>
          <DragIndexContext.Provider value={dragIndex}>
            <Table<IResource>
              tableLayout='auto'
              style={{ width: '100%' }}
              loading={local.loading}
              pagination={{ total: local.total, pageSize: parseInt(page.query.page_size as string) || 20 }}
              rowKey={'_id'}
              sticky={true}
              dataSource={mode === 'edit' ? [local.temp] : local.resources}
              onChange={p => {
                page.setQuery('page', p.current as number);
                page.setQuery('page_size', p.pageSize as number);
                init();
              }}
              columns={self.children.map((child: IComponent, i) => ({
                title: child.title,
                _id: child._id,
                key: child._id,
                width: child.style.width || '',
                align: child.attrs.align || 'left',
                dataIndex: self.widget.field,
                onHeaderCell: () => { return { _id: child._id, title: child.title, self: child, mode: mode, page: page } },
                render: (field: any, data: any) => (
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
                          source={data}
                          setDataField={(widget: IWidget, value: any) => {
                            if (!widget.field) {
                              return;
                            }
                            value = getWidgetValue(widget, value);
                            if (isNil(value)) {
                              return;
                            }
                            runInAction(() => {
                              data[widget.field] = value
                            })
                          }}
                        />
                      ))}
                    </Fragment>)
                )
              }))}
              components={{
                header: {
                  cell: (props: any) => {
                    return <HeaderCell {...props} />
                  }
                },
              }}
            />
          </DragIndexContext.Provider>
        </SortableContext>
        <DragOverlay>
          <th style={{ backgroundColor: 'lightyellow', padding: 16, border: '1px solid #ccc' }}>
            {self.children[self.children.findIndex((i) => i._id === dragIndex.active)]?.title as React.ReactNode}
          </th>
        </DragOverlay>
      </DndContext>
    </ComponentWrap>
  )}</Observer>
}