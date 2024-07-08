import { Fragment, useCallback, useEffect, } from 'react'
import { Observer, useLocalStore } from 'mobx-react'
import { Modal, notification, } from 'antd'
import { IEditorField } from '@/types'
import Content from './content'
import apis from '@/api'

export default function EditPage({ visible, fetch, data, close, ...props }: { visible: boolean, data: any, fetch: Function, close: Function }) {
  const local = useLocalStore<{ fetching: boolean, fields: IEditorField[] }>(() => ({
    fetching: true,
    fields: [],
  }))
  const init = useCallback(async (d: any) => {
    local.fetching = true;
    if (d && d._id) {
      const resp = await apis.getTemplateFields(d._id);
      console.log(resp)
      if (resp.code === 0) {
        local.fields = resp.data.items;
      }
    }
    local.fetching = false;
  }, []);
  useEffect(() => {
    init(data);
  }, [data])
  return <Observer>{() => {
    if (!data || !visible) {
      return null;
    }
    return (<Fragment>
      <Modal
        title={data._id ? '修改' : '添加'}
        open={true}
        okText="确定"
        confirmLoading={local.fetching}
        cancelText="取消"
        onOk={async () => {
          local.fetching = true
          try {
            local.fields.forEach(item => {
              if (item.type === 'json' && typeof data[item.field] === 'string') {
                data[item.field] = JSON.parse(data[item.field])
              }
              if (item.type === 'string' && !data[item.field]) {
                data[item.field] = item.defaultValue || ''
              }
              if (item.type === 'number') {
                data[item.field] = parseInt(data[item.field])
              }
            })
            await fetch({ body: data })
          } catch (e: any) {
            notification.error({ message: e.message })
          } finally {
            local.fetching = false
            close();
          }
        }}
        onCancel={async () => {
          local.fetching = false
          close();
        }}
      >
        <Content data={data} fields={local.fields} fetch={fetch} />
      </Modal>
    </Fragment>)
  }}</Observer>
} 