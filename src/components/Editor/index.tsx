import React, { Fragment, useEffect, useRef, useMemo, useState, } from 'react'
import { Observer, useLocalObservable } from 'mobx-react'
import { Form, Input, Modal, notification, Switch, Upload, Button, Select, Spin, message, } from 'antd'
import { UploadOutlined } from '@ant-design/icons'
import { Codemirror } from 'react-codemirror-ts';
import _, { debounce } from 'lodash'
import apis from '@/api'
import store from '@/store'
import { EditorField } from '@/types'
import 'codemirror/mode/javascript/javascript';
import 'codemirror/addon/edit/matchbrackets';
import 'codemirror/lib/codemirror.css';
import 'codemirror/theme/3024-night.css';

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
      onInputKeyDown={e => {
        if (e.keyCode === 13) {
          debounceFetcher('')
        }
      }}
      options={options}
    />
  );
}

const lb = { span: 4 }, rb = { span: 20 }

export default function EditPage({ visible, fetch, fields, data, close, ...props }: { visible: boolean, data: any, fields: EditorField[], fetch: Function, close: Function }) {
  const local = useLocalObservable<{ fetching: boolean, jsonMap: { [key: string]: string } }>(() => ({
    fetching: false,
    jsonMap: {},
  }))
  useEffect(() => {
    fields.forEach(item => {
      if (item.type === 'json') {
        local.jsonMap[item.field] = JSON.stringify(data[item.field] || {}, null, 2)
      }
    })
    return () => {
      local.jsonMap = {}
    }
  })
  return <Observer>{() => (<Fragment>
    <Modal
      title={data.id ? '修改' : '添加'}
      visible={visible}
      key={visible ? 1 : 2}
      okText="确定"
      confirmLoading={local.fetching}
      cancelText="取消"
      style={{ maxHeight: 700 }}
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
                  {item.value.map((v: any, index: number) => (<Select.Option key={index} value={v.value}>{v.name}</Select.Option>))}
                  {/* {store.component.types.map((v: any, index: number) => (<Select.Option key={index} value={v.type}>{v.title}</Select.Option>))} */}
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
                        return result.data.items.map((item: any) => ({ label: item.title+`(${item.type || ''})`, value: item.id, name: item.name }))
                      }
                    }
                    return []
                  }}
                  onChange={(value: any) => {
                    data[item.field] = value.value
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
            case 'Editor':
              return <Form.Item key={item.field} label={item.title} labelCol={lb} wrapperCol={rb}>
                <Codemirror
                  key={item.field}
                  autoFocus
                  value={local.jsonMap[item.field]}
                  name="attrs"
                  // path="example"
                  options={{
                    lineNumbers: true,
                    lineWrapping: true,
                    matchBrackets: true,
                    theme: '3024-night',
                    mode: 'javascript',
                    tabSize: 2,
                  }}
                  className="code-mirror"
                  onChange={(value, options) => {
                    data[item.field] = value
                  }}
                />
              </Form.Item>
            default: break;
          }
          return null
        })}
      </Form>
    </Modal>
  </Fragment>)}</Observer>
} 