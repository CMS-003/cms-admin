import { ITemplate, IComponent, IResource } from '@/types'
import { Observer, useLocalStore } from 'mobx-react'
import { EditWrap, TemplateBox, EditItem, Handler, } from './style'
import { Menu as ContextMenu, Item as ContextMenuItem, contextMenu } from 'react-contexify';
import { AlignAside } from '@/components/style'
import { Input, message } from 'antd'
import Acon from '@/components/Acon';
import "react-contexify/dist/ReactContexify.css";
import { ComponentItem } from '@/store/component';
import SortList from '@/components/SortList/';
import store from '@/store'
import _ from 'lodash'
import { useCallback } from 'react';
import apis from '@/api'
import { useEffectOnce } from 'react-use';
import { CopyToClipboard } from 'react-copy-to-clipboard';

import Menu from './Menu'
import MenuItem from './MenuItem'
import Tab from './Tab'
import TabItem from './TabItem'
import Filter from './Filter'
import FilterRow from './FilterRow'
import FilterTag from './FilterTag'
import Layout from './Layout'
import PickCard from './Card'
import RandomCard from './Random'
import SearchBtn from './SearchBtn'
import IconBtn from './Button'
import { toJS } from 'mobx';
import { Fragment } from 'react';
import events from '@/utils/event';
import styled from 'styled-components';

const BaseComponent = {
  Menu,
  MenuItem,
  Tab,
  TabItem,
  Filter,
  FilterRow,
  FilterTag,
  Layout,
  PickCard,
  RandomCard,
  SearchBtn,
  IconBtn,
}

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

