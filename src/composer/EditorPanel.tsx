// src/EditorPanel.tsx
import { FlatNode, IComponent, IResource } from '@/types';
import { useLocalProxy } from '@/utils/valtio';
import { Button, Divider, Input, Radio, Select, Space, Switch, Tabs } from 'antd';
import styled from 'styled-components'
import JSON5 from 'json5';
import { Acon } from '@/components';
import { SortDD } from '@/components/SortableDD';
import { FullWidth, AlignAround } from '@/components/style';
import store from '@/store';
import { cloneDeep, isPlainObject, pick } from 'lodash-es';
import { getSnapshot } from 'mobx-state-tree';
import { Fragment } from 'react/jsx-runtime';
import ResourceModal from '@/components/ResourceModal';
import CONST from '@/constant';
import QueryModal from '@/groups/queriesModal';
import { CopyToClipboard } from 'react-copy-to-clipboard-ts';

type Props = {
  node: FlatNode;
  setNode: Function;
  tabKey: string;
  onChange: (patch: Partial<Omit<IComponent, '_id'>>) => void;
  onClose: () => void;
};

const Panel = styled.div`
  flex-shrink: 0;
  background: #fbe9b2;
  border-left: 1px solid #e2e8f0;
  display: flex;
  flex-direction: column;
  overflow-y: hidden;
}
`
const ScrollWrap = styled.div`
  flex: 1;
  height: 100%;
  overflow-y: auto;
  &::-webkit-scrollbar {
    display: none;
  }
`
export const EditItem = styled.div`
  margin-bottom: 8px;
  padding: 0 8px;
  display: flex;
  flex-direction: column;
  gap: 5px;
`

