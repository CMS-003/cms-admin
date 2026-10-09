import { FullHeight, FullHeightAuto } from "@/components/style";
import { IBaseCom, IComponent, IResource, ITemplate, IWidget } from "@/types";
import { useLocalProxy } from "@/utils/valtio";
import { GripVertical, Grip } from "lucide-react";
import { Button, message, Space, Spin } from 'antd'
import { NodeWrapper } from "@/composer/NodeWrapper";
import apis from "@/api";
import events from "@/utils/event";
import { useEffect } from "react";
import { useEffectOnce } from "react-use";
import { getWidgetValue } from "@/composer/utils";
import { isNil, set, isEqual, isEmpty, omit, pick } from "lodash-es";
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

export default function CForm({ self, bindings, mode, page, children, childrenNodes }: IBaseCom) {
  const cls = ['node', bindings.isDragging ? 'is-dragging' : '',].join(' ');
  const [localState, localStore] = useLocalProxy({
    loading: false,
    $origin: {} as any,
    booting: true,
    source: {} as any,
    query: { id: page.query.id } as any,
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
    initSource(source: any) {
      this.$origin = source;
      this.source = source;
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
    setDataField(widget: IWidget, value: any) {
      if (!widget.field) {
        return;
      }
      value = getWidgetValue(widget, value);
      if (isNil(value)) {
        return;
      }
      if (widget.query) {
        localStore.query[widget.field] = value;
      } else {
        set(localStore.source, widget.field, value)
      }
    },
    setNodeField(node: any, key: string, value: any) {

    },
    async getInfo() {
      if (self.widget.action === 'FETCH' && mode === 'preview' && page.query.id) {
        this.loading = true
        const resp = await apis.fetch('get', self.getApi(page.query));
        if (resp.code === 0) {
          this.source = resp.data
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
        const url = self.getApi(this.query)
        const result = page.query.id
          ? await apis.fetch<IResource>('put', url, changes)
          : await apis.fetch<IResource>('post', url, changes);
        if (result.code === 0) {
          if (result.data) {
            this.$origin = result.data as any;
            this.initSource(result.data)
            // page.setQuery('id', result.data._id)
          } else {
            this.$origin = this.source;
          }
          if (result.data) {
            // 刷新父页面列表
            events.emit(CONST.ACTION_TYPE.SEARCH, { target: pick(parent || page, ['template_id', 'path', 'param', 'query']) })
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
          this.$origin = this.source;
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
  }, [page.query['id'], self.widget.action])
  useEffectOnce(() => {
    events.on('event', localStore.changeResource);
    return () => {
      events.off('event', localStore.changeResource)
    }
  })
  return <div
    {...bindings.root}
    className={cls}
    style={{
      flexDirection: 'column', height: '100%'
    }}>
    <div style={{ display: 'flex' }}>
      {mode === 'edit' && <Grip className="node-handle" ref={bindings.handleRef} onContextMenu={bindings.onContextMenu} />}
    </div>
    <FullHeight>
      <FullHeightAuto>
        {localState.booting
          ? <Spin></Spin>
          : childrenNodes.map(child => (
            <NodeWrapper key={child._id} self={child} setNodeField={localStore.setNodeField} source={localState.source} setDataField={localStore.setDataField} onContextMenu={bindings.onContextMenu} />
          ))}
      </FullHeightAuto>
      <Space style={{ padding: 8, justifyContent: 'center' }}>
        <Button loading={localState.loading} disabled={mode === 'edit' || localState.loading || !localState.isDiffed} type='primary' onClick={() => localStore.updateInfo(false)}>保存</Button>
        <Button loading={localState.loading} disabled={mode === 'edit' || localState.loading || !localState.isDiffed} type='primary' onClick={() => localStore.updateInfo(true)}>保存并关闭</Button>
      </Space>
    </FullHeight>
  </div>
}