export function Component({ self, children, mode, isDragging, handler, ...props }: { self: IComponent, children?: any, isDragging?: boolean, mode: string, handler?: any, props?: any }) {
  const local = useLocalStore(() => ({
    isDragOver: false,
    isMouseOver: false,
    onDrop: (e: any) => {
      e.preventDefault();
      e.stopPropagation();
      local.isDragOver = false;
      if (self.status !== 0 && store.component.canDrop(store.app.dragingType, self.type)) {
        self.appendChild(store.app.dragingType)
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
    setIsMouseOver(is: boolean) {
      local.isMouseOver = is;
    }
  }))
  if (self.status === 0 && mode === 'preview') {
    return null;
  }
  const Com = BaseComponent[self.type as keyof typeof BaseComponent];
  if (Com) {
    const direction = self.type === 'Tab' || self.style.get('flexDirection') === 'row' ? 'horizontal' : 'vertical';
    return <Observer>
      {() => (
        mode === 'edit' ? <EditWrap
          data-component-id={self.type + '-' + self._id}
          onContextMenu={e => {
            e.preventDefault();
            e.stopPropagation();
            contextMenu.show({
              id: 'group_menu',
              event: e,
              props: self
            });
          }}
          onMouseEnter={() => {
            local.setIsMouseOver(true);
          }}
          onMouseLeave={() => {
            local.setIsMouseOver(false);
          }}
          onDragOver={local.onDragOver}
          onDragLeave={local.onDragLeave}
          onDrop={local.onDrop}
          className={`${mode} ${self.status === 0 ? 'delete' : ''} ${local.isMouseOver ? 'hover' : ''} ${store.app.editing_component_id === self._id && mode === 'edit' ? 'focus' : ''} ${store.app.dragingType && local.isDragOver ? (self.status !== 0 && store.component.canDrop(store.app.dragingType, self.type) ? 'dragover' : 'cantdrag') : ''}`}
        >
          <Handler {...handler} data-drag={isDragging} style={isDragging ? { visibility: 'visible' } : {}}>
            <Acon icon='DragOutlined' />
          </Handler>
          <Com self={self} mode={mode} level={_.get(props, 'level', 1)} {...(props)}>
            <SortList
              listStyle={Object.fromEntries(self.style)}
              sort={(oldIndex: number, newIndex: number) => {
                self.swap(oldIndex, newIndex);
              }}
              droppableId={self._id}
              items={self.children}
              itemStyle={{ display: 'flex', alignItems: 'center', }}
              mode={mode}
              direction={direction}
              renderItem={({ item, handler: h2 }: { item: IComponent, handler: HTMLObjectElement }) => <Component mode={mode} handler={h2} self={item} key={item._id} {...({ level: _.get(props, 'level', 1) + 1 })} />}
            />
          </Com>
        </EditWrap>
          : <Com self={self} mode={mode} level={_.get(props, 'level', 1)} {...(props)}>
            <Fragment>
              {self.children.map(child => (<Component mode={mode} self={child} key={child._id} {...({ level: 2 })} />))}
            </Fragment>
          </Com>
      )
      }
    </Observer >
  } else {
    return <div>
      {self.type}!
    </div>
  }
}

export function TemplatePage({ template_id, mode, }: { template_id: string, mode: string }) {
  const local = useLocalStore<{
    template: ITemplate | null,
    isDragOver: boolean,
    loading: boolean,
    setLoading: (is: boolean) => void,
    onDragOver: any,
    onDragLeave: any,
    onDrop: any,
    remComponent: Function
  }>(() => ({
    loading: true,
    template: null,
    isDragOver: false,
    onDrop: (e: any) => {
      e.preventDefault();
      e.stopPropagation();
      local.isDragOver = false;
      if (mode === 'preview') {
        return;
      }
      const type = store.component.types.find(it => it.name === store.app.dragingType)
      if (type && type.level !== 1) {
        return message.warn('非一级组件不能直接放到模板页')
      }
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
      });
      local.template?.children.push(child)
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
        const index = local.template?.children.findIndex(c => c._id === id) as number;
        console.log(index)
        if (index !== -1 && local.template) {
          local.template.children.splice(index, 1);
        } else {
          local.template?.children.forEach(c => {
            c.removeChild(id)
          })
        }
      }
    }
  }))
  const refresh = useCallback(async () => {
    local.setLoading(true)
    try {
      const resp = await apis.getTemplateComponents(template_id)
      const { children, ...template } = resp.data as ITemplate;
      const components = children.map(child => ComponentItem.create(child))
      local.template = { ...template, children: components }
    } catch (e) {
      console.log(e)
    } finally {
      local.setLoading(false);
    }
  }, [])
  useEffectOnce(() => {
    refresh()
  })
  return <div style={{
    height: '100%',
    maxWidth: 480,
    minWidth: 400,
  }}>
    <Observer>{() => {
      if (local.loading) {
        return <div style={{ margin: '100px auto', textAlign: 'center' }}>loading...</div>
      } else if (local.template) {
        return <TemplateBox
          onDragOver={local.onDragOver}
          onDragLeave={local.onDragLeave}
          onDrop={local.onDrop}
          className={`${mode} ${local.isDragOver ? "dragover" : ""}`}
          style={toJS(local.template?.style)}
        >
          {mode === 'edit' ? <SortList
            listStyle={{}}
            sort={(oldIndex: number, newIndex: number) => {
              const [old] = (local.template as ITemplate).children.splice(oldIndex, 1);
              local.template?.children.splice(newIndex, 0, old);
              local.template?.children.forEach((child, i) => {
                child.setAttr('order', i);
              });
            }}
            key={local.template?.children.length}
            droppableId={(local.template as ITemplate)._id}
            items={(local.template as ITemplate).children}
            itemStyle={{ display: 'flex' }}
            mode={mode}
            renderItem={({ item, handler }: { item: IComponent, handler: HTMLObjectElement }) => <Component self={item} key={item._id} mode={mode} handler={handler} />}
          /> : ((local.template as ITemplate).children.map(child => <Component self={child} key={child._id} mode={mode} />))}
        </TemplateBox>
      } else {
        return <div>Page NotFound</div>
      }
    }
    }</Observer >
  </div>
}

const ScrollWrap = styled.div`
  flex: 1;
  overflow-y: auto;
  margin: 10px;
  &::-webkit-scrollbar {
    display: none;
  }
`

