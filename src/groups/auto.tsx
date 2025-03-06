import { Fragment, useCallback, useEffect, useRef } from 'react';
import { useEffectOnce } from 'react-use';
import { toJS } from 'mobx';
import { Observer, useLocalObservable } from 'mobx-react'
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
import { PageContext, useSetTitleContext } from './context';

export function Component({ self, children, mode, dnd, source, setSource, page, ...props }: IAuto) {
  // 拖拽事件
  const dragStore = useLocalObservable(() => ({
    isDragOver: false,
    get className() {
      return ` component${self.status === 0 ? ' delete' : ''}${mode === 'edit' && store.component.hover_component_id === self._id && !store.component.isDragging ? ' hover' : ''}${store.component.editing_component_id === self._id ? ' focus' : ''}${store.component.dragingType && dragStore.isDragOver ? (store.component.canDrop(store.component.dragingType, self.type) ? ' dragover' : ' cantdrag') : ''}`
    },
    events: {
      onDrop: (e: any) => {
        e.preventDefault();
        e.stopPropagation();
        if (mode === 'preview' || store.component.dragingType === '') return;
        dragStore.isDragOver = false;
        if (self.status !== 0 && store.component.canDrop(store.component.dragingType, self.type)) {
          const com = self.appendChild(store.component.dragingType)
          store.component.setEditComponentId(com._id);
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
        store.component.setHoverComponentId(self._id)
      },
      onMouseOver() {
        if (!store.component.hover_component_id) {
          store.component.setHoverComponentId(self._id)
        }
      },
      onMouseLeave() {
        store.component.setHoverComponentId('')
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

  if (self.status === 0 && mode === 'preview') {
    return null;
  }
  const Com = BaseComponent[self.type as keyof typeof BaseComponent];
  if (Com) {
    return <Observer>
      {() => (
        <Com
          self={self}
          mode={mode}
          page={page}
          source={source}
          setSource={setSource}
          dnd={dnd}
          drag={mode === 'edit' ? dragStore : { isDragOver: false, className: ' component', events: {} }}
          {...(props)}
        >
          <Handler className='handler' onMouseEnter={() => {
            store.component.setCanDragId(self._id)
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

export default function AutoPage({ template_id, mode, path }: { template_id: string, mode: string, path: string, [key: string]: any }) {
  const page = useLocalObservable<IPageInfo>(() => ({
    template_id,
    path,
    param: {},
    query: Object.fromEntries(new URLSearchParams(path.split('?')[1])),
    setQuery(field, value) {
      this.query[field] = value;
    },
  }))
  const setTitle = useSetTitleContext()
  const local = useLocalObservable<{
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
      if (mode === 'preview' || store.component.dragingType === '') {
        return;
      }
      const type = store.component.types.find(it => it.name === store.component.dragingType)
      const child = ComponentItem.create({
        _id: '',
        parent_id: '',
        tree_id: '',
        type: store.component.dragingType,
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
        store.component.setEditComponentId(child._id);
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
      store.component.setEditComponentId(com ? com._id : '');
    },
    setEditPanelKey(v: string) {
      local.editPanelKey = v;
    }
  }))

  const refresh = useCallback(async () => {
    local.setLoading(true)
    try {
      const resp = await apis.getTemplateComponents(template_id)
      const { children, ...template } = resp.data as ITemplate;
      const components = children.map(child => ComponentItem.create(child))
      local.template = { ...template, children: components }
      setTitle(path, local.template.title);
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
  return <PageContext.Provider value={page}>
    <Observer>{() => (<div style={{ display: 'flex', width: '100%', height: '100%', justifyContent: 'center', alignItems: 'center' }}>
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
                className={`component ${mode} ${local.isDragOver ? (BaseComponent[store.component.dragingType as keyof typeof BaseComponent] ? "dragover" : 'cantdrag') : ""}`}
                style={{ ...toJS(local.template?.style) }}
              >
                <NatureSortable
                  items={(local.template as ITemplate).children}
                  direction='vertical'
                  wrap={TemplateBox}
                  droppableId={local.template._id}
                  sort={() => { }}
                  renderItem={({ item, dnd }) => (
                    <Component
                      self={item}
                      mode={mode}
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
  </PageContext.Provider>
}