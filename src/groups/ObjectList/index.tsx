
import { Center, FullHeight } from '@/components/style'
import { IAuto, IBaseComponent } from '@/types/component'
import _ from 'lodash'
import NatureSortable from '@/components/NatureSortable'
import { Component } from '../auto'
import { Observer, useLocalObservable } from 'mobx-react'
import { Fragment } from 'react'
import { Acon } from '@/components'
import { Space } from 'antd'

export default function ObjectList({ self, mode, drag, dnd, source, setSource, children, ...props }: IAuto & IBaseComponent) {
  const local = useLocalObservable<{
    showAdd: boolean;
    source: any;
    setSource: (field: string, value: any) => void;
  }>(() => ({
    showAdd: false,
    source: {},
    setSource(key: string, value: any) {
      local.source[key] = value;
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
                  setSource={(field: string, value: any) => {

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
                setSource={(field: string, value: any) => {
                  local.setSource(field, value)
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
              local.showAdd = false;
              local.source = {}
            }} />
            <Acon icon="check" onClick={() => {
              local.showAdd = false;
              setSource && setSource(self.widget.field, [...(source[self.widget.field] || []), local.source])
              local.source = {};
            }} />
          </Space>
          : <Acon icon="PlusOutlined" onClick={() => {
            local.showAdd = true
          }} />
        }

      </Center>
    </FullHeight>
  )}</Observer>
}