
import { Center, FullHeight } from '@/components/style'
import { IAuto, IBaseComponent, IComponent, IWidget } from '@/types/component'
import { Component } from '../auto'
import { runInAction, toJS } from 'mobx';
import { Observer, useLocalObservable } from 'mobx-react'
import { Acon, Style } from '@/components'
import icon_drag from '@/asserts/images/drag.svg'
import { Space, message } from 'antd'
import { ComponentWrap } from '../style';
import apis from '@/api';
import styled from 'styled-components';
import CONST from '@/constant';
import { getWidgetValue } from '../utils';
import _ from 'lodash';
import { SortDD } from '@/components/SortableDD';

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

export default function ObjectList({ self, mode, drag, source, children, setDataField, ...props }: IAuto & IBaseComponent) {
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
      if (!widget.field) {
        return;
      }
      value = getWidgetValue(widget, value);
      if (_.isNil(value)) {
        return;
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
      style={{ justifyContent: 'center', alignItems: 'center', }}
    >
      {children}
      <FullHeight style={{ flex: 1 }}>
        {mode === 'preview'
          ? <SortDD
            mode='preview'
            direction='vertical'
            handle
            sort={(srcIndex: number, dstIndex: number) => {
              runInAction(() => {
                const items = source[self.widget.field] || [];
                const [item] = items.splice(srcIndex, 1);
                items.splice(dstIndex, 0, item);
                setDataField(self.widget, items);
              })
            }}
            items={(source[self.widget.field] || []).map((v: any) => ({ id: v._id, data: v }))}
            renderItem={(item: any, handler: any) => (
              <ObjectItem>
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
                      source={item.data}
                      initField={false}
                      setDataField={(widget: IWidget, value: any) => {
                        if (!widget.field) {
                          return;
                        }
                        value = getWidgetValue(widget, value);
                        if (_.isNil(value)) {
                          return;
                        }
                        runInAction(() => {
                          item.data[widget.field] = value
                        })
                      }}
                      {...props}
                    />
                  ))}
                </div>
              </ObjectItem>
            )}
          />
          : <SortDD
            mode='edit'
            direction='vertical'
            sort={self.swap}
            items={self.children.map(child => ({ id: child._id, data: child }))}
            renderItem={(item: any) => (
              <Component
                self={item.data as IComponent}
                mode='edit'
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
              <Acon icon="CircleX" style={{ padding: '10px 15px' }} onClick={() => {
                local.setAdd(false)
                local.set({})
              }} />
              <Acon icon="CircleCheck" style={{ padding: '10px 15px' }} onClick={async () => {
                const videos = (toJS(source[self.widget.field])) || []
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
            : <Acon icon="CirclePlus" style={{ padding: '10px 15px' }} onClick={() => {
              local.setAdd(true)
            }} />
          }
        </Center>
      </FullHeight>
    </ComponentWrap>
  )}</Observer>
}