import { Observer, observer, useLocalObservable } from "mobx-react"
import { makeAutoObservable, toJS } from "mobx"
import { Fragment } from 'react';
import { Input, Button, Divider, Select, Tabs, Radio, message, Space, Modal } from 'antd'
import { CopyToClipboard } from 'react-copy-to-clipboard';
import { cloneDeep } from 'lodash'
import { Acon, SortList, Style } from '@/components/index';
import { IComponent, IResource, } from '@/types'
import styled from 'styled-components';
import {
  EditItem,
} from './style'
import CONST from "@/constant";
import QueryModal from "./queriesModal";
import { FullWidth } from "@/components/style";
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
    setShowQueryModal(show: boolean) {
      local.showQueryModal = show;
    }
  }))
  return (
    <div className='hidden-scroll' key={data._id} style={{ display: 'flex', flexDirection: 'column', width: 300, height: '100%', backgroundColor: 'wheat', marginLeft: 50 }}>
      <AlignAside style={{ color: '#5d564a', backgroundColor: '#bdbdbd', padding: '3px 5px' }}>
        <span>属性({data.type})</span>
        <Space>
          <CopyToClipboard text={JSON.stringify(toJS(data))} onCopy={() => { message.success('复制成功') }}>
            <Acon icon="copy" />
          </CopyToClipboard>
          <Acon icon='CloseOutlined' onClick={() => {
            setData(null, '')
          }} />
        </Space>
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
                  <Input addonBefore="标题" defaultValue={data.title} onChange={e => {
                    if (data) {
                      data.setAttr('title', e.target.value);
                    }
                  }} />
                </EditItem>
                <EditItem>
                  <Input addonBefore="描述" value={data.desc} />
                </EditItem>
                <EditItem>
                  <Input addonBefore="parent_id" value={data.parent_id} onChange={e => {
                    if (data) {
                      data.setAttr('parent_id', e.target.value)
                    }
                  }} />
                </EditItem>
                <EditItem>
                  <Input addonBefore="_id" readOnly value={data._id} />
                </EditItem>
                <EditItem>
                  <Input addonBefore="status" type="number" value={data.status} onChange={e => {
                    if (data) {
                      data.setAttr('status', parseInt(e.target.value));
                    }
                  }} />
                </EditItem>
                <EditItem>
                  <Input addonBefore="name" value={data.name} onChange={e => {
                    data.setAttr('name', e.target.value);
                  }} />
                </EditItem>
                <EditItem>
                  <Input addonBefore="icon" value={data.icon} onChange={e => {
                    data.setAttr('icon', e.target.value);
                  }} />
                </EditItem>
                <EditItem>
                  属性
                  <Input.TextArea style={{ minHeight: 150 }} defaultValue={JSON.stringify(data.attrs, null, 2)} onBlur={e => {
                    try {
                      const attrs = JSON.parse(e.target.value)
                      data?.setAttr('attrs', attrs);
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
                  <Space direction='vertical'>
                    <span className="ant-input-group-wrapper">
                      <span className="ant-input-wrapper ant-input-group">
                        <span className="ant-input-group-addon">参数位置</span>
                        <div className="ant-input-group-addon" style={{ width: '100%', padding: '2px 5px', backgroundColor: '#d9d9d9' }}>
                          <Radio.Group options={[{ label: 'body', value: 'body' }, { label: 'query', value: 'query' }]} value={data.widget.in} onChange={(e) => {
                            console.log(e.target.value)
                            data.setWidget('in', e.target.value)
                          }} />
                        </div>
                      </span>
                    </span>
                    <Input addonBefore="参数字段" value={data.widget.field} onChange={e => {
                      data.setWidget('field', e.target.value);
                    }} />
                    <span className="ant-input-group-wrapper">
                      <span className="ant-input-wrapper ant-input-group">
                        <span className="ant-input-group-addon">参数类型</span>
                        <Select style={{ width: '100%' }} value={data.widget.type} onChange={v => {
                          if (data) {
                            data.changeWidgetType(v);
                          }
                        }}>
                          <Select.Option value="string">文本</Select.Option>
                          <Select.Option value="number">数字</Select.Option>
                          <Select.Option value="boolean">布尔</Select.Option>
                          <Select.Option value="json">数组或对象</Select.Option>
                        </Select>
                      </span>
                    </span>
                  </Space>
                  默认值
                  <Input.TextArea value={data.widget.value.toString()} onChange={e => {
                    data.setWidget('value', e.target.value);
                  }} />
                  参考值
                  <SortList
                    key={data.widget.refer.length}
                    sort={(srcIndex: number, dstIndex: number) => {
                      const arr = cloneDeep(data.widget.refer);
                      const curr = arr.splice(srcIndex, 1);
                      arr.splice(dstIndex, 0, ...(curr || []));
                      data.setWidget('refer', arr)
                    }}
                    droppableId={data._id + '2'}
                    mode={'edit'}
                    direction={'vertical'}
                    listStyle={{}}
                    itemStyle={{ display: 'flex', alignItems: 'center', marginBottom: 5 }}
                    items={data.widget.refer}
                    renderItem={({ item, index, handler }: { item: { label: string, value: number | string }, index: number, handler: any }) => (
                      <Input
                        key={index}
                        addonBefore={<FullWidth>
                          <Acon icon='DragOutlined' style={{ marginRight: 5 }}  {...handler} />
                          {item.label}
                        </FullWidth>}
                        value={item.value}
                        addonAfter={<Acon icon='close' onClick={() => { data.remRefer(index); }} />}
                      />
                    )}
                  />
                  <AlignAround>
                    {local.addWidgetReferVisible
                      ? <Fragment>
                        <Input addonBefore='名称' />
                        <Input addonBefore='值' />
                        <Acon icon='check' onClick={e => {
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
                      : <Acon icon='add' onClick={() => local.setVisible(true)} />}
                  </AlignAround>
                </EditItem>
              </ScrollWrap>
            )
          },
          {
            label: '数据', key: 'data', children: (
              <ScrollWrap>
                <EditItem>
                  <Input addonBefore="接口" value={data.api} onChange={e => {
                    data?.setAttr('api', e.target.value);
                  }} />
                </EditItem>
                <EditItem>
                  条件 <Acon icon='PlusCircleOutlined' onClick={() => {
                    local.setShowQueryModal(true)
                  }} />
                  {data.queries.map(id => (
                    <Input key={id} readOnly value={id} addonAfter={
                      <Space>
                        <Acon icon="SafetyOutlined" />
                        <Acon icon="delete" />
                      </Space>
                    } />
                  ))}
                  <QueryModal
                    show={local.showQueryModal}
                    queries={data.queries}
                    setQueries={(queries: string[]) => data.setAttr('queries', queries)}
                    q={local.q}
                    close={() => local.setShowQueryModal(false)} />
                </EditItem>
                <EditItem>
                  静态数据
                  <SortList
                    key={data.resources?.length}
                    sort={(oldIndex: number, newIndex: number) => {
                      data && data.swapResource(oldIndex, newIndex);
                    }}
                    droppableId={data._id}
                    items={(data.resources as any)}
                    itemStyle={{ display: 'flex', alignItems: 'center' }}
                    mode={'edit'}
                    direction={'vertical'}
                    renderItem={({ item: resource, handler: handler2 }: { item: IResource, handler: any }) => <Fragment key={resource._id}>
                      <div style={{ display: 'flex', alignItems: 'center', marginTop: 5 }}>
                        <Acon icon='DragOutlined' {...handler2} style={{ marginRight: 5 }} />
                        <Input
                          value={resource.title}
                          addonBefore={<CopyToClipboard text={resource._id as string}><Acon icon='CopyOutlined' title={resource._id} onClick={() => { }} /></CopyToClipboard>}
                          addonAfter={<Acon icon='CloseOutlined' onClick={() => { data?.remResource(resource._id) }}
                          />} />
                      </div>
                    </Fragment>}
                  />
                  <Button icon={<Acon icon="add" />}>添加资源</Button>
                </EditItem>
              </ScrollWrap>
            )
          },
          {
            label: '事件', key: 'event', children: (
              <ScrollWrap>
                <EditItem>
                  <Input addonBefore="跳转url" value={data.widget.url} onChange={e => {
                    data?.setWidget('url', e.target.value);
                  }} />
                </EditItem>
                <EditItem>
                  <span className="ant-input-group-wrapper">
                    <span className="ant-input-wrapper ant-input-group">
                      <span className="ant-input-group-addon">事件类型</span>
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
                        <Select.Option value={CONST.ACTION_TYPE.PREVIEW_IMAGE}>图片预览</Select.Option>
                      </Select>
                    </span>
                  </span>
                </EditItem>
              </ScrollWrap>
            )
          },
          {
            label: '布局', key: 'layout', children: (
              <ScrollWrap>
                <EditItem>
                  布局方向<Divider type='vertical' />
                  <Radio.Group value={data.attrs.layout} options={[
                    { label: '水平', value: 'horizontal' },
                    { label: '垂直', value: 'vertical' },
                  ]} onChange={e => {
                    data?.setAttrs('layout', e.target.value)
                  }} />
                </EditItem>
                <EditItem>
                  样式
                  <Input.TextArea style={{ minHeight: 150 }} defaultValue={JSON.stringify(data.style, null, 2)} onBlur={e => {
                    try {
                      const style = JSON.parse(e.target.value)
                      data?.updateStyle(style);
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