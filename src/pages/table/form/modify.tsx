import { useLocalStore, Observer, useLocalObservable } from 'mobx-react'
import React, { useEffect, useCallback, Fragment } from 'react'
import { ITable, ITableWidget, IWidget } from '@/types';
import { useEffectOnce } from 'react-use';
import { useNavigate, useLocation } from "react-router-dom";
import _ from 'lodash';
import apis from '@/api';
import store from '@/store';
import { FullWidth, FullWidthFix, FullWidthAuto, FullHeight } from '@/components/style';
import styled from 'styled-components';
import SortList from '@/components/SortList';
import { Transform } from '@/groups/widgets';
import { toJS } from 'mobx';
import { Select, Input, } from 'antd';

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
    background-color: grey;
  }
`
const AttrItem = styled.div`
  & > span { display: inline-block; }
  & > div { width: 150px; }
`
export default function FormModifyPage() {
  const local: {
    table: string,
    error: boolean,
    editWidget: ITableWidget | null,
    setDrag: (is: boolean) => void,
    onDrop: () => void,
    isDragOver: boolean,
    widgets: ITableWidget[],
    fields: { field: string, type: string }[]
  } = useLocalObservable(() => ({
    table: '',
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
        let optionValue: any = '';
        switch (store.app.dragingWidgetType) {
          case 'input':
            value = '';
            break;
          case 'checkbox':
            value = '';
            optionValue = [
              { value: 'apple', name: '苹果', },
              { value: 'banana', name: '香蕉', },
            ];
            break;
          case 'radio':
            value = '';
            optionValue = [{ value: 'apple', name: '苹果' }, { value: 'banana', name: '香蕉' }];
            break;
          default: break;
        }
        local.widgets.push({
          field: '',
          title: '标题',
          id: store.app.dragingWidgetType,
          value,
          optionValue,
        });
        local.widgets = toJS(local.widgets)
      }
    }
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
        <SortList
          droppableId={local.table || '_'}
          items={local.widgets}
          sort={(oldIndex: number, newIndex: number) => {
            // (oldIndex, newIndex);
          }}
          mode={'preview'}
          listStyle={{}}
          itemStyle={{}}
          renderItem={({ item, handler }: { item: ITableWidget, handler: HTMLObjectElement }) => (
            <Handler key={item.id} onClick={() => {
              local.editWidget = item;
            }}>
              <FullWidth>
                <FullWidthFix style={{ minWidth: 50 }}>{item.title}</FullWidthFix>
                <FullWidthAuto>
                  <Transform widget={item} />
                </FullWidthAuto>
              </FullWidth>
            </Handler>
          )}
        />
      </FullWidthAuto>
      {
        local.editWidget && (<FullHeight style={{ padding: 5, width: 250 }} key={local.editWidget.id}>
          <p>属性列表</p>
          <FullWidth>
            <FullWidthFix style={{ width: 50 }}>
              标签:
            </FullWidthFix>
            <FullWidthAuto>
              <Input style={{ width: '100%' }} defaultValue={local.editWidget.title} onChange={e => {
                if (local.editWidget) {
                  local.editWidget.title = e.target.value;
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
                  <Select.Option value={field.field}>{field.field}</Select.Option>
                ))}
              </Select>
            </FullWidthAuto>
          </FullWidth>
          <FullWidth>
            <FullWidthFix style={{ width: 50 }}>
              多选/复选:
            </FullWidthFix>
            <FullWidthAuto>
              <Input.TextArea defaultValue={JSON.stringify(local.editWidget.optionValue, null, 2)} onChange={e => {
                try {
                  e.target.style.border = '1px solid grey';
                  const arr = JSON.parse(e.target.value);
                  if (_.isArray(arr) && local.editWidget) {
                    local.editWidget.optionValue = arr.map(it => _.omit(it, ['checked']));
                  }
                } catch (err) {
                  e.target.style.border = '1px solid red';
                }
              }} />
            </FullWidthAuto>
          </FullWidth>
        </FullHeight>)
      }
    </FullWidth>
  )}</Observer>
}