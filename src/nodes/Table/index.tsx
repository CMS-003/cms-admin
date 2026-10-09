import { NodeWrapper } from "@/composer/NodeWrapper";
import { IBaseCom, IComponent, IPageInfo, IResource, IWidget } from "@/types";
import { useLocalProxy } from "@/utils/valtio";
import { getWidgetValue } from '@/groups/utils'
import { isNil } from 'lodash-es'
import apis from "@/api";
import CONST from "@/constant";
import events from "@/utils/event";
import { useCallback } from "react";
import { useEffectOnce } from "react-use";
import { message, Table } from "antd";
import { getApi } from "@/composer/utils";


export default function CTable({ self, bindings, source, setDataField, setNodeField, mode, page, setQuery, children, childrenNodes, resolveChildren }: IBaseCom) {
  const cls = ['node', bindings.isDragging ? 'is-dragging' : '',].join(' ');
  const [localState, localStore] = useLocalProxy({
    loading: false,
    total: 0,
    resources: [] as IResource[],
    temp: { _id: 'temp' } as any,
    changeResource(data: any) {
      if (data.resource_type === 'resource' || data.resource_type === 'task') {
        this.resources.forEach(resource => {
          if (resource._id === data.resource_id) {
            if (!isNil(data.status)) {
              resource.status = data.status;
            }
            if (!isNil(data.transcode)) {
              resource.transcode = data.transcode;
            }
            if (!isNil(data.progress) && data.resource_type === 'task') {
              resource.progress = data.progress;
            }
            if (!isNil(data.message) && data.resource_type === 'task') {
              resource.message = data.message;
              data.message && message.warning(data.message)
            }
          }
        })
      }
    }
  });
  const onSetQuery = function (event: { target: { template_id: string, path: string } }) {
    if (self.template_id === event.target.template_id) {
      init();
    }
  };
  const init = useCallback(async () => {
    if (self.widget.action === 'FETCH' && mode === 'preview') {
      localStore.loading = true
      const params = Object.assign({}, page.query)
      const resp = await apis.fetch(self.widget.method, getApi(self, params, params));
      if (resp.code === 0) {
        localStore.resources = (resp.data as any).items as IResource[]
        localStore.total = (resp.data as any).total || 0
      }
      localStore.loading = false
    }
  }, [self.widget.action])

  useEffectOnce(() => {
    if (!page.query.page_size) {
      setQuery('page_size', 20)
    }
    init();
    events.on(CONST.ACTION_TYPE.SEARCH, onSetQuery);
    events.on('event', localStore.changeResource)
    return () => {
      events.off(CONST.ACTION_TYPE.SEARCH, onSetQuery);
      events.off('event', localStore.changeResource)
    }
  })
  return <div
    {...bindings.root}
    className={cls}
    style={{
      flexDirection: 'column', overflow: 'hidden'
    }}>
    <Table<IResource>
      style={{}}
      loading={localState.loading}
      pagination={{ total: localState.total, pageSize: parseInt(page.query.page_zie as string) || 20 }}
      rowKey={'_id'}
      sticky={true}
      dataSource={mode === 'edit' ? [localState.temp] : localState.resources}
      onChange={p => {
        // page.setQuery('page', p.current as number)
        // page.setQuery('page_size', p.pageSize as number)
        init();
      }}
      columns={childrenNodes.map(child => ({
        title: child.title,
        _id: child._id,
        key: child._id,
        dataIndex: self.widget.field,
        onHeaderCell: () => ({ _id: child._id, title: child.title, self: child, mode: mode, page: page }),
        render: (field: string, data: any) => (
          resolveChildren(child._id).map((item, k: number) => (
            <NodeWrapper key={k} self={item} source={data} setNodeField={setNodeField} setDataField={(widget: IWidget, value: any) => {
              if (!widget.field) {
                return;
              }
              value = getWidgetValue(widget, value);
              if (isNil(value)) {
                return;
              }
              data[widget.field] = value
            }} />
          ))
        )
      }))}
      components={{
        header: {
          cell: (props: any) => {
            return <th>
              <NodeWrapper self={props.self} source={source} setDataField={setDataField} setNodeField={setNodeField} />
            </th>
          }
        }
      }}
    />
  </div>
}