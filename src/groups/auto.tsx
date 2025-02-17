import { Fragment, useCallback, useEffect, useRef } from 'react';
import { useEffectOnce } from 'react-use';
import { toJS } from 'mobx';
import { Observer, useLocalStore } from 'mobx-react'
import { Input, message, Button, Divider, Space, Select } from 'antd'
import { CopyToClipboard } from 'react-copy-to-clipboard';
import "react-contexify/dist/ReactContexify.css";
import { Menu as ContextMenu, Item as ContextMenuItem, contextMenu } from 'react-contexify';
import _ from 'lodash'
import apis from '@/api'
import store from '@/store'
import events from '@/utils/event';
import styled from 'styled-components';
import { ComponentItem } from '@/store/component';
import icon_drag from '@/asserts/images/drag.svg'
import { Acon, SortList, Style } from '@/components/index';
import { IPageInfo, ITemplate, IComponent, IResource, IAuto, IBaseComponent } from '@/types'
import BaseComponent from './index';
import {
  EditWrap,
  TemplateBox,
  EditItem,
  Handler,
  LineL,
  LineT,
  LineR,
  LineB,
  ConerLB,
  ConerRB,
  ConerLT,
  ConerRT,
} from './style'

const { AlignAround, AlignAside, IconSVG } = Style;

function getDiff(t: ITemplate | IComponent | null) {
  if (!t) {
    return [];
  }
  const results: IComponent[] = [];
  if (t.children) {
    t.children.forEach((child) => {
      const diff = child.diff()
      if (diff) {
        results.push((child as IComponent).toJSON())
      }
      const subResults = getDiff(child);
      if (subResults.length) {
        results.push(...subResults)
      }
    })
  }
  return results;
}
function findNode(arr: IComponent[], id: string): IComponent | null {
  let result: IComponent | null = null;
  for (let i = 0; i < arr.length; i++) {
    const v = arr[i];
    if (v._id === id) {
      return v;
    }
    result = findNode(v.children, id);
    if (result) {
      return result;
    }
  }
  return null;
}
function collectIds(tree: IComponent, arr: string[]) {
  arr.push(tree._id);
  tree.children.forEach(t => collectIds(t, arr));
}

