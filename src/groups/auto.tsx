import { Fragment, useCallback, useEffect, useRef } from 'react';
import { useEffectOnce } from 'react-use';
import { toJS } from 'mobx';
import { Observer, useLocalStore } from 'mobx-react'
import { message, } from 'antd'
import "react-contexify/dist/ReactContexify.css";
import { contextMenu } from 'react-contexify';
import _ from 'lodash'
import apis from '@/api'
import store from '@/store'
import events from '@/utils/event';
import styled from 'styled-components';
import { ComponentItem } from '@/store/component';
import icon_drag from '@/asserts/images/drag.svg'
import { Style } from '@/components/index';
import { IPageInfo, ITemplate, IComponent, IResource, IAuto } from '@/types'
import NatureSortable from '@/components/NatureSortable'
import BaseComponent from './index';
import GroupMenu from './contextmenu'
import Edit from './edit'
import { getDiff, findNode, collectIds } from './utils'
import {
  TemplateBox,
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

export function Component({ self, children, mode, setParentHovered, dnd, source, setSource, page, ...props }: IAuto) {
  // 拖拽事件
  const dragStore = useLocalStore(() => ({
    isDragOver: false,
    isMouseOver: false,
    get className() {
      return ` component${self.status === 0 ? ' delete' : ''}${mode === 'edit' && dragStore.isMouseOver && !store.app.isDragging ? ' hover' : ''}${store.app.editing_component_id === self._id ? ' focus' : ''}${store.app.dragingType && dragStore.isDragOver ? (store.component.canDrop(store.app.dragingType, self.type) ? ' dragover' : ' cantdrag') : ''}`
    },
    setIsMouseOver: (is: boolean) => {
      dragStore.isMouseOver = is;
    },
    events: {
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
    },
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
    const direction = self.attrs.get('layout') === 'vertical' ? 'vertical' : 'horizontal';
    return <Observer>
      {() => (
        <Com
          self={self}
          mode={mode}
          page={page}
          source={source}
          setSource={setSource}
          setParentHovered={setParentHovered}
          dnd={dnd}
          drag={dragStore}
          {...(props)}
        >
          <Handler className='handler' onMouseEnter={() => {
            store.app.setCanDragId(self._id)
          }}>
            <Style.IconSVG src={icon_drag} />
          </Handler>
          <LineL className='line' />
          <LineT className='line' />
          <LineR className='line' />
          <LineB className='line' />
          <ConerLB className='coner' />
          <ConerRB className='coner' />
          <ConerLT className='coner' />
          <ConerRT className='coner' />
        </Com>
      )
      }
    </Observer >
  } else {
    return <div>
      <Handler className='handler' style={dnd?.isDragging ? { visibility: 'visible', cursor: 'move' } : {}}>
        <Style.IconSVG src={icon_drag} />
      </Handler>
      <span>不支持</span>
    </div>
  }
}

const ScrollWrap = styled.div`
  flex: 1;
  height: 100%;
  overflow-y: auto;
  &::-webkit-scrollbar {
    display: none;
  }
`

export default function EditablePage({ template_id, mode, page, ...props }: { template_id: string, mode: string, page?: IPageInfo, [key: string]: any }) {
  const local = useLocalStore<{
    editComponent: IComponent | null;
    editPanelKey: string;
    template: ITemplate | null;
    isDragOver: boolean;
    loading: boolean;
    addWidgetReferVisible: boolean;
    setLoading: (is: boolean) => void;
    onDragOver: any;
    onDragLeave: any;
    onDrop: any;
    remComponent: Function;
    setEditComponent: Function;
  }>(() => ({
    editComponent: null,
    editPanelKey: 'base',
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
            local.setEditComponent(null, '');
          }
          local.template.children.forEach(child => child.removeChild(id));
          apis.batchDestroyComponent({ ids: toJS(ids).join(',') })
        }
      }
    },
    setEditComponent(com: IComponent | null, key = 'base') {
      local.editComponent = com;
      local.editPanelKey = key;
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
            local.setEditComponent(curr, '');
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

  return <Observer>{() => (<div style={{ display: 'flex', width: '90%', height: '100%', justifyContent: 'center', alignItems: 'center' }}>
    <GroupMenu setEditComponent={local.setEditComponent} />
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
              <NatureSortable
                items={(local.template as ITemplate).children}
                direction='vertical'
                droppableId={local.template._id}
                sort={() => { }}
                renderItem={({ item, dnd }) => (
                  <Component
                    self={item}
                    mode={mode}
                    page={page}
                    dnd={dnd}
                  />
                )}
              />
            </TemplateBox>
          } else {
            return <div>Page NotFound</div>
          }
        }
        }</Observer >
      </div>
    </div>
    {local.editComponent && (
      <Edit data={local.editComponent} setData={local.setEditComponent} tabkey={local.editPanelKey} setTabkey={(v: string) => { local.editPanelKey = v }} />
    )}
  </div>)
  }</Observer >
}