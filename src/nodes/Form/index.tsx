import { FullHeight, FullHeightAuto } from "@/components/style";
import { IBaseCom, IResource, IWidget } from "@/types";
import { useLocalProxy } from "@/utils/valtio";
import { SourceScope, useMode, usePage, useQuery, useQueryScope } from "@/context";
import { GripVertical, Grip } from "lucide-react";
import { Button, message, Space, Spin } from 'antd'
import { NodeWrapper } from "@/composer/NodeWrapper";
import apis from "@/api";
import events from "@/utils/event";
import { useCallback, useEffect, useRef } from "react";
import { useEffectOnce } from "react-use";
import { cloneDeep, isEmpty, isEqual, omit, pick, set } from "lodash-es";
import CONST from "@/constant";

function getFields(widget: IWidget) {
  const picks: string[] = [], omits: string[] = [];
  widget.refer.map(kv => {
    if (typeof kv.value === 'string') {
      const flag = kv.value.startsWith('-')
      const field = kv.value.replace(/^-/, '')
      if (flag) {
        omits.push(field)
      } else {
        picks.push(field);
      }
    }
  });
  return { picks, omits }
}

/**
 * 详情表单。
 *
 * 数据模型：
 * - **source** = 本表单的详情数据，整个子树共用（这里用 <SourceScope> 覆盖模板级数据源）
 * - **query** = 页面查询条件（整页共用一份），表单只从这里取 `id` 决定拉哪条 / 是新建还是更新
 *
 * 以前这里有第二份 query（`localStore.query`，挂载时从 `page.query.id` 抄一次）：
 * 子节点写入走的是这份副本，而读取走的是 `page.query` —— 写和读不是一个对象，
 * 加上挂载时只抄一次，等于永远读到过期值。现在只有一份 query，就是页面那份。
 */
