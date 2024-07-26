import { FullHeight, FullHeightAuto, FullWidth, FullWidthFix } from '@/components/style';
import { Observer, useLocalObservable } from 'mobx-react';
import React, { useCallback } from 'react';
import { Input, Table } from 'antd';
import { toJS } from 'mobx';
import { useEffectOnce } from 'react-use';
import apis from '@/api';
import { ITableView, ITableWidget } from '@/types';
import hbs from 'handlebars'
import { Transform } from '@/groups/widgets';

export default function () {
  const local = useLocalObservable<{
    view: ITableView | null,
    view_id: string,
    table: string,
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
  }));
  const getList = useCallback(async () => {
    if (local.table) {
      const resp = await apis.getList(local.table, {});
      if (resp.code === 0) {
        local.list = resp.data.items;
      }
    }
  }, []);
  const init = useCallback(async () => {
    const resp = await apis.getViewDetail(local.view_id, {})
    if (resp.code === 0) {
      local.view = resp.data;
      local.table = resp.data.table;
      local.widgets = resp.data.widgets.filter(it => it.widget !== 'column');
      local.columns = resp.data.widgets.filter(it => it.widget === 'column').map((it, i) => {
        const tpl = hbs.compile(it.template);
        return {
          title: it.label,
          key: i + '',
          dataIndex: it.field,
          render: (value: any, record: any, index: number) => {
            return <div dangerouslySetInnerHTML={{ __html: tpl({ data: record, widget: it }) }}></div>
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
  })
  return <Observer>
    {() => (
      <FullHeight style={{ padding: 10 }}>
        <FullWidth style={{ marginBottom: 10 }}>
          {local.widgets.map((it, i) => <FullWidthFix key={i} style={{ marginRight: 10 }}>
            <Transform widget={it} />
          </FullWidthFix>)}
        </FullWidth>
        <FullHeightAuto>
          <Table rowKey={'_id'} columns={local.columns} dataSource={toJS(local.list)} pagination={{ position: ['bottomRight'] }}>

          </Table>
        </FullHeightAuto>
      </FullHeight>
    )}
  </Observer>
}