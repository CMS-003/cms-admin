import { FullHeight, FullHeightAuto, FullWidth, FullWidthFix } from '@/components/style';
import { Observer, useLocalObservable } from 'mobx-react';
import React, { useCallback } from 'react';
import { Button, Input, Table } from 'antd';
import { toJS } from 'mobx';
import { useEffectOnce } from 'react-use';
import apis from '@/api';
import { ITableView, ITableWidget } from '@/types';
import hbs from 'handlebars'
import { Transform } from '@/groups/widgets';
import events from '@/utils/event';
import moment from 'moment';


hbs.registerHelper('eq', function (a, b, options) {
  // @ts-ignore
  const that = this as any;
  if (a == b) {
    return options.fn(that);
  }
  return options.inverse(that);
});
hbs.registerHelper('moment', function (time, format) {
  return moment(time).format(format);
})

export default function ({ setTitle }: { setTitle: (title: string) => void, }) {
  const local = useLocalObservable<{
    view: ITableView | null,
    view_id: string,
    table: string,
    page: number,
    page_size: number,
    loading: boolean,
    getQuery: () => { [key: string]: string | number },
    clear: () => void,
    widgets: ITableWidget[],
    columns: { title: string, key: string, render?: (value: any, record: any, index: number) => JSX.Element }[],
    list: any[],
  }>(() => ({
    view: null,
    columns: [],
    list: [],
    widgets: [],
    view_id: '',
    table: '',
    loading: false,
    page: 1,
    page_size: 20,
    getQuery() {
      const query: any = {
        page: local.page,
        page_size: local.page_size,
      };
      local.widgets.forEach(widget => {
        if (widget.widget !== 'column') {
          query[widget.field] = widget.value;
        }
      })
      return query;
    },
    clear() {
      local.widgets.forEach(widget => {
        if (widget.widget !== 'column') {
          widget.value = '';
        }
      })
    }
  }));
  const getList = useCallback(async () => {
    if (local.table) {
      try {
        local.loading = true;
        const query = local.getQuery();
        const resp = await apis.getList(local.table, query);
        if (resp.code === 0) {
          local.list = resp.data.items;
        }
      } finally {
        local.loading = false;
      }
    }
  }, []);
  const init = useCallback(async () => {
    const resp = await apis.getViewDetail(local.view_id, {})
    if (resp.code === 0) {
      local.view = resp.data;
      local.table = resp.data.table;
      setTitle(resp.data.name);
      local.widgets = resp.data.widgets.filter(it => it.widget !== 'column');
      local.columns = resp.data.widgets.filter(it => it.widget === 'column').map((it, i) => {
        const tpl = hbs.compile(it.template);
        return {
          title: it.label,
          key: i + '',
          dataIndex: it.field,
          render: (value: any, record: any, index: number) => {
            let html = '';
            try {
              html = tpl({ data: record, widget: it })
            } catch (e) {
              console.log(e);
            }
            return <div dangerouslySetInnerHTML={{ __html: html }}></div>
          }
        }
      });
      await getList();
    }
  }, []);
  useEffectOnce(() => {
    const params = new URL(window.location.href).searchParams;
    local.view_id = params.get('view_id') || '';
    init();
    function search(data: any) {
      if (data.view_id === local.view_id) {
        getList();
      }
    }
    function clear(data: any) {
      if (data.view_id === local.view_id) {
        local.clear();
      }
    }
    events.on('search', search);
    events.on('clear', clear);
    return () => {
      events && events.off('search', search);
      events && events.off('clear', clear);
    }
  })
  return <Observer>
    {() => (
      <FullHeight style={{ padding: 10 }}>
        <FullWidth style={{ marginBottom: 10 }}>
          {local.widgets.map((it, i) => <Transform key={i} widget={it} mode="preview" />)}
        </FullWidth>
        <FullHeightAuto>
          <Table rowKey={'_id'} columns={local.columns} dataSource={toJS(local.list)} pagination={{ position: ['bottomRight'] }}>

          </Table>
        </FullHeightAuto>
      </FullHeight>
    )}
  </Observer>
}