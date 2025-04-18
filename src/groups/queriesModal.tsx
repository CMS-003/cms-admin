import { Observer, useLocalObservable } from "mobx-react";
import { Modal, Table } from "antd";
import { useCallback, useEffect } from "react";
import apis from "@/api";

type Query = {
  _id: string;
  title: string;
  sort: string;
  where: any;
  limit?: number;
}

export default function QueryModal({ show, q = '', close }: { show: boolean, q: string, close: Function }) {
  const local = useLocalObservable<{
    loading: boolean;
    page: number;
    q: any;
    total: number;
    list: Query[],
  }>(() => ({
    loading: false,
    list: [],
    total: 0,
    page: 1,
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
      footer={null}
    >
      <Table
        dataSource={local.list}
        columns={[
          {
            title: 'id',
            key: '_id',
            render: (v, record, index) => (<span>{record._id}</span>)
          },
          {
            title: '名称',
            key: 'title',
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
        ]}
      />
    </Modal>
  )}</Observer>
}