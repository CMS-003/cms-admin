
import { Center, FullHeight } from '@/components/style'
import { IAuto, IBaseComponent, IWidget } from '@/types/component'
import _ from 'lodash'
import NatureSortable from '@/components/NatureSortable'
import { Component } from '../auto'
import { runInAction } from 'mobx';
import { Observer, useLocalObservable } from 'mobx-react'
import { Fragment } from 'react'
import { Acon } from '@/components'
import { Space } from 'antd'

export default function ObjectList({ self, mode, drag, dnd, source, children, setDataField, ...props }: IAuto & IBaseComponent) {
  const local = useLocalObservable<{
    showAdd: boolean;
    source: any;
    setDataField: (field: IWidget, value: any) => void;
    set: (s: any) => void;
    setAdd: (b: boolean) => void;
  }>(() => ({
    showAdd: false,
    source: {},
    setDataField(widget: IWidget, value: any) {
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
      local.source[widget.field] = value;
    },
    set(s) {
      local.source = s;
    },
    setAdd(b) {
      local.showAdd = b;
    }
  }));
  return <Observer>{() => (
    <FullHeight key={self.children.length}
      className={mode + drag.className}
      {...drag.events}
      ref={dnd?.ref}
      {...dnd?.props}
      style={{ ...self.style, ...dnd?.style }}
    >
      {children}
      {mode === 'preview'
        ? <NatureSortable
          items={source[self.widget.field] || []}
          direction='vertical'
          droppableId={self._id}
          sort={() => {

          }}
          style={{ overflow: 'initial' }}
          renderItem={({ item, dnd: dnd2, index }) => (
            <div
              key={index}
              ref={dnd2?.ref}
              {...dnd2?.props}
              style={{ padding: 4, ...dnd2?.style }}
            >
              {self.children.map(child => (
                <Component
                  key={child._id}
                  self={child}
                  mode={mode}
                  source={item}
                  setDataField={(widget: IWidget, value: any) => {

                  }}
                  {...props}
                />
              ))}
            </div>
          )}
        />
        : <NatureSortable
          items={self.children}
          direction='vertical'
          disabled={mode === 'preview'}
          droppableId={self._id}
          sort={self.swap}
          renderItem={({ item, dnd }) => (
            <Component
              self={item}
              mode={mode}
              dnd={dnd}
              source={item}
              setDataField={(widget: IWidget, value: any) => {
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
                runInAction(() => {
                  item[widget.field] = value
                })
              }}
              {...props}
            />
          )}
        />
      }
      {local.showAdd && (
        <Fragment>
          {
            self.children.map(child => (
              <Component
                key={child._id}
                self={child}
                mode={mode}
                dnd={dnd}
                source={local.source}
                setDataField={(widget: IWidget, value: any) => {
                  local.setDataField(widget, value)
                }}
              />
            ))
          }

        </Fragment>

      )}
      <Center>
        {local.showAdd
          ? <Space>
            <Acon icon="close" onClick={() => {
              local.setAdd(false)
              local.set({})
            }} />
            <Acon icon="check" onClick={() => {
              // TODO: 请求创建接口
              local.setAdd(false)
              setDataField(self.widget, [...(source[self.widget.field] || []), local.source])
              local.set({})
            }} />
          </Space>
          : <Acon icon="PlusOutlined" onClick={() => {
            local.setAdd(true)
          }} />
        }

      </Center>
    </FullHeight>
  )}</Observer>
}