import { Modal, Table, Space, Image, Button, Input, InputRef } from "antd";
import { Observer, useLocalObservable } from "mobx-react";
import { Fragment, useCallback, useRef } from "react";
import { useEffectOnce } from "react-use";
import apis from "@/api";
import { IResource } from "@/types/resource";
import Acon from "../Acon";

export default function ResourceModal({ show, onAdd, onClose }: { show: boolean, onAdd: Function, onClose: Function }) {
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
        <Modal
          open={show}
          destroyOnClose={true}
          closable={false}
          footer={(
            <Space style={{ width: '100%', justifyContent: 'right', paddingTop: 10 }}>
              <Button type="primary" disabled={local.fetch || local.page === 1} onClick={() => {
                local.page -= 1;
                getResources()
              }}>上一页</Button>
              <Button type="primary" disabled={local.fetch} onClick={() => {
                local.page += 1;
                getResources()
              }}>下一页</Button>
              <Button type="primary" onClick={() => { onClose(); }}>关闭</Button>
            </Space>
          )}
        >
          <div style={{ display: 'flex', flexDirection: 'column', padding: 10, height: '100%', overflow: 'hidden' }}>
            <Space style={{ paddingBottom: 10 }}>
              <Input ref={ref => (searchInput as any).current = ref} onChangeCapture={e => {
                local.q = e.currentTarget.value
              }} />
              <Button type="primary" disabled={local.fetch} onClick={() => {
                getResources();
              }}>查询</Button>
              <Button type="default" onClick={() => {
                local.page = 1;
                local.q = '';
                const current: any = searchInput.current;
                if (current) {
                  current.currentTarget.value = '';
                  current.state.value = '';
                }
              }}>清空</Button>
            </Space>
            <div style={{ flex: 1, overflow: 'auto' }}>
              <Table loading={local.fetch} pagination={false} style={{ tableLayout: 'fixed' }} rowKey="_id" dataSource={local.resources}>
                <Table.Column title="名称" dataIndex="title" render={(title, record: IResource) => <Fragment>{record.cover ? <Image src={"http://192.168.0.124:8097" + record.cover} /> : null} {title}</Fragment>} />
                <Table.Column title="操作" key="_id" render={(_, record: IResource) => (
                  <Acon icon='CirclePlus' onClick={() => {
                    onAdd({ _id: record._id, title: record.title, cover: record.poster || record.thumbnail })
                  }} />
                )} />
              </Table>
            </div>
          </div>
        </Modal>
      </Fragment>
    )
    }
  </Observer >
}