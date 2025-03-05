import { Fragment, useCallback } from 'react'
import { Observer, useLocalObservable } from 'mobx-react';
import { IJsonSchema } from '@/types/table';
import { useEffectOnce } from 'react-use';
import JsonSchemaEditor from '@/components/JsonSchemaEditor';
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
  } = useLocalObservable(() => ({
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
      <AlignAround style={{ height: 50, flex: 'none' }}>
        <Space>
          {local.name}
          <CopyToClipboard text={JSON.stringify(local.schema, null, 2)}><Acon icon='CopyOutlined' title={'复制'} onClick={() => { message.success('已复制') }} /></CopyToClipboard>
        </Space>
      </AlignAround>
      <JsonSchemaEditor
        wrapStyle={{ overflow: 'auto' }}
        mainStyle={{ margin: '0 auto', width: '50%', minWidth: 800 }}
        data={local.schema}
        onChange={data => {
          
        }} />
      <AlignAround style={{ height: 50, flex: 'none' }}>
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