export default function Page({ template_id, mode, ...props }: { template_id: string, props?: any, mode: string, }) {
  const local = useLocalStore<{
    editComponent: IComponent | null
    template: ITemplate | null,
    isDragOver: boolean,
    loading: boolean,
    setLoading: (is: boolean) => void,
    onDragOver: any,
    onDragLeave: any,
    onDrop: any,
    remComponent: Function
  }>(() => ({
    editComponent: null,
    loading: true,
    template: null,
    isDragOver: false,
    onDrop: (e: any) => {
      e.preventDefault();
      e.stopPropagation();
      local.isDragOver = false;
      if (mode === 'preview') {
        return;
      }
      const type = store.component.types.find(it => it.name === store.app.dragingType)
      if (type && type.level !== 1) {
        return message.warn('非一级组件不能直接放到模板页')
      }
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
      });
      local.template?.children.push(child)
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
        const index = local.template?.children.findIndex(c => c._id === id) as number;
        console.log(index)
        if (index !== -1 && local.template) {
          local.template.children.splice(index, 1);
        } else {
          local.template?.children.forEach(c => {
            c.removeChild(id)
          })
        }
      }
    }
  }))
  const refresh = useCallback(async () => {
    local.setLoading(true)
    try {
      const resp = await apis.getTemplateComponents(template_id)
      const { children, ...template } = resp.data as ITemplate;
      const components = children.map(child => ComponentItem.create(child))
      local.template = { ...template, children: components }
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
        if (e.props.$new) {
          events && events.emit('remove_component', e.props._id);
        } else {
          e.props.setAttr('status', 0)
        }
      }
    }}>删除</ContextMenuItem>
    {/* <ContextMenuItem onClick={(e: any) => {
      // ComponentItem.create({})
      e.props.appendChild('type')
      store.app.setEditComponentId(e.props._id);
      local.editComponent = e.props
    }}>添加子视图</ContextMenuItem> */}
  </ContextMenu>);

  return <Observer>{() => (<div style={{ display: 'flex', height: '100%', justifyContent: 'center', alignItems: 'center' }}>
    <GroupMenu />
    <div style={{ display: 'flex', flex: 1, justifyContent: 'center', alignItems: 'center', height: '90%', overflowX: 'hidden', overflowY:'auto', boxShadow: 'rgb(41, 172, 233) 0px 0px 10px 4px' }}>
      <div style={{
        height: '100%',
        maxWidth: 480,
        minWidth: 400,
      }}>
        <Observer>{() => {
          if (local.loading) {
            return <div style={{ margin: '100px auto', textAlign: 'center' }}>loading...</div>
          } else if (local.template) {
            return <TemplateBox
              onDragOver={local.onDragOver}
              onDragLeave={local.onDragLeave}
              onDrop={local.onDrop}
              className={`${mode} ${local.isDragOver ? "dragover" : ""}`}
              style={toJS(local.template?.style)}
            >
              {mode === 'edit' ? <SortList
                listStyle={{}}
                sort={(oldIndex: number, newIndex: number) => {
                  const [old] = (local.template as ITemplate).children.splice(oldIndex, 1);
                  local.template?.children.splice(newIndex, 0, old);
                  local.template?.children.forEach((child, i) => {
                    child.setAttr('order', i);
                  });
                }}
                key={local.template?.children.length}
                droppableId={(local.template as ITemplate)._id}
                items={(local.template as ITemplate).children}
                itemStyle={{ display: 'flex' }}
                mode={mode}
                renderItem={({ item, handler }: { item: IComponent, handler: HTMLObjectElement }) => <Component self={item} key={item._id} mode={mode} handler={handler} />}
              /> : ((local.template as ITemplate).children.map(child => <Component self={child} key={child._id} mode={mode} />))}
            </TemplateBox>
          } else {
            return <div>Page NotFound</div>
          }
        }
        }</Observer >
      </div>
    </div>
    {local.editComponent && <div key={local.editComponent._id} style={{ display: 'flex', flexDirection: 'column', width: 300, overflowX: 'auto', backgroundColor: 'wheat', position: 'absolute', right: 0, top: 0, bottom: 0 }}>
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
          <Input addonBefore="parent_id" readOnly value={local.editComponent.parent_id} />
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
          resources
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
        </EditItem>
        <EditItem>
          attr
          <Input.TextArea style={{ minHeight: 150 }} defaultValue={JSON.stringify(local.editComponent.attrs, null, 2)} onChange={e => {
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
          <Input.TextArea style={{ minHeight: 150 }} defaultValue={JSON.stringify(local.editComponent.style, null, 2)} onChange={e => {
            try {
              const style = JSON.parse(e.target.value)
              const keys = Array.from(local.editComponent?.style).map((v: any) => v[0])
              const new_keys = Object.keys(style);
              for (let k in style) {
                local.editComponent?.setStyle(k, style[k])
              }
              _.difference(keys, new_keys).forEach(k => {
                local.editComponent?.setStyle(k, null)
              })
            } catch (e) {

            } finally {

            }
          }} />
        </EditItem>
      </ScrollWrap>
    </div>}
  </div>)}</Observer>
}