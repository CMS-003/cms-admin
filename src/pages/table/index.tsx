import React, { Fragment, useCallback, useEffect } from 'react'
import { Observer, useLocalStore } from 'mobx-react';
import { useNavigate } from "react-router-dom";
import { ITable, ITableDetail } from '@/types/table';
import { TableCard, TableTitle, SubTitle } from './style'
import apis from '@/api';
import Acon from '@/components/Acon';
import { AlignAside } from '@/components/style';
import { useEffectOnce } from 'react-use';

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
  useEffectOnce(() => {
    refresh();
  })
  return <Observer>{() => (<div style={{ overflow: 'auto', paddingRight: 10, paddingTop: 10 }}>
    {local.tables.map(table => (
      <TableCard key={table.name}>
        <TableTitle>{table.name}{table.title ? `(${table.title})` : ''}</TableTitle>
        <SubTitle>表单视图 <Acon icon='PlusCircleOutlined' onClick={() => {
          navigate(process.env.PUBLIC_URL + '/tables/form/modify?table=' + table.name);
        }} /></SubTitle>
        {table.forms.map(view => (
          <AlignAside key={view._id} style={{ fontSize: 13, borderBottom: '1px solid #e4e4e4' }}>
            <span>{view.name}</span>
            <div>
              <Acon icon='FormOutlined' style={{ margin: 5, cursor: 'pointer' }} onClick={() => {
                navigate(process.env.PUBLIC_URL + `/tables/form/modify?table=${table.name}&id=${view._id}`);
              }} />
              <Acon icon='FileSearchOutlined' style={{ margin: 5, cursor: 'pointer' }} onClick={() => {
                navigate(`${process.env.PUBLIC_URL}/tables/form/preview?title=${view.name}&view_id=${view._id}`);
              }} />
            </div>
          </AlignAside>
        ))}
        <br />
        <SubTitle>列表视图 <Acon icon='PlusCircleOutlined' onClick={() => {
          navigate(`${process.env.PUBLIC_URL}/tables/list/modify?table=${table.name}`);
        }} /></SubTitle>
        {table.lists.map(view => (
          <AlignAside key={view._id} style={{ fontSize: 13, borderBottom: '1px solid #e4e4e4' }}>
            <span className='txt-omit'>{view.name}</span>
            <div style={{ whiteSpace: 'nowrap' }}>
              <Acon icon='FormOutlined' style={{ margin: 5, cursor: 'pointer' }} onClick={() => {
                navigate(`${process.env.PUBLIC_URL}/tables/list/modify?table=${table.name}&id=${view._id}`);
              }} />
              <Acon icon='FileSearchOutlined' style={{ margin: 5, cursor: 'pointer' }} onClick={() => {
                navigate(`${process.env.PUBLIC_URL}/tables/list/preview?view_id=${view._id}`);
              }} />
            </div>
          </AlignAside>
        ))}
      </TableCard>
    ))}
  </div>)}</Observer>
}