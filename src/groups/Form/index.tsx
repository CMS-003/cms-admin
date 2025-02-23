import { AlignAround, FullHeight, FullHeightAuto } from '@/components/style'
import { IAuto, IBaseComponent, IComponent } from '@/types/component'
import { Observer, useLocalStore } from 'mobx-react'
import { Button } from 'antd'
import { SortList } from '@/components'
import { Component } from '../auto'
import { useCallback, useEffect } from 'react'
import apis from '@/api'
import _ from 'lodash'
import { DragDropContext, Droppable, Draggable, DropResult, Direction, DraggableProvided, DraggableStateSnapshot, DraggableChildrenFn } from "react-beautiful-dnd";
import NatureSortable from '@/components/NatureSortable'

export default function CForm({ self, mode, page, drag, children }: IAuto & IBaseComponent) {
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
      const resp = await apis.getInfo(self.api, page?.query['id'] as string);
      if (resp.code === 0) {
        local.setSource(resp.data);
      }
      local.loading = false;
    }
  }, [self.api, page?.query['id']])
  const updateInfo = useCallback(async () => {
    console.log(local.getDiff(), self.api)
  }, [])
  useEffect(() => {
    getInfo();
  }, [page?.query['id'], self.api])
  return <Observer>{() => (
    <FullHeight
      style={{ width: '100%', height: '100%' }}
      className={`${mode} ${drag?.classNames}`}
      {...drag.events}
    >
      {children}
      <FullHeightAuto>
        <NatureSortable
          items={self.children}
          direction='vertical'
          droppableId={self._id}
          sort={(srcIndex, dstIndex) => self.swap(srcIndex, dstIndex)}
          renderItem={({ item, dnd, index }) => (
            <Component
              self={item}
              mode={mode}
              index={index}
              source={local.source}
              setSource={local.setSource}
              setParentHovered={drag?.setIsMouseOver}
              dnd={dnd}
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