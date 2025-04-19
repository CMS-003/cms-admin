import { Observer, useLocalObservable } from "mobx-react";
import { Button, Checkbox, Input, Modal, Space, Table } from "antd";
import { useCallback, useEffect } from "react";
import apis from "@/api";

type Query = {
  _id: string;
  title: string;
  sort: string;
  where: any;
  limit?: number;
}

export default function QueryModal({ show, q = '', queries, setQueries, close }: { show: boolean, q: string, queries: string[], setQueries: Function, close: Function }) {
  const local = useLocalObservable<{
    loading: boolean;
    page: number;
    size: number;
    q: any;
    total: number;
    list: Query[],
  }>(() => ({
    loading: false,
    list: [],
    total: 0,
    page: 1,
    size: 20,
    q: q,
  }));
  const getData = useCallback(async () => {
    try {
      local.loading = true;
      const resp = await apis.getDataList('/api/gatling/4CiPccfDG', { page: local.page, q: local.q })
      if (resp.code === 0) {
        local.list = (resp.data.items as Query[]) || [];
        local.total = resp.data.total || 0;
      }
    } catch (e) {

    } finally {
      local.loading = false;
    }
  }, []);
  useEffect(() => {
    getData();
  }, [])
  return <Observer>{() => (
    <Modal
      title={'query列表'}
      open={show}
      destroyOnClose={true}
      onCancel={() => {
        close()
      }}
      bodyStyle={{
        padding: 10
      }}

      footer={null}
    >
      <Space style={{ marginBottom: 8 }}>
        <Input defaultValue={local.q} onChange={(v) => {
          local.q = v.target.value
        }} />
        <Button type="primary" loading={local.loading} onClick={() => { getData() }}>搜索</Button>
      </Space>
      <Table
        loading={local.loading}
        dataSource={local.list}
        pagination={{ total: local.total, pageSize: local.size }}
        components={{
          body: {
            cell: (props: any) => (
              <td {...props} style={{ ...props.style, paddingBlock: '12px' }} />
            ),
          }
        }}
        onChange={(pagination) => {
          local.page = pagination.current || 1;
          getData();
        }}
        columns={[
          {
            title: 'id',
            key: '_id',
            render: (v, record, index) => (<span>{record._id}</span>)
          },
          {
            title: '名称',
            key: '_id',
            render: (v, record, index) => (<span>{record.title}</span>)
          },
          {
            title: ' 排序',
            key: 'sort',
            render: (v, record, index) => (<span>{record.sort}</span>)
          },
          {
            title: '数量',
            key: 'limit',
            render: (v, record, index) => (<span>{record.limit}</span>)
          },
          {
            title: '修改时间',
            key: 'updatedAt',
            render: (v, record, index) => (<span>{record._id}</span>)
          },
          {
            title: '',
            key: '_id',
            render: (v, record, index) => (<Checkbox checked={queries.includes(record._id)} onChange={e => { setQueries(e.target.checked ? [...queries, record._id] : queries.filter(q => q !== record._id)) }} />)
          },
        ]}
      />
    </Modal>
  )}</Observer>
}