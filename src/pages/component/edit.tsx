import React, { Fragment, useEffect, useRef, useMemo, useState, } from 'react'
import { Observer, useLocalObservable } from 'mobx-react'
import { Form, Input, Modal, notification, Switch, Upload, Button, Select, Spin, } from 'antd'
import { UploadOutlined } from '@ant-design/icons'
import apis from '../../api'
import { debounce } from 'lodash'

function DebounceSelect({ fetchOptions, onChoose, value, debounceTimeout = 800, ...props }: { placeholder: string, onChange: Function, value: any, showSearch: boolean, fetchOptions: any, onChoose: Function, debounceTimeout?: number, props?: any }) {
  const [fetching, setFetching] = useState(false);
  const [options, setOptions] = useState([]);
  const fetchRef = useRef(0);
  const debounceFetcher = useMemo(() => {
    const loadOptions = (v: any) => {
      fetchRef.current += 1;
      const fetchId = fetchRef.current;
      setOptions([]);
      setFetching(true);
      fetchOptions(v).then((newOptions: any) => {
        if (fetchId !== fetchRef.current) {
          // for fetch callback order
          return;
        }

        setOptions(newOptions);
        setFetching(false);
      });
    };

    return debounce(loadOptions, debounceTimeout);
  }, [fetchOptions, debounceTimeout]);
  return (
    <Select
      labelInValue
      filterOption={false}
      onSearch={debounceFetcher}
      notFoundContent={fetching ? <Spin size="small" /> : null}
      value={{ value }}
      {...props}
      onChange={e => {
        props.onChange && props.onChange(e);
      }}
      options={options}
    />
  );
}

const fields = [
  {
    field: 'type',
    title: '组件类型',
    type: 'string',
    component: 'Select',
    defaultValue: '',
    autoFocus: false,
    value: [
      { name: '根组件', value: '' },
      { name: '菜单项', value: 'MenuItem' },
    ],
  },
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
    field: 'name',
    title: 'name',
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
    field: 'tree_id',
    title: '根组件',
    type: 'string',
    component: 'RemoteSelect',
    defaultValue: '',
    autoFocus: false,
    value: [],
    fetch: apis.getComponents
  },
  {
    field: 'parent_id',
    title: '父组件',
    type: 'string',
    component: 'RemoteSelect',
    defaultValue: '',
    autoFocus: false,
    value: [],
    fetch: apis.getComponents
  },
  {
    field: 'available',
    title: '是否可用',
    type: 'boolean',
    component: 'Switch',
    defaultValue: false,
    value: [{ name: '可用', value: 1 }, { name: '不可用', value: 0 }],
    autoFocus: false,
  },
  {
    field: 'cover',
    title: '图片',
    type: 'string',
    component: 'Image',
    defaultValue: '',
    value: [],
    autoFocus: false,
  },
]
const lb = { span: 6 }, rb = { span: 18 }

export default function EditPage({ visible, fetch, data, close, ...props }: { visible: boolean, data: any, fetch: Function, close: Function }) {
  const local = useLocalObservable<{ fetching: boolean }>(() => ({
    fetching: false,
  }))
  return <Observer>{() => (<Fragment>
    <Modal
      title={data.id ? '修改' : '添加'}
      visible={visible}
      okText="确定"
      confirmLoading={local.fetching}
      cancelText="取消"
      onOk={async () => {
        local.fetching = true
        try {
          await fetch({ body: data })
        } catch (e: any) {
          notification.error({ message: e.message })
        } finally {
          local.fetching = false
          close();
        }
      }}
      onCancel={async () => {
        close();
      }}
    >
      <Form>
        {fields.map(item => {
          switch (item.component) {
            case 'Input':
              return <Form.Item key={item.field} label={item.title} labelCol={lb} wrapperCol={rb}>
                <Input value={data[item.field]} autoFocus={item.autoFocus || false} onChange={e => {
                  data[item.field] = e.target.value
                }} />
              </Form.Item>;
            case 'Select':
              return <Form.Item key={item.field} label={item.title} labelCol={lb} wrapperCol={rb}>
                <Select key={item.field} value={data[item.field] || ''} onChange={(value) => {
                  data[item.field] = value
                }}>
                  {item.value.map((v: any) => (<Select.Option key={v.value} value={v.value}>{v.name}</Select.Option>))}
                </Select>
              </Form.Item>;
            case 'RemoteSelect':
              return <Form.Item key={item.field} label={item.title} labelCol={lb} wrapperCol={rb}>
                <DebounceSelect
                  // mode="multiple"
                  showSearch
                  onChoose={() => {

                  }}
                  value={data[item.field] || ''}
                  placeholder={"请输入"}
                  fetchOptions={async () => {
                    if (item.fetch) {
                      const result = await item.fetch()
                      if (result.code === 0) {
                        return result.data.items.map((item: any) => ({ label: item.title, value: item.id, name: item.name }))
                      }
                    }
                    return []
                  }}
                  onChange={(value: any) => {
                    data[item.field] = value.value
                    console.log(data[item.field], value)
                  }}
                />
              </Form.Item>;
            case 'Switch':
              return <Form.Item key={item.field} label={item.title} labelCol={lb} wrapperCol={rb}>
                <Switch checked={data[item.field] === item.value[0].value} onClick={e => {
                  data[item.field] = data[item.field] === item.value[0].value ? item.value[1].value : item.value[0].value
                }} /> {data[item.field] === item.value[0].value ? item.value[0].name : item.value[1].name}
              </Form.Item>
            case 'Image':
              return <Form.Item key={item.field} label={item.title} labelCol={lb} wrapperCol={rb}>
                <Upload
                  style={{ position: 'relative' }}
                  listType="picture-card"
                  className="avatar-uploader"
                  showUploadList={false} name="cover" onChange={(e: any) => {
                    data[item.field] = e.file
                    const reader = new FileReader();
                    reader.addEventListener('load', () => { data[item.field] = reader.result });
                    reader.readAsDataURL(e.file);
                  }} beforeUpload={(f) => {
                    return false
                  }}>
                  <img width="100%" src={((data[item.field] || '').startsWith('data') ? data[item.field] : 'http://localhost:3334' + (data[item.field] || '/images/poster/nocover.jpg'))} alt="" />
                  <Button style={{ position: 'absolute', left: '50%', top: '50%', transform: 'translate(-50%,-50%)' }}>
                    <UploadOutlined /> 上传
                  </Button>
                </Upload>
              </Form.Item>
            default: break;
          }
          return null
        })}
      </Form>
    </Modal>
  </Fragment>)}</Observer>
} 