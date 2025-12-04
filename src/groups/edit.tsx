import { observer, useLocalObservable } from "mobx-react"
import { Fragment, useMemo } from 'react';
import { Input, Button, Divider, Select, Tabs, Radio, message, Space, Modal, Switch, Flex } from 'antd'
import { CopyToClipboard } from 'react-copy-to-clipboard';
import { cloneDeep, isPlainObject, pick } from 'lodash-es'
import { Acon, Style } from '@/components/index';
import { IComponent, IResource, } from '@/types'
import styled from 'styled-components';
import {
  EditItem,
} from './style'
import CONST from "@/constant";
import QueryModal from "./queriesModal";
import { FullWidth } from "@/components/style";
import ResourceModal from "@/components/ResourceModal";
import JSON5 from 'json5';
import store from "@/store";
import { SortDD } from "@/components/SortableDD";
import { getSnapshot, types } from "mobx-state-tree";

const { AlignAround, AlignAside } = Style;

const ScrollWrap = styled.div`
  flex: 1;
  height: 100%;
  overflow-y: auto;
  &::-webkit-scrollbar {
    display: none;
  }
`

const Edit = observer(({ data, setData, tabkey, setTabkey }: { data: IComponent, setData: Function, tabkey: string, setTabkey: Function }) => {
  const local = useLocalObservable(() => ({
    addWidgetReferVisible: false,
    q: '',
    setVisible(b: boolean) {
      local.addWidgetReferVisible = b;
    },
    setQ(q: string) {
      local.q = q;
    },
    showQueryModal: false,
    showResourceModal: false,
    setShowQueryModal(show: boolean) {
      local.showQueryModal = show;
    },
    setResourceModal(show: boolean) {
      local.showResourceModal = show;
    }
  }))
  const items = useMemo(() => {
    return [...data.widget.refer, ...(store.global.getValue(data.widget.source) || [])]
  }, [data.widget.refer, data.widget.source, store.global])
  return (
    <div className='hidden-scroll' key={data._id} style={{ display: 'flex', flexDirection: 'column', width: 300, height: '100%', backgroundColor: 'wheat', marginLeft: 50 }}>
      <AlignAside style={{ color: '#5d564a', backgroundColor: '#bdbdbd', padding: '3px 5px' }}>
        <span>属性({data.type})</span>
        <Acon icon='CircleX' onClick={() => {
          setData(null, '')
        }} />
      </AlignAside>
      <Tabs
        style={{ flex: 1, display: 'flex', height: '100%', overflow: 'hidden' }}
        activeKey={tabkey}
        onChange={v => {
          setTabkey(v)
        }}
        items={[
          {
            label: '基础', key: 'base', children: (
              <ScrollWrap>
                <EditItem>
                  <Input prefix={<span>标题<Divider orientation="vertical" /></span>} defaultValue={data.title} onChange={e => {
                    if (data) {
                      data.setAttr('title', e.target.value);
                    }
                  }} />
                </EditItem>
                <EditItem>
                  <Input prefix={<span>描述<Divider orientation="vertical" /></span>} value={data.desc} />
                </EditItem>
                <EditItem>
                  <Input prefix={<span>项目id<Divider orientation="vertical" /></span>} value={data.project_id} onChange={e => {
                    if (data) {
                      data.setAttr('project_id', e.target.value)
                    }
                  }} />
                </EditItem>
                <EditItem>
                  <Input prefix={<span>上级id<Divider orientation="vertical" /></span>} value={data.parent_id} onChange={e => {
                    if (data) {
                      data.setAttr('parent_id', e.target.value)
                    }
                  }} />
                </EditItem>
                <EditItem>
                  <Input prefix={<span>_id<Divider orientation="vertical" /></span>} readOnly value={data._id} />
                </EditItem>
                <EditItem>
                  <Input prefix={<span>状态<Divider orientation="vertical" /></span>} type="number" value={data.status} onChange={e => {
                    if (data) {
                      data.setAttr('status', parseInt(e.target.value));
                    }
                  }} />
                </EditItem>
                <EditItem>
                  <Input prefix={<span>name<Divider orientation="vertical" /></span>} value={data.name} onChange={e => {
                    data.setAttr('name', e.target.value);
                  }} />
                </EditItem>
                <EditItem>
                  <Input prefix={<span>图标<Divider orientation="vertical" /></span>} value={data.icon} onChange={e => {
                    data.setAttr('icon', e.target.value);
                  }} />
                </EditItem>
                <EditItem>
                  属性
                  <Input.TextArea style={{ minHeight: 150 }} defaultValue={JSON.stringify(data.attrs, null, 2)} onBlur={e => {
                    try {
                      const attrs = JSON5.parse(e.target.value)
                      data.setAttr('attrs', attrs);
                    } catch (e) {

                    } finally {

                    }
                  }} />
                </EditItem>
              </ScrollWrap>
            )
          },
          {
            label: '控件', key: 'widget', children: (
              <ScrollWrap>
                <EditItem>
                  <Space.Compact style={{ width: '100%', }}>
                    <Space.Addon style={{ padding: '6px 8px' }}>仅查询</Space.Addon>
                    <Space.Addon style={{ flex: 1 }}>
                      <Switch checkedChildren='是' unCheckedChildren='否' checked={data.widget.query} onChange={checked => {
                        data.setWidget('query', checked)
                      }} />
                    </Space.Addon>
                  </Space.Compact>
                </EditItem>
                <EditItem>
                  <Space.Compact block>
                    <Space.Addon style={{ flexShrink: 0 }}>字段</Space.Addon>
                    <Input value={data.widget.field} onChange={e => {
                      data.setWidget('field', e.target.value);
                    }} />
                  </Space.Compact>
                  <Space.Compact block>
                    <Space.Addon style={{ flexShrink: 0 }}>来源</Space.Addon>
                    <Input placeholder="默认" defaultValue={data.widget.source} onBlur={e => {
                      data.setWidget('source', e.target.value);
                    }} />
                  </Space.Compact>
                  <Space.Compact block orientation="vertical">
                    默认值
                    <Input.TextArea value={data.widget.value.toString()} onChange={e => {
                      data.setWidget('value', e.target.value);
                    }} />
                  </Space.Compact>
                  参考值
                  <SortDD
                    direction='vertical'
                    handle={true}
                    items={[...data.widget.refer, ...(store.global.getValue(data.widget.source) || []).map((v: any) => ({ ...v, disabled: true }))].map((v: any) => {
                      return { id: v.value, data: isPlainObject(v) ? v : getSnapshot(v), disabled: v.disabled ? true : false, }
                    })}
                    renderItem={(item: any, handler: any) => {
                      return <Space.Compact style={{ marginBottom: 5 }}>
                        <Space.Addon style={{ flexShrink: 0 }}>
                          <FullWidth>
                            <Acon icon='Move' style={{ marginRight: 5 }}  {...handler} />
                            {item.data.label}
                          </FullWidth>
                        </Space.Addon>
                        <Input
                          readOnly
                          value={item.data.value}
                          disabled={item.disabled}
                        />
                      </Space.Compact>
                    }}
                    sort={data.swapRefer}
                  />
                  <AlignAround>
                    {local.addWidgetReferVisible
                      ? <Fragment>
                        <Space.Compact block>
                          <Space.Addon style={{ flexShrink: 0 }}>名称</Space.Addon>
                          <Input />
                        </Space.Compact>
                        <Divider orientation="vertical" />
                        <Space.Compact block>
                          <Space.Addon style={{ flexShrink: 0 }}>值</Space.Addon>
                          <Input />
                        </Space.Compact>
                        <Acon icon='CircleCheck' style={{ marginLeft: 5 }} onClick={e => {
                          const op = e.currentTarget.parentElement;
                          if (op && data) {
                            const oinputs = op.getElementsByTagName('input');
                            if (oinputs?.length === 2 && oinputs[0].value) {
                              data.pushRefer({ label: oinputs[0].value, value: oinputs[1].value });
                            }
                            local.setVisible(false)
                          }
                        }} />
                      </Fragment>
                      : <Acon icon='CirclePlus' onClick={() => local.setVisible(true)} />}
                  </AlignAround>
                </EditItem>
              </ScrollWrap>
            )
          },
          {
            label: '数据', key: 'data', children: (
              <ScrollWrap>
                <EditItem>
                  <Space.Compact block style={{ alignItems: 'center' }}>
                    <div>条件</div>
                    <Divider orientation="vertical" />
                    <Acon icon='CirclePlus' onClick={() => {
                      local.setShowQueryModal(true)
                    }} />
                  </Space.Compact>

                  {data.queries.map(id => (
                    <Input key={id} readOnly value={id} suffix={<Acon icon="X" onClick={() => {
                      data.queries.replace(data.queries.filter(q => q !== id))
                    }} />} />
                  ))}
                  {local.showQueryModal && <QueryModal
                    show={local.showQueryModal}
                    queries={data.queries}
                    setQueries={(queries: string[]) => data.queries.replace(queries)}
                    q={local.q}
                    close={() => local.setShowQueryModal(false)}
                  />}
                </EditItem>
                <EditItem>
                  静态数据
                  <SortDD
                    direction='vertical'
                    items={((data.resources || []).map(v => ({ id: v._id, data: v })))}
                    renderItem={(item: any, handler: any) => {
                      return <div style={{ display: 'flex', alignItems: 'center', marginTop: 5 }}>
                        <Acon icon='Move' style={{ marginRight: 5 }} {...handler} />
                        <Input
                          value={item.data.title}
                          prefix={<CopyToClipboard text={item.data._id as string}><Acon icon='Copy' onClick={() => { }} /></CopyToClipboard>}
                          suffix={<Acon icon='CircleX' onClick={() => { data.remResource(data._id) }}
                          />} />
                      </div>
                    }}
                    sort={data.swapResource}
                  />
                  {local.showResourceModal && <ResourceModal
                    show={local.showResourceModal}
                    onAdd={(d: IResource) => {
                      data.addResource(pick(d, ['_id', 'title', 'cover', 'thumbnail', 'status']) as IResource)
                    }}
                    onClose={() => {
                      local.setResourceModal(false)
                    }}
                  />}
                  <AlignAround style={{ marginTop: 10 }}>
                    <Button icon={<Acon icon="Plus" />} onClick={() => {
                      local.setResourceModal(true)
                    }}>添加资源</Button>
                  </AlignAround>
                </EditItem>
              </ScrollWrap>
            )
          },
          {
            label: '事件', key: 'event', children: (
              <ScrollWrap>
                <EditItem>
                  {
                    (data.widget.action === CONST.ACTION_TYPE.GOTO_PAGE || data.widget.action === CONST.ACTION_TYPE.OPEN_URL)
                    && <Input prefix="跳转url" value={data.url} onChange={e => {
                      data.setAttr('url', e.target.value);
                    }} />
                  }
                  {
                    data.widget.action === CONST.ACTION_TYPE.MODAL && <Input prefix='模板id' value={data.widget.method} onChange={e => {
                      data.setWidget('method', e.target.value);
                    }} />
                  }
                  {
                    data.widget.action === CONST.ACTION_TYPE.PREVIEW && <Select defaultValue={data.widget.method} onChange={v => {
                      data.setWidget('method', v);
                    }}>
                      <Select.Option value='image'>图片</Select.Option>
                      <Select.Option value='video'>视频</Select.Option>
                    </Select>
                  }
                  {[CONST.ACTION_TYPE.FETCH, CONST.ACTION_TYPE.UPLOAD].includes(data.widget.action) && <Space.Compact block>
                    <Select value={data.widget.method} onChange={v => {
                      data.setWidget('method', v);
                    }}>
                      <Select.Option value="AUTO">AUTO</Select.Option>
                      <Select.Option value="GET">GET</Select.Option>
                      <Select.Option value="PUT">PUT</Select.Option>
                      <Select.Option value="POST">POST</Select.Option>
                      <Select.Option value="DELETE">DELETE</Select.Option>
                      <Select.Option value="PATCH">PATCH</Select.Option>
                    </Select>
                    <Input
                      value={data.url}
                      readOnly={![CONST.ACTION_TYPE.FETCH, CONST.ACTION_TYPE.UPLOAD].includes(data.widget.action)}
                      onChange={e => {
                        data.setAttr('url', e.target.value);
                      }} />
                  </Space.Compact>}
                </EditItem>
                <EditItem>
                  <Space.Compact block>
                    <Space.Addon style={{ flexShrink: 0 }}>
                      事件类型
                    </Space.Addon>
                    <Select style={{ width: '100%' }} value={data.widget.action} onChange={v => {
                      data.setWidget('action', v);
                    }} >
                      <Select.Option value="">无</Select.Option>
                      <Select.Option value={CONST.ACTION_TYPE.GOTO_PAGE}>跳标签页</Select.Option>
                      <Select.Option value={CONST.ACTION_TYPE.OPEN_URL}>跳转外链</Select.Option>
                      <Select.Option value={CONST.ACTION_TYPE.MODAL}>打开弹框</Select.Option>
                      <Select.Option value={CONST.ACTION_TYPE.COPY}>复制数据</Select.Option>
                      <Select.Option value={CONST.ACTION_TYPE.SEARCH}>执行搜索</Select.Option>
                      <Select.Option value={CONST.ACTION_TYPE.FETCH}>发送请求</Select.Option>
                      <Select.Option value={CONST.ACTION_TYPE.PREVIEW}>图片预览</Select.Option>
                      <Select.Option value={CONST.ACTION_TYPE.UPLOAD}>文件上传</Select.Option>
                    </Select>
                  </Space.Compact>
                </EditItem>
              </ScrollWrap>
            )
          },
          {
            label: '布局', key: 'layout', children: (
              <ScrollWrap>
                <EditItem>
                  布局方向<Divider orientation='vertical' />
                  <Radio.Group value={data.attrs.layout} options={[
                    { label: '水平', value: 'horizontal' },
                    { label: '垂直', value: 'vertical' },
                  ]} onChange={e => {
                    const attrs = cloneDeep(data.attrs);
                    attrs.layout = e.target.value
                    data.setAttr('attrs', attrs)
                  }} />
                </EditItem>
                <EditItem>
                  样式
                  <Input.TextArea style={{ minHeight: 150 }} defaultValue={JSON.stringify(data.style, null, 2)} onBlur={e => {
                    try {
                      const style = JSON5.parse(e.target.value)
                      data.setAttr('style', style);
                    } catch (e) {

                    } finally {

                    }
                  }} />
                </EditItem>
              </ScrollWrap>
            )
          }
        ]}
      />
    </div>
  )
});

export default Edit;