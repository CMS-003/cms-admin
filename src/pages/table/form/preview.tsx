import { Fragment, useEffect, useRef, useMemo, useState, JSXElementConstructor, ReactElement, ReactFragment, ReactPortal, useCallback, } from 'react'
import { Observer, useLocalStore } from 'mobx-react'
import { Form, Input, Switch, Upload, Button, Select, Spin, Row, Col, message } from 'antd'
import Acon from '@/components/Acon'
import { Codemirror } from 'react-codemirror-ts';
import { debounce } from 'lodash'
import store from '@/store'
import { IEditorField, ITableView, ITableWidget } from '@/types'
import 'codemirror/mode/javascript/javascript';
import 'codemirror/addon/edit/matchbrackets';
import 'codemirror/lib/codemirror.css';
import 'codemirror/theme/3024-night.css';
import { useEffectOnce } from 'react-use';
import apis from '@/api';
import { Center, FullHeight, FullHeightAuto, FullHeightFix } from '@/components/style';
import { FormItem } from '../style'

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

const lb = { span: 4 }, rb = { span: 16 }

export default function EditPage({ setTitle }: { setTitle: (title: string) => void }) {
  const local = useLocalStore<{ isLoading: boolean, table: string, data: any, id: string, view_id: string, title: string, widgets: ITableWidget[] }>(() => ({
    isLoading: false,
    id: '',
    title: '',
    table: '',
    view_id: '',
    data: {},
    widgets: [],
  }))
  const init = useCallback(async () => {
    if (local.view_id) {
      const resp = await apis.getViewDetail(local.view_id, { id: local.id });
      if (resp.code === 0) {
        local.widgets = resp.data.widgets
        local.table = resp.data.table;
        local.data = resp.data.data || {};
      }
    }
  }, []);
  const save = useCallback(async () => {
    try {
      local.isLoading = true;
      await apis.updateData(local.table, local.data);
    } catch (e) {
      message.error('修改失败!')
    } finally {
      local.isLoading = false;
    }
  }, []);
  useEffect(() => {
    return () => {

    }
  })
  useEffectOnce(() => {
    const params = new URL(window.location.href).searchParams;
    local.id = params.get('id') || '';
    local.view_id = params.get('view_id') || '';
    local.title = params.get('title') || '';
    if (local.title) {
      setTitle(local.title);
    }
    init();
  })
  return <Observer>{() => (<FullHeight>
    <FullHeightAuto>
      <Form disabled={!local.id} style={{ width: '80%' }}>
        {local.widgets.map((item, i) => {
          switch (item.widget) {
            case 'input':
              return <FormItem key={i}>
                <Col span={6} style={{ textAlign: 'right', padding: '0 15px' }}>{item.label}</Col>
                <Col span={18}>
                  <Input defaultValue={local.data[item.field] as string} onChange={e => {
                    local.data[item.field] = e.target.value
                  }} />
                </Col>
              </FormItem>;
            case 'Number':
              return <Form.Item key={item.field} label={item.label} labelCol={lb} wrapperCol={rb}>
                <Input type="number" value={local.data[item.field]} onChange={e => {
                  local.data[item.field] = e.target.value
                }} />
              </Form.Item>;
            case 'Hidden':
              return <Form.Item key={item.field} label={item.label} labelCol={lb} wrapperCol={rb}>
                <Input type="hidden" value={local.data[item.field]} />
              </Form.Item>;
            case 'Read':
              return <Form.Item key={item.field} label={item.label} labelCol={lb} wrapperCol={rb}>
                <Input readOnly disabled value={local.data[item.field]} />
              </Form.Item>;
            case 'Area':
              return <Form.Item key={item.field} label={item.label} labelCol={lb} wrapperCol={rb}>
                <Input.TextArea value={local.data[item.field]} onChange={e => {
                  local.data[item.field] = e.target.value
                }} />
              </Form.Item>;
            case 'Select':
              return <Form.Item key={item.field} label={item.label} labelCol={lb} wrapperCol={rb}>
                <Select key={item.field} defaultValue={local.data[item.field] || ''} onChange={(value) => {
                  local.data[item.field] = value
                }}>
                  {item.value.map((v: any, index: number) => (<Select.Option key={index} value={v.value}>{v.name}</Select.Option>))}
                  {/* {store.component.types.map((v: any, index: number) => (<Select.Option key={index} value={v.type}>{v.title}</Select.Option>))} */}
                </Select>
              </Form.Item>;
            case 'RemoteSelect':
              return <Form.Item key={item.field} label={item.label} labelCol={lb} wrapperCol={rb}>
                <DebounceSelect
                  // mode="multiple"
                  showSearch
                  onChoose={() => {

                  }}
                  defaultValue={item.value}
                  value={local.data[item.field] || ''}
                  placeholder={"请输入"}
                  fetchOptions={async () => {
                    // if (item.fetch) {
                    //   const result = await item.fetch()
                    //   if (result.code === 0) {
                    //     return result.data.items.map((item: any) => ({ label: item.title + `(${item.type || ''})`, value: item._id, name: item.name }))
                    //   }
                    // }
                    // return []
                  }}
                  onChange={(value: any) => {
                    local.data[item.field] = value.value
                  }}
                />
              </Form.Item>;
            case 'Switch':
              return <Form.Item key={item.field} label={item.label} labelCol={lb} wrapperCol={rb}>
                <Switch checked={local.data[item.field] === item.value[0].value} onClick={e => {
                  local.data[item.field] = local.data[item.field] === item.value[0].value ? item.value[1].value : item.value[0].value
                }} /> {local.data[item.field] === item.value[0].value ? item.value[0].name : item.value[1].name}
              </Form.Item>
            case 'Image':
              return <Form.Item key={item.field} label={item.label} labelCol={lb} wrapperCol={rb}>
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
                      local.data[item.field] = e.file.response.data.filepath;
                    }
                  }} beforeUpload={(f) => {
                    return true
                  }}>
                  <img width="100%" src={((local.data[item.field] || '').startsWith('data') ? local.data[item.field] : 'http://localhost:3334' + (local.data[item.field] || '/images/poster/nocover.jpg'))} alt="" />
                  <Button style={{ position: 'absolute', left: '50%', top: '50%', transform: 'translate(-50%,-50%)' }}>
                    <Acon icon='UploadOutlined' /> 上传
                  </Button>
                </Upload>
              </Form.Item>
            case 'Editor':
              return <Form.Item key={item.field} label={item.label} labelCol={lb} wrapperCol={rb}>
                <Codemirror
                  key={item.field}
                  autoFocus
                  value={local.data[item.field]}
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
                    local.data[item.field] = value
                  }}
                />
              </Form.Item>
            default: break;
          }
          return null
        })}
      </Form>
    </FullHeightAuto>
    <Center style={{ padding: 15 }}>
      <Button disabled={local.isLoading} type='primary' onClick={save}>保存</Button>
    </Center>
  </FullHeight>)}</Observer>
} 