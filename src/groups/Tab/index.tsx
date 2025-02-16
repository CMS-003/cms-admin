import { Tabs } from "antd";
import { Observer, useLocalStore } from "mobx-react";
import { IAuto, IComponent } from '@/types/component';
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

export default function CTab({ self, mode, source, setParentHovered }: IAuto) {
  return <Observer>
    {() => (
      <TabWrap>
        <Tabs
          activeKey={self.attrs.get('selected_id')}
          tabBarExtraContent={{ right: <Acon icon={(self.icon as Icon) || 'BarsOutlined'} /> }}
          onChange={activeKey => {
            self.setAttrs('selected_id', activeKey)
          }}
          items={self.children.map((child, i) => ({
            label: <TabItemWrap
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
                mode === 'edit' ? <TabItem self={child} mode={mode} source={source}>
                  <SortList
                    sort={(oldIndex: number, newIndex: number) => {
                      self.swap(oldIndex, newIndex);
                    }}
                    droppableId={self._id}
                    items={child.children}
                    itemStyle={{ display: 'flex', alignItems: 'center' }}
                    mode={mode}
                    direction={'vertical'}
                    renderItem={({ item, handler }: { item: IComponent, handler: HTMLObjectElement }) => <Component mode={mode} handler={handler} self={item} key={item._id} setParentHovered={setParentHovered} />}
                  />
                </TabItem> : <Component mode={mode} self={child} key={child._id} />
            )
          }))}
        >
        </Tabs>
      </TabWrap>
    )}
  </Observer>
}