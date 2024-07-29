import { useLocalStore, Observer, useLocalObservable } from 'mobx-react'
import React, { useEffect, useCallback, Fragment } from 'react'
import { ITable, ITableWidget, IWidget } from '@/types';
import { useEffectOnce } from 'react-use';
import { useNavigate, useLocation } from "react-router-dom";
import _ from 'lodash';
import apis from '@/api';
import store from '@/store';
import { FullWidth, FullWidthFix, FullWidthAuto, FullHeight, AlignAside, FullHeightAuto, AlignAround } from '@/components/style';
import styled from 'styled-components';
import SortList from '@/components/SortList';
import { Transform } from '@/groups/widgets';
import { toJS } from 'mobx';
import { Select, Input, Button, Popconfirm } from 'antd';
import VisualBox from '@/components/VisualBox';
import Acon from '@/components/Acon';

const WidgetWrap = styled.div`
  margin: 5px 10px;
  cursor: pointer;
  & > img {
    width: 24px;
    height: 24px;
    margin: 0 10px;
  }
`
const Handler = styled.div`
  &:hover {
    background-color: #c6c6c6;
  }
`
const AttrItem = styled.div`
  & > span { display: inline-block; }
  & > div { width: 150px; }
`

type IEditWidget = ITableWidget & { _id: number };

