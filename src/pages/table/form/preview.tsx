import { Fragment, useEffect, useRef, useMemo, useState, JSXElementConstructor, ReactElement, ReactFragment, ReactPortal, useCallback, } from 'react'
import { Observer, useLocalStore } from 'mobx-react'
import { Form, Input, Switch, Upload, Button, Select, Spin, Row, Col, message } from 'antd'
import Acon from '@/components/Acon'
import { Codemirror } from 'react-codemirror-ts';
import { debounce } from 'lodash'
import store from '@/store'
import { IEditorField, ITableView, ITableWidget } from '@/types'
import 'codemirror/mode/javascript/javascript';
import 'codemirror/addon/edit/matchbrackets';
import 'codemirror/lib/codemirror.css';
import 'codemirror/theme/3024-night.css';
import { useEffectOnce } from 'react-use';
import apis from '@/api';
import { Center, FullWidth, FullWidthFix, FullWidthAuto, FullHeight, AlignAside, FullHeightAuto, AlignAround } from '@/components/style';
import { FormItem } from '../style'
import SortList from '@/components/SortList';
import styled from 'styled-components';
import { Transform } from '@/groups/widgets';
import { toJS } from 'mobx';

function DebounceSelect({ fetchOptions, onChoose, value, defaultValue, debounceTimeout = 800, ...props }: { placeholder: string, onChange: Function, value: any, defaultValue: any, showSearch: boolean, fetchOptions: any, onChoose: Function, debounceTimeout?: number, props?: any }) {
  const [fetching, setFetching] = useState(false);
  const [options, setOptions] = useState([]);
  const fetchRef = useRef(0);
  const debounceFetcher = useMemo(() => {
    const loadOptions = (v: any) => {
      fetchRef.current += 1;
      const fetchId = fetchRef.current;
      setOptions([]);
      setFetching(true);
      fetchOptions(v).then((newOptions: any) => {
        if (fetchId !== fetchRef.current) {
          // for fetch callback order
          return;
        }

        setOptions(newOptions);
        setFetching(false);
      });
    };

    return debounce(loadOptions, debounceTimeout);
  }, [fetchOptions, debounceTimeout]);
  return (
    <Select
      labelInValue
      filterOption={false}
      onSearch={debounceFetcher}
      notFoundContent={fetching ? <Spin size="small" /> : null}
      defaultValue={defaultValue}
      value={value}
      {...props}
      onChange={e => {
        props.onChange && props.onChange(e);
      }}
      onInputKeyDown={e => {
        if (e.keyCode === 13) {
          debounceFetcher('')
        }
      }}
      options={options}
    />
  );
}

const lb = { span: 4 }, rb = { span: 16 }
type IEditWidget = ITableWidget & { _id: number };

export default function EditPage({ setTitle }: { setTitle: (title: string) => void }) {
  const local = useLocalStore<{ isLoading: boolean, table: string, data: any, id: string, view_id: string, title: string, widgets: IEditWidget[] }>(() => ({
    isLoading: false,
    id: '',
    title: '',
    table: '',
    view_id: '',
    data: {},
    widgets: [],
  }))
  const init = useCallback(async () => {
    if (local.view_id) {
      const resp = await apis.getViewDetail(local.view_id, { id: local.id });
      if (resp.code === 0) {
        local.data = resp.data.data || {};
        local.widgets = resp.data.widgets.map((widget, i) => ({ _id: i, ...widget, value: local.data[widget.field] || '' }));
        local.table = resp.data.table;
        setTitle(resp.data.name);
      }
    }
  }, []);
  const save = useCallback(async () => {
    try {
      local.isLoading = true;
      local.widgets.forEach(widget => {
        local.data[widget.field] = widget.value;
      });
      if (local.id) {
        await apis.updateData(local.table, local.data);
      } else {
        local.widgets.forEach(widget => {
          local.data[widget.field] = widget.value;
        });
        const resp = await apis.createData(local.table, local.data);
        if (resp.code === 0 && resp.data) {
          local.id = resp.data._id;
          local.data._id = local.id;
        }
      }
    } catch (e) {
      message.error('修改失败!')
    } finally {
      local.isLoading = false;
    }
  }, []);
  useEffect(() => {
    return () => {

    }
  })
  useEffectOnce(() => {
    const params = new URL(window.location.href).searchParams;
    local.id = params.get('id') || '';
    local.view_id = params.get('view_id') || '';
    local.title = params.get('title') || '';
    if (local.title) {
      setTitle(local.title);
    }
    init();
  })
  return <Observer>{() => (<FullHeight>
    <FullHeightAuto>
      <Form style={{ width: '80%' }}>
        <SortList
          droppableId={local.table || '_'}
          items={local.widgets}
          sort={(oldIndex: number, newIndex: number) => {
            const [old] = local.widgets.splice(oldIndex, 1)
            local.widgets.splice(newIndex, 0, old)
          }}
          ukey="index"
          mode={'preview'}
          listStyle={{}}
          itemStyle={{ padding: 6 }}
          renderItem={({ item, handler }: { item: IEditWidget, handler: any }) => (
            <FullWidth key={item._id} {...handler}>
              <FullWidthFix style={{ minWidth: 50 }}>{item.label}</FullWidthFix>
              <FullWidthAuto>
                <Transform widget={item} mode="preview" />
              </FullWidthAuto>
            </FullWidth>
          )}
        />
      </Form>
    </FullHeightAuto>
    <Center style={{ padding: 15 }}>
      <Button disabled={local.isLoading} type='primary' onClick={save}>保存</Button>
    </Center>
  </FullHeight>)}</Observer>
} 