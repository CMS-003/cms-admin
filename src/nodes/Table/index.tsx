import { NodeWrapper } from "@/composer/NodeWrapper";
import { SourceScope, useActions, useMode, usePage, useQuery, useQueryScope } from "@/context";
import { IBaseCom, IResource } from "@/types";
import { useLocalProxy } from "@/utils/valtio";
import { isNil, set } from 'lodash-es'
import apis from "@/api";
import CONST from "@/constant";
import events from "@/utils/event";
import { Grip, GripVertical } from "lucide-react";
import { useCallback, useRef } from "react";
import { useEffectOnce } from "react-use";
import { message, Table } from "antd";

export default function CTable({ self, bindings, childrenNodes, resolveChildren }: IBaseCom) {
  const actions = useActions();
  const mode = useMode();
  const page = usePage();
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

  /**
   * 查询条件域。
   * 读分两种：渲染里要用的（page_size）走 useQuery 按值订阅；
   * 命令式要用的（拼 fetch 参数）现取 scope、调用时再 get —— 不会有闭包陈旧的问题。
   */
  const queryScope = useQueryScope();
  const pageSize = parseInt(String(useQuery('page_size') ?? '')) || 20;

  const init = useCallback(async (params?: Record<string, any>) => {
    if (self.widget.action === 'FETCH' && mode === 'preview') {
      localStore.loading = true
      // 显式传进来的（搜索事件携带的快照）优先，否则现读查询域
      const current = Object.assign({}, params ?? queryScope.get())
      const resp = await apis.fetch(self.widget.method, self.getApi(current, current));
      if (resp.code === 0) {
        localStore.resources = (resp.data as any).items as IResource[]
        localStore.total = (resp.data as any).total || 0
      }
      localStore.loading = false
    }
  }, [self.widget.action, mode, queryScope, localStore])

  // 事件总线只在 useEffectOnce 里注册一次，直接把 init 闭包进去的话，
  // 它永远是「首次渲染那一份」。用 ref 转一道，回调里始终调到最新的 init。
  const initRef = useRef(init)
  initRef.current = init

  /**
   * 单元格的写回通道。
   * 传下去给子节点读的 source 是**快照**（localState.resources[i]），写的时候必须找
   * **活的那一项**（localStore.resources[i]，valtio proxy），改快照没人会知道。
   * 以前单元格里的表单控件是往模板级 store.source 写的 —— 那是错的目标。
   */
  const writeRow = useCallback((rowId: string, field: string, value: any) => {
    const live = (localStore.resources as IResource[]).find(r => r._id === rowId)
    set((live ?? localStore.temp) as any, field, value)
  }, [localStore])

  /**
   * websocket 推送过来的资源状态变化。
   * 注意不能写成 `events.on('event', localStore.changeResource)` ——
   * valtio 的 proxy **不绑定方法**，方法被摘出来调用时 `this` 就丢了，
   * 里面的 `this.resources` 会直接抛。包一层、在调用点用 `localStore.xxx()` 才有 this。
   */
  const handleResourceEvent = useCallback((data: any) => {
    localStore.changeResource(data)
  }, [localStore])

  useEffectOnce(() => {
    if (!queryScope.get('page_size')) {
      actions.setQuery('page_size', 20)
    }
    initRef.current();
    const onSetQuery = (event: { target: { template_id: string, query?: Record<string, any> } }) => {
      if (self.template_id === event.target?.template_id) {
        // 搜索事件的目标里带了发出瞬间的 query 快照，直接用
        initRef.current(event.target?.query)
      }
    };
    events.on(CONST.ACTION_TYPE.SEARCH, onSetQuery);
    events.on('event', handleResourceEvent)
    return () => {
      events.off(CONST.ACTION_TYPE.SEARCH, onSetQuery);
      events.off('event', handleResourceEvent)
    }
  })
  return <div
    {...bindings.root}
    className={cls}
    style={{
      flexDirection: 'row', height: '100%', overflow: 'hidden'
    }}>
    <div style={{ display: 'flex' }}>
      {mode === 'edit' && <Grip className="node-handle" ref={bindings.handleRef} onContextMenu={bindings.onContextMenu} />}
    </div>
    <Table<IResource>
      style={{}}
      loading={localState.loading}
      pagination={{ total: localState.total, pageSize }}
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
        // 每行一个数据域：读用这一行的快照，写回落这一行
        render: (field: string, data: any) => (
          <SourceScope source={data} write={(f: string, v: any) => writeRow(data._id, f, v)}>
            {resolveChildren(child._id).map((item, k: number) => (
              <NodeWrapper key={k} self={item} onContextMenu={bindings.onContextMenu} />
            ))}
          </SourceScope>
        )
      }))}
      components={{
        header: {
          cell: (props: any) => {
            return <th>
              <NodeWrapper self={props.self} onContextMenu={bindings.onContextMenu} />
            </th>
          }
        }
      }}
    />
  </div>
}
