import React, { Fragment } from 'react'
import { Observer, useLocalObservable } from 'mobx-react'
import { Form, Input, Modal, notification, Switch } from 'antd'
import { Component } from '../../types/index'
import * as apis from '../../api'

const fields = [
  {
    field: 'id',
    type: 'string',
    component: '',
    defaultValue: '',
    autoFocus: false,
    value: [],
  },
  {
    field: 'title',
    title: '组件名称',
    type: 'string',
    component: 'Input',
    defaultValue: '',
    autoFocus: false,
    value: [],
  },
  {
    field: 'desc',
    title: '组件描述',
    type: 'string',
    component: 'Input',
    defaultValue: '',
    autoFocus: false,
    value: [],
  },
  {
    field: 'available',
    title: '是否可用',
    type: 'boolean',
    component: 'Switch',
    defaultValue: false,
    value: [1, 2],
    autoFocus: false,
  },
]
export default function EditPage({ ...props }) {
  const local = useLocalObservable<{ data: any, fetching: boolean }>(() => ({
    fetching: false,
    data: {}
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
        {fields.map(item => {
          switch (item.component) {
            case 'Input':
              return <Form.Item key={item.field} label={item.title}>
                <Input value={local.data[item.field]} autoFocus={item.autoFocus || false} onChange={e => {
                  local.data[item.field] = e.target.value
                }} />
              </Form.Item>;
            case 'Switch':
              return <Form.Item key={item.field} label={item.title}>
                <Switch checked={local.data[item.field] === item.value[0]} onClick={e => {
                  local.data[item.field] = local.data[item.field] === item.value[0] ? item.value[1] : item.value[0]
                }} /> {local.data[item.field]}
              </Form.Item>
            default: break;
          }
          return null
        })}
      </Form>
    </Modal>
  </Fragment>)}</Observer>
} 