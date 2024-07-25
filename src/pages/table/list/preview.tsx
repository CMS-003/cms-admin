import { FullHeight, FullHeightAuto, FullWidth } from '@/components/style';
import { Observer, useLocalObservable } from 'mobx-react';
import React, { useCallback } from 'react';
import { Input, Table } from 'antd';
import { toJS } from 'mobx';
import { useEffectOnce } from 'react-use';
import apis from '@/api';
import { ITableView } from '@/types';

export default function () {
  const local = useLocalObservable<{
    view: ITableView | null,
    view_id: string,
    table: string,
    columns: { title: string, key: string }[],
    list: any[],
  }>(() => ({
    view: null,
    columns: [],
    list: [],
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
      local.columns = resp.data.widgets.filter(it => it.widget === 'column').map((it, i) => ({
        title: it.label,
        key: i + '',
        dataIndex: it.field,
      }));
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
      <FullHeight>
        <FullWidth>
          <Input value="搜索栏部分" />
        </FullWidth>
        <FullHeightAuto>
          <Table rowKey={'_id'} columns={local.columns} dataSource={toJS(local.list)} pagination={{ position: ['bottomRight'] }}>

          </Table>
        </FullHeightAuto>
      </FullHeight>
    )}
  </Observer>
}