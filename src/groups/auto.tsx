import React, { useCallback } from 'react'
import { Observer } from 'mobx-react'
import { ITemplate, IComponent } from '@/types'
import { useLocalObservable } from 'mobx-react'
import { EditWrap } from './style'
import { Menu as ContextMenu, Item as ContextMenuItem, contextMenu } from 'react-contexify';
import "react-contexify/dist/ReactContexify.css";

import Menu from './Menu'
import MenuItem from './MenuItem'

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
            if (mode === 'preview') return;
            e.preventDefault();
            contextMenu.show({
              id: 'group_menu',
              event: e,
              props: {
                _id: self._id,
              }
            });
          }}
          onDragOver={local.onDragOver}
          onDragLeave={local.onDragLeave}
          onDrop={local.onDrop}
          className={`${mode} ${local.isDragOver ? 'dragover' : ''}`}
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
    return <div>{template.children.map(child => (
      <Component self={child} key={child._id} mode={mode} />
    ))}</div>
  } else if (template) {
    return <div>Empty Page</div>
  } else {
    return <div>Page NotFound</div>
  }
}

export default function Page({ template, mode, ...props }: { props?: any, mode: string, template: ITemplate | null }) {
  const test = useCallback((e: any, props: any) => {
    console.log(props);
  }, [])
  const GroupMenu = (props: any) => (<ContextMenu id='group_menu'>
    <ContextMenuItem onClick={e => test(e, props)}>编辑</ContextMenuItem>
    <ContextMenuItem onClick={e => test(e, props)}>删除</ContextMenuItem>
    <ContextMenuItem onClick={e => test(e, props)}>添加子视图</ContextMenuItem>
  </ContextMenu>)
  return <Observer>{() => (<div style={{ display: 'flex', justifyContent: 'center', }}>
    <GroupMenu />
    <TemplatePage template={template} mode={mode} />
  </div>)}</Observer>
}