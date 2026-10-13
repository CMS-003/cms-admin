// src/EditorPanel.tsx
import { FlatNode, IResource } from '@/types';
import { useLocalProxy } from '@/utils/valtio';
import { Button, Divider, Input, Radio, Select, Space, Switch, Tabs } from 'antd';
import styled from 'styled-components'
import JSON5 from 'json5';
import { Acon } from '@/components';
import { SortDD } from '@/components/SortableDD';
import { FullWidth, AlignAround } from '@/components/style';
import store from '@/store';
import { cloneDeep, isPlainObject, pick } from 'lodash-es';
import { observer } from 'mobx-react';
import { getSnapshot, isStateTreeNode } from 'mobx-state-tree';
import { TreeNode } from '@/store/tree';
import { Fragment, useEffect } from 'react';
import ResourceModal from '@/components/ResourceModal';
import CONST from '@/constant';
import QueryModal from './QueryModal';
import { CopyToClipboard } from 'react-copy-to-clipboard-ts';
import { foldMappingRows, toMappingRows, type MappingRow } from '@/utils/mapping';

type Props = {
  node: TreeNode;
  /**
   * 唯一的写入口。field 是字段路径，支持 'title' / 'widget.field' / 'attrs.x'
   * 这种写法（TView 那边走 lodash set 落到节点上，同时标脏）。
   */
  onChange: (field: string, value?: any) => void;
  tabKey: string;
  onClose: () => void;
};

