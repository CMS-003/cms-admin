import { Fragment, useEffect, } from 'react'
import { Observer, useLocalStore } from 'mobx-react'
import { Modal, notification, } from 'antd'
import { IEditorField } from '@/types'
import Content from './content'

export default function EditPage({ isAdd, visible, fetch, fields, data, close, ...props }: { isAdd?: boolean, visible: boolean, data: any, fields: IEditorField[], fetch: Function, close: Function }) {
  const local = useLocalStore<{ fetching: boolean }>(() => ({
    fetching: false,
  }))
  useEffect(() => {

  })
  return <Observer>{() => {
    if (!data) {
      return null;
    }
    return (<Fragment>
      <Modal
        title={isAdd || !data._id ? '添加' : '修改'}
        open={visible}
        key={visible ? 1 : 2}
        okText="确定"
        confirmLoading={local.fetching}
        cancelText="取消"
        onOk={async () => {
          local.fetching = true
          try {
            fields.forEach(item => {
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
        <Content data={data} fields={fields} fetch={fetch} />
      </Modal>
    </Fragment>)
  }}</Observer>
} 