import { Tabs } from "antd";
import { Observer } from "mobx-react";
import { IComponent } from '@/types/component';
import { BarsOutlined, LeftOutlined, RightOutlined } from '@ant-design/icons'
import * as icons from '@ant-design/icons'
import { Component } from '../auto'
import SortList from '@/components/SortList/';
import TabItem from "../TabItem";
import styled from "styled-components";
import { contextMenu } from 'react-contexify';

const TabWrap = styled.div`
  height: 100%;
  & > div {
    height: 100%;
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

export default function TagPage({ self, mode, children }: { self: IComponent, mode: string, children?: any }) {
  const icon: keyof typeof icons = self.icon as any;
  const Image: any = icons[icon];
  return <Observer>
    {() => (
      <TabWrap>
        <Tabs
          defaultActiveKey={self.attrs.get('selected_id')}
          tabBarExtraContent={{ right: Image ? <Image /> : <BarsOutlined /> }}
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
              <LeftOutlined hidden={mode === 'preview'} onClick={(e) => {
                e.preventDefault()
                e.stopPropagation()
                if (i > 0) {
                  self.swap(i, i - 1)
                }
              }} />
              {child.title}
              <RightOutlined hidden={mode === 'preview'} onClick={(e) => {
                e.preventDefault()
                e.stopPropagation()
                if (i < self.children.length - 1) {
                  self.swap(i, i + 1)
                }
              }} />
            </TabItemWrap>,
            key: child._id,
            children: (
              mode === 'edit' ? <TabItem self={child} mode={mode}>
                <SortList
                  sort={(oldIndex: number, newIndex: number) => {
                    self.swap(oldIndex, newIndex);
                  }}
                  droppableId={self._id}
                  items={child.children}
                  itemStyle={{ display: 'flex', alignItems: 'center' }}
                  mode={mode}
                  direction={'vertical'}
                  renderItem={({ item, handler }: { item: IComponent, handler: HTMLObjectElement }) => <Component mode={mode} handler={handler} self={item} key={item._id} />}
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