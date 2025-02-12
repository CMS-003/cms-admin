import { Fragment, useCallback } from 'react';
import { useEffectOnce } from 'react-use';
import { toJS } from 'mobx';
import { Observer, useLocalStore } from 'mobx-react'
import { Input, message, Button, Divider, Space } from 'antd'
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
import { ITemplate, IComponent, IResource } from '@/types'
import BaseComponent from './index';
import {
  EditWrap,
  TemplateBox,
  EditItem,
  Handler,
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

export function Component({ self, children, mode, isDragging, handler, setParentHovered, source, ...props }: { self: IComponent, source?: object, children?: any, isDragging?: boolean, mode: string, handler?: any, setParentHovered?: Function, props?: any }) {
  // 拖拽事件
  const dragStore = useLocalStore(() => ({
    isDragOver: false,
    isMouseOver: false,
    onDrop: (e: any) => {
      e.preventDefault();
      e.stopPropagation();
      dragStore.isDragOver = false;
      if (self.status !== 0 && store.component.canDrop(store.app.dragingType, self.type)) {
        self.appendChild(store.app.dragingType)
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
    setIsMouseOver(is: boolean) {
      dragStore.isMouseOver = is;
    }
  }))
  if (self.status === 0 && mode === 'preview') {
    return null;
  }
  const Com = BaseComponent[self.type as keyof typeof BaseComponent];
  if (Com) {
    const direction = ['Tab'].includes(self.type) || self.style.flexDirection === 'row' || self.attrs.get('layout') === 'horizon' || (self.type === 'Layout' && !self.attrs.get('layout')) ? 'horizontal' : 'vertical';
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
            dragStore.setIsMouseOver(true);
            if (setParentHovered) {
              setParentHovered(false)
            }
          }}
          onMouseLeave={() => {
            dragStore.setIsMouseOver(false);
            if (setParentHovered) {
              setParentHovered(true)
            }
          }}
          onDragOver={dragStore.onDragOver}
          onDragLeave={dragStore.onDragLeave}
          onDrop={dragStore.onDrop}
          className={`${mode} ${store.app.editing_component_id === self._id && mode === 'edit' ? 'focus' : ''} ${self.status === 0 ? 'delete' : ''} ${dragStore.isMouseOver ? 'hover' : ''} ${store.app.dragingType && dragStore.isDragOver ? (self.status !== 0 && store.component.canDrop(store.app.dragingType, self.type) && BaseComponent[store.app.dragingType as keyof typeof BaseComponent] ? 'dragover' : 'cantdrag') : ''}`}
        >
          <ConerLB className='coner' />
          <ConerRB className='coner' />
          <ConerLT className='coner' />
          <ConerRT className='coner' />
          <Handler {...handler} className='hover' data-drag={isDragging}>
            <IconSVG src={icon_drag} />
          </Handler>
          <Com self={self} mode={mode} source={source} level={_.get(props, 'level', 1)} setParentHovered={(is: boolean) => {
            dragStore.setIsMouseOver(is);
          }} {...(props)}>
            <SortList
              listStyle={self.style || {}}
              sort={(oldIndex: number, newIndex: number) => {
                self.swap(oldIndex, newIndex);
              }}
              droppableId={self._id}
              items={self.children}
              itemStyle={{ display: 'flex', alignItems: 'center', }}
              mode={mode}
              direction={direction}
              renderItem={({ item, handler: h2, index }: { item: IComponent, handler: HTMLObjectElement, index: number }) => <Component mode={mode} handler={h2} self={item} key={index} setParentHovered={(is: boolean) => {
                dragStore.setIsMouseOver(is);
              }} {...({ level: _.get(props, 'level', 1) + 1 })} />}
            />
          </Com>
        </EditWrap>
          : <Com self={self} mode={mode} source={source} level={_.get(props, 'level', 1)} {...(props)}>
            <Fragment>
              {self.children.map(child => (<Component mode={mode} self={child} key={child._id} {...({ level: 2 })} />))}
            </Fragment>
          </Com>
      )
      }
    </Observer >
  } else {
    return <div>
      <Handler {...handler} data-drag={isDragging} style={isDragging ? { visibility: 'visible', cursor: 'move' } : {}}>
        <IconSVG src={icon_drag} />
      </Handler>
      <span>不支持</span>
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
          className={`${mode} ${local.isDragOver && BaseComponent[store.app.dragingType as keyof typeof BaseComponent] ? "dragover" : ""}`}
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

export default function Page({ template_id, mode, ...props }: { template_id: string, mode: string, [key: string]: any }) {
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
              className={`${mode} ${local.isDragOver ? (BaseComponent[store.app.dragingType as keyof typeof BaseComponent] ? "dragover" : 'cantdrag') : ""}`}
              style={{ display: 'flex', flexDirection: 'column', ...toJS(local.template?.style) }}
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
          <Input addonBefore="字段" value={local.editComponent.widget?.field} onChange={e => {
            local.editComponent?.setWidget('field', e.target.value);
          }} />
          <Input addonBefore="默认值" value={local.editComponent.widget?.value} onChange={e => {
            local.editComponent?.setWidget('value', e.target.value);
          }} />
          <Divider type="horizontal" style={{ margin: 5 }} />
          <Space direction='vertical'>
            {local.editComponent.widget?.refer.map((w, n) => (
              <Input key={w.value} addonBefore={w.label} value={w.value} addonAfter={<Acon icon='close' onClick={() => local.editComponent?.remRefer(n)} />} />
            ))}
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