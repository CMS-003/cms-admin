import React, { Fragment } from 'react'
import { Observer, useLocalObservable } from 'mobx-react'
import { Form, Input, Modal, notification } from 'antd'
import { Component } from '../../types/index'
import * as apis from '../../api'

export default function EditPage({ ...props }) {
  const local = useLocalObservable(() => ({
    fetching: false,
    data: {
      id: props.data.id || '',
      title: props.data.title || '',
    }
  }))
  return <Observer>{() => (<Fragment>
    <Modal
      title={local.data.id ? '修改' : '添加'}
      visible={props.visible}
      okText="确定"
      confirmLoading={local.fetching}
      cancelText="取消"
      onOk={async () => {
        local.fetching = true
        try {
          await apis.createComponent({ body: local.data })
        } catch (e: any) {
          notification.error({ message: e.message })
        } finally {
          local.fetching = false
          props.close();
        }
      }}
      onCancel={async () => {
        props.close();
      }}
    >
      <Form>
        <Form.Item label="组件名称">
          <Input value={local.data.title} autoFocus onChange={e => {
            local.data.title = e.target.value
          }} />
        </Form.Item>
      </Form>
    </Modal>
  </Fragment>)}</Observer>
} 