export function EditorPanel({ node, setNode, tabKey, onClose }: Props) {
  const [localState, localStore] = useLocalProxy({
    addWidgetReferVisible: false,
    q: '',
    tabKey,
    showQueryModal: false,
    showResourceModal: false,
  });
  return (
    <Panel>
      <Tabs
        style={{ flex: 1, display: 'flex', height: '100%', overflow: 'hidden' }}
        activeKey={localState.tabKey}
        onChange={v => {
          if (v === 'close') {
            return onClose()
          }
          localStore.tabKey = v
        }}

        items={[
          {
            label: '基础', key: 'base', children: (
              <ScrollWrap>
                <EditItem>
                  <Input prefix={<span>标题<Divider orientation="vertical" /></span>} defaultValue={node.title} onChange={e => {
                    setNode('title', e.target.value);
                  }} />
                </EditItem>
                <EditItem>
                  <Input prefix={<span>描述<Divider orientation="vertical" /></span>} value={node.desc} />
                </EditItem>
                <EditItem>
                  <Input prefix={<span>项目id<Divider orientation="vertical" /></span>} value={node.project_id} onChange={e => {
                    setNode('project_id', e.target.value);
                  }} />
                </EditItem>
                <EditItem>
                  <Input prefix={<span>上级id<Divider orientation="vertical" /></span>} value={node.parent_id} onChange={e => {
                    setNode('parent_id', e.target.value)
                  }} />
                </EditItem>
                <EditItem>
                  <Input prefix={<span>_id<Divider orientation="vertical" /></span>} readOnly value={node._id} />
                </EditItem>
                <EditItem>
                  <Input prefix={<span>状态<Divider orientation="vertical" /></span>} type="number" value={node.status} onChange={e => {
                    setNode('status', e.target.value)
                  }} />
                </EditItem>
                <EditItem>
                  <Input prefix={<span>name<Divider orientation="vertical" /></span>} value={node.name} onChange={e => {
                    setNode('name', e.target.value)
                  }} />
                </EditItem>
                <EditItem>
                  <Input prefix={<span>图标<Divider orientation="vertical" /></span>} value={node.icon} onChange={e => {
                    setNode('icon', e.target.value)
                  }} />
                </EditItem>
                <EditItem>
                  属性
                  <Input.TextArea style={{ minHeight: 150 }} defaultValue={JSON.stringify(node.attrs, null, 2)} onBlur={e => {
                    try {
                      const attrs = JSON5.parse(e.target.value)
                      setNode('attrs', attrs)
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
                      <Switch checkedChildren='是' unCheckedChildren='否' checked={node.widget.query} onChange={checked => {
                        setNode('widget.query', checked)
                      }} />
                    </Space.Addon>
                  </Space.Compact>
                </EditItem>
                <EditItem>
                  <Space.Compact block>
                    <Space.Addon style={{ flexShrink: 0 }}>字段</Space.Addon>
                    <Input value={node.widget.field} onChange={e => {
                      setNode('widget.field', e.target.value);
                    }} />
                    <Space.Addon>
                      <Select value={node.widget.type} onChange={(vv) => {
                        setNode('widget.type', vv)
                      }}>
                        <Select.Option value="json" >json</Select.Option>
                        <Select.Option value="string" >string</Select.Option>
                        <Select.Option value="number" >number</Select.Option>
                        <Select.Option value="boolean" >boolean</Select.Option>
                      </Select>
                    </Space.Addon>
                  </Space.Compact>
                  <Space.Compact block>
                    <Space.Addon style={{ flexShrink: 0 }}>来源</Space.Addon>
                    <Input placeholder="默认" defaultValue={node.widget.source} onBlur={e => {
                      setNode('widget.source', e.target.value);
                    }} />
                  </Space.Compact>
                  <Space.Compact block orientation="vertical">
                    默认值
                    <Input.TextArea value={node.widget.value.toString()} onChange={e => {
                      setNode('widget.value', e.target.value);
                    }} />
                  </Space.Compact>
                  参考值
                  <SortDD
                    direction='vertical'
                    handle={true}
                    items={[...node.widget.refer, ...(store.global.getValue(node.widget.source) || []).map((v: any) => ({ ...v, disabled: true }))].map((v: any) => {
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
                    sort={node.swapRefer}
                  />
                  <AlignAround>
                    {localState.addWidgetReferVisible
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
                          if (op && node) {
                            const oinputs = op.getElementsByTagName('input');
                            if (oinputs?.length === 2 && oinputs[0].value) {
                              node.pushRefer({ label: oinputs[0].value, value: oinputs[1].value });
                            }
                            localStore.addWidgetReferVisible = false
                          }
                        }} />
                      </Fragment>
                      : <Acon icon='CirclePlus' onClick={() => localStore.addWidgetReferVisible = true} />}
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
                      localStore.showQueryModal = true
                    }} />
                  </Space.Compact>

                  {node.queries.map(id => (
                    <Input key={id} readOnly value={id} suffix={<Acon icon="X" onClick={() => {
                      setNode('queries', node.queries.filter(q => q !== id))
                    }} />} />
                  ))}
                  {localState.showQueryModal && <QueryModal
                    show={localState.showQueryModal}
                    queries={node.queries}
                    setQueries={(queries: any) => {
                      setNode('queries', queries)
                    }}
                    q={localState.q}
                    close={() => localStore.showQueryModal = false}
                  />}
                </EditItem>
                <EditItem>
                  静态数据
                  <SortDD
                    direction='vertical'
                    items={((node.resources || []).map(v => ({ id: v._id, data: v })))}
                    renderItem={(item: any, handler: any) => {
                      return <div style={{ display: 'flex', alignItems: 'center', marginTop: 5 }}>
                        <Acon icon='Move' style={{ marginRight: 5 }} {...handler} />
                        <Input
                          value={item.data.title}
                          prefix={<CopyToClipboard text={item.data._id as string}><Acon icon='Copy' onClick={() => { }} /></CopyToClipboard>}
                          suffix={<Acon icon='CircleX' onClick={() => { node.remResource(node._id) }}
                          />} />
                      </div>
                    }}
                    sort={node.swapResource}
                  />
                  {localState.showResourceModal && <ResourceModal
                    show={localState.showResourceModal}
                    onAdd={(d: IResource) => {
                      node.addResource(pick(d, ['_id', 'title', 'cover', 'thumbnail', 'status']) as IResource)
                    }}
                    onClose={() => {
                      localStore.showResourceModal = false
                    }}
                  />}
                  <AlignAround style={{ marginTop: 10 }}>
                    <Button icon={<Acon icon="Plus" />} onClick={() => {
                      localStore.showResourceModal = true
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
                    (node.widget.action === CONST.ACTION_TYPE.GOTO_PAGE || node.widget.action === CONST.ACTION_TYPE.OPEN_URL)
                    && <Input prefix="跳转url" value={node.url} onChange={e => {
                      setNode('widget.url', e.target.value);
                    }} />
                  }
                  {
                    node.widget.action === CONST.ACTION_TYPE.MODAL && <Input prefix='模板id' value={node.widget.method} onChange={e => {
                      setNode('widget.method', e.target.value);
                    }} />
                  }
                  {
                    node.widget.action === CONST.ACTION_TYPE.PREVIEW && <Select defaultValue={node.widget.method} onChange={v => {
                      setNode('widget.method', v);
                    }}>
                      <Select.Option value='image'>图片</Select.Option>
                      <Select.Option value='video'>视频</Select.Option>
                    </Select>
                  }
                  {[CONST.ACTION_TYPE.FETCH, CONST.ACTION_TYPE.UPLOAD].includes(node.widget.action) && <Space.Compact block>
                    <Select value={node.widget.method} onChange={v => {
                      setNode('widget.method', v);
                    }}>
                      <Select.Option value="AUTO">AUTO</Select.Option>
                      <Select.Option value="GET">GET</Select.Option>
                      <Select.Option value="PUT">PUT</Select.Option>
                      <Select.Option value="POST">POST</Select.Option>
                      <Select.Option value="DELETE">DELETE</Select.Option>
                      <Select.Option value="PATCH">PATCH</Select.Option>
                    </Select>
                    <Input
                      value={node.url}
                      readOnly={![CONST.ACTION_TYPE.FETCH, CONST.ACTION_TYPE.UPLOAD].includes(node.widget.action)}
                      onChange={e => {
                        setNode('url', e.target.value);
                      }} />
                  </Space.Compact>}
                </EditItem>
                <EditItem>
                  <Space.Compact block>
                    <Space.Addon style={{ flexShrink: 0 }}>
                      事件类型
                    </Space.Addon>
                    <Select style={{ width: '100%' }} value={node.widget.action} onChange={v => {
                      setNode('widget.action', v);
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
                  <Radio.Group value={node.attrs.layout} options={[
                    { label: '水平', value: 'horizontal' },
                    { label: '垂直', value: 'vertical' },
                  ]} onChange={e => {
                    const attrs = cloneDeep(node.attrs);
                    attrs.layout = e.target.value
                    setNode('attrs', attrs)
                  }} />
                </EditItem>
                <EditItem>
                  样式
                  <Input.TextArea style={{ minHeight: 150 }} defaultValue={JSON.stringify(node.style, null, 2)} onBlur={e => {
                    try {
                      const style = JSON5.parse(e.target.value)
                      setNode('style', style);
                    } catch (e) {

                    } finally {

                    }
                  }} />
                </EditItem>
              </ScrollWrap>
            )
          },
          {
            label: <Acon icon='X' />, key: 'close', children: null
          }
        ]}
      >

      </Tabs>
    </Panel>
  );
}