export default function FormModifyPage({ setTitle }: { setTitle: (title: string) => void, }) {
  const local: {
    isLoading: boolean,
    table: string,
    id: string,
    error: boolean,
    flag: number,
    editWidget: IEditWidget | null,
    setEditData: (data: IEditWidget | null) => void,
    setDrag: (is: boolean) => void,
    onDrop: () => void,
    isDragOver: boolean,
    name: string,
    widgets: IEditWidget[],
    fields: { field: string, type: string }[]
  } = useLocalObservable(() => ({
    isLoading: false,
    table: '',
    id: new URL(window.location.href).searchParams.get('id') || '',
    name: '视图名称',
    fields: [],
    widgets: [],
    flag: 0,
    editWidget: null,
    isDragOver: false,
    error: false,
    setDrag(is) {
      local.isDragOver = is;
    },
    setEditData(data: IEditWidget | null) {
      local.flag = Date.now();
      local.editWidget = data;
    },
    onDrop() {
      if (store.app.dragingWidgetType) {
        const widget = store.widget.getViewWidgetByType(store.app.dragingWidgetType);
        local.editWidget = null;
        local.widgets.push({ ...widget, _id: local.widgets.length });
      }
    },
  }));
  const init = useCallback(async () => {
    if (store.widget.list.length === 0) {
      const resp = await apis.getWidgets();
      if (resp.code === 0) {
        store.widget.setList(resp.data.items);
      }
    }
    const resp = await apis.getTableFields(local.table);
    if (resp.code === 0) {
      local.fields = resp.data;
    }
    if (local.id) {
      const resp = await apis.getTableViewDetail({ table: local.table, id: local.id });
      if (resp.code === 0) {
        local.name = resp.data.name
        setTitle(local.name);
        local.widgets = resp.data.widgets.map((it, i) => ({ ...it, _id: i }));
      }
    }
  }, []);
  const saveView = useCallback(async () => {
    if (local.id) {
      await apis.updateTableView(local.id, { table: local.table, name: local.name, widgets: local.widgets });
    } else {
      const respResult = await apis.addTableView({
        type: 'list',
        table: local.table,
        name: local.name,
        widgets: local.widgets.map(it => _.omit(it, ['_id'])),
      });
      if (respResult.code === 0 && respResult.data) {
        local.id = respResult.data._id
      }
    }
  }, []);
  useEffectOnce(() => {
    const searchParams = new URLSearchParams(window.location.search.substring(1));
    local.table = searchParams.get('table') || '';
    if (local.table) {
      init();
    } else {
      local.error = true;
    }
  })
  return <Observer>{() => (
    <FullWidth style={{ height: '100%' }}>
      <FullWidthFix style={{ flexDirection: 'column', width: 150, height: '100%', }}>
        <p>控件列表</p>
        {store.widget.list.map(widget => (
          <WidgetWrap draggable
            key={widget._id}
            onDragStartCapture={() => {
              store.app.setDragWidgetType(widget._id);
            }}
            onDragEndCapture={() => {
              store.app.setDragWidgetType('')
            }}>
            <img src={widget.cover} />
            {widget.title}
          </WidgetWrap>
        ))}
      </FullWidthFix>
      <FullWidthAuto
        style={{
          backgroundColor: local.isDragOver ? '#dadada' : '',
          height: '100%',
          minWidth: 500,
          overflowX: 'auto',
        }}
        onDragOver={(e) => {
          e.preventDefault();
          e.stopPropagation();
          local.setDrag(true);
        }}
        onDragLeave={() => {
          local.setDrag(false);
        }}
        onDrop={local.onDrop}
      >
        <FullHeight>
          <FullHeightAuto style={{ backgroundColor: '#1990ff1f' }}>
            <Input addonBefore="视图标题" value={local.name} onChange={e => {
              local.name = e.target.value;
            }} />
            <div>搜索栏</div>
            <FullWidth>
              <SortList
                droppableId={'search' + local.table}
                items={local.widgets}
                sort={(oldIndex: number, newIndex: number) => {
                  const [old] = local.widgets.splice(oldIndex, 1)
                  local.widgets.splice(newIndex, 0, old)
                }}
                direction={'horizontal'}
                ukey="index"
                mode={''}
                listStyle={{ flex: '0' }}
                itemStyle={{ padding: 6 }}
                renderItem={({ index, item, handler }: { index: number, item: IEditWidget, handler: any }) => (
                  item.widget === 'column' ? <div key={index}></div> :
                    <Handler key={index}>
                      <FullWidth onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        local.editWidget = item;
                      }}>
                        <FullWidthFix {...handler}>
                          <Acon icon='DragOutlined' style={{ marginRight: 5 }} />
                        </FullWidthFix>
                        <Transform widget={item} mode="modify" />
                      </FullWidth>
                    </Handler>
                )}
              />
              <Button type='primary' disabled style={{ marginLeft: 10 }} >搜索</Button>
              <Button type='ghost' disabled style={{ marginLeft: 10 }} >清空</Button>
            </FullWidth>
            <div style={{ marginTop: 30 }}>列字段</div>
            <SortList
              droppableId={'table' + local.table}
              items={local.widgets}
              sort={(oldIndex: number, newIndex: number) => {
                const [old] = local.widgets.splice(oldIndex, 1)
                local.widgets.splice(newIndex, 0, old)
              }}
              direction={'horizontal'}
              ukey="index"
              mode={'modify'}
              listStyle={{ borderBottom: '1px dashed #888', margin: '0 20px' }}
              itemStyle={{}}
              renderItem={({ index, item, handler }: { index: number, item: IEditWidget, handler: any }) => (
                item.widget === 'column' ? <FullWidth key={index} style={{ minWidth: 50, padding: '5px 10px', borderRight: '1px solid #cfcfcf', backgroundColor: 'wheat' }} onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  local.setEditData(item);
                }}>
                  <FullWidthFix {...handler}>
                    <Acon icon='DragOutlined' style={{ marginRight: 5 }} />
                  </FullWidthFix>
                  <Transform widget={item} mode="modify" />
                </FullWidth> : <div key={index}></div>
              )}
            />
          </FullHeightAuto>
          <AlignAround style={{ padding: 10 }}>
            <Button type='primary' disabled={local.isLoading} onClick={async () => {
              local.isLoading = true;
              await saveView();
              local.isLoading = false;
            }}>保存</Button>
          </AlignAround>
        </FullHeight>

      </FullWidthAuto>
      {
        local.editWidget && (<FullHeight style={{ padding: 5, width: 250 }} key={local.flag}>
          <AlignAside style={{ marginBottom: 10 }}>
            <span>属性列表</span>
            <div>
              <Acon icon={"CloseOutlined"} onClick={() => local.editWidget = null} />
              <Popconfirm
                title="确定删除控件吗?"
                okText="确定"
                cancelText="取消"
                onConfirm={() => {
                  local.widgets.forEach((it) => {
                    if (local.editWidget && (it._id === local.editWidget._id)) {
                      local.widgets.splice(local.editWidget._id, 1);
                      local.editWidget = null;
                    }
                  });
                  local.widgets.forEach((it, i) => {
                    it._id = i;
                  });
                }}>
                <Acon icon={"DeleteOutlined"} />
              </Popconfirm>
            </div>
          </AlignAside>
          <FullWidth style={{ marginBottom: 10 }}>
            <FullWidthFix style={{ width: 50 }}>
              标签:
            </FullWidthFix>
            <FullWidthAuto>
              <Input style={{ width: '100%' }} value={local.editWidget.label} onChange={e => {
                if (local.editWidget) {
                  local.editWidget.label = e.target.value;
                }
              }} />
            </FullWidthAuto>
          </FullWidth>
          <FullWidth style={{ marginBottom: 10 }}>
            <FullWidthFix style={{ width: 50 }}>
              字段:
            </FullWidthFix>
            <FullWidthAuto>
              <Select
                style={{ width: '100%' }}
                value={local.editWidget.field}
                onSelect={value => {
                  if (local.editWidget) {
                    local.editWidget.field = value || '';
                  }
                }}
              >
                {local.fields.map(field => (
                  <Select.Option key={field.field} value={field.field}>{field.field}</Select.Option>
                ))}
              </Select>
            </FullWidthAuto>
          </FullWidth>
          <VisualBox visible={!['column'].includes(local.editWidget.widget)}>
            <FullWidth style={{ marginBottom: 10 }}>
              <FullWidthFix style={{ width: 50 }}>
                默认值:
              </FullWidthFix>
              <FullWidthAuto>
                <Input style={{ width: '100%' }} defaultValue={local.editWidget.value} onChange={e => {
                  if (local.editWidget) {
                    local.editWidget.value = e.target.value;
                  }
                }} />
              </FullWidthAuto>
            </FullWidth>
          </VisualBox>
          <VisualBox visible={['checkbox', 'radio'].includes(local.editWidget.widget)}>
            <FullWidth style={{ marginBottom: 10 }}>
              <FullWidthFix style={{ width: 50 }}>
                多选/复选:
              </FullWidthFix>
              <FullWidthAuto>
                <Input.TextArea style={{ minHeight: 200 }} defaultValue={JSON.stringify(local.editWidget.refer, null, 2)} onChange={e => {
                  try {
                    e.target.style.border = '1px solid grey';
                    const arr = JSON.parse(e.target.value);
                    if (_.isArray(arr) && local.editWidget) {
                      local.editWidget.refer = arr.map(it => _.omit(it, ['checked']));
                    }
                  } catch (err) {
                    e.target.style.border = '1px solid red';
                  }
                }} />
              </FullWidthAuto>
            </FullWidth>
          </VisualBox>
          <VisualBox visible={['select'].includes(local.editWidget.widget)}>
            <FullWidth style={{ marginBottom: 10 }}>
              <FullWidthFix style={{ width: 50 }}>
                下拉框:
              </FullWidthFix>
              <FullWidthAuto>
                <Input.TextArea style={{ minHeight: 200 }} defaultValue={JSON.stringify(local.editWidget.refer, null, 2)} onChange={e => {
                  try {
                    e.target.style.border = '1px solid grey';
                    if (local.editWidget) {
                      local.editWidget.refer = JSON.parse(e.target.value);
                    }
                  } catch (err) {
                    e.target.style.border = '1px solid red';
                  }
                }} />
              </FullWidthAuto>
            </FullWidth>
          </VisualBox>
          <VisualBox visible={['column'].includes(local.editWidget.widget)}>
            <FullWidth style={{ marginBottom: 10 }}>
              <FullWidthFix style={{ width: 50 }}>
                模板:
              </FullWidthFix>
              <FullWidthAuto>
                <Input.TextArea style={{ width: '100%', minHeight: 200 }} defaultValue={local.editWidget.template} onChange={e => {
                  if (local.editWidget) {
                    local.editWidget.template = e.target.value;
                  }
                }} />
              </FullWidthAuto>
            </FullWidth>
          </VisualBox>
        </FullHeight>)
      }
    </FullWidth>
  )}</Observer>
}