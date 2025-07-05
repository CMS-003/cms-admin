
import { Center, FullHeight } from '@/components/style'
import { IAuto, IBaseComponent, IWidget } from '@/types/component'
import NatureSortable from '@/components/NatureSortable'
import { Component } from '../auto'
import { runInAction, toJS } from 'mobx';
import { Observer, useLocalObservable } from 'mobx-react'
import { Acon, SortList, Style } from '@/components'
import icon_drag from '@/asserts/images/drag.svg'
import { Space, message } from 'antd'
import { ComponentWrap } from '../style';
import apis from '@/api';
import styled from 'styled-components';
import CONST from '@/constant';

const ObjectItem = styled.div`
  display: flex;
  flex-direction: row;
  position: relative;
  align-items: center;
  flex: 1;
  padding: 2px;
  border: 1px dashed #00000036;
  &:hover {
    background-color: lightblue;
  }
`

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
          ? <SortList
            sort={(srcIndex: number, dstIndex: number) => {
              const items = source[self.widget.field] || [];
              const [item] = items.splice(srcIndex, 1);
              items.splice(dstIndex, 0, item);
              setDataField(self.widget, items);
            }}
            droppableId={self._id}
            items={source[self.widget.field] || []}
            itemStyle={{ overflow: 'initial', gap: 2, marginBottom: 2 }}
            mode='edit'
            direction='vertical'
            renderItem={({ item, handler }: { item: any, handler: any }) => (
              <ObjectItem key={item._id}>
                <span {...handler}>
                  <Style.IconSVG src={icon_drag} />
                </span>
                <div style={{
                  display: 'flex',
                  flexDirection: 'column',
                  flex: 1,
                  gap: 2,
                }}>
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
              </ObjectItem>
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
                source={local.source}
                setDataField={local.setTempDataField}
                {...props}
              />
            )}
          />
        }
        {local.showAdd && (
          <div style={{ padding: 4, display: 'flex', flexDirection: 'column', gap: 2, marginBottom: 2, border: '1px dashed #ccc' }}>
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
        <Center style={{ borderRadius: 5, backgroundColor: '#dedede', display: 'flex', justifyContent: 'center' }}>
          {local.showAdd
            ? <Space>
              <Acon icon="close" style={{ padding: '10px 15px' }} onClick={() => {
                local.setAdd(false)
                local.set({})
              }} />
              <Acon icon="check" style={{ padding: '10px 15px' }} onClick={async () => {
                const videos = (toJS(source[self.widget.field]))
                const video = toJS(local.source)
                if (self.widget.action === CONST.ACTION_TYPE.FETCH) {
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
                } else {
                  videos.push(video);
                  setDataField(self.widget, videos)
                  local.setAdd(false)
                  local.set({})
                }
              }} />
            </Space>
            : <Acon icon="PlusOutlined" style={{ padding: '10px 15px' }} onClick={() => {
              local.setAdd(true)
            }} />
          }
        </Center>
      </FullHeight>
    </ComponentWrap>
  )}</Observer>
}