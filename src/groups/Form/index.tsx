import { AlignAround, FullHeight, FullHeightAuto } from '@/components/style'
import { IAuto, IBaseComponent } from '@/types/component'
import { Observer, useLocalObservable } from 'mobx-react'
import { Button, message } from 'antd'
import { Component } from '../auto'
import { useCallback, useContext, useEffect } from 'react'
import apis from '@/api'
import _ from 'lodash'
import NatureSortable from '@/components/NatureSortable'
import { usePageContext } from '../context'
import { toJS } from 'mobx'
import { IResource } from '@/types'

export default function CForm({ self, mode, drag, dnd, children }: IAuto & IBaseComponent) {
  const page = usePageContext();
  const local: {
    source: { [key: string]: any };
    $origin: { [key: string]: any };
    loading: boolean;
    setSource: Function;
    updateSource: Function;
    getDiff: Function;
    isDiff: Function;
    setLoading: Function;
  }
    = useLocalObservable(() => ({
      loading: false,
      source: {},
      $origin: {},
      setSource: function () {
        const args = arguments;
        if (args.length === 1) {
          local.source = args[0];
          local.$origin = args[0];
        } else {
          local.source[args[0]] = args[1];
        }
      },
      updateSource: (field: string, value: any) => (local.source as any)[field] = value,
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
      const resp = await apis.getDataInfo(self.api, page.query['id'] as string);
      if (resp.code === 0) {
        local.setSource(resp.data);
      }
      local.setLoading(false)
    }
  }, [self.api, page.query['id']])
  const updateInfo = useCallback(async () => {
    try {
      local.setLoading(true)
      const data = toJS(local.source) as IResource;
      const result = await (local.source._id ? apis.putData(self.api, data) : apis.createData(self.api, data));
      if (result.code === 0) {
        local.setSource(result.data)
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
    <FullHeight
      className={mode + drag.className}
      {...drag.events}
      ref={dnd?.ref}
      {...dnd?.props}
      style={{
        width: '100%', height: '100%',
        ...dnd?.style,
        backgroundColor: dnd?.isDragging ? 'lightblue' : '',
      }}
    >
      {children}
      <FullHeightAuto>
        <NatureSortable
          items={self.children}
          direction='vertical'
          droppableId={self._id}
          sort={self.swap}
          renderItem={({ item, dnd }) => (
            <Component
              self={item}
              mode={mode}
              source={local.source}
              setSource={local.setSource}
              dnd={dnd}
              page={page}
            />
          )}
        />
      </FullHeightAuto>
      <AlignAround style={{ padding: 8 }}>
        <Button loading={local.loading} disabled={!local.isDiff()} type='primary' onClick={updateInfo}>保存</Button>
      </AlignAround>
    </FullHeight>

  )}</Observer>
}