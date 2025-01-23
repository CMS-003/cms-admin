import { Fragment, useEffect, useRef, useMemo, useState, } from 'react'
import { Observer, useLocalStore } from 'mobx-react'
import { Form, Input, Switch, Upload, Button, Select, Spin, } from 'antd'
import Acon from '../Acon'
import CodeMirror from '@uiw/react-codemirror';
import { json } from '@codemirror/lang-json';
import { debounce } from 'lodash'
import store from '@/store'
import { IEditorField } from '@/types'

function DebounceSelect({ fetchOptions, onChoose, value, defaultValue, debounceTimeout = 800, ...props }: { placeholder: string, onChange: Function, value: any, defaultValue: any, showSearch: boolean, fetchOptions: any, onChoose: Function, debounceTimeout?: number, props?: any }) {
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
      defaultValue={defaultValue}
      value={value}
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

export default function EditPage({ fetch, fields, data, ...props }: { data: any, fields: IEditorField[], fetch: Function, }) {
  const local = useLocalStore<{ jsonMap: { [key: string]: string } }>(() => ({
    jsonMap: {},
  }))
  useEffect(() => {
    fields.forEach(item => {
      if (item.type === 'json') {
        local.jsonMap[item.field] = JSON.stringify(data[item.field] || {}, null, 2)
      } else {
        local.jsonMap[item.field] = data[item.field];
      }
    })
    return () => {
      local.jsonMap = {}
    }
  })
  return <Observer>{() => (<Fragment>
    <Form>
      {fields.map(item => {
        switch (item.component) {
          case 'Input':
            return <Form.Item key={item.field} label={item.title} labelCol={lb} wrapperCol={rb}>
              <Input defaultValue={data[item.field]} autoFocus={item.autoFocus || false} onChange={e => {
                data[item.field] = e.target.value
              }} />
            </Form.Item>;
          case 'Number':
            return <Form.Item key={item.field} label={item.title} labelCol={lb} wrapperCol={rb}>
              <Input type="number" value={data[item.field]} autoFocus={item.autoFocus || false} onChange={e => {
                data[item.field] = e.target.value
              }} />
            </Form.Item>;
          case 'Hidden':
            return <Form.Item key={item.field} label={item.title} labelCol={lb} wrapperCol={rb}>
              <Input type="hidden" value={data[item.field]} autoFocus={item.autoFocus || false} />
            </Form.Item>;
          case 'Read':
            return <Form.Item key={item.field} label={item.title} labelCol={lb} wrapperCol={rb}>
              <Input readOnly disabled value={data[item.field]} autoFocus={item.autoFocus || false} />
            </Form.Item>;
          case 'Area':
            return <Form.Item key={item.field} label={item.title} labelCol={lb} wrapperCol={rb}>
              <Input.TextArea value={data[item.field]} onChange={e => {
                data[item.field] = e.target.value
              }} />
            </Form.Item>;
          case 'Select':
            return <Form.Item key={item.field} label={item.title} labelCol={lb} wrapperCol={rb}>
              <Select key={item.field} defaultValue={data[item.field] || ''} onChange={(value) => {
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
                defaultValue={item.defaultValue}
                value={data[item.field] || ''}
                placeholder={"请输入"}
                fetchOptions={async () => {
                  if (item.fetch) {
                    const result = await item.fetch()
                    if (result.code === 0) {
                      return result.data.items.map((item: any) => ({ label: item.title + `(${item.type || ''})`, value: item._id, name: item.name }))
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
                action={store.app.baseURL + "/api/v1/upload/image"}
                showUploadList={false}
                headers={{ Authorization: 'Bearer ' + store.user.getAccessToken() }}
                name="image"
                onChange={(e) => {
                  if (e.file.status === 'uploading') {
                    console.log(e.event?.percent)
                    // data[item.field] = e.file
                    // const reader = new FileReader();
                    // reader.addEventListener('load', () => { data[item.field] = reader.result });
                    // reader.readAsDataURL(e.file as any);
                  } else if (e.file.status === 'done') {
                    data[item.field] = e.file.response.data;
                  }
                }} beforeUpload={(f) => {
                  return true
                }}>
                <img width="100%" src={((data[item.field] || '').startsWith('data') ? data[item.field] : 'http://localhost:3334' + (data[item.field] || '/images/poster/nocover.jpg'))} alt="" />
                <Button style={{ position: 'absolute', left: '50%', top: '50%', transform: 'translate(-50%,-50%)' }}>
                  <Acon icon='UploadOutlined' style={{}} /> 上传
                </Button>
              </Upload>
            </Form.Item>
          case 'Editor':
            return <Form.Item key={item.field} label={item.title} labelCol={lb} wrapperCol={rb}>
              <Select defaultValue={item.type} onChange={type => {
                item.type = type;
              }}>
                <Select.Option value="html">html</Select.Option>
                <Select.Option value="json">json</Select.Option>
              </Select>
              <CodeMirror
                key={item.field}
                autoFocus
                value={local.jsonMap[item.field]}
                className="code-mirror"
                extensions={[json()]}
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
  </Fragment>)}</Observer>
} 