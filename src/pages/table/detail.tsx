import { Fragment, useCallback } from 'react'
import { Observer, useLocalStore } from 'mobx-react';
import { IJsonSchema } from '@/types/table';
import { useEffectOnce } from 'react-use';
import JsonSchemaEditor from '@/components/JsonSchemaEditor';
import { toJS } from 'mobx';
import { AlignAround } from '@/components/style';
import { Button, message, Space } from 'antd';
import { cloneDeep } from 'lodash';
import apis from '@/api';
import { CopyToClipboard } from 'react-copy-to-clipboard';
import Acon from '@/components/Acon';

export default function Page() {
  const local: {
    isLoading: boolean;
    diffed: boolean;
    name: string;
    schema: IJsonSchema | null,
    original: IJsonSchema | null,
  } = useLocalStore(() => ({
    original: null,
    schema: null,
    isLoading: false,
    name: new URL(window.location.href).searchParams.get('name') || '',
    get diffed() {
      return JSON.stringify(local.schema) !== JSON.stringify(local.original);
    }
  }));

  const init = useCallback(async () => {
    const resp = await apis.getTableSchema(local.name);
    if (resp.code === 0) {
      local.schema = resp.data;
      local.original = cloneDeep(resp.data);
    }
  }, []);
  useEffectOnce(() => {
    const searchParams = new URLSearchParams(window.location.search.substring(1));
    if (!local.schema) {
      init();
    }
  })
  return <Observer>{() => (<Fragment>
    {local.schema ? <Fragment>
      <AlignAround style={{ height: 50 }}>
        <Space>
          {local.name}
          <CopyToClipboard text={JSON.stringify(local.schema, null, 2)}><Acon icon='CopyOutlined' title={'复制'} onClick={() => { message.success('已复制') }} /></CopyToClipboard>
        </Space>
      </AlignAround>
      <JsonSchemaEditor
        data={local.schema}
        onChange={data => {
          if (local.diffed) {
            console.log(JSON.stringify(toJS(data), null, 2));
          }
        }} />
      <AlignAround style={{ paddingTop: 50 }}>
        <Button type='primary' loading={local.isLoading} disabled={!local.diffed} onClick={async () => {
          if (local.schema) {
            try {
              local.isLoading = true;
              await apis.updateTableSchema(local.name, { schema: local.schema });
              local.original = cloneDeep(local.schema);
            } finally {
              local.isLoading = false;
            }
          }
        }}>保存</Button>
      </AlignAround>
    </Fragment> : null}
  </Fragment>)}</Observer>
}