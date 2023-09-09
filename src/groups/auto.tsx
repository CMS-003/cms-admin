import { Fragment, useCallback, useEffect } from 'react'
import { ITemplate, IComponent } from '@/types'
import { toJS } from 'mobx'
import { Observer, useLocalObservable } from 'mobx-react'
import { EditWrap } from './style'
import { Menu as ContextMenu, Item as ContextMenuItem, contextMenu } from 'react-contexify';
import "react-contexify/dist/ReactContexify.css";

import Menu from './Menu'
import MenuItem from './MenuItem'
import store from '@/store'

const BaseComponent = {
  Menu,
  MenuItem,
}

type IEditComponent = IComponent & {
  $delete: boolean;
  $origin: IComponent;
  $new: boolean;
}

function Component({ self, children, mode, ...props }: { self: IComponent, children?: any, mode: string, props?: any }) {
  const local = useLocalObservable(() => ({
    isDragOver: false,
    onDrop: (e: any) => {
      e.preventDefault();
      e.stopPropagation();
      // TODO: 判断是否能添加以及添加逻辑
      local.isDragOver = false;
    },
    onDragLeave: () => {
      local.isDragOver = false;
    },
    onDragOver: (e: any) => {
      e.preventDefault();
      e.stopPropagation();
      if (!local.isDragOver) {
        // local.dragClass = store.component.canDrop(store.app.dragingType, self.type) ? 'dragover': 'cantdrag';
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
              props: toJS(self)
            });
          }}
          onDragOver={local.onDragOver}
          onDragLeave={local.onDragLeave}
          onDrop={local.onDrop}
          className={`${mode} ${store.app.editing_component_id === self._id ? 'focus' : ''} ${local.isDragOver ? (store.component.canDrop(store.app.dragingType, self.type) ? 'dragover' : 'cantdrag') : ''}`}
        >
          <Com self={self} mode={mode}>
            {self.children && self.children.map((child: IComponent) => <Component mode={mode} self={child} key={child._id} />)}
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

function TemplatePage({ template, mode, ...props }: { template: ITemplate | null, mode: string, props?: any }) {
  if (template && template.children) {
    return <Fragment>
      {template.children.map(child => (
        <Component self={child} key={child._id} mode={mode} />
      ))}
    </Fragment>
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
  const edit = useCallback((e: any, props: any) => {
    store.app.setEditComponentId(props._id);
    local.editComponent = props
  }, [])
  useEffect(() => {
    console.log(template?.children)
    if(template) {
      // TODO: IEditComponent
    }
  }, [template])
  const GroupMenu = (props: any) => (<ContextMenu id='group_menu'>
    <ContextMenuItem onClick={(e: any) => edit(e, e.props)}>编辑</ContextMenuItem>
    <ContextMenuItem onClick={(e: any) => test(e, e.props)}>删除</ContextMenuItem>
    <ContextMenuItem onClick={(e: any) => test(e, e.props)}>添加子视图</ContextMenuItem>
  </ContextMenu>)
  return <Observer>{() => (<div style={{ display: 'flex', height: '100%' }}>
    <GroupMenu />
    <div style={{ display: 'flex', flex: 1, justifyContent: 'center', alignItems: 'flex-start' }}>
      <TemplatePage template={template} mode={mode} />
    </div>
    {local.editComponent && <div style={{ width: 250 }}>
      {local.editComponent.title}
    </div>}
  </div>)}</Observer>
}