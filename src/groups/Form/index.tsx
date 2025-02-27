import { AlignAround, FullHeight, FullHeightAuto } from '@/components/style'
import { IAuto, IBaseComponent } from '@/types/component'
import { Observer, useLocalStore } from 'mobx-react'
import { Button } from 'antd'
import { Component } from '../auto'
import { useCallback, useEffect } from 'react'
import apis from '@/api'
import _ from 'lodash'
import NatureSortable from '@/components/NatureSortable'

export default function CForm({ self, mode, page, drag, dnd, children }: IAuto & IBaseComponent) {
  const local: {
    source: { [key: string]: any };
    $origin: { [key: string]: any };
    loading: boolean;
    setSource: Function;
    updateSource: Function;
    getDiff: Function;
    isDiff: Function;
  }
    = useLocalStore(() => ({
      loading: false,
      source: {},
      $origin: {},
      setSource: (d: any) => {
        local.source = d;
        local.$origin = d;
      },
      updateSource: (field: string, value: any) => (local.source as any)[field] = value,
      getDiff() {
        const result: { [key: string]: any } = {};
        for (let key in local.$origin) {
          const equal = _.isEqual((local.$origin as any)[key], (local.source as any)[key]);
          if (!equal) {
            result[key] = local.source[key]
          }
        }
        return result;
      },
      isDiff() {
        return !_.isEmpty(local.getDiff())
      }
    }));
  const getInfo = useCallback(async () => {
    if (self.api && mode === 'preview') {
      local.loading = true;
      const resp = await apis.getInfo(self.api, page.query['id'] as string);
      if (resp.code === 0) {
        local.setSource(resp.data);
      }
      local.loading = false;
    }
  }, [self.api, page.query['id']])
  const updateInfo = useCallback(async () => {
    console.log(local.getDiff(), self.api)
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