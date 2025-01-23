import React, { Fragment, useCallback, useEffect, useState } from 'react'
import { Observer, useLocalStore } from 'mobx-react';
import { useNavigate } from "react-router-dom";
import { ITable, ITableDetail } from '@/types/table';
import { TableCard, TableTitle, SubTitle } from './style'
import apis from '@/api';
import Acon from '@/components/Acon';
import { AlignAside } from '@/components/style';
import { useEffectOnce } from 'react-use';
import { Affix, Form, Input, message, Modal, Switch } from 'antd';
import CodeMirror from '@uiw/react-codemirror';
import { toJS } from 'mobx';
import { json } from '@codemirror/lang-json';

const lb = { span: 4 }, rb = { span: 16 }
export default function Page() {

  const [value, setValue] = useState<string>('');
  const navigate = useNavigate()
  const local: {
    temp: any;
    schema: any;
    loading: boolean | undefined;
    showCreate: boolean;
    tables: ITableDetail[];
    setData: Function;
  } = useLocalStore(() => ({
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
        <TableTitle>{table.name}<Acon icon='SettingOutlined' onClick={() => {
          navigate(process.env.PUBLIC_URL + `/tables/detail?name=${table.name}`);
        }} /></TableTitle>
        <span>{table.title}</span>
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
          const resp = await apis.createTableSchema(name, data);
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