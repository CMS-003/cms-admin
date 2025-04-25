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
import { CenterXY } from '@/components/style';
import { v4 } from 'uuid';

export function Component({ self, children, mode, dnd, query, source, setDataField, page, parent, ...props }: IAuto) {
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
          parent={parent}
          query={query}
          source={source}
          setDataField={setDataField}
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

function editCopyID(node: IComponent, parent_node: Partial<IComponent> | null) {
  const new_node: any = _.omit(node, ['$new', '$selected', 'children', '$origin', '_id']);
  new_node._id = v4();
  new_node.$new = true;
  if (parent_node) {
    new_node.parent_id = parent_node._id;
    new_node.tree_id = parent_node.tree_id;
    new_node.template_id = parent_node.template_id;
  } else {
    new_node.tree_id = new_node._id;
  }
  new_node.children = node.children.map(v => editCopyID(v, new_node));
  return new_node;
}

export default function AutoPage({ parent, template_id, mode, path, close }: { parent?: IPageInfo, template_id: string, mode: string, path: string, close: Function, [key: string]: any }) {
  const page = useLocalObservable<IPageInfo>(() => ({
    template_id,
    path,
    param: {},
    query: Object.fromEntries(new URLSearchParams(path.split('?')[1])),
    setQuery(field, value) {
      this.query[field] = value;
    },
    close: close
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
    copyComponent: Function;
    pasteComponent: Function;
    setEditComponent: Function;
    setEditPanelKey: Function;
  }>(() => ({
    editComponent: null,
    editPanelKey: 'base',
    loading: false,
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
          type: 'string',
          value: '',
          in: 'body'
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
    copyComponent: (id: string) => {
      let com: IComponent | null | undefined = null;
      if (local.template && local.template.children) {
        com = local.template.children.find(v => v._id === id);
      }
      if (com) {
        console.log(com)
      } else {
        message.info('只能复制一级tree组件')
      }
    },
    pasteComponent: (text: string) => {
      try {
        const data = JSON.parse(text);
        data.template_id = local.template?._id || '';
        const dealed_component = editCopyID(data, null);
        local.template?.children.push(ComponentItem.create(dealed_component));
      } catch (e) {
        console.log(e, text)
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
    if (!template_id) return;
    local.setLoading(true)
    local.setEditComponent(null)
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
  const afterUpdateTemplate = useCallback(async (id: string) => {
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
      }
    }
  }, [])
  const onRemoveComponent = useCallback(async (id: string) => {
    local.remComponent(id)
  }, []);
  const onCopyComponent = useCallback(async (id: string) => {
    local.copyComponent(id);
  }, []);
  const onPasteComponent = useCallback(async (text: string) => {
    local.pasteComponent(text)
  }, []);
  useEffect(() => {
    local.setEditComponent(null)
  }, [mode])
  useEffectOnce(() => {
    refresh()
    events.on('editable', afterUpdateTemplate)
    events.on('copy_component', onCopyComponent)
    events.on('paste_component', onPasteComponent)
    events.on('remove_component', onRemoveComponent)
    return () => {
      if (events) {
        events.off('editable', afterUpdateTemplate);
        events.off('copy_component', onCopyComponent)
        events.off('paste_component', onPasteComponent)
        events.off('remove_component', onRemoveComponent)
      }
    }
  })
  return <PageContext.Provider value={page}>
    <Observer>{() => (<div style={{ display: 'flex', width: '100%', height: '100%', justifyContent: 'center', alignItems: 'center', overflow: 'hidden' }}>
      <GroupMenu setEditComponent={local.setEditComponent} />
      <div style={{ display: 'flex', width: '100%', padding: 4, overflow: 'hidden', justifyContent: 'center', alignItems: 'center', height: '100%', boxShadow: mode === 'edit' ? 'inset #1890ff 0 0 5px' : '' }}>
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
                  key={local.template.children.length}
                  items={(local.template as ITemplate).children}
                  direction='vertical'
                  disabled={mode === 'preview'}
                  wrap={TemplateBox}
                  droppableId={local.template._id}
                  sort={() => { }}
                  renderItem={({ item, dnd }) => (
                    <Component
                      self={item}
                      mode={mode}
                      dnd={dnd}
                      parent={parent}
                      source={{}}
                      setDataField={() => { }}
                    />
                  )}
                />
              </TemplateBox>
            } else {
              return <CenterXY>NotFound</CenterXY>
            }
          }
          }</Observer >
        </div>
      </div>
      {local.editComponent && (
        <Edit data={local.editComponent} setData={local.setEditComponent} tabkey={local.editPanelKey} setTabkey={(v: string) => { local.setEditPanelKey(v) }} />
      )}
    </div>)
    }</Observer >
  </PageContext.Provider>
}