export function Component({ self, children, mode, handler = {}, isDragging, index, setParentHovered, source, setSource, page, ...props }: IAuto) {
  // 拖拽事件
  const dragStore = useLocalStore(() => ({
    isDragOver: false,
    isMouseOver: false,
    onDrop: (e: any) => {
      e.preventDefault();
      e.stopPropagation();
      if (mode === 'preview' || store.app.dragingType === '') return;
      dragStore.isDragOver = false;
      if (self.status !== 0 && store.component.canDrop(store.app.dragingType, self.type)) {
        const com = self.appendChild(store.app.dragingType)
        store.app.setEditComponentId(com._id);
      }
    },
    onDragLeave: () => {
      dragStore.isDragOver = false;
    },
    onDragOver: (e: any) => {
      e.preventDefault();
      e.stopPropagation();
      if (!dragStore.isDragOver) {
        dragStore.isDragOver = true;
      }
    },
    setIsMouseOver: (is: boolean) => {
      dragStore.isMouseOver = is;
    },
    onMouseEnter() {
      dragStore.isMouseOver = true;
      if (setParentHovered) {
        setParentHovered(false)
      }
    },
    onMouseLeave() {
      dragStore.isMouseOver = false;
      if (setParentHovered) {
        setParentHovered(true)
      }
    },
    onContextMenu(e: React.MouseEvent<HTMLDivElement, MouseEvent>) {
      e.preventDefault();
      e.stopPropagation();
      contextMenu.show({
        id: 'group_menu',
        event: e,
        props: self
      });
    },
    get classNames() {
      return `component ${self.status === 0 ? 'delete' : ''} ${mode === 'edit' && dragStore.isMouseOver ? 'hover' : ''} ${store.app.editing_component_id === self._id ? 'focus' : ''} ${store.app.dragingType && dragStore.isDragOver ? (store.component.canDrop(store.app.dragingType, self.type) ? 'dragover' : 'cantdrag') : ''}`
    }
  }));
  // 数据源
  const dataStore: {
    loading: boolean,
    query: { [key: string]: string | number },
    total: number,
    page: number,
    pageSize: number,
    resources: IResource[],
    setQuery: Function,
    getQuery: Function,
    setResources: (resource: IResource[]) => void,
  } = useLocalStore(() => ({
    loading: false,
    // 列表类型
    page: 1,
    pageSize: 20,
    total: 0,
    query: {},
    setQuery(field: string, value: string | number) {
      dataStore.query[field] = value;
    },
    getQuery() {
      return {
        page: dataStore.page,
        page_size: dataStore.pageSize,
        ...dataStore.query,
      }
    },
    setResources(resources: IResource[]) {
      dataStore.resources = resources;
    },
    resources: [],
    // 表单类型
    resource: null,
  }));
  const onSetQuery = useCallback((event: { field: string, value: string, force: boolean, template_id: string }) => {
    if (self.template_id === event.template_id) {
      dataStore.setQuery(event.field, event.value);
      if (event.force) {
        init();
      }
    }
  }, []);
  useEffectOnce(() => {
    events.on('setQuery', onSetQuery);
    () => {
      events.off('setQuery', onSetQuery);
    }
  })
  const init = useCallback(async () => {
    if (self.api && mode === 'preview' && self.type !== 'Form') {
      dataStore.loading = true;
      const resp = await apis.getList(self.api, dataStore.getQuery());
      if (resp.code === 0) {
        dataStore.setResources(resp.data.items as IResource[]);
        dataStore.total = resp.data.total || 0;
      }
      dataStore.loading = false;
    }
  }, [self.api])
  useEffectOnce(() => {
    init();
  })

  if (self.status === 0 && mode === 'preview') {
    return null;
  }
  const Com = BaseComponent[self.type as keyof typeof BaseComponent];
  if (Com) {
    const direction = ['Tab'].includes(self.type) || self.style.flexDirection === 'row' || self.attrs.get('layout') === 'horizon' || (self.type === 'Layout' && !self.attrs.get('layout')) ? 'horizontal' : 'vertical';
    return <Observer>
      {() => (
        <Com
          self={self}
          mode={mode}
          index={index}
          page={page}
          source={source}
          setSource={setSource}
          setParentHovered={setParentHovered}
          drag={dragStore}
          handler={handler}
          isDragging={isDragging}
          {...(props)}
        >
          <div>
            <Handler
              className='handler'
              // ref={handler.innerRef}
              // {...handler.draggableProps}
              // {...handler.dragHandleProps}
              // style={{
              //   backgroundColor: isDragging ? 'lightblue' : '',
              //   ...(handler.draggableProps || {}).style,
              // }}
            >
              <IconSVG src={icon_drag} />
            </Handler>
            <LineL className='line' />
            <LineT className='line' />
            <LineR className='line' />
            <LineB className='line' />
            <ConerLB className='coner' />
            <ConerRB className='coner' />
            <ConerLT className='coner' />
            <ConerRT className='coner' />
          </div>
        </Com>
      )
      }
    </Observer >
  } else {
    return <div>
      <Handler className='handler' {...handler} style={isDragging ? { visibility: 'visible', cursor: 'move' } : {}}>
        <IconSVG src={icon_drag} />
      </Handler>
      <span>不支持</span>
    </div>
  }
}

const ScrollWrap = styled.div`
  flex: 1;
  overflow-y: auto;
  margin: 10px;
  &::-webkit-scrollbar {
    display: none;
  }
`

