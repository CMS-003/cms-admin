import { Observer, observer, useLocalObservable } from "mobx-react"
import { makeAutoObservable, toJS } from "mobx"
import { Fragment } from 'react';
import { Input, Button, Divider, Select, Tabs, Radio, message, Space } from 'antd'
import { CopyToClipboard } from 'react-copy-to-clipboard';
import { cloneDeep } from 'lodash'
import { Acon, SortList, Style } from '@/components/index';
import { IComponent, IResource, } from '@/types'
import styled from 'styled-components';
import {
  EditItem,
} from './style'
import CONST from "@/constant";
const { AlignAround, AlignAside } = Style;

const ScrollWrap = styled.div`
  flex: 1;
  height: 100%;
  overflow-y: auto;
  &::-webkit-scrollbar {
    display: none;
  }
`

class local {
  addWidgetReferVisible = false

  constructor() {
    makeAutoObservable(this)
  }

  setVisible(v: boolean) {
    this.addWidgetReferVisible = v
  }
}

const Edit = observer(({ data, setData, tabkey, setTabkey }: { data: IComponent, setData: Function, tabkey: string, setTabkey: Function }) => {
  const local = useLocalObservable(() => ({
    addWidgetReferVisible: false,
    setVisible(b: boolean) {
      local.addWidgetReferVisible = b;
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
                  <Input addonBefore="name" value={data.name} />
                </EditItem>
                <EditItem>
                  <Input addonBefore="icon" value={data.icon} onChange={e => {
                    data?.setAttr('icon', e.target.value);
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
            label: '数据', key: 'data', children: (
              <ScrollWrap>
                <EditItem>
                  <Input addonBefore="接口" value={data.api} onChange={e => {
                    data?.setAttr('api', e.target.value);
                  }} />
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
                <EditItem>
                  控件属性
                  <Input addonBefore="字段" value={data.widget.field} onChange={e => {
                    data?.setWidget('field', e.target.value);
                  }} />
                  <Divider type="horizontal" style={{ margin: 5 }} />
                  <span className="ant-input-group-wrapper">
                    <span className="ant-input-wrapper ant-input-group">
                      <span className="ant-input-group-addon">类型</span>
                      <Select style={{ width: '100%' }} value={data.widget.type} onChange={v => {
                        if (data) {
                          data.changeWidgetType(v);
                        }
                      }}>
                        <Select.Option value="string">文本</Select.Option>
                        <Select.Option value="number">数字</Select.Option>
                        <Select.Option value="boolean">布尔</Select.Option>
                        <Select.Option value="date">日期</Select.Option>
                      </Select>
                    </span>
                  </span>
                  <Divider type="horizontal" style={{ margin: 5 }} />
                  默认值
                  <Input.TextArea value={data.widget.value.toString()} onChange={e => {
                    data?.setWidget('value', e.target.value);
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
                        addonBefore={<div  {...handler}>
                          <Acon icon='DragOutlined' style={{ marginRight: 5 }} />
                          {item.label}
                        </div>}
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
            label: '事件', key: 'event', children: (
              <ScrollWrap>
                <EditItem>
                  <Input addonBefore="跳转url" value={data.widget.action_url} onChange={e => {
                    data?.setWidget('action_url', e.target.value);
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
                        <Select.Option value={CONST.ACTION_TYPE.MODAL}>对话框</Select.Option>
                        <Select.Option value={CONST.ACTION_TYPE.COPY}>复制</Select.Option>
                        <Select.Option value={CONST.ACTION_TYPE.FILTER}>过滤</Select.Option>
                        <Select.Option value={CONST.ACTION_TYPE.SEARCH}>搜索</Select.Option>
                        <Select.Option value={CONST.ACTION_TYPE.GET}>获取数据</Select.Option>
                        <Select.Option value={CONST.ACTION_TYPE.POST}>发送POST</Select.Option>
                        <Select.Option value={CONST.ACTION_TYPE.UPDATE}>修改数据</Select.Option>
                        <Select.Option value={CONST.ACTION_TYPE.DELETE}>删除数据</Select.Option>
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