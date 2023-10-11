import { ITemplate, IComponent } from '@/types'
import { Observer, useLocalObservable } from 'mobx-react'
import { EditWrap, TemplateBox, EditItem, Handler, } from './style'
import { Menu as ContextMenu, Item as ContextMenuItem, contextMenu } from 'react-contexify';
import { AlignAside } from '@/components/style'
import { Input, message } from 'antd'
import { CloseOutlined, DragOutlined } from '@ant-design/icons'
import "react-contexify/dist/ReactContexify.css";
import { ComponentItem } from '@/store/component';
import SortList from '@/components/SortList/';
import store from '@/store'
import _ from 'lodash'

import Menu from './Menu'
import MenuItem from './MenuItem'
import Tab from './Tab'
import TabItem from './TabItem'
import Layout from './Layout'
import { toJS } from 'mobx';

const BaseComponent = {
  Menu,
  MenuItem,
  Tab,
  TabItem,
  Layout,
}

export function Component({ self, children, mode, handler, ...props }: { self: IComponent, children?: any, mode: string, handler?: any, props?: any }) {
  const local = useLocalObservable(() => ({
    isDragOver: false,
    onDrop: (e: any) => {
      e.preventDefault();
      e.stopPropagation();
      local.isDragOver = false;
      if (store.component.canDrop(store.app.dragingType, self.type)) {
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
    }
  }))
  const Com = BaseComponent[self.type as keyof typeof BaseComponent];
  if (Com) {
    return <Observer>
      {() => (
        <EditWrap
          onContextMenu={e => {
            e.preventDefault();
            e.stopPropagation();
            if (mode === 'preview') return;
            contextMenu.show({
              id: 'group_menu',
              event: e,
              props: self
            });
          }}
          onDragOver={local.onDragOver}
          onDragLeave={local.onDragLeave}
          onDrop={local.onDrop}
          className={`${mode} ${self.status === 0 ? 'delete' : ''} ${store.app.editing_component_id === self._id ? 'focus' : ''} ${store.app.dragingType && local.isDragOver ? (store.component.canDrop(store.app.dragingType, self.type) ? 'dragover' : 'cantdrag') : ''}`}
        >
          {mode === 'edit' && <Handler {...handler}>
            <DragOutlined />
          </Handler>}
          <Com self={self} mode={mode} level={_.get(props, 'level', 1)}>
            <SortList
              sort={(oldIndex: number, newIndex: number) => {
                self.swap(oldIndex, newIndex);
              }}
              droppableId={self._id}
              items={self.children}
              itemStyle={{ display: 'flex', alignItems: 'center' }}
              mode={mode}
              direction={self.type === 'Tab' ? 'horizontal' : 'vertical'}
              renderItem={({ item, handler: h2 }: { item: IComponent, handler: HTMLObjectElement }) => <Component mode={mode} handler={h2} self={item} key={item._id} {...({ level: _.get(props, 'level', 1) + 1 })} />}
            />
          </Com>
        </EditWrap>
      )}
    </Observer>
  } else {
    return <div>
      {self.type}!
    </div>
  }
}

function TemplatePage({ template, mode, }: { template: ITemplate | null, mode: string }) {
  const local = useLocalObservable(() => ({
    isDragOver: false,
    onDrop: (e: any) => {
      e.preventDefault();
      e.stopPropagation();
      local.isDragOver = false;
      const type = store.component.types.find(it => it.name === store.app.dragingType)
      if (type && type.level !== 1) {
        return message.warn('非一级组件不能直接放到模板页')
      }
      const t = template as ITemplate;
      const child = ComponentItem.create({
        _id: '',
        parent_id: '',
        tree_id: '',
        type: store.app.dragingType,
        status: 1,
        order: t.children.length,
        template_id: t._id,
        title: '无',
        name: '',
        cover: '',
        desc: '',
        createdAt: new Date(),
        updatedAt: new Date(),
        accepts: [],
        children: [],
      });
      t.children.push(child);
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
    }
  }))
  if (template && template.children) {
    const props = { level: 0 }
    return <Observer>{() => (
      <div style={{
        marginTop: '5%',
        height: '90%',
        minWidth: 400,
        boxShadow: '#29ace9 4px 4px 16px 3px',
      }}>
        <TemplateBox
          onDragOver={local.onDragOver}
          onDragLeave={local.onDragLeave}
          onDrop={local.onDrop}
          className={local.isDragOver ? "dragover" : ""}
          style={toJS(template.style)}
        >
          <SortList
            listStyle={{ height: '100%' }}
            sort={(oldIndex: number, newIndex: number) => {
              const [old] = template.children.splice(oldIndex, 1);
              template.children.splice(newIndex, 0, old);
              template.children.forEach((child, i) => {
                child.setAttr('order', i);
              });
            }}
            droppableId={template._id}
            items={template.children}
            itemStyle={{ display: 'flex', alignItems: 'flex-start' }}
            mode={mode}
            renderItem={({ item, handler }: { item: IComponent, handler: HTMLObjectElement }) => <Component self={item} key={item._id} mode={mode} {...props} handler={handler} />}
          />
        </TemplateBox>
      </div>
    )
    }</Observer >
  } else if (template) {
    return <div>Empty Page</div>
  } else {
    return <div>Page NotFound</div>
  }
}

export default function Page({ template, mode, ...props }: { props?: any, mode: string, template: ITemplate | null }) {
  const local = useLocalObservable<{ editComponent: IComponent | null }>(() => ({
    editComponent: null,
  }))

  const GroupMenu = (props: any) => (<ContextMenu id='group_menu'>
    <ContextMenuItem onClick={async (e: any) => {
      store.app.setEditComponentId(e.props._id);
      local.editComponent = e.props
    }}>编辑</ContextMenuItem>
    <ContextMenuItem onClick={(e: any) => {
      e.props.setAttr('status', 0)
    }}>删除</ContextMenuItem>
    <ContextMenuItem onClick={(e: any) => test(e, e.props)}>添加子视图</ContextMenuItem>
  </ContextMenu>);

  return <Observer>{() => (<div style={{ display: 'flex', height: '100%' }}>
    <GroupMenu />
    <div style={{ display: 'flex', flex: 1, justifyContent: 'center', alignItems: 'flex-start' }}>
      <TemplatePage template={template} mode={mode} />
    </div>
    {local.editComponent && <div key={local.editComponent._id} style={{ width: 300, padding: '0 10px', backgroundColor: 'wheat' }}>
      <AlignAside>
        <span>属性修改({local.editComponent.type})</span>
        <CloseOutlined onClick={() => {
          store.app.setEditComponentId('')
          local.editComponent = null
        }} />
      </AlignAside>
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
        attr
        <Input.TextArea defaultValue={JSON.stringify(local.editComponent.attrs)} />
      </EditItem>
      <EditItem>
        样式
        <Input.TextArea defaultValue={JSON.stringify(local.editComponent.style)} />
      </EditItem>
    </div>}
  </div>)}</Observer>
}