const Panel = styled.div`
  width: 350px;
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

/** 交换数组里两个下标（返回新数组）。越界 / 相同则原样返回 */
function swapArray<T>(list: T[], a: number, b: number): T[] {
  if (a === b || a < 0 || b < 0 || a >= list.length || b >= list.length) return list;
  const next = list.slice();
  const tmp = next[a];
  next[a] = next[b];
  next[b] = tmp;
  return next;
}

/** 响应映射的草稿行 ↔ 存储对象：语义都在 `@/utils/mapping`，这里只负责接进面板 */

/**
 * 会消费 `attrs.more` / `attrs.refresh` 的节点类型。
 * 只有列表类节点才有「更多 / 刷新」这两个开关，别的节点不给它们露脸。
 */
const LIST_TYPES = ['Card', 'Banner'];

/**
 * 面板是 observer：node 是 MST 节点实例，读到的字段变化会自动重渲染，
 * 受控输入才能跟着数据走（「加参考值 / 删资源 / 拖排序」都改 store）。
 */
export const EditorPanel = observer(function EditorPanel({ node, onChange, tabKey, onClose }: Props) {
  const refer = node.widget?.refer || [];
  const resources = node.resources || [];
  const queries = node.queries || [];

  const [localState, localStore] = useLocalProxy({
    addWidgetReferVisible: false,
    q: '',
    tabKey,
    showQueryModal: false,
    showResourceModal: false,
    // 响应映射的草稿行（面板按节点 _id 重挂载，所以初始化时取一次就够了）
    mappingRows: toMappingRows(node.widget?.mapping),
  });

  // 从右键菜单切换 tab（菜单里点「数据」→ 面板直接跳到数据页）
  useEffect(() => {
    if (tabKey && tabKey !== localStore.tabKey) {
      localStore.tabKey = tabKey;
    }
  }, [tabKey]);

  // ---------- 响应映射（仅 FETCH）----------
  // 三处改动都要把「折回的对象」整体写回：mapping 是 frozen，逐 key 写不会被追踪
  const writeMappingRows = (rows: MappingRow[]) => {
    localStore.mappingRows = rows;
    onChange('widget.mapping', foldMappingRows(rows));
  };
  const updateMappingRow = (index: number, patch: Partial<MappingRow>) => {
    const rows = localState.mappingRows.map((row, i) => (i === index ? { ...row, ...patch } : { ...row }));
    writeMappingRows(rows);
  };
  const removeMappingRow = (index: number) => {
    writeMappingRows(localState.mappingRows.filter((_, i) => i !== index).map(r => ({ ...r })));
  };
  // 新增只是加一行空行，空字段名折不出来东西，所以不写 store（也不该此时就标脏）
  const addMappingRow = () => {
    localStore.mappingRows = [...localState.mappingRows.map(r => ({ ...r })), { key: '', value: '' }];
  };

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
                  <Input prefix={<span>描述<Divider orientation="vertical" /></span>} value={node.desc} onChange={e => {
                    onChange('desc', e.target.value);
                  }} />
                </EditItem>
                <EditItem>
                  <Input prefix={<span>标题<Divider orientation="vertical" /></span>} value={node.title} onChange={e => {
                    onChange('title', e.target.value);
                  }} />
                </EditItem>
                <EditItem>
                  <Input prefix={<span>项目id<Divider orientation="vertical" /></span>} value={node.project_id} readOnly />
                </EditItem>
                <EditItem>
                  <Input prefix={<span>上级id<Divider orientation="vertical" /></span>} value={node.parent_id} readOnly />
                </EditItem>
                <EditItem>
                  {/* 所属子树（后端按它分页 / 缓存 / 失效）。一级子节点这里是它自己 */}
                  <Input prefix={<span>树id<Divider orientation="vertical" /></span>} value={node.tree_id} readOnly />
                </EditItem>
                <EditItem>
                  <Input prefix={<span>_id<Divider orientation="vertical" /></span>} readOnly value={node._id} />
                </EditItem>
                <EditItem>
                  <Input prefix={<span>类型<Divider orientation="vertical" /></span>} readOnly value={node.type} />
                </EditItem>
                <EditItem>
                  <Input prefix={<span>状态<Divider orientation="vertical" /></span>} type="number" value={node.status} onChange={e => {
                    onChange('status', Number(e.target.value))
                  }} />
                </EditItem>
                <EditItem>
                  <Input prefix={<span>name<Divider orientation="vertical" /></span>} value={node.name} onChange={e => {
                    onChange('name', e.target.value)
                  }} />
                </EditItem>
                <EditItem>
                  <Input prefix={<span>图标<Divider orientation="vertical" /></span>} value={node.icon} onBlur={e => {
                    onChange('icon', e.target.value)
                  }} />
                </EditItem>
                <EditItem>
                  属性
                  <Input.TextArea style={{ minHeight: 150 }} defaultValue={JSON.stringify(node.attrs, null, 2)} onBlur={e => {
                    try {
                      const attrs = JSON5.parse(e.target.value)
                      onChange('attrs', attrs)
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
                      <Switch checkedChildren='是' unCheckedChildren='否' checked={!!node.widget?.query} onChange={checked => {
                        onChange('widget.query', checked)
                      }} />
                    </Space.Addon>
                  </Space.Compact>
                </EditItem>
                <EditItem>
                  {/* 数据来源：列表类节点（Card / Banner）据此决定去哪拿数据 */}
                  <Space.Compact block>
                    <Space.Addon style={{ flexShrink: 0 }}>数据来源</Space.Addon>
                    <Select style={{ width: '100%' }} value={node.widget?.from || 'data'} onChange={(v) => {
                      onChange('widget.from', v)
                    }}>
                      <Select.Option value="data">节点数据</Select.Option>
                      <Select.Option value="global">全局配置</Select.Option>
                      <Select.Option value="api">接口请求</Select.Option>
                    </Select>
                  </Space.Compact>
                </EditItem>
                <EditItem>
                  <Space.Compact block>
                    <Space.Addon style={{ flexShrink: 0 }}>字段</Space.Addon>
                    <Input value={node.widget?.field} onBlur={e => {
                      onChange('widget.field', e.target.value);
                    }} />
                    <Space.Addon>
                      <Select value={node.widget?.type} onChange={(vv) => {
                        onChange('widget.type', vv)
                      }}>
                        <Select.Option value="json" >json</Select.Option>
                        <Select.Option value="string" >string</Select.Option>
                        <Select.Option value="number" >number</Select.Option>
                        <Select.Option value="boolean" >boolean</Select.Option>
                      </Select>
                    </Space.Addon>
                  </Space.Compact>
                  <Space.Compact block>
                    <Space.Addon style={{ flexShrink: 0 }}>全局路径</Space.Addon>
                    <Input placeholder="全局配置里的路径" value={node.widget?.source} onBlur={e => {
                      onChange('widget.source', e.target.value);
                    }} />
                  </Space.Compact>
                  <Space.Compact block orientation="vertical">
                    默认值
                    <Input.TextArea value={String(node.widget?.value ?? '')} onBlur={e => {
                      onChange('widget.value', e.target.value);
                    }} />
                  </Space.Compact>
                  参考值
                  <SortDD
                    direction='vertical'
                    handle={true}
                    items={[...refer, ...(store.global.getValue(node.widget?.source) || []).map((v: any) => ({ ...v, disabled: true }))].map((v: any) => {
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
                    sort={(oldIndex: number, newIndex: number) => {
                      // items 里尾随的是「来源」里带出来的只读项，拖到它们身上直接忽略
                      if (oldIndex >= refer.length || newIndex >= refer.length) return;
                      onChange('widget.refer', swapArray([...refer], oldIndex, newIndex));
                    }}
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
                              onChange('widget.refer', [...refer, { label: oinputs[0].value, value: oinputs[1].value }]);
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

                  {queries.map((id: string) => (
                    <Input key={id} readOnly value={id} suffix={<Acon icon="X" onClick={() => {
                      onChange('queries', queries.filter((q: string) => q !== id))
                    }} />} />
                  ))}
                  {localState.showQueryModal && <QueryModal
                    show={localState.showQueryModal}
                    queries={queries}
                    setQueries={(next: any) => {
                      onChange('queries', next)
                    }}
                    q={localState.q}
                    close={() => localStore.showQueryModal = false}
                  />}
                </EditItem>
                <EditItem>
                  静态数据
                  <SortDD
                    direction='vertical'
                    items={resources.map((v: any) => ({ id: v._id, data: isStateTreeNode(v) ? getSnapshot(v) : v }))}
                    renderItem={(item: any, handler: any) => {
                      return <div style={{ display: 'flex', alignItems: 'center', marginTop: 5 }}>
                        <Acon icon='Move' style={{ marginRight: 5 }} {...handler} />
                        <Input
                          value={item.data.title}
                          prefix={<CopyToClipboard text={item.data._id as string}><Acon icon='Copy' onClick={() => { }} /></CopyToClipboard>}
                          suffix={<Acon icon='CircleX' onClick={() => {
                            onChange('resources', resources.filter((r: any) => r._id !== item.data._id))
                          }} />} />
                      </div>
                    }}
                    sort={(oldIndex: number, newIndex: number) => {
                      onChange('resources', swapArray([...resources], oldIndex, newIndex));
                    }}
                  />
                  {localState.showResourceModal && <ResourceModal
                    show={localState.showResourceModal}
                    onAdd={(d: IResource) => {
                      onChange('resources', [...resources, pick(d, ['_id', 'title', 'cover', 'thumbnail', 'status'])])
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
                {/* 列表类节点（Card / Banner）的两个开关 */}
                {LIST_TYPES.indexOf(node.type) !== -1 && <EditItem>
                  <Space.Compact block>
                    <Space.Addon style={{ flexShrink: 0 }}>更多页面</Space.Addon>
                    <Input placeholder="要跳去的页面视图，留空则不显示" value={node.attrs?.more || ''} onBlur={e => {
                      onChange('attrs.more', e.target.value)
                    }} />
                  </Space.Compact>
                  <Space.Compact block>
                    <Space.Addon style={{ flexShrink: 0 }}>显示刷新</Space.Addon>
                    <Space.Addon style={{ flex: 1 }}>
                      <Switch checkedChildren='是' unCheckedChildren='否' checked={!!node.attrs?.refresh} onChange={checked => {
                        onChange('attrs.refresh', checked)
                      }} />
                    </Space.Addon>
                  </Space.Compact>
                </EditItem>}
              </ScrollWrap>
            )
          },
          {
            label: '事件', key: 'event', children: (
              <ScrollWrap>
                <EditItem>
                  {
                    (node.widget?.action === CONST.ACTION_TYPE.GOTO_PAGE || node.widget?.action === CONST.ACTION_TYPE.OPEN_URL)
                    && <Input prefix="跳转url" value={node.url} onChange={e => {
                      onChange('url', e.target.value);
                    }} />
                  }
                  {
                    node.widget?.action === CONST.ACTION_TYPE.MODAL && <Input prefix='模板id' value={node.widget?.method} onChange={e => {
                      onChange('widget.method', e.target.value);
                    }} />
                  }
                  {
                    node.widget?.action === CONST.ACTION_TYPE.PREVIEW && <Select value={node.widget?.method} onChange={v => {
                      onChange('widget.method', v);
                    }}>
                      <Select.Option value='image'>图片</Select.Option>
                      <Select.Option value='video'>视频</Select.Option>
                    </Select>
                  }
                  {[CONST.ACTION_TYPE.FETCH, CONST.ACTION_TYPE.UPLOAD].includes(node.widget?.action) && <Space.Compact block>
                    <Select value={node.widget?.method} onChange={v => {
                      onChange('widget.method', v);
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
                      onChange={e => {
                        onChange('url', e.target.value);
                      }} />
                  </Space.Compact>}
                </EditItem>
                {/* 响应映射：外部接口的包装格式和本项目不一样时，用它把响应 body 翻译过来 */}
                {node.widget?.action === CONST.ACTION_TYPE.FETCH && <EditItem>
                  <Space.Compact block style={{ alignItems: 'center' }}>
                    <div>响应映射</div>
                    <Divider orientation="vertical" />
                    <Acon icon='CirclePlus' onClick={addMappingRow} />
                  </Space.Compact>
                  <div style={{ fontSize: 12, color: '#a08a4b', lineHeight: 1.6 }}>
                    字段 → 规则。<b>$</b> 开头是取值路径（<code>$data.list</code>），其他值原样填充。
                  </div>
                  {localState.mappingRows.map((row, i) => (
                    <Space.Compact key={i} block style={{ marginBottom: 5 }}>
                      <Input
                        placeholder="字段"
                        value={row.key}
                        onBlur={e => updateMappingRow(i, { key: e.target.value })}
                      />
                      <Input
                        placeholder="$data.list"
                        value={row.value}
                        onBlur={e => updateMappingRow(i, { value: e.target.value })}
                      />
                      <Space.Addon style={{ padding: '0 8px' }}>
                        <Acon icon='CircleX' onClick={() => removeMappingRow(i)} />
                      </Space.Addon>
                    </Space.Compact>
                  ))}
                </EditItem>}
                <EditItem>
                  <Space.Compact block>
                    <Space.Addon style={{ flexShrink: 0 }}>
                      事件类型
                    </Space.Addon>
                    <Select style={{ width: '100%' }} value={node.widget?.action} onChange={v => {
                      onChange('widget.action', v);
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
                  <Radio.Group value={node.attrs?.layout} options={[
                    { label: '水平', value: 'horizontal' },
                    { label: '垂直', value: 'vertical' },
                  ]} onChange={e => {
                    const attrs = cloneDeep(node.attrs || {});
                    attrs.layout = e.target.value
                    onChange('attrs', attrs)
                  }} />
                </EditItem>
                <EditItem>
                  样式
                  <Input.TextArea style={{ minHeight: 150 }} defaultValue={JSON.stringify(node.style, null, 2)} onBlur={e => {
                    try {
                      const style = JSON5.parse(e.target.value)
                      onChange('style', style);
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
});
