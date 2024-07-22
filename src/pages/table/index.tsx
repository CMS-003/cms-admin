import React, { Fragment, useCallback, useEffect } from 'react'
import { Observer, useLocalStore } from 'mobx-react';
import { useNavigate } from "react-router-dom";
import { ITable, ITableDetail } from '@/types/table';
import { TableCard, TableTitle, SubTitle } from './style'
import apis from '@/api';
import Acon from '@/components/Acon';

export default function Page() {
  const navigate = useNavigate()
  const local: { tables: ITableDetail[], setData: Function } = useLocalStore(() => ({
    tables: [],
    setData: (key: 'tables', data: any) => {
      local[key] = data;
    }
  }));
  const refresh = useCallback(async () => {
    const resp = await apis.getTables();
    if (resp.code === 0) {
      local.tables = resp.data.items;
    }
  }, []);
  useEffect(() => {
    refresh();
  })
  return <Observer>{() => (<div>
    {local.tables.map(table => (
      <TableCard key={table.name}>
        <TableTitle>{table.name}</TableTitle>
        <SubTitle>表单视图 <Acon icon='PlusCircleOutlined' onClick={() => {
          navigate('/tables/form/modify?table=' + table.name);
        }} /></SubTitle>
        {table.forms.map(view => (
          <span>{view.name}</span>
        ))}
        <SubTitle>列表视图</SubTitle>
        {table.lists.map(view => (
          <span>{view.name}</span>
        ))}
      </TableCard>
    ))}
  </div>)}</Observer>
}