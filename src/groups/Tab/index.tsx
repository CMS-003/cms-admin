import { Tabs } from "antd";
import { Observer, useLocalStore } from "mobx-react";
import { IAuto, IBaseComponent } from '@/types/component';
import Acon, { Icon } from '@/components/Acon'
import { Component } from '../auto'
import SortList from '@/components/SortList/';
import TabItem from "../TabItem";
import styled from "styled-components";
import { contextMenu } from 'react-contexify';
import { Fragment, useEffect } from "react";
import Auto from '../auto'
import { useEffectOnce } from "react-use";

const TabWrap = styled.div`
  height: 100%;
  & > div {
    height: 100%;
  }
  & > .ant-tabs-top > .ant-tabs-nav {
    margin: 0;
  }
`
const TabItemWrap = styled.div`
  display: flex;
  flex-direction: row;
  align-items: center;
  & > span.anticon {
    margin: 0;
    visibility: hidden;
  }
  &:hover > span {
    visibility: visible
  }
`

export default function CTab({ self, mode, drag, dnd, children, ...props }: IAuto & IBaseComponent) {
  return <Observer>
    {() => (
      <TabWrap
        className={mode + drag.className}
        {...drag.events}
        ref={dnd?.ref}
        {...dnd?.draggableProps}
        {...dnd?.dragHandleProps}
        style={{
          ...self.style,
          ...dnd?.style,
        }}
      >
        {children}
        <Tabs
          activeKey={self.attrs.get('selected_id')}
          tabBarExtraContent={{ right: <Acon icon={(self.icon as Icon) || 'BarsOutlined'} /> }}
          onChange={activeKey => {
            self.setAttrs('selected_id', activeKey)
          }}
          items={self.children.map((child, i) => ({
            label: <TabItemWrap
              className={mode + drag.className}
              onContextMenu={e => {
                e.preventDefault();
                e.stopPropagation();
                contextMenu.show({
                  id: 'group_menu',
                  event: e,
                  props: child
                });
              }}>
              {child.title}
            </TabItemWrap>,
            key: child._id,
            children: (
              child.attrs.get('content_type') === 'template' ? (<Fragment>
                <Auto mode={'preview'} template_id={child.attrs.get('template_id')} />
              </Fragment>) :
                <Component mode={mode} self={child} key={i} index={i} {...props} setParentHovered={drag?.setIsMouseOver} />
            )
          }))}
        >
        </Tabs>
      </TabWrap>
    )}
  </Observer>
}