export default function CForm({ self, bindings, childrenNodes }: IBaseCom) {
  const mode = useMode();
  const page = usePage();
  const cls = ['node', bindings.isDragging ? 'is-dragging' : '',].join(' ');

  // query 域在方法（getInfo / updateInfo）里是命令式读的，用 ref 兜住最新的一份
  const queryScope = useQueryScope();
  const queryRef = useRef(queryScope);
  queryRef.current = queryScope;

  /** 渲染里要订阅：id 变了要重新拉详情 */
  const resourceId = useQuery<string>('id');

  const [localState, localStore] = useLocalProxy({
    loading: false,
    $origin: {} as any,
    booting: true,
    source: {} as any,
    get isDiffed() {
      const keys1 = Object.keys(this.$origin);
      const keys2 = Object.keys(this.source);
      const s = new Set([...keys1, ...keys2]);
      const result: { [key: string]: any } = {};
      const { picks, omits } = getFields(self.widget);
      s.forEach(key => {
        if (picks.length && !picks.includes(key)) {
          return;
        }
        if (omits.length && omits.includes(key)) {
          return;
        }
        const equal = isEqual((this.$origin)[key], (this.source)[key]);
        if (!equal) {
          result[key] = this.source[key]
        }
      })
      return !isEmpty(result)
    },
    /**
     * 落基线。
     * $origin 必须**深拷贝**：以前是 `this.$origin = source; this.source = source`，
     * 两个字段指向同一个对象，之后任何一次编辑都会连基线一起改掉 ——
     * isDiffed 永远是 false，保存按钮永远灰着。
     */
    initSource(source: any) {
      this.$origin = cloneDeep(source);
      this.source = cloneDeep(source);
    },
    setSubStatus(type: 'chapters' | 'images' | 'videos', _id: string, status: number) {
      if (this.source[type]) {
        this.source[type].forEach((doc: any) => {
          if (doc._id === _id) {
            doc.status = status;
          }
        })
      }
    },
    async getInfo() {
      const id = queryRef.current.get('id');
      if (self.widget.action === 'FETCH' && mode === 'preview' && id) {
        this.loading = true
        const resp = await apis.fetch('get', self.getApi(queryRef.current.get()));
        if (resp.code === 0) {
          // 拉回来就是当前基线：不落 $origin 的话，isDiffed 会拿空对象比，
          // 刚打开就判定「有改动」，保存按钮一直是亮的
          this.initSource(resp.data)
        }
        this.loading = false
      }
      this.booting = false
    },
    async updateInfo(close: boolean = false) {
      try {
        this.loading = true
        const { omits, picks } = getFields(self.widget);
        const data = this.source as IResource;
        const changes = omits.length ? omit(data, omits) : (picks.length ? pick(data, picks) : data);
        // 只有 id 参与拼 URL（和以前 localStore.query 的内容一致）
        const id = queryRef.current.get('id');
        const url = self.getApi(id ? { id } : {})
        const result = id
          ? await apis.fetch<IResource>('put', url, changes)
          : await apis.fetch<IResource>('post', url, changes);
        if (result.code === 0) {
          if (result.data) {
            this.initSource(result.data)
            // 刷新父页面列表
            events.emit(CONST.ACTION_TYPE.SEARCH, { target: pick((page || {}) as any, ['template_id', 'path', 'param', 'query']) })
            if (close) {
              page.close()
            }
          } else {
            if (close) {
              page.close()
            }
          }
        } else {
          message.warning('请求失败', 1)
        }
      } catch (e) {

      } finally {
        this.loading = false
      }
    },
    changeResource(data: any) {
      if (self.name === 'resource_detail') {
        const resource_id = data.resource_id;
        if (data.resource_type === 'resource' && resource_id === this.source._id) {
          this.source.status = data.status;
          // 这条改动来自服务端，等同新基线（同样要深拷贝，不能和 source 共享引用）
          this.$origin = cloneDeep(this.source);
        } else if (data.resource_type === 'chapter') {
          this.setSubStatus('chapters', resource_id, data.status)
        } else if (data.resource_type === 'video') {
          this.setSubStatus('videos', resource_id, data.status)
        } else if (data.resource_type === 'image') {
          this.setSubStatus('images', resource_id, data.status);
        }
      }
    }
  });

  useEffect(() => {
    localStore.getInfo();
  }, [resourceId, self.widget.action])

  /**
   * websocket 推送的资源状态变化。
   * 不能写成 `events.on('event', localStore.changeResource)` —— valtio 的 proxy
   * **不绑定方法**，方法被摘出来单独调用时 `this` 会丢，里面的 `this.source` 会直接抛。
   */
  const handleResourceEvent = useCallback((data: any) => {
    localStore.changeResource(data)
  }, [localStore])

  useEffectOnce(() => {
    events.on('event', handleResourceEvent);
    return () => {
      events.off('event', handleResourceEvent)
    }
  })
  return <div
    {...bindings.root}
    className={cls}
    style={{
      flexDirection: 'row', height: '100%'
    }}>
    <div style={{ display: 'flex' }}>
      {mode === 'edit' && <Grip className="node-handle" ref={bindings.handleRef} onContextMenu={bindings.onContextMenu} />}
    </div>
    <FullHeight style={{ flex: 1 }}>
      <FullHeightAuto style={{ padding: '5px 0 0 0', ...self.style }}>
        {localState.booting
          ? <Spin></Spin>
          : (
            /* 整棵子树换成「详情」这个数据源；写回落活的 localStore.source（不是快照） */
            <SourceScope
              source={localState.source}
              write={(field, value) => set(localStore.source, field, value)}
            >
              {childrenNodes.map(child => (
                <NodeWrapper key={child._id} self={child} onContextMenu={bindings.onContextMenu} />
              ))}
            </SourceScope>
          )}
      </FullHeightAuto>
      <Space style={{ padding: 8, justifyContent: 'center' }}>
        <Button loading={localState.loading} disabled={mode === 'edit' || localState.loading || !localState.isDiffed} type='primary' onClick={() => localStore.updateInfo(false)}>保存</Button>
        <Button loading={localState.loading} disabled={mode === 'edit' || localState.loading || !localState.isDiffed} type='primary' onClick={() => localStore.updateInfo(true)}>保存并关闭</Button>
      </Space>
    </FullHeight>
  </div>
}
