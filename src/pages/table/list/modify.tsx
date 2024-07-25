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
import { Select, Input, Button } from 'antd';
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
export default function FormModifyPage({ setTitle }: { setTitle: (title: string) => void, }) {
  const local: {
    isLoading: boolean,
    table: string,
    id: string,
    error: boolean,
    editWidget: ITableWidget | null,
    setDrag: (is: boolean) => void,
    onDrop: () => void,
    isDragOver: boolean,
    name: string,
    widgets: ITableWidget[],
    fields: { field: string, type: string }[]
  } = useLocalObservable(() => ({
    isLoading: false,
    table: '',
    id: new URL(window.location.href).searchParams.get('id') || '',
    name: '视图名称',
    fields: [],
    widgets: [],
    editWidget: null,
    isDragOver: false,
    error: false,
    setDrag(is) {
      local.isDragOver = is;
    },
    onDrop() {
      if (store.app.dragingWidgetType) {
        let value: any = '';
        let refer: any = '';
        switch (store.app.dragingWidgetType) {
          case 'input':
            value = '';
            break;
          case 'checkbox':
            value = '';
            refer = [
              { value: 'apple', name: '苹果', },
              { value: 'banana', name: '香蕉', },
            ];
            break;
          case 'radio':
            value = '';
            refer = [{ value: 'apple', name: '苹果' }, { value: 'banana', name: '香蕉' }];
            break;
          default: break;
        }
        local.widgets.push({
          field: '',
          label: '字段',
          widget: store.app.dragingWidgetType,
          value,
          source: 'var',
          refer,
          explain: '',
        });
        // local.widgets = toJS(local.widgets)
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
        local.widgets = resp.data.widgets
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
        widgets: local.widgets,
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
      <FullWidthFix style={{ flexDirection: 'column', width: 120, height: '100%', }}>
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
            <Input addonBefore="视图标题" defaultValue={local.name} onChange={e => {
              local.name = e.target.value;
            }} />
            <div>搜索栏</div>
            <SortList
              droppableId={'search' + local.table}
              items={local.widgets.filter(it => it.widget === 'button')}
              sort={(oldIndex: number, newIndex: number) => {
                // (oldIndex, newIndex);
              }}
              direction={'horizontal'}
              ukey="widget"
              mode={'preview'}
              listStyle={{}}
              itemStyle={{ padding: 6 }}
              renderItem={({ item, handler }: { item: ITableWidget, handler: HTMLObjectElement }) => (
                <Handler key={item.widget}>
                  <FullWidth onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    console.log(e.nativeEvent.currentTarget)
                    local.editWidget = item;
                  }}>
                    <FullWidthFix style={{ minWidth: 50 }}>{item.label}</FullWidthFix>
                    <FullWidthAuto>
                      <Transform widget={item} />
                    </FullWidthAuto>
                  </FullWidth>
                </Handler>
              )}
            />
            <div>列字段</div>
            <SortList
              droppableId={'table' + local.table}
              items={local.widgets.filter(it => it.widget === 'column')}
              sort={(oldIndex: number, newIndex: number) => {
                // (oldIndex, newIndex);
              }}
              direction={'horizontal'}
              ukey="index"
              mode={'preview'}
              listStyle={{}}
              itemStyle={{ padding: 6 }}
              renderItem={({ index, item, handler }: { index: number, item: ITableWidget, handler: HTMLObjectElement }) => (
                <Handler key={index}>
                  <FullWidth onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    console.log(item)
                    local.editWidget = item;
                  }}>
                    <FullWidthFix style={{ minWidth: 50 }}>
                      <Transform widget={item} />
                    </FullWidthFix>
                  </FullWidth>
                </Handler>
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
        local.editWidget && (<FullHeight style={{ padding: 5, width: 250 }} key={local.editWidget.widget}>
          <AlignAside>
            <span>属性列表</span>
            <Acon icon={"CloseOutlined"} onClick={() => local.editWidget = null} />
          </AlignAside>
          <FullWidth>
            <FullWidthFix style={{ width: 50 }}>
              标签:
            </FullWidthFix>
            <FullWidthAuto>
              <Input style={{ width: '100%' }} defaultValue={local.editWidget.label} onChange={e => {
                if (local.editWidget) {
                  local.editWidget.label = e.target.value;
                }
              }} />
            </FullWidthAuto>
          </FullWidth>
          <FullWidth>
            <FullWidthFix style={{ width: 50 }}>
              字段:
            </FullWidthFix>
            <FullWidthAuto>
              <Select
                style={{ width: '100%' }}
                defaultValue={local.editWidget.field}
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
          <VisualBox visible={['checkbox', 'radio'].includes(local.editWidget.widget)}>
            <FullWidth>
              <FullWidthFix style={{ width: 50 }}>
                多选/复选:
              </FullWidthFix>
              <FullWidthAuto>
                <Input.TextArea defaultValue={JSON.stringify(local.editWidget.refer, null, 2)} onChange={e => {
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

        </FullHeight>)
      }
    </FullWidth>
  )}</Observer>
}