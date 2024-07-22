import React, { Fragment, useEffect } from 'react'
import { Observer, useLocalStore } from 'mobx-react';
import { ITable, ITableDetail } from '@/types/table';
import { TableCard, TableTitle } from './style'

export default function Page() {
  const local: { table: ITableDetail | null } = useLocalStore(() => ({
    table: null
  }));
  return <Observer>{() => (<Fragment>
    {local.table ? <TableCard>
      <TableTitle>{local.table.name}</TableTitle>
      <h2>表单视图</h2>
      {local.table.forms.map(view => (
        <span>{view.name}</span>
      ))}
      <h2>列表视图</h2>
      {local.table.lists.map(view => (
        <span>{view.name}</span>
      ))}
    </TableCard> : null}
  </Fragment>)}</Observer>
}