import { useLocalStore, Observer } from 'mobx-react'
import React, { useEffect, useCallback, Fragment } from 'react'
import { ITable, IWidget } from '@/types';
import { useEffectOnce } from 'react-use';
import { useNavigate, useLocation } from "react-router-dom";
import apis from '@/api';
import store from '@/store';

export default function FormModifyPage() {
  const local: { table: string, error: boolean, fields: { id: string, name: string }[] } = useLocalStore(() => ({
    table: '',
    fields: [],
    error: false,
  }));
  const init = useCallback(async () => {
    if (store.widget.list.length === 0) {
      const resp = await apis.getWidgets();
      if (resp.code === 0) {
        store.widget.setList(resp.data.items);
      }
    }
    const resp = await apis.getTable(local.table);
    if (resp.code === 0) {
      local.fields = resp.data.fields;
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
  return <Observer>{() => {
    if (local.error) {
      return <span>404</span>
    } else {
      return <Fragment>

      </Fragment>
    }
  }}</Observer>
}