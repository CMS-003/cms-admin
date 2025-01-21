import React, { Fragment, useEffect, useCallback, useState } from 'react'
import { Observer, useLocalStore } from 'mobx-react';
import { IJsonSchema } from '@/types/table';
import { TableCard, TableTitle } from './style'
import { useEffectOnce } from 'react-use';
import apis from '@/api';

export default function Page() {
  const local: {
    name: string;
    schema: IJsonSchema | null
  } = useLocalStore(() => ({
    schema: null,
    isLoading: false,
    name: new URL(window.location.href).searchParams.get('name') || '',
  }));

  const init = useCallback(async () => {
    const resp = await apis.getTableSchema(local.name);
    if (resp.code === 0) {
      local.schema = resp.data;
    }
  }, []);
  useEffectOnce(() => {
    const searchParams = new URLSearchParams(window.location.search.substring(1));
    if (!local.schema) {
      init();
    } else {
      // local.error = true;
    }

  })
  return <Observer>{() => (<Fragment>
    {local.schema ? <Fragment>
      <TableTitle>{local.name}</TableTitle>
      <h2>表单视图</h2>
    </Fragment> : null}
  </Fragment>)}</Observer>
}