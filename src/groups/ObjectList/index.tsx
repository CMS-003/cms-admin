
import { Center, FullHeight } from '@/components/style'
import { IAuto, IBaseComponent, IWidget } from '@/types/component'
import NatureSortable from '@/components/NatureSortable'
import { Component } from '../auto'
import { runInAction, toJS } from 'mobx';
import { Observer, useLocalObservable } from 'mobx-react'
import { Acon } from '@/components'
import { Space, message } from 'antd'
import { ComponentWrap } from '../style';
import apis from '@/api';

export default function ObjectList({ self, mode, drag, dnd, source, children, setDataField, ...props }: IAuto & IBaseComponent) {
  const local = useLocalObservable<{
    showAdd: boolean;
    source: any;
    setTempDataField: (field: IWidget, value: any) => void;
    set: (s: any) => void;
    setAdd: (b: boolean) => void;
  }>(() => ({
    showAdd: false,
    source: {},
    setTempDataField(widget: IWidget, value: any) {
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
    <ComponentWrap key={self.children.length}
      className={mode + drag.className}
      {...drag.events}
      ref={dnd?.ref}
      {...dnd?.props}
      style={{ height: '100%', justifyContent: 'center', alignItems: 'center', ...dnd?.style }}
    >
      {children}
      <FullHeight style={{ flex: 1 }}>
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
                style={{ padding: 4, display: 'flex', flexDirection: 'column', gap: 2, ...dnd2?.style }}
              >
                {self.children.map(child => (
                  <Component
                    key={child._id}
                    self={child}
                    mode={mode}
                    source={item}
                    initField={false}
                    setDataField={(widget: IWidget, value: any) => {
                      switch (widget.type) {
                        case 'boolean':
                          value = [1, '1', 'true', 'TRUE', true].includes(value) ? true : false;
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
                ))}
              </div>
            )}
          />
          : <NatureSortable
            items={self.children}
            direction='vertical'
            disabled={mode === 'preview'}
            droppableId={self._id}

            style={{ padding: 4, display: 'flex', flexDirection: 'column', gap: 2, }}
            sort={self.swap}
            renderItem={({ item, dnd }) => (
              <Component
                self={item}
                mode={mode}
                dnd={dnd}
                source={{}}
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
                    // item[widget.field] = value
                  })
                }}
                {...props}
              />
            )}
          />
        }
        {local.showAdd && (
          <div style={{ padding: 4, display: 'flex', flexDirection: 'column', gap: 2, border: '1px dashed #ccc' }}>
            {
              self.children.map(child => (
                <Component
                  key={child._id}
                  self={child}
                  mode={mode}
                  dnd={dnd}
                  source={local.source}
                  setDataField={(widget: IWidget, value: any) => {
                    local.setTempDataField(widget, value)
                  }}
                />
              ))
            }
          </div>
        )}
        <Center style={{ margin: 4, padding: 10, borderRadius: 5, backgroundColor: 'lightblue' }}>
          {local.showAdd
            ? <Space>
              <Acon icon="close" onClick={() => {
                local.setAdd(false)
                local.set({})
              }} />
              <Acon icon="check" onClick={async () => {
                const videos = (toJS(source[self.widget.field]))
                const video = toJS(local.source)
                const url = self.getApi(source._id)
                try {
                  const resp = await apis.fetch(self.widget.method, url, video);
                  if (resp.code === 0) {
                    videos.push(resp.data);
                    setDataField(self.widget, videos)
                  } else {
                    message.error('请求失败')
                  }
                } catch (e) {
                  console.log(e)
                } finally {
                  local.setAdd(false)
                  local.set({})
                }
              }} />
            </Space>
            : <Acon icon="PlusOutlined" onClick={() => {
              local.setAdd(true)
            }} />
          }
        </Center>
      </FullHeight>
    </ComponentWrap>
  )}</Observer>
}