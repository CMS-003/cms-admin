import React, { Fragment, useCallback, useEffect, useState } from 'react'
import { Observer, useLocalObservable } from 'mobx-react';
import { useNavigate } from "react-router-dom";
import {ISchema } from '@/types/table';
import { TableCard, TableTitle, SubTitle } from './style'
import apis from '@/api';
import Acon from '@/components/Acon';
import { AlignAside } from '@/components/style';
import { useEffectOnce, useWindowSize } from 'react-use';
import { Affix, Form, Input, message, Modal, Switch } from 'antd';
import CodeMirror from '@uiw/react-codemirror';
import { toJS } from 'mobx';
import { json } from '@codemirror/lang-json';
import { chunk } from 'lodash'

const lb = { span: 4 }, rb = { span: 16 }
export default function Page() {
  const { width } = useWindowSize()
  const [value, setValue] = useState<string>('');
  const navigate = useNavigate()
  const local: {
    cells: number;
    temp: any;
    schema: any;
    loading: boolean | undefined;
    showCreate: boolean;
    tables: ISchema[];
    setData: Function;
  } = useLocalObservable(() => ({
    cells: 1,
    tables: [],
    loading: false,
    showCreate: false,
    schema: {},
    temp: '',
    setData: (key: 'tables', data: any) => {
      local[key] = data;
    }
  }));
  const refresh = useCallback(async () => {
    const resp = await apis.getSchemaAll();
    if (resp.code === 0) {
      local.tables = resp.data.items;
    }
  }, []);
  useEffect(() => {
    local.cells = width < 200 ? 1 : Math.floor(width / 200);
  }, [width]);
  useEffectOnce(() => {
    refresh();
  })
  return <Observer>{() => (<div style={{ overflow: 'auto', paddingRight: 10, paddingTop: 10 }}>
    {chunk(local.tables, local.cells).map((tables, i) => (
      <AlignAside style={{ justifyContent: 'flex-start' }} key={i}>
        {tables.map(table => (
          <TableCard key={table.name}>
            <TableTitle>{table.name}<Acon icon='SettingOutlined' onClick={() => {
              navigate(process.env.PUBLIC_URL + `/schema/info?name=${table.name}`);
            }} /></TableTitle>
            <span>{table.title}</span>
          </TableCard>
        ))}
      </AlignAside>
    ))}
    <Affix style={{ position: 'fixed', bottom: 50, right: 50 }}>
      <Acon icon='PlusCircleOutlined' size={30} color='#0896db' onClick={() => {
        local.schema = {
          table: '',
          name: '',
          title: '',
          db: '',
          status: 0,
          schema: {
            type: 'Object',
            properties: {}
          }
        };
        local.temp = JSON.stringify(local.schema.schema, null, 2);
        local.showCreate = true;
      }} />
    </Affix>
    <Modal
      title='新建表'
      destroyOnClose
      open={local.showCreate}
      confirmLoading={local.loading}
      okText='保存'
      cancelText='取消'
      onCancel={() => {
        local.showCreate = false;
      }}
      onOk={async () => {
        if (!local.schema.name) {
          return message.error('schema 必填');
        }
        try {
          const json = JSON.parse(local.temp);
          local.schema.schema = json;
        } catch (e) {
          message.error('schema json错误');
          return;
        }
        try {
          local.loading = true;
          const { name, ...data } = toJS(local.schema);
          const resp = await apis.createSchema(name, data);
          if (resp.code === 0) {
            refresh();
            local.showCreate = false;
          } else {
            message.error(resp.message);
          }
        } catch (e) {
          message.error('创建失败')
        } finally {
          local.loading = false;
        }
      }}
    >
      <Form>
        <Form.Item label='schema名' labelCol={lb} required wrapperCol={rb}>
          <Input type='text' id='schema_name' placeholder='表名' onChange={(e) => {
            local.schema.name = e.target.value;
          }
          } />
        </Form.Item>
        <Form.Item label='schema标题' labelCol={lb} wrapperCol={rb}>
          <Input type='text' id='schema_title' placeholder='表标题' onChange={(e) => {
            local.schema.title = e.target.value;
          }
          } />
        </Form.Item>
        <Form.Item label='表名' labelCol={lb} required wrapperCol={rb}>
          <Input type='text' id='schema_table' placeholder='表名' onChange={(e) => {
            local.schema.table = e.target.value;
          }} />
        </Form.Item>
        <Form.Item label='数据库' labelCol={lb} required wrapperCol={rb}>
          <Input type='text' id='schema_db' placeholder='数据库' onChange={(e) => {
            local.schema.db = e.target.value;
          }} />
        </Form.Item>
        <Form.Item label='状态' labelCol={lb} wrapperCol={rb}>
          <Switch id='schema_status' checked={local.schema.status} onChange={() => {
            local.schema.status = local.schema.status ? 0 : 1;
          }} />
        </Form.Item>
        <Form.Item label='schema' labelCol={lb} wrapperCol={rb}>
          <CodeMirror
            style={{ border: '1px solid #ccc' }}
            height='350px'
            value={value}
            extensions={[json()]}
            onChange={(v, options) => {
              setValue(v);
            }}
          />
        </Form.Item>
      </Form>

    </Modal>
  </div>)
  }</Observer >
}