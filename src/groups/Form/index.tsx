import { AlignAround, Center, FullHeight, FullHeightAuto, FullWidthAuto } from '@/components/style'
import { IAuto, IBaseComponent, IWidget } from '@/types/component'
import { Observer, useLocalObservable } from 'mobx-react'
import { Button, message, Space } from 'antd'
import { Component } from '../auto'
import { useCallback, useContext, useEffect } from 'react'
import apis from '@/api'
import _ from 'lodash'
import NatureSortable from '@/components/NatureSortable'
import { usePageContext } from '../context'
import { toJS } from 'mobx'
import { IResource } from '@/types'
import events from '@/utils/event';
import { pick } from 'lodash';
import CONST from '@/constant';
import { ComponentWrap } from '../style';

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
  }
    = useLocalObservable(() => ({
      loading: false,
      source: {},
      query: {},
      $origin: {},
      setSource: function () {
        const args = Array.from(arguments);
        let type = 'body';
        if (args.length === 3) {
          type = args.pop();
        }
        if (args.length === 1) {
          local.source = args[0];
          local.$origin = args[0];
        } else {
          let v = args[1];
          if (type === 'body') {
            _.set(local.source, args[0], v)
          }
          if (type === 'query') {
            local.query[args[0]] = args[1]
          }
        }
      },
      setDataField: (widget: IWidget, value: any) => {
        if (!widget.field) {
          return;
        }
        switch (widget.type) {
          case 'boolean':
            value = [1, '1', 'true', 'TRUE'].includes(value) ? true : false;
            break;
          case 'number':
            value = parseFloat(value) || 0
            break;
          case 'json':
            try {
              value = JSON.parse(value);
            } catch (e) {
              return;
            }
            break;
          default: break;
        }
        if (widget.in === 'query') {
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
        s.forEach(key => {
          const equal = _.isEqual((local.$origin as any)[key], (local.source as any)[key]);
          if (!equal) {
            result[key] = local.source[key]
          }
        })
        return result;
      },
      isDiff() {
        return !_.isEmpty(local.getDiff())
      },
      setLoading(b: boolean) {
        local.loading = b
      }
    }));
  const getInfo = useCallback(async () => {
    if (self.api && mode === 'preview' && page.query.id) {
      local.setLoading(true)
      const resp = await apis.getDataInfo(self.getApi(page.query['id'] as string));
      if (resp.code === 0) {
        local.setSource(resp.data);
      }
      local.setLoading(false)
    }
  }, [self.api, page.query['id']])
  const updateInfo = useCallback(async (close = false) => {
    try {
      local.setLoading(true)
      const data = toJS(local.source) as IResource;
      const result = await (page.query.id ? apis.putData(self.getApi(page.query['id'] as string, local.query), data) : apis.createData(self.getApi(page.query['id'] as string, local.query), data));
      if (result.code === 0) {
        if (result.data) {
          local.setSource(result.data)
          // 刷新父页面列表
          events.emit(CONST.ACTION_TYPE.SEARCH, { target: pick(parent || page, ['template_id', 'path', 'param', 'query']) })
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
  useEffect(() => {
    getInfo();
  }, [page.query['id'], self.api])
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
        <FullHeightAuto style={{ overflow: 'initial' }}>
          <NatureSortable
            items={self.children}
            direction='vertical'
            disabled={mode === 'preview'}
            droppableId={self._id}
            sort={self.swap}
            renderItem={({ item, dnd }) => (
              <Component
                self={item}
                mode={mode}
                query={local.query}
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
            <Button loading={local.loading} disabled={!local.isDiff() && _.isEmpty(local.query)} type='primary' onClick={() => updateInfo(false)}>保存</Button>
            <Button loading={local.loading} disabled={!local.isDiff() && _.isEmpty(local.query)} type='primary' onClick={() => updateInfo(true)}>保存并关闭</Button>
          </Space>
        </Center>
      </FullWidthAuto>
    </ComponentWrap>
  )}</Observer>
}