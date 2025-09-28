import { Center, FullHeightAuto, FullWidthAuto } from '@/components/style'
import { IAuto, IBaseComponent, IWidget } from '@/types/component'
import { Observer, useLocalObservable } from 'mobx-react'
import { Button, message, Space } from 'antd'
import { Component } from '../auto'
import { useCallback, useEffect } from 'react'
import apis from '@/api'
import NatureSortable from '@/components/NatureSortable'
import { usePageContext } from '../context'
import { runInAction, toJS } from 'mobx'
import { IResource } from '@/types'
import events from '@/utils/event';
import { pick, set, isEqual, isEmpty, omit } from 'lodash';
import CONST from '@/constant';
import { ComponentWrap } from '../style';
import { useEffectOnce } from 'react-use'
import store from '@/store'
import { getWidgetValue } from '../utils'
import _ from 'lodash'

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

export default function CForm({ self, mode, drag, dnd, children, parent }: IAuto & IBaseComponent) {
  const page = usePageContext();
  const local: {
    source: { [key: string]: any };
    query: { [key: string]: any };
    $origin: { [key: string]: any };
    loading: boolean;
    setSource: Function;
    setDataField: (widget: IWidget, value: any) => void;
    getDiff: Function;
    isDiff: Function;
    setLoading: Function;
    setSubStatus: Function;
  }
    = useLocalObservable(() => ({
      loading: false,
      source: {},
      query: {},
      $origin: {},
      setSource: function () {
        const args = Array.from(arguments);
        if (args.length === 1) {
          local.source = args[0];
          local.$origin = args[0];
        } else {
          let v = args[1];
          if (args[2] === true) {
            local.$origin = _.assign(_.cloneDeep(local.$origin), { [args[0]]: args[1] });
          }
          set(local.source, args[0], v)
        }
      },
      setDataField: (widget: IWidget, value: any) => {
        if (!widget.field) {
          return;
        }
        value = getWidgetValue(widget, value);
        if (_.isNil(value)) {
          return;
        }
        if (widget.query) {
          local.query[widget.field] = value;
        } else {
          local.source[widget.field] = value
        }
      },
      getDiff() {
        const keys1 = Object.keys(local.$origin);
        const keys2 = Object.keys(local.source);
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
          const equal = isEqual((local.$origin as any)[key], (local.source as any)[key]);
          if (!equal) {
            result[key] = local.source[key]
          }
        })
        return result;
      },
      isDiff() {
        return !isEmpty(local.getDiff())
      },
      setLoading(b: boolean) {
        local.loading = b
      },
      setSubStatus(type: 'chapters' | 'images' | 'videos', _id: string, status: number) {
        if (local.source[type]) {
          local.source[type].forEach((doc: any) => {
            if (doc._id === _id) {
              doc.status = status;
            }
          })
        }
      }
    }));
  const getInfo = useCallback(async () => {
    if (self.widget.action === 'FETCH' && mode === 'preview' && page.query.id) {
      local.setLoading(true)
      const resp = await apis.fetch('get', self.getApi(page.query['id'] as string));
      if (resp.code === 0) {
        local.setSource(resp.data);
      }
      local.setLoading(false)
    }
  }, [self.widget.action, page.query['id']])
  const updateInfo = useCallback(async (close = false) => {
    try {
      local.setLoading(true)
      const { omits, picks } = getFields(self.widget);
      const data = toJS(local.source) as IResource;
      const changes = omits.length ? omit(data, omits) : (picks.length ? pick(data, picks) : data);
      const url = self.getApi(page.query.id as string, local.query)
      const result = await (page.query.id ? apis.fetch<IResource>('put', url, changes) : apis.fetch<IResource>('post', url, changes));
      if (result.code === 0) {
        runInAction(() => {
          if (result.data) {
            local.$origin = result.data as any;
            local.setSource(result.data)
            page.setQuery('id', result.data._id)
          } else {
            local.$origin = local.source;
          }
        })
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
        message.warn('请求失败', 1)
      }
    } catch (e) {

    } finally {
      local.setLoading(false)
    }
  }, [])
  const changeResource = function (data: any) {
    if (self.name === 'resource_detail') {
      const resource_id = data.resource_id;
      if (data.resource_type === 'resource' && resource_id === local.source._id) {
        local.setSource('status', data.status, true)
      } else if (data.resource_type === 'chapter') {
        local.setSubStatus('chapters', resource_id, data.status)
      } else if (data.resource_type === 'video') {
        local.setSubStatus('videos', resource_id, data.status)
      } else if (data.resource_type === 'image') {
        local.setSubStatus('images', resource_id, data.status);
      }
    }
  }
  useEffect(() => {
    getInfo();
  }, [page.query['id'], self.widget.action])
  useEffectOnce(() => {
    events.on('event', changeResource);
    return () => {
      events.off('event', changeResource)
    }
  })
  return <Observer>{() => (
    <ComponentWrap
      className={mode + drag.className}
      {...drag.events}
      ref={dnd?.ref}
      {...dnd?.props}
      style={{
        width: '100%',
        height: '100%',
        ...dnd?.style,
        backgroundColor: dnd?.isDragging ? 'lightblue' : '',
      }}
    >
      {children}
      <FullWidthAuto style={{ display: 'flex', flexDirection: 'column', flex: 1, height: '100%' }}>
        <FullHeightAuto>
          <NatureSortable
            items={self.children}
            direction='vertical'
            disabled={mode === 'preview' || store.component.can_drag_id !== self._id}
            droppableId={self._id}
            sort={self.swap}
            renderItem={({ item, dnd }) => (
              <Component
                self={item}
                mode={mode}
                source={local.source}
                setDataField={local.setDataField}
                dnd={dnd}
                page={page}
              />
            )}
          />
        </FullHeightAuto>
        <Center>
          <Space style={{ padding: 8 }}>
            <Button loading={local.loading} disabled={local.loading || !local.isDiff() && isEmpty(local.query)} type='primary' onClick={() => updateInfo(false)}>保存</Button>
            <Button loading={local.loading} disabled={local.loading || !local.isDiff() && isEmpty(local.query)} type='primary' onClick={() => updateInfo(true)}>保存并关闭</Button>
          </Space>
        </Center>
      </FullWidthAuto>
    </ComponentWrap>
  )}</Observer>
}