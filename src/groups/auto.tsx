import { ITemplate, IComponent } from '@/types'
import { Observer, useLocalObservable } from 'mobx-react'
import { EditWrap, TemplateBox, EditItem } from './style'
import { Menu as ContextMenu, Item as ContextMenuItem, contextMenu } from 'react-contexify';
import { AlignAside } from '@/components/style'
import { Input, message } from 'antd'
import { CloseOutlined } from '@ant-design/icons'
import "react-contexify/dist/ReactContexify.css";
import { ComponentItem } from '@/store/component';

import Menu from './Menu'
import MenuItem from './MenuItem'
import store from '@/store'
import _ from 'lodash'

const BaseComponent = {
  Menu,
  MenuItem,
}

function Component({ self, children, mode, ...props }: { self: IComponent, children?: any, mode: string, props?: any }) {
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
          className={`${mode} ${self.status === 0 ? 'delete' : ''} ${store.app.editing_component_id === self._id ? 'focus' : ''} ${local.isDragOver ? (store.component.canDrop(store.app.dragingType, self.type) ? 'dragover' : 'cantdrag') : ''}`}
        >
          <Com self={self} mode={mode} level={_.get(props, 'level', 1)}>
            {self.children && self.children.map((child: IComponent) => <Component mode={mode} self={child} key={child._id} {...({ level: _.get(props, 'level', 1) + 1 })} />)}
          </Com>
        </EditWrap>
      )}
    </Observer>
  } else {
    return <div>
      未识别:{self.type}
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
      if(type && type.level!==1) {
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
      <TemplateBox
        onDragOver={local.onDragOver}
        onDragLeave={local.onDragLeave}
        onDrop={local.onDrop}
        className={local.isDragOver ? "focus" : ""}
      >
        {template.children.map(child => (
          <Component self={child} key={child._id} mode={mode} {...props} />
        ))}
      </TemplateBox>
    )}</Observer>
  } else if (template) {
    return <div>Empty Page</div>
  } else {
    return <div>Page NotFound</div>
  }
}

export default function Page({ template, mode, ...props }: { props?: any, mode: string, template: ITemplate | null }) {
  const local = useLocalObservable < { editComponent: IComponent | null } > (() => ({
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
    {local.editComponent && <div style={{ width: 300, padding: '0 10px', backgroundColor: 'wheat' }}>
      <AlignAside>
        <span>属性修改</span>
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
        <Input addonBefore="status" type="number" value={local.editComponent.status} />
      </EditItem>
      <EditItem>
        <Input addonBefore="name" value={local.editComponent.name} />
      </EditItem>
    </div>}
  </div>)}</Observer>
}