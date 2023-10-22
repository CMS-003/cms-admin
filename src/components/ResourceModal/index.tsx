import { Modal, Table, Space, Image, Button, Input, InputRef } from "antd";
import { Observer, useLocalObservable } from "mobx-react";
import { Fragment, useCallback, useRef } from "react";
import { useEffectOnce } from "react-use";
import apis from "@/api";
import { IResource } from "@/types/resource";
import { PlusOutlined } from "@ant-design/icons";

export default function ResourceModal({ onAdd, onClose }: { onAdd: Function, onClose: Function }) {
  const local = useLocalObservable<{ resources: IResource[], page: number, fetch: boolean, setFetch: Function, setResources: Function, q: string }>(() => ({
    resources: [],
    page: 1,
    q: '',
    fetch: true,
    setFetch(b: boolean) {
      local.fetch = b;
    },
    setResources(items: IResource[]) {
      local.resources = items;
    }
  }));
  const searchInput = useRef(null)
  const getResources = useCallback(async () => {
    try {
      local.setFetch(true);
      const resp = await apis.getResources({ search: local.q, page: local.page });
      local.setResources(resp.data.items)
    } finally {
      local.setFetch(false);
    }
  }, [])
  useEffectOnce(() => {
    getResources();
  })
  return <Observer>
    {() => (
      <Fragment>
        <Modal open={true}
          closable={false}
          footer={<Button type="primary" onClick={() => { onClose(); }}>关闭</Button>}
        >
          <Space style={{ paddingBottom: 10 }}>
            <Input ref={ref => (searchInput as any).current = ref} onChangeCapture={e => {
              local.q = e.currentTarget.value
            }} />
            <Button type="primary" disabled={local.fetch} onClick={() => {
              getResources();
            }}>查询</Button>
            <Button type="ghost" onClick={() => {
              local.page = 1;
              local.q = '';
              const current: any = searchInput.current;
              if (current) {
                current.currentTarget.value = '';
                current.state.value = '';
              }
            }}>清空</Button>
          </Space>
          <Table style={{ height: '100%' }} loading={local.fetch} pagination={false} rowKey="_id" dataSource={local.resources}>
            <Table.Column title="项目名称" dataIndex="title" render={(title, record: IResource) => <Fragment>{record.cover ? <Image src={"http://192.168.0.124:8097" + record.cover} /> : null} {title}</Fragment>} />
            <Table.Column title="操作" key="_id" render={(_, record: IResource) => (
              <PlusOutlined onClick={() => {
                onAdd({ _id: record._id, title: record.title, cover: record.poster || record.thumbnail })
              }} />
            )} />
          </Table>
          <Space style={{ width: '100%', justifyContent: 'right', paddingTop: 10 }}>
            <Button type="primary" disabled={local.fetch || local.page === 1} onClick={() => {
              local.page -= 1;
              getResources()
            }}>上一页</Button>
            <Button type="primary" disabled={local.fetch} onClick={() => {
              local.page += 1;
              getResources()
            }}>下一页</Button>
          </Space>
        </Modal>
      </Fragment>
    )
    }
  </Observer >
}