export default function EditablePage({ template_id, mode, page, ...props }: { template_id: string, mode: string, page?: IPageInfo, [key: string]: any }) {
  const local = useLocalStore<{
    editComponent: IComponent | null
    template: ITemplate | null,
    isDragOver: boolean,
    loading: boolean,
    addWidgetReferVisible: boolean,
    setLoading: (is: boolean) => void,
    onDragOver: any,
    onDragLeave: any,
    onDrop: any,
    remComponent: Function,
    setEditComponent: Function,
  }>(() => ({
    editComponent: null,
    loading: true,
    template: null,
    addWidgetReferVisible: false,
    isDragOver: false,
    onDrop: (e: any) => {
      e.preventDefault();
      e.stopPropagation();
      local.isDragOver = false;
      if (mode === 'preview' || store.app.dragingType === '') {
        return;
      }
      const type = store.component.types.find(it => it.name === store.app.dragingType)
      const child = ComponentItem.create({
        _id: '',
        parent_id: '',
        tree_id: '',
        type: store.app.dragingType,
        status: 1,
        order: local.template?.children.length,
        template_id: local.template?._id,
        title: '无',
        name: '',
        cover: '',
        desc: '',
        createdAt: new Date(),
        updatedAt: new Date(),
        accepts: [],
        children: [],
        widget: {
          type: 'string'
        }
      });
      if (local.template) {
        local.template.children.push(child)
        local.setEditComponent(local.template.children[local.template.children.length - 1]);
        store.app.setEditComponentId(child._id);
      }
    },
    onDragLeave: () => {
      local.isDragOver = false;
    },
    onDragOver: (e: any) => {
      e.preventDefault();
      e.stopPropagation();
      if (!local.isDragOver) {
        local.isDragOver = true;
      }
    },
    setLoading: (is: boolean) => {
      local.loading = is;
    },
    remComponent: (id: string) => {
      if (local.template) {
        const tree = findNode(local.template.children, id);
        if (tree) {
          const ids: string[] = [];
          collectIds(tree, ids);
          if (local.editComponent && ids.includes(local.editComponent._id)) {
            local.editComponent = null;
          }
          local.template.children.forEach(child => child.removeChild(id));
          apis.batchDestroyComponent({ ids: toJS(ids).join(',') })
        }
      }
    },
    setEditComponent(com: IComponent | null) {
      local.editComponent = com;
      store.app.setEditComponentId(com ? com._id : '');
    }
  }))

  const refresh = useCallback(async () => {
    local.setLoading(true)
    try {
      const resp = await apis.getTemplateComponents(template_id)
      const { children, ...template } = resp.data as ITemplate;
      const components = children.map(child => ComponentItem.create(child))
      local.template = { ...template, children: components }
      if (props && props.setTitle) {
        (props.setTitle as any)(local.template.title)
      }
      // 更新编辑中的数据
      if (local.editComponent) {
        const stack = components.map(c => c);
        while (stack.length) {
          const curr = stack.shift();
          if (curr && curr._id === local.editComponent._id) {
            local.editComponent = curr;
            break;
          } else if (curr?.children.length) {
            curr.children.forEach(child => {
              stack.push(child);
            })
          }
        }
      }
    } catch (e) {
      console.log(e)
    } finally {
      local.setLoading(false);
    }
  }, [])
  const eventHandle = useCallback(async (id: string) => {
    if (id === template_id) {
      const diff = getDiff(local.template);
      if (diff.length) {
        try {
          await apis.batchUpdateComponent({ body: diff })
          await refresh()
          if (local.template?.name === 'admin') {
            store.menu.setTree(local.template?.children[0])
            store.menu.setFlag(Date.now());
          }
        } catch (e) {
          console.log(e)
        } finally {
          events.emit('finished')
        }
      } else {
        message.warn('数据无变化')
      }
    }
  }, [])
  const eventRemoveComponent = useCallback(async (id: string) => {
    local.remComponent(id)
  }, []);
  useEffect(() => {
    local.setEditComponent(null)
  }, [mode])
  useEffectOnce(() => {
    refresh()
    events.on('editable', eventHandle)
    events.on('remove_component', eventRemoveComponent)
    return () => {
      if (events) {
        events.off('editable', eventHandle);
        events.off('remove_component', eventRemoveComponent)
      }
    }
  })

  const GroupMenu = (props: any) => (<ContextMenu id='group_menu'>
    <ContextMenuItem onClick={async (e: any) => {
      store.app.setEditComponentId(e.props._id);
      local.editComponent = e.props
    }}>编辑</ContextMenuItem>
    <ContextMenuItem onClick={(e: { props?: IComponent }) => {
      if (e.props) {
        events && events.emit('remove_component', e.props._id);
      }
    }}>删除</ContextMenuItem>
    {/* <ContextMenuItem onClick={(e: any) => {
      // ComponentItem.create({})
      e.props.appendChild('type')
      store.app.setEditComponentId(e.props._id);
      local.editComponent = e.props
    }}>添加子视图</ContextMenuItem> */}
  </ContextMenu>);

  return <Observer>{() => (<div style={{ display: 'flex', width: mode === 'edit' ? '90%' : '100%', height: '100%', justifyContent: 'center', alignItems: 'center' }}>
    <GroupMenu />
    <div style={{ display: 'flex', flex: 1, justifyContent: 'center', alignItems: 'center', height: '100%', boxShadow: mode === 'edit' ? '#1890ff 0 0 10px' : '' }}>
      <div className='hidden-scrollbar' style={{
        height: '100%',
        minWidth: 400,
        width: '100%',
        overflow: 'auto'
      }}>
        <Observer>{() => {
          if (local.loading) {
            return <div style={{ margin: '100px auto', textAlign: 'center' }}>loading...</div>
          } else if (local.template) {
            return <TemplateBox
              onDragOver={local.onDragOver}
              onDragLeave={local.onDragLeave}
              onDrop={local.onDrop}
              className={`component ${mode} ${local.isDragOver ? (BaseComponent[store.app.dragingType as keyof typeof BaseComponent] ? "dragover" : 'cantdrag') : ""}`}
              style={{ display: 'flex', flexDirection: 'column', ...toJS(local.template?.style) }}
            >
              {(local.template as ITemplate).children.map((child, index) => <Component self={child} index={index} key={child._id} mode={mode} page={page} />)}
            </TemplateBox>
          } else {
            return <div>Page NotFound</div>
          }
        }
        }</Observer >
      </div>
    </div>
    {local.editComponent && <div className='hidden-scroll' key={local.editComponent._id} style={{ display: 'flex', flexDirection: 'column', width: 300, height: '100%', backgroundColor: 'wheat', marginLeft: '5%', marginRight: mode === 'edit' ? '-5%' : '' }}>
      <AlignAside style={{ color: '#5d564a', backgroundColor: '#bdbdbd', padding: '3px 5px' }}>
        <span>属性修改({local.editComponent.type})</span>
        <Acon icon='CloseOutlined' onClick={() => {
          store.app.setEditComponentId('')
          local.editComponent = null
        }} />
      </AlignAside>
      <ScrollWrap>
        <EditItem>
          <Input addonBefore="标题" defaultValue={local.editComponent.title} onChange={e => {
            if (local.editComponent) {
              local.editComponent.setAttr('title', e.target.value);
            }
          }} />
        </EditItem>
        <EditItem>
          <Input addonBefore="描述" value={local.editComponent.desc} />
        </EditItem>
        <EditItem>
          <Input addonBefore="parent_id" value={local.editComponent.parent_id} onChange={e => {
            if (local.editComponent) {
              local.editComponent.setAttr('parent_id', e.target.value)
            }
          }} />
        </EditItem>
        <EditItem>
          <Input addonBefore="_id" readOnly value={local.editComponent._id} />
        </EditItem>
        <EditItem>
          <Input addonBefore="status" type="number" value={local.editComponent.status} onChange={e => {
            if (local.editComponent) {
              local.editComponent.setAttr('status', parseInt(e.target.value));
            }
          }} />
        </EditItem>
        <EditItem>
          <Input addonBefore="name" value={local.editComponent.name} />
        </EditItem>
        <EditItem>
          <Input addonBefore="icon" value={local.editComponent.icon} onChange={e => {
            local.editComponent?.setAttr('icon', e.target.value);
          }} />
        </EditItem>
        <EditItem>
          数据
          <Input addonBefore="api" value={local.editComponent.api} onChange={e => {
            local.editComponent?.setAttr('api', e.target.value);
          }} />
          <Divider type="horizontal" style={{ margin: 5 }} />
          <SortList
            key={local.editComponent.resources?.length}
            sort={(oldIndex: number, newIndex: number) => {
              local.editComponent && local.editComponent.swapResource(oldIndex, newIndex);
            }}
            droppableId={local.editComponent._id}
            items={(local.editComponent.resources as any)}
            itemStyle={{ display: 'flex', alignItems: 'center' }}
            mode={mode}
            direction={'vertical'}
            renderItem={({ item: resource, handler: handler2 }: { item: IResource, handler: any }) => <Fragment key={resource._id}>
              <div style={{ display: 'flex', alignItems: 'center', marginTop: 5 }}>
                <Acon icon='DragOutlined' {...handler2} style={{ marginRight: 5 }} />
                <Input
                  value={resource.title}
                  addonBefore={<CopyToClipboard text={resource._id as string}><Acon icon='CopyOutlined' title={resource._id} onClick={() => { }} /></CopyToClipboard>}
                  addonAfter={<Acon icon='CloseOutlined' onClick={() => { local.editComponent?.remResource(resource._id) }}
                  />} />
              </div>
            </Fragment>}
          />
          <Button icon={<Acon icon="add" />}>添加资源</Button>
        </EditItem>
        <EditItem>
          控件属性
          <Input addonBefore="字段" value={local.editComponent.widget.field} onChange={e => {
            local.editComponent?.setWidget('field', e.target.value);
          }} />
          <Input addonBefore="默认值" value={local.editComponent.widget.value} onChange={e => {
            local.editComponent?.setWidget('value', e.target.value);
          }} addonAfter={<Select value={local.editComponent.widget.type} onChange={v => {
            if (local.editComponent) {
              local.editComponent.changeWidgetType(v);
            }
          }}>
            <Select.Option value="string">string</Select.Option>
            <Select.Option value="number">number</Select.Option>
            <Select.Option value="boolean">boolean</Select.Option>
            <Select.Option value="date">date</Select.Option>
          </Select>} />
          <Divider type="horizontal" style={{ margin: 5 }} />
          <Space direction='vertical'>
            <SortList
              sort={(srcIndex: number, dstIndex: number) => {
                const arr = _.cloneDeep(local.editComponent?.widget.refer);
                const curr = arr?.splice(srcIndex, 1);
                arr?.splice(dstIndex, 0, ...(curr || []));
                local.editComponent?.setWidget('refer', arr)
              }}
              droppableId={local.editComponent._id + '2'}
              mode={mode}
              direction={'vertical'}
              listStyle={{}}
              itemStyle={{ display: 'flex', alignItems: 'center' }}
              items={local.editComponent.widget.refer}
              renderItem={({ item, index, handler }: { item: { label: string, value: number | string }, index: number, handler: any }) => (
                <Input
                  key={index}
                  addonBefore={<div  {...handler}>
                    <Acon icon='DragOutlined' style={{ marginRight: 5 }} />
                    {item.label}
                  </div>}
                  value={item.value}
                  addonAfter={<Acon icon='close' onClick={() => local.editComponent?.remRefer(index)} />}
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
                    if (op && local.editComponent) {
                      const oinputs = op.getElementsByTagName('input');
                      if (oinputs?.length === 2) {
                        local.editComponent.pushRefer({ label: oinputs[0].value, value: oinputs[1].value });
                      }
                      local.addWidgetReferVisible = false
                    }
                  }} />
                </Fragment>
                : <Acon icon='add' onClick={() => local.addWidgetReferVisible = true} />}
            </AlignAround>
          </Space>
        </EditItem>
        <EditItem>
          事件
          <Input addonBefore="action_url" value={local.editComponent.widget.action_url} onChange={e => {
            local.editComponent?.setWidget('action_url', e.target.value);
          }} addonAfter={<Select value={local.editComponent.widget.action} onChange={v => {
            local.editComponent?.setWidget('action', v);
          }} >
            <Select.Option value="">无</Select.Option>
            <Select.Option value="goto_detail">跳转详情</Select.Option>
            <Select.Option value="goto_url">跳转外链</Select.Option>
            <Select.Option value="edit">编辑</Select.Option>
            <Select.Option value="delete">删除</Select.Option>
          </Select>} />
        </EditItem>
        <EditItem>
          attr
          <Input.TextArea style={{ minHeight: 150 }} defaultValue={JSON.stringify(local.editComponent.attrs, null, 2)} onBlur={e => {
            try {
              const attrs = JSON.parse(e.target.value)
              const keys = Array.from(local.editComponent?.attrs).map((v: any) => v[0])
              const new_keys = Object.keys(attrs);
              for (let k in attrs) {
                local.editComponent?.setAttrs(k, attrs[k])
              }
              _.difference(keys, new_keys).forEach(k => {
                local.editComponent?.setAttrs(k, null)
              })
            } catch (e) {

            } finally {

            }
          }} />
        </EditItem>
        <EditItem>
          样式
          <Input.TextArea style={{ minHeight: 150 }} defaultValue={JSON.stringify(local.editComponent.style, null, 2)} onBlur={e => {
            try {
              const style = JSON.parse(e.target.value)
              local.editComponent?.updateStyle(style);
            } catch (e) {

            } finally {

            }
          }} />
        </EditItem>
      </ScrollWrap>
    </div>}
  </div>)
  }</Observer >
}