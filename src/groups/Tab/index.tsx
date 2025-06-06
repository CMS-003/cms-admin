import { Tabs } from "antd";
import { Observer } from "mobx-react";
import { IAuto, IBaseComponent } from '@/types/component';
import Acon, { Icon } from '@/components/Acon'
import { Component } from '../auto'
import styled from "styled-components";
import { contextMenu } from 'react-contexify';
import { Fragment } from "react";
import Auto from '../auto'
import { usePageContext } from '../context'
import { ComponentWrap } from '../style';

const TabWrap = styled.div`
  height: 100%;
  flex: 1;
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
  const page = usePageContext();
  return <Observer>
    {() => (
      <ComponentWrap
        className={mode + drag.className}
        {...drag.events}
        ref={dnd?.ref}
        {...dnd?.props}
        style={{
          ...dnd?.style,
          backgroundColor: dnd?.isDragging ? 'lightblue' : '',
        }}>
        {children}
        <TabWrap>
          <Tabs
            activeKey={self.attrs.selected_id}
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
                child.attrs.content_type === 'template' ? (<Fragment>
                  <Auto mode={'preview'} template_id={child.attrs.template_id} path={page.path} close={page.close} />
                </Fragment>) :
                  <Component mode={mode} self={child} key={i} index={i} {...props} />
              )
            }))}
          >
          </Tabs>
        </TabWrap>
      </ComponentWrap>
    )}
  </Observer>
}